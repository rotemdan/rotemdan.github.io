/*!
 LZ-UTF8 v0.5.7

 Copyright (c) 2018, Rotem Dan
 Released under the MIT license.

 Build date: 2021-01-12 

 Please report any issue at https://github.com/rotemdan/lzutf8.js/issues
*/
var LZUTF8;
(function (LZUTF8) {
    LZUTF8.runningInNodeJS = function () {
        return ((typeof process === "object") && (typeof process.versions === "object") && (typeof process.versions.node === "string"));
    };
    LZUTF8.runningInMainNodeJSModule = function () {
        return LZUTF8.runningInNodeJS() && require.main === module;
    };
    LZUTF8.commonJSAvailable = function () {
        return typeof module === "object" && typeof module.exports === "object";
    };
    LZUTF8.runningInWebWorker = function () {
        return typeof window === "undefined" && typeof self === "object" && typeof self.addEventListener === "function" && typeof self.close === "function";
    };
    LZUTF8.runningInNodeChildProcess = function () {
        return LZUTF8.runningInNodeJS() && typeof process.send === "function";
    };
    LZUTF8.runningInNullOrigin = function () {
        if (typeof window !== "object" || typeof window.location !== "object" || typeof document !== "object")
            return false;
        return document.location.protocol !== 'http:' && document.location.protocol !== 'https:';
    };
    LZUTF8.webWorkersAvailable = function () {
        if (typeof Worker !== "function" || LZUTF8.runningInNullOrigin())
            return false;
        if (LZUTF8.runningInNodeJS())
            return false;
        if (navigator && navigator.userAgent && navigator.userAgent.indexOf("Android 4.3") >= 0)
            return false;
        return true;
    };
    LZUTF8.log = function (message, appendToDocument) {
        if (appendToDocument === void 0) { appendToDocument = false; }
        if (typeof console !== "object")
            return;
        console.log(message);
        if (appendToDocument && typeof document == "object")
            document.body.innerHTML += message + "<br/>";
    };
    LZUTF8.createErrorMessage = function (exception, title) {
        if (title === void 0) { title = "Unhandled exception"; }
        if (exception == null)
            return title;
        title += ": ";
        if (typeof exception.content === "object") {
            if (LZUTF8.runningInNodeJS()) {
                return title + exception.content.stack;
            }
            else {
                var exceptionJSON = JSON.stringify(exception.content);
                if (exceptionJSON !== "{}")
                    return title + exceptionJSON;
                else
                    return title + exception.content;
            }
        }
        else if (typeof exception.content === "string") {
            return title + exception.content;
        }
        else {
            return title + exception;
        }
    };
    LZUTF8.printExceptionAndStackTraceToConsole = function (exception, title) {
        if (title === void 0) { title = "Unhandled exception"; }
        LZUTF8.log(LZUTF8.createErrorMessage(exception, title));
    };
    LZUTF8.getGlobalObject = function () {
        if (typeof global === "object")
            return global;
        else if (typeof window === "object")
            return window;
        else if (typeof self === "object")
            return self;
        else
            return {};
    };
    LZUTF8.toString = Object.prototype.toString;
    if (LZUTF8.commonJSAvailable())
        module.exports = LZUTF8;
})(LZUTF8 || (LZUTF8 = {}));
// Internet Explorer 10 has a broken Typed Array
// implementation. subarray doesn't work correctly when slicing a
// zero-length subarray at the end of the array. Monkey-patch in a
// working version, adapted from the typed array polyfill.
//
// It was reported back in November, but they seem to have WONTFIXed
// the bug.
// https://connect.microsoft.com/IE/feedback/details/771452/typed-array-subarray-issue
var IE10SubarrayBugPatcher;
(function (IE10SubarrayBugPatcher) {
    if (typeof Uint8Array === "function" && new Uint8Array(1).subarray(1).byteLength !== 0) {
        var subarray = function (start, end) {
            var clamp = function (v, min, max) { return v < min ? min : v > max ? max : v; };
            start = start | 0;
            end = end | 0;
            if (arguments.length < 1)
                start = 0;
            if (arguments.length < 2)
                end = this.length;
            if (start < 0)
                start = this.length + start;
            if (end < 0)
                end = this.length + end;
            start = clamp(start, 0, this.length);
            end = clamp(end, 0, this.length);
            var len = end - start;
            if (len < 0)
                len = 0;
            return new this.constructor(this.buffer, this.byteOffset + start * this.BYTES_PER_ELEMENT, len);
        };
        var types = ['Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'];
        var globalObject = void 0;
        if (typeof window === "object")
            globalObject = window;
        else if (typeof self === "object")
            globalObject = self;
        if (globalObject !== undefined) {
            for (var i = 0; i < types.length; i++) {
                if (globalObject[types[i]])
                    globalObject[types[i]].prototype.subarray = subarray;
            }
        }
    }
})(IE10SubarrayBugPatcher || (IE10SubarrayBugPatcher = {}));
var LZUTF8;
(function (LZUTF8) {
    var AsyncCompressor = /** @class */ (function () {
        function AsyncCompressor() {
        }
        AsyncCompressor.compressAsync = function (input, options, callback) {
            var timer = new LZUTF8.Timer();
            var compressor = new LZUTF8.Compressor();
            if (!callback)
                throw new TypeError("compressAsync: No callback argument given");
            if (typeof input === "string") {
                input = LZUTF8.encodeUTF8(input);
            }
            else if (input == null || !(input instanceof Uint8Array)) {
                callback(undefined, new TypeError("compressAsync: Invalid input argument, only 'string' and 'Uint8Array' are supported"));
                return;
            }
            var sourceBlocks = LZUTF8.ArrayTools.splitByteArray(input, options.blockSize);
            var compressedBlocks = [];
            var compressBlocksStartingAt = function (index) {
                if (index < sourceBlocks.length) {
                    var compressedBlock = void 0;
                    try {
                        compressedBlock = compressor.compressBlock(sourceBlocks[index]);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    compressedBlocks.push(compressedBlock);
                    if (timer.getElapsedTime() <= 20) {
                        compressBlocksStartingAt(index + 1);
                    }
                    else {
                        LZUTF8.enqueueImmediate(function () { return compressBlocksStartingAt(index + 1); });
                        timer.restart();
                    }
                }
                else {
                    var joinedCompressedBlocks_1 = LZUTF8.ArrayTools.concatUint8Arrays(compressedBlocks);
                    LZUTF8.enqueueImmediate(function () {
                        var result;
                        try {
                            result = LZUTF8.CompressionCommon.encodeCompressedBytes(joinedCompressedBlocks_1, options.outputEncoding);
                        }
                        catch (e) {
                            callback(undefined, e);
                            return;
                        }
                        LZUTF8.enqueueImmediate(function () { return callback(result); });
                    });
                }
            };
            LZUTF8.enqueueImmediate(function () { return compressBlocksStartingAt(0); });
        };
        AsyncCompressor.createCompressionStream = function () {
            var compressor = new LZUTF8.Compressor();
            var NodeStream = require("readable-stream");
            var compressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });
            compressionStream._transform = function (data, encoding, done) {
                var buffer;
                try {
                    buffer = LZUTF8.BufferTools.uint8ArrayToBuffer(compressor.compressBlock(LZUTF8.BufferTools.bufferToUint8Array(data)));
                }
                catch (e) {
                    compressionStream.emit("error", e);
                    return;
                }
                compressionStream.push(buffer);
                done();
            };
            return compressionStream;
        };
        return AsyncCompressor;
    }());
    LZUTF8.AsyncCompressor = AsyncCompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var AsyncDecompressor = /** @class */ (function () {
        function AsyncDecompressor() {
        }
        AsyncDecompressor.decompressAsync = function (input, options, callback) {
            if (!callback)
                throw new TypeError("decompressAsync: No callback argument given");
            var timer = new LZUTF8.Timer();
            try {
                input = LZUTF8.CompressionCommon.decodeCompressedBytes(input, options.inputEncoding);
            }
            catch (e) {
                callback(undefined, e);
                return;
            }
            var decompressor = new LZUTF8.Decompressor();
            var sourceBlocks = LZUTF8.ArrayTools.splitByteArray(input, options.blockSize);
            var decompressedBlocks = [];
            var decompressBlocksStartingAt = function (index) {
                if (index < sourceBlocks.length) {
                    var decompressedBlock = void 0;
                    try {
                        decompressedBlock = decompressor.decompressBlock(sourceBlocks[index]);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    decompressedBlocks.push(decompressedBlock);
                    if (timer.getElapsedTime() <= 20) {
                        decompressBlocksStartingAt(index + 1);
                    }
                    else {
                        LZUTF8.enqueueImmediate(function () { return decompressBlocksStartingAt(index + 1); });
                        timer.restart();
                    }
                }
                else {
                    var joinedDecompressedBlocks_1 = LZUTF8.ArrayTools.concatUint8Arrays(decompressedBlocks);
                    LZUTF8.enqueueImmediate(function () {
                        var result;
                        try {
                            result = LZUTF8.CompressionCommon.encodeDecompressedBytes(joinedDecompressedBlocks_1, options.outputEncoding);
                        }
                        catch (e) {
                            callback(undefined, e);
                            return;
                        }
                        LZUTF8.enqueueImmediate(function () { return callback(result); });
                    });
                }
            };
            LZUTF8.enqueueImmediate(function () { return decompressBlocksStartingAt(0); });
        };
        AsyncDecompressor.createDecompressionStream = function () {
            var decompressor = new LZUTF8.Decompressor();
            var NodeStream = require("readable-stream");
            var decompressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });
            decompressionStream._transform = function (data, encoding, done) {
                var buffer;
                try {
                    buffer = LZUTF8.BufferTools.uint8ArrayToBuffer(decompressor.decompressBlock(LZUTF8.BufferTools.bufferToUint8Array(data)));
                }
                catch (e) {
                    decompressionStream.emit("error", e);
                    return;
                }
                decompressionStream.push(buffer);
                done();
            };
            return decompressionStream;
        };
        return AsyncDecompressor;
    }());
    LZUTF8.AsyncDecompressor = AsyncDecompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var WebWorker;
    (function (WebWorker) {
        WebWorker.compressAsync = function (input, options, callback) {
            if (options.inputEncoding == "ByteArray") {
                if (!(input instanceof Uint8Array)) {
                    callback(undefined, new TypeError("compressAsync: input is not a Uint8Array"));
                    return;
                }
            }
            var request = {
                token: Math.random().toString(),
                type: "compress",
                data: input,
                inputEncoding: options.inputEncoding,
                outputEncoding: options.outputEncoding
            };
            var responseListener = function (e) {
                var response = e.data;
                if (!response || response.token != request.token)
                    return;
                WebWorker.globalWorker.removeEventListener("message", responseListener);
                if (response.type == "error")
                    callback(undefined, new Error(response.error));
                else
                    callback(response.data);
            };
            WebWorker.globalWorker.addEventListener("message", responseListener);
            WebWorker.globalWorker.postMessage(request, []);
        };
        WebWorker.decompressAsync = function (input, options, callback) {
            var request = {
                token: Math.random().toString(),
                type: "decompress",
                data: input,
                inputEncoding: options.inputEncoding,
                outputEncoding: options.outputEncoding
            };
            var responseListener = function (e) {
                var response = e.data;
                if (!response || response.token != request.token)
                    return;
                WebWorker.globalWorker.removeEventListener("message", responseListener);
                if (response.type == "error")
                    callback(undefined, new Error(response.error));
                else
                    callback(response.data);
            };
            WebWorker.globalWorker.addEventListener("message", responseListener);
            WebWorker.globalWorker.postMessage(request, []);
        };
        // Worker internal handler
        WebWorker.installWebWorkerIfNeeded = function () {
            if (typeof self == "object" && self.document === undefined && self.addEventListener != undefined) {
                self.addEventListener("message", function (e) {
                    var request = e.data;
                    if (request.type == "compress") {
                        var compressedData = void 0;
                        try {
                            compressedData = LZUTF8.compress(request.data, { outputEncoding: request.outputEncoding });
                        }
                        catch (e) {
                            self.postMessage({ token: request.token, type: "error", error: LZUTF8.createErrorMessage(e) }, []);
                            return;
                        }
                        var response = {
                            token: request.token,
                            type: "compressionResult",
                            data: compressedData,
                            encoding: request.outputEncoding,
                        };
                        if (response.data instanceof Uint8Array && navigator.appVersion.indexOf("MSIE 10") === -1)
                            self.postMessage(response, [response.data.buffer]);
                        else
                            self.postMessage(response, []);
                    }
                    else if (request.type == "decompress") {
                        var decompressedData = void 0;
                        try {
                            decompressedData = LZUTF8.decompress(request.data, { inputEncoding: request.inputEncoding, outputEncoding: request.outputEncoding });
                        }
                        catch (e) {
                            self.postMessage({ token: request.token, type: "error", error: LZUTF8.createErrorMessage(e) }, []);
                            return;
                        }
                        var response = {
                            token: request.token,
                            type: "decompressionResult",
                            data: decompressedData,
                            encoding: request.outputEncoding,
                        };
                        if (response.data instanceof Uint8Array && navigator.appVersion.indexOf("MSIE 10") === -1)
                            self.postMessage(response, [response.data.buffer]);
                        else
                            self.postMessage(response, []);
                    }
                });
                self.addEventListener("error", function (e) {
                    LZUTF8.log(LZUTF8.createErrorMessage(e.error, "Unexpected LZUTF8 WebWorker exception"));
                });
            }
        };
        WebWorker.createGlobalWorkerIfNeeded = function () {
            if (WebWorker.globalWorker)
                return true;
            if (!LZUTF8.webWorkersAvailable())
                return false;
            if (!WebWorker.scriptURI && typeof document === "object") {
                var scriptElement = document.getElementById("lzutf8");
                if (scriptElement != null)
                    WebWorker.scriptURI = scriptElement.getAttribute("src") || undefined;
            }
            if (WebWorker.scriptURI) {
                WebWorker.globalWorker = new Worker(WebWorker.scriptURI);
                return true;
            }
            else {
                return false;
            }
        };
        WebWorker.terminate = function () {
            if (WebWorker.globalWorker) {
                WebWorker.globalWorker.terminate();
                WebWorker.globalWorker = undefined;
            }
        };
    })(WebWorker = LZUTF8.WebWorker || (LZUTF8.WebWorker = {}));
    // Install listener during script load if inside a worker
    WebWorker.installWebWorkerIfNeeded();
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ArraySegment = /** @class */ (function () {
        function ArraySegment(container, startPosition, length) {
            this.container = container;
            this.startPosition = startPosition;
            this.length = length;
        }
        ArraySegment.prototype.get = function (index) {
            return this.container[this.startPosition + index];
        };
        ArraySegment.prototype.getInReversedOrder = function (reverseIndex) {
            return this.container[this.startPosition + this.length - 1 - reverseIndex];
        };
        ArraySegment.prototype.set = function (index, value) {
            this.container[this.startPosition + index] = value;
        };
        return ArraySegment;
    }());
    LZUTF8.ArraySegment = ArraySegment;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ArrayTools;
    (function (ArrayTools) {
        ArrayTools.copyElements = function (source, sourceIndex, destination, destinationIndex, count) {
            while (count--)
                destination[destinationIndex++] = source[sourceIndex++];
        };
        ArrayTools.zeroElements = function (collection, index, count) {
            while (count--)
                collection[index++] = 0;
        };
        ArrayTools.countNonzeroValuesInArray = function (array) {
            var result = 0;
            for (var i = 0; i < array.length; i++)
                if (array[i])
                    result++;
            return result;
        };
        ArrayTools.truncateStartingElements = function (array, truncatedLength) {
            if (array.length <= truncatedLength)
                throw new RangeError("truncateStartingElements: Requested length should be smaller than array length");
            var sourcePosition = array.length - truncatedLength;
            for (var i = 0; i < truncatedLength; i++)
                array[i] = array[sourcePosition + i];
            array.length = truncatedLength;
        };
        ArrayTools.doubleByteArrayCapacity = function (array) {
            var newArray = new Uint8Array(array.length * 2);
            newArray.set(array);
            return newArray;
        };
        ArrayTools.concatUint8Arrays = function (arrays) {
            var totalLength = 0;
            for (var _i = 0, arrays_1 = arrays; _i < arrays_1.length; _i++) {
                var array = arrays_1[_i];
                totalLength += array.length;
            }
            var result = new Uint8Array(totalLength);
            var offset = 0;
            for (var _a = 0, arrays_2 = arrays; _a < arrays_2.length; _a++) {
                var array = arrays_2[_a];
                result.set(array, offset);
                offset += array.length;
            }
            return result;
        };
        ArrayTools.splitByteArray = function (byteArray, maxPartLength) {
            var result = [];
            for (var offset = 0; offset < byteArray.length;) {
                var blockLength = Math.min(maxPartLength, byteArray.length - offset);
                result.push(byteArray.subarray(offset, offset + blockLength));
                offset += blockLength;
            }
            return result;
        };
    })(ArrayTools = LZUTF8.ArrayTools || (LZUTF8.ArrayTools = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var BufferTools;
    (function (BufferTools) {
        BufferTools.convertToUint8ArrayIfNeeded = function (input) {
            if (typeof Buffer === "function" && Buffer.isBuffer(input))
                return BufferTools.bufferToUint8Array(input);
            else
                return input;
        };
        BufferTools.uint8ArrayToBuffer = function (arr) {
            if (Buffer.prototype instanceof Uint8Array) {
                // A simple technique based on how buffer objects are created in node 3/4+
                // See: https://github.com/nodejs/node/blob/627524973a22c584fdd06c951fbe82364927a1ed/lib/buffer.js#L67
                var arrClone = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
                Object["setPrototypeOf"](arrClone, Buffer.prototype);
                return arrClone;
            }
            else {
                var len = arr.length;
                var buf = new Buffer(len);
                for (var i = 0; i < len; i++)
                    buf[i] = arr[i];
                return buf;
            }
        };
        BufferTools.bufferToUint8Array = function (buf) {
            if (Buffer.prototype instanceof Uint8Array) {
                return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"]);
            }
            else {
                var len = buf.length;
                var arr = new Uint8Array(len);
                for (var i = 0; i < len; i++)
                    arr[i] = buf[i];
                return arr;
            }
        };
    })(BufferTools = LZUTF8.BufferTools || (LZUTF8.BufferTools = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressionCommon;
    (function (CompressionCommon) {
        CompressionCommon.getCroppedBuffer = function (buffer, cropStartOffset, cropLength, additionalCapacity) {
            if (additionalCapacity === void 0) { additionalCapacity = 0; }
            var croppedBuffer = new Uint8Array(cropLength + additionalCapacity);
            croppedBuffer.set(buffer.subarray(cropStartOffset, cropStartOffset + cropLength));
            return croppedBuffer;
        };
        CompressionCommon.getCroppedAndAppendedByteArray = function (bytes, cropStartOffset, cropLength, byteArrayToAppend) {
            return LZUTF8.ArrayTools.concatUint8Arrays([bytes.subarray(cropStartOffset, cropStartOffset + cropLength), byteArrayToAppend]);
        };
        CompressionCommon.detectCompressionSourceEncoding = function (input) {
            if (input == null)
                throw new TypeError("detectCompressionSourceEncoding: input is null or undefined");
            if (typeof input === "string")
                return "String";
            else if (input instanceof Uint8Array || (typeof Buffer === "function" && Buffer.isBuffer(input)))
                return "ByteArray";
            else
                throw new TypeError("detectCompressionSourceEncoding: input must be of type 'string', 'Uint8Array' or 'Buffer'");
        };
        CompressionCommon.encodeCompressedBytes = function (compressedBytes, outputEncoding) {
            switch (outputEncoding) {
                case "ByteArray":
                    return compressedBytes;
                case "Buffer":
                    return LZUTF8.BufferTools.uint8ArrayToBuffer(compressedBytes);
                case "Base64":
                    return LZUTF8.encodeBase64(compressedBytes);
                case "BinaryString":
                    return LZUTF8.encodeBinaryString(compressedBytes);
                case "StorageBinaryString":
                    return LZUTF8.encodeStorageBinaryString(compressedBytes);
                default:
                    throw new TypeError("encodeCompressedBytes: invalid output encoding requested");
            }
        };
        CompressionCommon.decodeCompressedBytes = function (compressedData, inputEncoding) {
            if (inputEncoding == null)
                throw new TypeError("decodeCompressedData: Input is null or undefined");
            switch (inputEncoding) {
                case "ByteArray":
                case "Buffer":
                    var normalizedBytes = LZUTF8.BufferTools.convertToUint8ArrayIfNeeded(compressedData);
                    if (!(normalizedBytes instanceof Uint8Array))
                        throw new TypeError("decodeCompressedData: 'ByteArray' or 'Buffer' input type was specified but input is not a Uint8Array or Buffer");
                    return normalizedBytes;
                case "Base64":
                    if (typeof compressedData !== "string")
                        throw new TypeError("decodeCompressedData: 'Base64' input type was specified but input is not a string");
                    return LZUTF8.decodeBase64(compressedData);
                case "BinaryString":
                    if (typeof compressedData !== "string")
                        throw new TypeError("decodeCompressedData: 'BinaryString' input type was specified but input is not a string");
                    return LZUTF8.decodeBinaryString(compressedData);
                case "StorageBinaryString":
                    if (typeof compressedData !== "string")
                        throw new TypeError("decodeCompressedData: 'StorageBinaryString' input type was specified but input is not a string");
                    return LZUTF8.decodeStorageBinaryString(compressedData);
                default:
                    throw new TypeError("decodeCompressedData: invalid input encoding requested: '" + inputEncoding + "'");
            }
        };
        CompressionCommon.encodeDecompressedBytes = function (decompressedBytes, outputEncoding) {
            switch (outputEncoding) {
                case "String":
                    return LZUTF8.decodeUTF8(decompressedBytes);
                case "ByteArray":
                    return decompressedBytes;
                case "Buffer":
                    if (typeof Buffer !== "function")
                        throw new TypeError("encodeDecompressedBytes: a 'Buffer' type was specified but is not supported at the current envirnment");
                    return LZUTF8.BufferTools.uint8ArrayToBuffer(decompressedBytes);
                default:
                    throw new TypeError("encodeDecompressedBytes: invalid output encoding requested");
            }
        };
    })(CompressionCommon = LZUTF8.CompressionCommon || (LZUTF8.CompressionCommon = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var EventLoop;
    (function (EventLoop) {
        var queuedFunctions = [];
        var asyncFlushFunc;
        EventLoop.enqueueImmediate = function (func) {
            queuedFunctions.push(func);
            if (queuedFunctions.length === 1)
                asyncFlushFunc();
        };
        EventLoop.initializeScheduler = function () {
            var flush = function () {
                for (var _i = 0, queuedFunctions_1 = queuedFunctions; _i < queuedFunctions_1.length; _i++) {
                    var func = queuedFunctions_1[_i];
                    try {
                        func.call(undefined);
                    }
                    catch (exception) {
                        LZUTF8.printExceptionAndStackTraceToConsole(exception, "enqueueImmediate exception");
                    }
                }
                queuedFunctions.length = 0;
            };
            if (LZUTF8.runningInNodeJS()) {
                asyncFlushFunc = function () { return setImmediate(function () { return flush(); }); };
            }
            if (typeof window === "object" && typeof window.addEventListener === "function" && typeof window.postMessage === "function") {
                var token_1 = "enqueueImmediate-" + Math.random().toString();
                window.addEventListener("message", function (event) {
                    if (event.data === token_1)
                        flush();
                });
                var targetOrigin_1;
                if (LZUTF8.runningInNullOrigin())
                    targetOrigin_1 = '*';
                else
                    targetOrigin_1 = window.location.href;
                asyncFlushFunc = function () { return window.postMessage(token_1, targetOrigin_1); };
            }
            else if (typeof MessageChannel === "function" && typeof MessagePort === "function") {
                var channel_1 = new MessageChannel();
                channel_1.port1.onmessage = function () { return flush(); };
                asyncFlushFunc = function () { return channel_1.port2.postMessage(0); };
            }
            else {
                asyncFlushFunc = function () { return setTimeout(function () { return flush(); }, 0); };
            }
        };
        EventLoop.initializeScheduler();
    })(EventLoop = LZUTF8.EventLoop || (LZUTF8.EventLoop = {}));
    LZUTF8.enqueueImmediate = function (func) { return EventLoop.enqueueImmediate(func); };
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ObjectTools;
    (function (ObjectTools) {
        ObjectTools.override = function (obj, newPropertyValues) {
            return ObjectTools.extend(obj, newPropertyValues);
        };
        ObjectTools.extend = function (obj, newProperties) {
            if (obj == null)
                throw new TypeError("obj is null or undefined");
            if (typeof obj !== "object")
                throw new TypeError("obj is not an object");
            if (newProperties == null)
                newProperties = {};
            if (typeof newProperties !== "object")
                throw new TypeError("newProperties is not an object");
            if (newProperties != null) {
                for (var property in newProperties)
                    obj[property] = newProperties[property];
            }
            return obj;
        };
    })(ObjectTools = LZUTF8.ObjectTools || (LZUTF8.ObjectTools = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    LZUTF8.getRandomIntegerInRange = function (low, high) {
        return low + Math.floor(Math.random() * (high - low));
    };
    LZUTF8.getRandomUTF16StringOfLength = function (length) {
        var randomString = "";
        for (var i = 0; i < length; i++) {
            var randomCodePoint = void 0;
            do {
                randomCodePoint = LZUTF8.getRandomIntegerInRange(0, 0x10FFFF + 1);
            } while (randomCodePoint >= 0xD800 && randomCodePoint <= 0xDFFF);
            randomString += LZUTF8.Encoding.CodePoint.decodeToString(randomCodePoint);
        }
        return randomString;
    };
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var StringBuilder = /** @class */ (function () {
        function StringBuilder(outputBufferCapacity) {
            if (outputBufferCapacity === void 0) { outputBufferCapacity = 1024; }
            this.outputBufferCapacity = outputBufferCapacity;
            this.outputPosition = 0;
            this.outputString = "";
            this.outputBuffer = new Uint16Array(this.outputBufferCapacity);
        }
        StringBuilder.prototype.appendCharCode = function (charCode) {
            this.outputBuffer[this.outputPosition++] = charCode;
            if (this.outputPosition === this.outputBufferCapacity)
                this.flushBufferToOutputString();
        };
        StringBuilder.prototype.appendCharCodes = function (charCodes) {
            for (var i = 0, length_1 = charCodes.length; i < length_1; i++)
                this.appendCharCode(charCodes[i]);
        };
        StringBuilder.prototype.appendString = function (str) {
            for (var i = 0, length_2 = str.length; i < length_2; i++)
                this.appendCharCode(str.charCodeAt(i));
        };
        StringBuilder.prototype.appendCodePoint = function (codePoint) {
            if (codePoint <= 0xFFFF) {
                this.appendCharCode(codePoint);
            }
            else if (codePoint <= 0x10FFFF) {
                this.appendCharCode(0xD800 + ((codePoint - 0x10000) >>> 10));
                this.appendCharCode(0xDC00 + ((codePoint - 0x10000) & 1023));
            }
            else
                throw new Error("appendCodePoint: A code point of " + codePoint + " cannot be encoded in UTF-16");
        };
        StringBuilder.prototype.getOutputString = function () {
            this.flushBufferToOutputString();
            return this.outputString;
        };
        StringBuilder.prototype.flushBufferToOutputString = function () {
            if (this.outputPosition === this.outputBufferCapacity)
                this.outputString += String.fromCharCode.apply(null, this.outputBuffer);
            else
                this.outputString += String.fromCharCode.apply(null, this.outputBuffer.subarray(0, this.outputPosition));
            this.outputPosition = 0;
        };
        return StringBuilder;
    }());
    LZUTF8.StringBuilder = StringBuilder;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Timer = /** @class */ (function () {
        function Timer() {
            this.restart();
        }
        Timer.prototype.restart = function () {
            this.startTime = Timer.getTimestamp();
        };
        Timer.prototype.getElapsedTime = function () {
            return Timer.getTimestamp() - this.startTime;
        };
        Timer.prototype.getElapsedTimeAndRestart = function () {
            var elapsedTime = this.getElapsedTime();
            this.restart();
            return elapsedTime;
        };
        Timer.prototype.logAndRestart = function (title, logToDocument) {
            if (logToDocument === void 0) { logToDocument = true; }
            var elapsedTime = this.getElapsedTime();
            //
            var message = title + ": " + elapsedTime.toFixed(3) + "ms";
            LZUTF8.log(message, logToDocument);
            //
            this.restart();
            return elapsedTime;
        };
        Timer.getTimestamp = function () {
            if (!this.timestampFunc)
                this.createGlobalTimestampFunction();
            return this.timestampFunc();
        };
        Timer.getMicrosecondTimestamp = function () {
            return Math.floor(Timer.getTimestamp() * 1000);
        };
        Timer.createGlobalTimestampFunction = function () {
            if (typeof process === "object" && typeof process.hrtime === "function") {
                var baseTimestamp_1 = 0;
                this.timestampFunc = function () {
                    var nodeTimeStamp = process.hrtime();
                    var millisecondTime = (nodeTimeStamp[0] * 1000) + (nodeTimeStamp[1] / 1000000);
                    return baseTimestamp_1 + millisecondTime;
                };
                baseTimestamp_1 = Date.now() - this.timestampFunc();
            }
            else if (typeof chrome === "object" && chrome.Interval) {
                var baseTimestamp_2 = Date.now();
                var chromeIntervalObject_1 = new chrome.Interval();
                chromeIntervalObject_1.start();
                this.timestampFunc = function () { return baseTimestamp_2 + chromeIntervalObject_1.microseconds() / 1000; };
            }
            else if (typeof performance === "object" && performance.now) {
                var baseTimestamp_3 = Date.now() - performance.now();
                this.timestampFunc = function () { return baseTimestamp_3 + performance.now(); };
            }
            else if (Date.now) {
                this.timestampFunc = function () { return Date.now(); };
            }
            else {
                this.timestampFunc = function () { return (new Date()).getTime(); };
            }
        };
        return Timer;
    }());
    LZUTF8.Timer = Timer;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Compressor = /** @class */ (function () {
        function Compressor(useCustomHashTable) {
            if (useCustomHashTable === void 0) { useCustomHashTable = true; }
            this.MinimumSequenceLength = 4;
            this.MaximumSequenceLength = 31;
            this.MaximumMatchDistance = 32767;
            this.PrefixHashTableSize = 65537;
            this.inputBufferStreamOffset = 1;
            if (useCustomHashTable && typeof Uint32Array == "function")
                this.prefixHashTable = new LZUTF8.CompressorCustomHashTable(this.PrefixHashTableSize);
            else
                this.prefixHashTable = new LZUTF8.CompressorSimpleHashTable(this.PrefixHashTableSize);
        }
        Compressor.prototype.compressBlock = function (input) {
            if (input === undefined || input === null)
                throw new TypeError("compressBlock: undefined or null input received");
            if (typeof input == "string")
                input = LZUTF8.encodeUTF8(input);
            input = LZUTF8.BufferTools.convertToUint8ArrayIfNeeded(input);
            return this.compressUtf8Block(input);
        };
        Compressor.prototype.compressUtf8Block = function (utf8Bytes) {
            if (!utf8Bytes || utf8Bytes.length == 0)
                return new Uint8Array(0);
            var bufferStartingReadOffset = this.cropAndAddNewBytesToInputBuffer(utf8Bytes);
            var inputBuffer = this.inputBuffer;
            var inputBufferLength = this.inputBuffer.length;
            this.outputBuffer = new Uint8Array(utf8Bytes.length);
            this.outputBufferPosition = 0;
            var latestMatchEndPosition = 0;
            for (var readPosition = bufferStartingReadOffset; readPosition < inputBufferLength; readPosition++) {
                var inputValue = inputBuffer[readPosition];
                var withinAMatchedRange = readPosition < latestMatchEndPosition;
                // Last 3 bytes are not matched
                if (readPosition > inputBufferLength - this.MinimumSequenceLength) {
                    if (!withinAMatchedRange)
                        this.outputRawByte(inputValue);
                    continue;
                }
                // Find the target bucket index
                var targetBucketIndex = this.getBucketIndexForPrefix(readPosition);
                if (!withinAMatchedRange) {
                    // Try to find the longest match for the sequence starting at the current position
                    var matchLocator = this.findLongestMatch(readPosition, targetBucketIndex);
                    // If match found
                    if (matchLocator != null) {
                        // Output a pointer to the match
                        this.outputPointerBytes(matchLocator.length, matchLocator.distance);
                        // Keep the end position of the match
                        latestMatchEndPosition = readPosition + matchLocator.length;
                        withinAMatchedRange = true;
                    }
                }
                // If not in a range of a match, output the literal byte
                if (!withinAMatchedRange)
                    this.outputRawByte(inputValue);
                // Add the current 4 byte sequence to the hash table
                // (note that input stream offset starts at 1, so it will never equal 0, thus the hash
                // table can safely use 0 as an empty bucket slot indicator - this property is critical for the custom hash table implementation).
                var inputStreamPosition = this.inputBufferStreamOffset + readPosition;
                this.prefixHashTable.addValueToBucket(targetBucketIndex, inputStreamPosition);
            }
            //this.logStatisticsToConsole(readPosition - bufferStartingReadOffset);
            return this.outputBuffer.subarray(0, this.outputBufferPosition);
        };
        Compressor.prototype.findLongestMatch = function (matchedSequencePosition, bucketIndex) {
            var bucket = this.prefixHashTable.getArraySegmentForBucketIndex(bucketIndex, this.reusableArraySegmentObject);
            if (bucket == null)
                return null;
            var input = this.inputBuffer;
            var longestMatchDistance;
            var longestMatchLength = 0;
            for (var i = 0; i < bucket.length; i++) {
                // Adjust to the actual buffer position. Note: position might be negative (not in the current buffer)
                var testedSequencePosition = bucket.getInReversedOrder(i) - this.inputBufferStreamOffset;
                var testedSequenceDistance = matchedSequencePosition - testedSequencePosition;
                // Find the length to surpass for this match
                var lengthToSurpass = void 0;
                if (longestMatchDistance === undefined)
                    lengthToSurpass = this.MinimumSequenceLength - 1;
                else if (longestMatchDistance < 128 && testedSequenceDistance >= 128)
                    lengthToSurpass = longestMatchLength + (longestMatchLength >>> 1); // floor(l * 1.5)
                else
                    lengthToSurpass = longestMatchLength;
                // Break if any of the conditions occur
                if (testedSequenceDistance > this.MaximumMatchDistance ||
                    lengthToSurpass >= this.MaximumSequenceLength ||
                    matchedSequencePosition + lengthToSurpass >= input.length)
                    break;
                // Quick check to see if there's any point comparing all the bytes.
                if (input[testedSequencePosition + lengthToSurpass] !== input[matchedSequencePosition + lengthToSurpass])
                    continue;
                for (var offset = 0;; offset++) {
                    if (matchedSequencePosition + offset === input.length ||
                        input[testedSequencePosition + offset] !== input[matchedSequencePosition + offset]) {
                        if (offset > lengthToSurpass) {
                            longestMatchDistance = testedSequenceDistance;
                            longestMatchLength = offset;
                        }
                        break;
                    }
                    else if (offset === this.MaximumSequenceLength)
                        return { distance: testedSequenceDistance, length: this.MaximumSequenceLength };
                }
            }
            if (longestMatchDistance !== undefined)
                return { distance: longestMatchDistance, length: longestMatchLength };
            else
                return null;
        };
        Compressor.prototype.getBucketIndexForPrefix = function (startPosition) {
            return (this.inputBuffer[startPosition] * 7880599 +
                this.inputBuffer[startPosition + 1] * 39601 +
                this.inputBuffer[startPosition + 2] * 199 +
                this.inputBuffer[startPosition + 3]) % this.PrefixHashTableSize;
        };
        Compressor.prototype.outputPointerBytes = function (length, distance) {
            if (distance < 128) {
                this.outputRawByte(192 | length);
                this.outputRawByte(distance);
            }
            else {
                this.outputRawByte(224 | length);
                this.outputRawByte(distance >>> 8);
                this.outputRawByte(distance & 255);
            }
        };
        Compressor.prototype.outputRawByte = function (value) {
            this.outputBuffer[this.outputBufferPosition++] = value;
        };
        Compressor.prototype.cropAndAddNewBytesToInputBuffer = function (newInput) {
            if (this.inputBuffer === undefined) {
                this.inputBuffer = newInput;
                return 0;
            }
            else {
                var cropLength = Math.min(this.inputBuffer.length, this.MaximumMatchDistance);
                var cropStartOffset = this.inputBuffer.length - cropLength;
                this.inputBuffer = LZUTF8.CompressionCommon.getCroppedAndAppendedByteArray(this.inputBuffer, cropStartOffset, cropLength, newInput);
                this.inputBufferStreamOffset += cropStartOffset;
                return cropLength;
            }
        };
        return Compressor;
    }());
    LZUTF8.Compressor = Compressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressorCustomHashTable = /** @class */ (function () {
        function CompressorCustomHashTable(bucketCount) {
            this.minimumBucketCapacity = 4;
            this.maximumBucketCapacity = 64;
            this.bucketLocators = new Uint32Array(bucketCount * 2);
            this.storage = new Uint32Array(bucketCount * 2);
            this.storageIndex = 1;
        }
        CompressorCustomHashTable.prototype.addValueToBucket = function (bucketIndex, valueToAdd) {
            bucketIndex <<= 1;
            if (this.storageIndex >= (this.storage.length >>> 1))
                this.compact();
            var startPosition = this.bucketLocators[bucketIndex];
            var length;
            if (startPosition === 0) {
                startPosition = this.storageIndex;
                length = 1;
                this.storage[this.storageIndex] = valueToAdd;
                this.storageIndex += this.minimumBucketCapacity; // Set an initial capacity for the bucket
            }
            else {
                length = this.bucketLocators[bucketIndex + 1];
                if (length === this.maximumBucketCapacity - 1)
                    length = this.truncateBucketToNewerElements(startPosition, length, this.maximumBucketCapacity / 2);
                var endPosition = startPosition + length;
                if (this.storage[endPosition] === 0) {
                    this.storage[endPosition] = valueToAdd;
                    if (endPosition === this.storageIndex)
                        this.storageIndex += length; // Double the bucket's capcaity
                }
                else {
                    LZUTF8.ArrayTools.copyElements(this.storage, startPosition, this.storage, this.storageIndex, length);
                    startPosition = this.storageIndex;
                    this.storageIndex += length;
                    this.storage[this.storageIndex++] = valueToAdd;
                    this.storageIndex += length; // Double the bucket's capcity
                }
                length++;
            }
            this.bucketLocators[bucketIndex] = startPosition;
            this.bucketLocators[bucketIndex + 1] = length;
        };
        CompressorCustomHashTable.prototype.truncateBucketToNewerElements = function (startPosition, bucketLength, truncatedBucketLength) {
            var sourcePosition = startPosition + bucketLength - truncatedBucketLength;
            LZUTF8.ArrayTools.copyElements(this.storage, sourcePosition, this.storage, startPosition, truncatedBucketLength);
            LZUTF8.ArrayTools.zeroElements(this.storage, startPosition + truncatedBucketLength, bucketLength - truncatedBucketLength);
            return truncatedBucketLength;
        };
        CompressorCustomHashTable.prototype.compact = function () {
            var oldBucketLocators = this.bucketLocators;
            var oldStorage = this.storage;
            this.bucketLocators = new Uint32Array(this.bucketLocators.length);
            this.storageIndex = 1;
            // First pass: Scan and create the new bucket locators
            for (var bucketIndex = 0; bucketIndex < oldBucketLocators.length; bucketIndex += 2) {
                var length_3 = oldBucketLocators[bucketIndex + 1];
                if (length_3 === 0)
                    continue;
                this.bucketLocators[bucketIndex] = this.storageIndex;
                this.bucketLocators[bucketIndex + 1] = length_3;
                this.storageIndex += Math.max(Math.min(length_3 * 2, this.maximumBucketCapacity), this.minimumBucketCapacity);
            }
            //
            this.storage = new Uint32Array(this.storageIndex * 8);
            //
            // Second pass: After storage was allocated, copy the old data to the new buckets
            for (var bucketIndex = 0; bucketIndex < oldBucketLocators.length; bucketIndex += 2) {
                var sourcePosition = oldBucketLocators[bucketIndex];
                if (sourcePosition === 0)
                    continue;
                var destPosition = this.bucketLocators[bucketIndex];
                var length_4 = this.bucketLocators[bucketIndex + 1];
                LZUTF8.ArrayTools.copyElements(oldStorage, sourcePosition, this.storage, destPosition, length_4);
            }
            //log("Total allocated storage in hash table: " + this.storageIndex + ", new capacity: " + this.storage.length);
        };
        CompressorCustomHashTable.prototype.getArraySegmentForBucketIndex = function (bucketIndex, outputObject) {
            bucketIndex <<= 1;
            var startPosition = this.bucketLocators[bucketIndex];
            if (startPosition === 0)
                return null;
            if (outputObject === undefined)
                outputObject = new LZUTF8.ArraySegment(this.storage, startPosition, this.bucketLocators[bucketIndex + 1]);
            return outputObject;
        };
        CompressorCustomHashTable.prototype.getUsedBucketCount = function () {
            return Math.floor(LZUTF8.ArrayTools.countNonzeroValuesInArray(this.bucketLocators) / 2);
        };
        CompressorCustomHashTable.prototype.getTotalElementCount = function () {
            var result = 0;
            for (var i = 0; i < this.bucketLocators.length; i += 2)
                result += this.bucketLocators[i + 1];
            return result;
        };
        return CompressorCustomHashTable;
    }());
    LZUTF8.CompressorCustomHashTable = CompressorCustomHashTable;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressorSimpleHashTable = /** @class */ (function () {
        function CompressorSimpleHashTable(size) {
            this.maximumBucketCapacity = 64;
            this.buckets = new Array(size);
        }
        CompressorSimpleHashTable.prototype.addValueToBucket = function (bucketIndex, valueToAdd) {
            var bucket = this.buckets[bucketIndex];
            if (bucket === undefined) {
                this.buckets[bucketIndex] = [valueToAdd];
            }
            else {
                if (bucket.length === this.maximumBucketCapacity - 1)
                    LZUTF8.ArrayTools.truncateStartingElements(bucket, this.maximumBucketCapacity / 2);
                bucket.push(valueToAdd);
            }
        };
        CompressorSimpleHashTable.prototype.getArraySegmentForBucketIndex = function (bucketIndex, outputObject) {
            var bucket = this.buckets[bucketIndex];
            if (bucket === undefined)
                return null;
            if (outputObject === undefined)
                outputObject = new LZUTF8.ArraySegment(bucket, 0, bucket.length);
            return outputObject;
        };
        CompressorSimpleHashTable.prototype.getUsedBucketCount = function () {
            return LZUTF8.ArrayTools.countNonzeroValuesInArray(this.buckets);
        };
        CompressorSimpleHashTable.prototype.getTotalElementCount = function () {
            var currentSum = 0;
            for (var i = 0; i < this.buckets.length; i++) {
                if (this.buckets[i] !== undefined)
                    currentSum += this.buckets[i].length;
            }
            return currentSum;
        };
        return CompressorSimpleHashTable;
    }());
    LZUTF8.CompressorSimpleHashTable = CompressorSimpleHashTable;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Decompressor = /** @class */ (function () {
        function Decompressor() {
            this.MaximumMatchDistance = 32767;
            this.outputPosition = 0;
        }
        Decompressor.prototype.decompressBlockToString = function (input) {
            input = LZUTF8.BufferTools.convertToUint8ArrayIfNeeded(input);
            return LZUTF8.decodeUTF8(this.decompressBlock(input));
        };
        Decompressor.prototype.decompressBlock = function (input) {
            if (this.inputBufferRemainder) {
                input = LZUTF8.ArrayTools.concatUint8Arrays([this.inputBufferRemainder, input]);
                this.inputBufferRemainder = undefined;
            }
            var outputStartPosition = this.cropOutputBufferToWindowAndInitialize(Math.max(input.length * 4, 1024));
            for (var readPosition = 0, inputLength = input.length; readPosition < inputLength; readPosition++) {
                var inputValue = input[readPosition];
                if (inputValue >>> 6 != 3) {
                    // If at the continuation byte of a UTF-8 codepoint sequence, output the literal value and continue
                    this.outputByte(inputValue);
                    continue;
                }
                // At this point it is known that the current byte is the lead byte of either a UTF-8 codepoint or a sized pointer sequence.
                var sequenceLengthIdentifier = inputValue >>> 5; // 6 for 2 bytes, 7 for at least 3 bytes
                // If bytes in read position imply the start of a truncated input sequence (either a literal codepoint or a pointer)
                // keep the remainder to be decoded with the next buffer
                if (readPosition == inputLength - 1 ||
                    (readPosition == inputLength - 2 && sequenceLengthIdentifier == 7)) {
                    this.inputBufferRemainder = input.subarray(readPosition);
                    break;
                }
                // If at the leading byte of a UTF-8 codepoint byte sequence
                if (input[readPosition + 1] >>> 7 === 1) {
                    // Output the literal value
                    this.outputByte(inputValue);
                }
                else {
                    // Beginning of a pointer sequence
                    var matchLength = inputValue & 31;
                    var matchDistance = void 0;
                    if (sequenceLengthIdentifier == 6) { // 2 byte pointer type, distance was smaller than 128
                        matchDistance = input[readPosition + 1];
                        readPosition += 1;
                    }
                    else { // 3 byte pointer type, distance was greater or equal to 128
                        matchDistance = (input[readPosition + 1] << 8) | (input[readPosition + 2]); // Big endian
                        readPosition += 2;
                    }
                    var matchPosition = this.outputPosition - matchDistance;
                    // Copy the match bytes to output
                    for (var offset = 0; offset < matchLength; offset++)
                        this.outputByte(this.outputBuffer[matchPosition + offset]);
                }
            }
            this.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence();
            return LZUTF8.CompressionCommon.getCroppedBuffer(this.outputBuffer, outputStartPosition, this.outputPosition - outputStartPosition);
        };
        Decompressor.prototype.outputByte = function (value) {
            if (this.outputPosition === this.outputBuffer.length)
                this.outputBuffer = LZUTF8.ArrayTools.doubleByteArrayCapacity(this.outputBuffer);
            this.outputBuffer[this.outputPosition++] = value;
        };
        Decompressor.prototype.cropOutputBufferToWindowAndInitialize = function (initialCapacity) {
            if (!this.outputBuffer) {
                this.outputBuffer = new Uint8Array(initialCapacity);
                return 0;
            }
            var cropLength = Math.min(this.outputPosition, this.MaximumMatchDistance);
            this.outputBuffer = LZUTF8.CompressionCommon.getCroppedBuffer(this.outputBuffer, this.outputPosition - cropLength, cropLength, initialCapacity);
            this.outputPosition = cropLength;
            if (this.outputBufferRemainder) {
                for (var i = 0; i < this.outputBufferRemainder.length; i++)
                    this.outputByte(this.outputBufferRemainder[i]);
                this.outputBufferRemainder = undefined;
            }
            return cropLength;
        };
        Decompressor.prototype.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence = function () {
            for (var offset = 1; offset <= 4 && this.outputPosition - offset >= 0; offset++) {
                var value = this.outputBuffer[this.outputPosition - offset];
                if ((offset < 4 && (value >>> 3) === 30) || // Leading byte of a 4 byte UTF8 sequence
                    (offset < 3 && (value >>> 4) === 14) || // Leading byte of a 3 byte UTF8 sequence
                    (offset < 2 && (value >>> 5) === 6)) { // Leading byte of a 2 byte UTF8 sequence
                    this.outputBufferRemainder = this.outputBuffer.subarray(this.outputPosition - offset, this.outputPosition);
                    this.outputPosition -= offset;
                    return;
                }
            }
        };
        return Decompressor;
    }());
    LZUTF8.Decompressor = Decompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var Base64;
        (function (Base64) {
            var charCodeMap = new Uint8Array([65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47]);
            var reverseCharCodeMap = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 255, 255, 255, 255]);
            var paddingCharacter = "=";
            var paddingCharCode = 61;
            Base64.encode = function (inputBytes) {
                if (!inputBytes || inputBytes.length == 0)
                    return "";
                if (LZUTF8.runningInNodeJS()) {
                    return (LZUTF8.BufferTools.uint8ArrayToBuffer(inputBytes)).toString("base64");
                }
                else {
                    return Base64.encodeWithJS(inputBytes);
                }
            };
            Base64.decode = function (base64String) {
                if (!base64String)
                    return new Uint8Array(0);
                if (LZUTF8.runningInNodeJS()) {
                    return LZUTF8.BufferTools.bufferToUint8Array(new Buffer(base64String, "base64"));
                }
                else {
                    return Base64.decodeWithJS(base64String);
                }
            };
            Base64.encodeWithJS = function (inputBytes, addPadding) {
                if (addPadding === void 0) { addPadding = true; }
                if (!inputBytes || inputBytes.length == 0)
                    return "";
                var map = charCodeMap;
                var output = new LZUTF8.StringBuilder();
                var uint24;
                for (var readPosition = 0, length_5 = inputBytes.length; readPosition < length_5; readPosition += 3) {
                    if (readPosition <= length_5 - 3) {
                        uint24 = inputBytes[readPosition] << 16 | inputBytes[readPosition + 1] << 8 | inputBytes[readPosition + 2];
                        output.appendCharCode(map[(uint24 >>> 18) & 63]);
                        output.appendCharCode(map[(uint24 >>> 12) & 63]);
                        output.appendCharCode(map[(uint24 >>> 6) & 63]);
                        output.appendCharCode(map[(uint24) & 63]);
                        uint24 = 0;
                    }
                    else if (readPosition === length_5 - 2) 
                    // If two bytes are left, output 3 encoded characters and one padding character
                    {
                        uint24 = inputBytes[readPosition] << 16 | inputBytes[readPosition + 1] << 8;
                        output.appendCharCode(map[(uint24 >>> 18) & 63]);
                        output.appendCharCode(map[(uint24 >>> 12) & 63]);
                        output.appendCharCode(map[(uint24 >>> 6) & 63]);
                        if (addPadding)
                            output.appendCharCode(paddingCharCode);
                    }
                    else if (readPosition === length_5 - 1) 
                    // Arrived at last byte at a position that did not complete a full 3 byte set
                    {
                        uint24 = inputBytes[readPosition] << 16;
                        output.appendCharCode(map[(uint24 >>> 18) & 63]);
                        output.appendCharCode(map[(uint24 >>> 12) & 63]);
                        if (addPadding) {
                            output.appendCharCode(paddingCharCode);
                            output.appendCharCode(paddingCharCode);
                        }
                    }
                }
                return output.getOutputString();
            };
            Base64.decodeWithJS = function (base64String, outputBuffer) {
                if (!base64String || base64String.length == 0)
                    return new Uint8Array(0);
                // Add padding if omitted
                var lengthModulo4 = base64String.length % 4;
                if (lengthModulo4 === 1)
                    throw new Error("Invalid Base64 string: length % 4 == 1");
                else if (lengthModulo4 === 2)
                    base64String += paddingCharacter + paddingCharacter;
                else if (lengthModulo4 === 3)
                    base64String += paddingCharacter;
                if (!outputBuffer)
                    outputBuffer = new Uint8Array(base64String.length);
                var outputPosition = 0;
                var length = base64String.length;
                for (var i = 0; i < length; i += 4) {
                    var uint24 = (reverseCharCodeMap[base64String.charCodeAt(i)] << 18) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 1)] << 12) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 2)] << 6) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 3)]);
                    outputBuffer[outputPosition++] = (uint24 >>> 16) & 255;
                    outputBuffer[outputPosition++] = (uint24 >>> 8) & 255;
                    outputBuffer[outputPosition++] = (uint24) & 255;
                }
                // Remove 1 or 2 last bytes if padding characters were added to the string
                if (base64String.charCodeAt(length - 1) == paddingCharCode)
                    outputPosition--;
                if (base64String.charCodeAt(length - 2) == paddingCharCode)
                    outputPosition--;
                return outputBuffer.subarray(0, outputPosition);
            };
        })(Base64 = Encoding.Base64 || (Encoding.Base64 = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var BinaryString;
        (function (BinaryString) {
            BinaryString.encode = function (input) {
                if (input == null)
                    throw new TypeError("BinaryString.encode: undefined or null input received");
                if (input.length === 0)
                    return "";
                var inputLength = input.length;
                var outputStringBuilder = new LZUTF8.StringBuilder();
                var remainder = 0;
                var state = 1;
                for (var i = 0; i < inputLength; i += 2) {
                    var value = void 0;
                    if (i == inputLength - 1)
                        value = (input[i] << 8);
                    else
                        value = (input[i] << 8) | input[i + 1];
                    outputStringBuilder.appendCharCode((remainder << (16 - state)) | value >>> state);
                    remainder = value & ((1 << state) - 1);
                    if (state === 15) {
                        outputStringBuilder.appendCharCode(remainder);
                        remainder = 0;
                        state = 1;
                    }
                    else {
                        state += 1;
                    }
                    if (i >= inputLength - 2)
                        outputStringBuilder.appendCharCode(remainder << (16 - state));
                }
                outputStringBuilder.appendCharCode(32768 | (inputLength % 2));
                return outputStringBuilder.getOutputString();
            };
            BinaryString.decode = function (input) {
                if (typeof input !== "string")
                    throw new TypeError("BinaryString.decode: invalid input type");
                if (input == "")
                    return new Uint8Array(0);
                var output = new Uint8Array(input.length * 3);
                var outputPosition = 0;
                var appendToOutput = function (value) {
                    output[outputPosition++] = value >>> 8;
                    output[outputPosition++] = value & 255;
                };
                var remainder = 0;
                var state = 0;
                for (var i = 0; i < input.length; i++) {
                    var value = input.charCodeAt(i);
                    if (value >= 32768) {
                        if (value == (32768 | 1))
                            outputPosition--;
                        state = 0;
                        continue;
                    }
                    //
                    if (state == 0) {
                        remainder = value;
                    }
                    else {
                        appendToOutput((remainder << state) | (value >>> (15 - state)));
                        remainder = value & ((1 << (15 - state)) - 1);
                    }
                    if (state == 15)
                        state = 0;
                    else
                        state += 1;
                }
                return output.subarray(0, outputPosition);
            };
        })(BinaryString = Encoding.BinaryString || (Encoding.BinaryString = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var CodePoint;
        (function (CodePoint) {
            CodePoint.encodeFromString = function (str, position) {
                var charCode = str.charCodeAt(position);
                if (charCode < 0xD800 || charCode > 0xDBFF)
                    return charCode;
                else {
                    var nextCharCode = str.charCodeAt(position + 1);
                    if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF)
                        return 0x10000 + (((charCode - 0xD800) << 10) + (nextCharCode - 0xDC00));
                    else
                        throw new Error("getUnicodeCodePoint: Received a lead surrogate character, char code " + charCode + ", followed by " + nextCharCode + ", which is not a trailing surrogate character code.");
                }
            };
            CodePoint.decodeToString = function (codePoint) {
                if (codePoint <= 0xFFFF)
                    return String.fromCharCode(codePoint);
                else if (codePoint <= 0x10FFFF)
                    return String.fromCharCode(0xD800 + ((codePoint - 0x10000) >>> 10), 0xDC00 + ((codePoint - 0x10000) & 1023));
                else
                    throw new Error("getStringFromUnicodeCodePoint: A code point of " + codePoint + " cannot be encoded in UTF-16");
            };
        })(CodePoint = Encoding.CodePoint || (Encoding.CodePoint = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var DecimalString;
        (function (DecimalString) {
            var lookupTable = ["000", "001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "023", "024", "025", "026", "027", "028", "029", "030", "031", "032", "033", "034", "035", "036", "037", "038", "039", "040", "041", "042", "043", "044", "045", "046", "047", "048", "049", "050", "051", "052", "053", "054", "055", "056", "057", "058", "059", "060", "061", "062", "063", "064", "065", "066", "067", "068", "069", "070", "071", "072", "073", "074", "075", "076", "077", "078", "079", "080", "081", "082", "083", "084", "085", "086", "087", "088", "089", "090", "091", "092", "093", "094", "095", "096", "097", "098", "099", "100", "101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "121", "122", "123", "124", "125", "126", "127", "128", "129", "130", "131", "132", "133", "134", "135", "136", "137", "138", "139", "140", "141", "142", "143", "144", "145", "146", "147", "148", "149", "150", "151", "152", "153", "154", "155", "156", "157", "158", "159", "160", "161", "162", "163", "164", "165", "166", "167", "168", "169", "170", "171", "172", "173", "174", "175", "176", "177", "178", "179", "180", "181", "182", "183", "184", "185", "186", "187", "188", "189", "190", "191", "192", "193", "194", "195", "196", "197", "198", "199", "200", "201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "212", "213", "214", "215", "216", "217", "218", "219", "220", "221", "222", "223", "224", "225", "226", "227", "228", "229", "230", "231", "232", "233", "234", "235", "236", "237", "238", "239", "240", "241", "242", "243", "244", "245", "246", "247", "248", "249", "250", "251", "252", "253", "254", "255"];
            DecimalString.encode = function (binaryBytes) {
                var resultArray = [];
                for (var i = 0; i < binaryBytes.length; i++)
                    resultArray.push(lookupTable[binaryBytes[i]]);
                return resultArray.join(" ");
            };
        })(DecimalString = Encoding.DecimalString || (Encoding.DecimalString = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var StorageBinaryString;
        (function (StorageBinaryString) {
            StorageBinaryString.encode = function (input) {
                return Encoding.BinaryString.encode(input).replace(/\0/g, '\u8002');
            };
            StorageBinaryString.decode = function (input) {
                return Encoding.BinaryString.decode(input.replace(/\u8002/g, '\0'));
            };
        })(StorageBinaryString = Encoding.StorageBinaryString || (Encoding.StorageBinaryString = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var UTF8;
        (function (UTF8) {
            var nativeTextEncoder;
            var nativeTextDecoder;
            UTF8.encode = function (str) {
                if (!str || str.length == 0)
                    return new Uint8Array(0);
                if (LZUTF8.runningInNodeJS()) {
                    return LZUTF8.BufferTools.bufferToUint8Array(new Buffer(str, "utf8"));
                }
                else if (UTF8.createNativeTextEncoderAndDecoderIfAvailable()) {
                    return nativeTextEncoder.encode(str);
                }
                else {
                    return UTF8.encodeWithJS(str);
                }
            };
            UTF8.decode = function (utf8Bytes) {
                if (!utf8Bytes || utf8Bytes.length == 0)
                    return "";
                if (LZUTF8.runningInNodeJS()) {
                    return LZUTF8.BufferTools.uint8ArrayToBuffer(utf8Bytes).toString("utf8");
                }
                else if (UTF8.createNativeTextEncoderAndDecoderIfAvailable()) {
                    return nativeTextDecoder.decode(utf8Bytes);
                }
                else {
                    return UTF8.decodeWithJS(utf8Bytes);
                }
            };
            UTF8.encodeWithJS = function (str, outputArray) {
                if (!str || str.length == 0)
                    return new Uint8Array(0);
                if (!outputArray)
                    outputArray = new Uint8Array(str.length * 4);
                var writeIndex = 0;
                for (var readIndex = 0; readIndex < str.length; readIndex++) {
                    var charCode = Encoding.CodePoint.encodeFromString(str, readIndex);
                    if (charCode <= 0x7F) {
                        outputArray[writeIndex++] = charCode;
                    }
                    else if (charCode <= 0x7FF) {
                        outputArray[writeIndex++] = 0xC0 | (charCode >>> 6);
                        outputArray[writeIndex++] = 0x80 | (charCode & 63);
                    }
                    else if (charCode <= 0xFFFF) {
                        outputArray[writeIndex++] = 0xE0 | (charCode >>> 12);
                        outputArray[writeIndex++] = 0x80 | ((charCode >>> 6) & 63);
                        outputArray[writeIndex++] = 0x80 | (charCode & 63);
                    }
                    else if (charCode <= 0x10FFFF) {
                        outputArray[writeIndex++] = 0xF0 | (charCode >>> 18);
                        outputArray[writeIndex++] = 0x80 | ((charCode >>> 12) & 63);
                        outputArray[writeIndex++] = 0x80 | ((charCode >>> 6) & 63);
                        outputArray[writeIndex++] = 0x80 | (charCode & 63);
                        readIndex++; // A character outside the BMP had to be made from two surrogate characters
                    }
                    else
                        throw new Error("Invalid UTF-16 string: Encountered a character unsupported by UTF-8/16 (RFC 3629)");
                }
                return outputArray.subarray(0, writeIndex);
            };
            UTF8.decodeWithJS = function (utf8Bytes, startOffset, endOffset) {
                if (startOffset === void 0) { startOffset = 0; }
                if (!utf8Bytes || utf8Bytes.length == 0)
                    return "";
                if (endOffset === undefined)
                    endOffset = utf8Bytes.length;
                var output = new LZUTF8.StringBuilder();
                var outputCodePoint;
                var leadByte;
                for (var readIndex = startOffset, length_6 = endOffset; readIndex < length_6;) {
                    leadByte = utf8Bytes[readIndex];
                    if ((leadByte >>> 7) === 0) {
                        outputCodePoint = leadByte;
                        readIndex += 1;
                    }
                    else if ((leadByte >>> 5) === 6) {
                        if (readIndex + 1 >= endOffset)
                            throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 31) << 6) | (utf8Bytes[readIndex + 1] & 63);
                        readIndex += 2;
                    }
                    else if ((leadByte >>> 4) === 14) {
                        if (readIndex + 2 >= endOffset)
                            throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 15) << 12) | ((utf8Bytes[readIndex + 1] & 63) << 6) | (utf8Bytes[readIndex + 2] & 63);
                        readIndex += 3;
                    }
                    else if ((leadByte >>> 3) === 30) {
                        if (readIndex + 3 >= endOffset)
                            throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 7) << 18) | ((utf8Bytes[readIndex + 1] & 63) << 12) | ((utf8Bytes[readIndex + 2] & 63) << 6) | (utf8Bytes[readIndex + 3] & 63);
                        readIndex += 4;
                    }
                    else
                        throw new Error("Invalid UTF-8 stream: An invalid lead byte value encountered at position " + readIndex);
                    output.appendCodePoint(outputCodePoint);
                }
                return output.getOutputString();
            };
            UTF8.createNativeTextEncoderAndDecoderIfAvailable = function () {
                if (nativeTextEncoder)
                    return true;
                if (typeof TextEncoder == "function") {
                    nativeTextEncoder = new TextEncoder("utf-8");
                    nativeTextDecoder = new TextDecoder("utf-8");
                    return true;
                }
                else
                    return false;
            };
        })(UTF8 = Encoding.UTF8 || (Encoding.UTF8 = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    function compress(input, options) {
        if (options === void 0) { options = {}; }
        if (input == null)
            throw new TypeError("compress: undefined or null input received");
        var inputEncoding = LZUTF8.CompressionCommon.detectCompressionSourceEncoding(input);
        options = LZUTF8.ObjectTools.override({ inputEncoding: inputEncoding, outputEncoding: "ByteArray" }, options);
        var compressor = new LZUTF8.Compressor();
        var compressedBytes = compressor.compressBlock(input);
        return LZUTF8.CompressionCommon.encodeCompressedBytes(compressedBytes, options.outputEncoding);
    }
    LZUTF8.compress = compress;
    function decompress(input, options) {
        if (options === void 0) { options = {}; }
        if (input == null)
            throw new TypeError("decompress: undefined or null input received");
        options = LZUTF8.ObjectTools.override({ inputEncoding: "ByteArray", outputEncoding: "String" }, options);
        var inputBytes = LZUTF8.CompressionCommon.decodeCompressedBytes(input, options.inputEncoding);
        var decompressor = new LZUTF8.Decompressor();
        var decompressedBytes = decompressor.decompressBlock(inputBytes);
        return LZUTF8.CompressionCommon.encodeDecompressedBytes(decompressedBytes, options.outputEncoding);
    }
    LZUTF8.decompress = decompress;
    function compressAsync(input, options, callback) {
        if (callback == null)
            callback = function () { };
        var inputEncoding;
        try {
            inputEncoding = LZUTF8.CompressionCommon.detectCompressionSourceEncoding(input);
        }
        catch (e) {
            callback(undefined, e);
            return;
        }
        options = LZUTF8.ObjectTools.override({
            inputEncoding: inputEncoding,
            outputEncoding: "ByteArray",
            useWebWorker: true,
            blockSize: 65536
        }, options);
        LZUTF8.enqueueImmediate(function () {
            if (options.useWebWorker && LZUTF8.WebWorker.createGlobalWorkerIfNeeded()) {
                LZUTF8.WebWorker.compressAsync(input, options, callback);
            }
            else {
                LZUTF8.AsyncCompressor.compressAsync(input, options, callback);
            }
        });
    }
    LZUTF8.compressAsync = compressAsync;
    function decompressAsync(input, options, callback) {
        if (callback == null)
            callback = function () { };
        if (input == null) {
            callback(undefined, new TypeError("decompressAsync: undefined or null input received"));
            return;
        }
        options = LZUTF8.ObjectTools.override({
            inputEncoding: "ByteArray",
            outputEncoding: "String",
            useWebWorker: true,
            blockSize: 65536
        }, options);
        var normalizedInput = LZUTF8.BufferTools.convertToUint8ArrayIfNeeded(input);
        LZUTF8.EventLoop.enqueueImmediate(function () {
            if (options.useWebWorker && LZUTF8.WebWorker.createGlobalWorkerIfNeeded()) {
                LZUTF8.WebWorker.decompressAsync(normalizedInput, options, callback);
            }
            else {
                LZUTF8.AsyncDecompressor.decompressAsync(input, options, callback);
            }
        });
    }
    LZUTF8.decompressAsync = decompressAsync;
    // Node.js streams
    function createCompressionStream() {
        return LZUTF8.AsyncCompressor.createCompressionStream();
    }
    LZUTF8.createCompressionStream = createCompressionStream;
    function createDecompressionStream() {
        return LZUTF8.AsyncDecompressor.createDecompressionStream();
    }
    LZUTF8.createDecompressionStream = createDecompressionStream;
    // Encodings
    function encodeUTF8(str) {
        return LZUTF8.Encoding.UTF8.encode(str);
    }
    LZUTF8.encodeUTF8 = encodeUTF8;
    function decodeUTF8(input) {
        return LZUTF8.Encoding.UTF8.decode(input);
    }
    LZUTF8.decodeUTF8 = decodeUTF8;
    function encodeBase64(input) {
        return LZUTF8.Encoding.Base64.encode(input);
    }
    LZUTF8.encodeBase64 = encodeBase64;
    function decodeBase64(str) {
        return LZUTF8.Encoding.Base64.decode(str);
    }
    LZUTF8.decodeBase64 = decodeBase64;
    function encodeBinaryString(input) {
        return LZUTF8.Encoding.BinaryString.encode(input);
    }
    LZUTF8.encodeBinaryString = encodeBinaryString;
    function decodeBinaryString(str) {
        return LZUTF8.Encoding.BinaryString.decode(str);
    }
    LZUTF8.decodeBinaryString = decodeBinaryString;
    function encodeStorageBinaryString(input) {
        return LZUTF8.Encoding.StorageBinaryString.encode(input);
    }
    LZUTF8.encodeStorageBinaryString = encodeStorageBinaryString;
    function decodeStorageBinaryString(str) {
        return LZUTF8.Encoding.StorageBinaryString.decode(str);
    }
    LZUTF8.decodeStorageBinaryString = decodeStorageBinaryString;
})(LZUTF8 || (LZUTF8 = {}));
(function () {
    var globalObject;
    if (typeof window === "object")
        globalObject = window;
    else if (typeof global === "object")
        globalObject = global;
    else if (typeof self === "object")
        globalObject = self;
    else
        globalObject = {};
    if (typeof globalObject["describe"] !== "function")
        globalObject["describe"] = function () { };
})();
var LZUTF8;
(function (LZUTF8) {
    var Random = /** @class */ (function () {
        function Random() {
        }
        Random.getRandomIntegerInRange = function (low, high) {
            return low + Math.floor(Math.random() * (high - low));
        };
        Random.getRandomIntegerArrayOfLength = function (length, low, high) {
            var randomValues = [];
            for (var i = 0; i < length; i++) {
                randomValues.push(Random.getRandomIntegerInRange(low, high));
            }
            return randomValues;
        };
        Random.getRandomUTF16StringOfLength = function (length) {
            var randomString = "";
            for (var i = 0; i < length; i++) {
                var randomCodePoint = void 0;
                do {
                    randomCodePoint = Random.getRandomIntegerInRange(0, 0x10FFFF + 1);
                } while (randomCodePoint >= 0xD800 && randomCodePoint <= 0xDFFF);
                randomString += LZUTF8.Encoding.CodePoint.decodeToString(randomCodePoint);
            }
            return randomString;
        };
        return Random;
    }());
    LZUTF8.Random = Random;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var TestData = /** @class */ (function () {
        function TestData() {
        }
        TestData.loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. \r\nMaecenas id dignissim enim. \tNunc tincidunt lacus vel fringilla pretium. Maecenas eu gravida nibh, et dapibus dui. Suspendisse porta orci id metus laoreet laoreet. In hac habitasse platea dictumst. Nunc venenatis lacinia sapien non dictum. Morbi vestibulum accumsan viverra. Aliquam et mauris eu enim sollicitudin varius. Pellentesque mauris turpis, tincidunt eget nulla eget, mollis lacinia urna. Donec convallis pellentesque rutrum. In rhoncus bibendum nisl, eget sagittis urna porttitor vel. Pellentesque elit quam, commodo vitae tortor vel, sodales feugiat felis. Nunc a purus id libero molestie euismod eget a urna.\r\nVivamus dapibus dictum erat eget consequat.\r\n Vivamus egestas neque sed metus gravida porttitor ac et tortor. Duis faucibus tortor nec porta tincidunt.\r\n Nulla ac libero lacus.\t Morbi hendrerit ligula et turpis varius suscipit. \rCum \nsociis natoque penatibus et magnis dis parturient montes, \tnascetur ridiculus mus. Suspendisse pulvinar consequat est, ac venenatis libero tincidunt et.\r\n Aliquam aliquam tortor nisi, eu eleifend justo pellentesque et. Nunc in lorem et ligula congue \tlacinia sed vitae metus. Aliquam porta, ipsum vitae malesuada porttitor, orci massa ornare libero, ac cursus risus urna fermentum mi. Sed quis eleifend dolor. Sed eu justo quis arcu adipiscing gravida. \n Vestibulum molestie velit nec sagittis commodo.\nIn purus purus, consectetur sollicitudin orci vitae, molestie gravida turpis. Aliquam erat volutpat. Integer id dolor lacus. In facilisis neque erat.  Pellentesque bibendum nisi sit amet nulla euismod, eget sollicitudin metus vestibulum. Phasellus porttitor dignissim dignissim. Curabitur quam orci, adipiscing vitae purus ut, aliquet adipiscing felis. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Aliquam suscipit nulla a velit ornare, eu dignissim tellus tristique. Aenean ac nunc nec orci mollis laoreet ut sit amet leo. Morbi tincidunt massa leo, sit amet placerat turpis ultrices sed. Donec sit amet fringilla lacus, sed adipiscing turpis. Nunc vel porta quam. Quisque id eros iaculis, rutrum turpis ac, viverra velit. Proin iaculis elit vestibulum lorem faucibus, ac lobortis tellus egestas.  Praesent aliquet dolor in lectus laoreet pulvinar. Phasellus ornare non tellus sollicitudin tempus. In ultricies sapien eget tempus feugiat. In suscipit velit volutpat est aliquet, ac sagittis metus suscipit. Aliquam vel tellus non justo vestibulum varius. Phasellus id ornare velit, a consectetur dui. Donec facilisis leo sit amet nulla vestibulum tincidunt. Proin est nibh, pulvinar ut elit ac, tristique porttitor massa. Praesent lobortis fringilla nulla vitae pellentesque. Aliquam congue fringilla eros, vitae lacinia nisl euismod id. Fusce leo sem, ornare a vulputate in, lacinia nec dui.\n In sed mauris in enim faucibus lacinia in vel diam. \t\r\nProin commodo mauris a fermentum viverra. Fusce imperdiet diam diam, ornare vestibulum nibh blandit nec.  Curabitur eget ante gravida, malesuada nibh luctus, molestie augue. \r\nEtiam tristique tortor justo, quis dapibus urna viverra commodo. Aenean rutrum eget urna vitae consequat. \t\r\nEtiam in arcu non nulla porta consequat sed in magna. Vivamus vel mauris a nulla vehicula viverra. Etiam venenatis quis tellus nec sagittis. Pellentesque ac lacus porta, gravida diam id, euismod sem. Praesent vel molestie leo. Vivamus fringilla rutrum lectus, quis fringilla neque ultrices eget. Pellentesque gravida ipsum massa, at dapibus neque ullamcorper non. Aliquam iaculis consectetur dui. Suspendisse nec euismod urna, condimentum lacinia velit. \r\n\tAliquam erat volutpat. \tCurabitur accumsan, dui non iaculis vulputate, odio purus vehicula odio, a accumsan purus felis ut tellus. \nDuis leo purus, faucibus at blandit sit amet, imperdiet non tortor.";
        TestData.hindiText = "उत्पत्ति 1 1 आदि में परमेश्वर ने आकाश और पृय्वी की सृष्टि की। 2 और पृय्वी बेडौल और सुनसान पक्की यी;\t और गहरे जल के ऊपर अन्धिक्कारनेा या: तया परमेश्वर का आत्मा जल के ऊपर मण्डलाता या। 3 तब परमेश्वर ने कहा, उजियाला हो: तो उजियाला हो गया। 4 और परमेश्वर ने उजियाले को देखा कि अच्छा है; \tऔर परमेश्वर ने उजियाले को अन्धिक्कारने से अलग किया। 5 और परमेश्वर ने उजियाले को दिन और अन्धिक्कारने को रात कहा। तया सांफ हुई फिर भोर हुआ। इस प्रकार पहिला दिन हो गया।। 6 फिर परमेश्वर ने कहा, जल के बीच एक ऐसा अन्तर हो कि जल दो भाग हो जाए। 7 तब परमेश्वर ने एक अन्तर करके उसके नीचे के जल और उसके ऊपर के जल को अलग अलग किया; और वैसा ही हो गया। 8 और परमेश्वर ने उस अन्तर को आकाश कहा। तया सांफ हुई फिर भोर हुआ। इस प्रकार दूसरा दिन हो गया।। 9 फिर परमेश्वर ने कहा, आकाश के नीचे का जल एक स्यान में इकट्ठा हो जाए और सूखी भूमि दिखाई दे; और वैसा ही हो गया। 10 और परमेश्वर ने सूखी भूमि को पृय्वी कहा; तया जो जल इकट्ठा हुआ उसको उस ने समुद्र कहा: और परमेश्वर ने देखा कि अच्छा है। 11 फिर परमेश्वर ने कहा, पृय्वी से हरी घास, तया बीजवाले छोटे छोटे पेड़, और फलदाई वृझ भी जिनके बीज उन्ही में एक एक की जाति के अनुसार होते हैं पृय्वी पर उगें; और वैसा ही हो गया। 12 तो पृय्वी से हरी घास, और छोटे छोटे पेड़ जिन में अपक्की अपक्की जाति के अनुसार बीज होता है, और फलदाई वृझ जिनके बीज एक एक की जाति के अनुसार उन्ही में होते हैं उगे; और परमेश्वर ने देखा कि अच्छा है। 13 तया सांफ हुई फिर भोर हुआ। इस प्रकार तीसरा दिन हो गया।। 14 फिर परमेश्वर ने कहा, दिन को रात से अलग करने के लिथे आकाश के अन्तर में ज्योतियां हों; और वे चिन्हों, और नियत समयों, और दिनों, और वर्षोंके कारण हों। 15 और वे ज्योतियां आकाश के अन्तर में पृय्वी पर प्रकाश देनेवाली भी ठहरें; और वैसा ही हो गया। 16 तब परमेश्वर ने दो बड़ी ज्योतियां बनाईं; उन में से बड़ी ज्योति को दिन पर प्रभुता करने के लिथे, और छोटी ज्योति को रात पर प्रभुता करने के लिथे बनाया: और तारागण को भी बनाया। 17 परमेश्वर ने उनको आकाश के अन्तर में इसलिथे रखा कि वे पृय्वी पर प्रकाश दें, 18 तया दिन और रात पर प्रभुता करें और उजियाले को अन्धिक्कारने से अलग करें: और परमेश्वर ने देखा कि अच्छा है। 19 तया सांफ हुई फिर भोर हुआ। इस प्रकार चौया दिन हो गया।। 20 फिर परमेश्वर ने कहा, जल जीवित प्राणियोंसे बहुत ही भर जाए, और पक्की पृय्वी के ऊपर आकाश कें अन्तर में उड़ें। 21 इसलिथे परमेश्वर ने जाति जाति के बड़े बड़े जल-जन्तुओं की, और उन सब जीवित प्राणियोंकी भी सृष्टि की जो चलते फिरते हैं जिन से जल बहुत ही भर गया और एक एक जाति के उड़नेवाले पझियोंकी भी सृष्टि की : और परमेश्वर ने देखा कि अच्छा है। 22 और परमेश्वर ने यह कहके उनको आशीष दी, कि फूलो-फलो, और समुद्र के जल में भर जाओ, और पक्की पृय्वी पर बढ़ें। 23 तया सांफ हुई फिर भोर हुआ। इस प्रकार पांचवां दिन हो गया। 24 फिर परमेश्वर ने कहा, पृय्वी से एक एक जाति के जीवित प्राणी, अर्यात्‌ घरेलू पशु, और रेंगनेवाले जन्तु, और पृय्वी के वनपशु, जाति जाति के अनुसार उत्पन्न हों; और वैसा ही हो गया। 25 सो परमेश्वर ने पृय्वी के जाति जाति के वनपशुओं को, और जाति जाति के घरेलू पशुओं को, और जाति जाति के भूमि पर सब रेंगनेवाले जन्तुओं को बनाया : और परमेश्वर ने देखा कि अच्छा है। 26 फिर परमेश्वर ने कहा, हम मनुष्य को अपके स्वरूप के अनुसार अपक्की समानता में बनाएं; और वे समुद्र की मछलियों, और आकाश के पझियों, और घरेलू पशुओं, और सारी पृय्वी पर, और सब रेंगनेवाले जन्तुओं पर जो पृय्वी पर रेंगते हैं, अधिक्कारने रखें। 27 तब परमेश्वर ने मनुष्य को अपके स्वरूप के अनुसार उत्पन्न किया, अपके ही स्वरूप के अनुसार परमेश्वर ने उसको उत्पन्न किया, नर और नारी करके उस ने मनुष्योंकी सृष्टि की। 28 और परमेश्वर ने उनको आशीष दी : और उन से कहा, फूलो-फलो, और पृय्वी में भर जाओ, और उसको अपके वश में कर लो; और समुद्र की मछलियों, तया आकाश के पझियों, और पृय्वी पर रेंगनेवाले सब जन्तुओ पर अधिक्कारने रखो। 29 फिर परमेश्वर ने उन से कहा, सुनो, जितने बीजवाले छोटे छोटे पेड़ सारी पृय्वी के ऊपर हैं और जितने वृझोंमें बीजवाले फल होते हैं, वे सब मैं ने तुम को दिए हैं; वे तुम्हारे भोजन के लिथे हैं : 30 और जितने पृय्वी के पशु, और आकाश के पक्की, और पृय्वी पर रेंगनेवाले जन्तु हैं, जिन में जीवन के प्राण हैं, उन सब के खाने के लिथे मैं ने सब हरे हरे छोटे पेड़ दिए हैं; और वैसा ही हो गया। 31 तब परमेश्वर ने जो कुछ बनाया या, सब को देखा, तो क्या देखा, कि वह बहुत ही अच्छा है। तया सांफ हुई फिर भोर हुआ। इस प्रकार छठवां दिन हो गया।। उत्पत्ति 2 1 योंआकाश और पृय्वी और उनकी सारी सेना का बनाना समाप्त हो गया। 2 और परमेश्वर ने अपना काम जिसे वह करता या सातवें दिन समाप्त किया। और उस ने अपके किए हुए सारे काम से सातवें दिन विश्रम किया। 3 और परमेश्वर ने सातवें दिन को आशीष दी और पवित्र ठहराया; क्योंकि उस में उस ने अपक्की सृष्टि की रचना के सारे काम से विश्रम लिया। 4 आकाश और पृय्वी की उत्पत्ति का वृत्तान्त यह है कि जब वे उत्पन्न हुए अर्यात्‌ जिस दिन यहोवा परमेश्वर ने पृय्वी और आकाश को बनाया: 5 तब मैदान का कोई पौधा भूमि पर न या, और न मैदान का कोई छोटा पेड़ उगा या, क्योंकि यहोवा परमेश्वर ने पृय्वी पर जल नहीं बरसाया या, और भूमि पर खेती करने के लिथे मनुष्य भी नहीं या; 6 तौभी कुहरा पृय्वी से उठता या जिस से सारी भूमि सिंच जाती यी 7 और यहोवा परमेश्वर ने आदम को भूमि की मिट्टी से रचा और उसके नयनो में जीवन का श्वास फूंक दिया; और आदम जीवता प्राणी बन गया। 8 और यहोवा परमेश्वर ने पूर्व की ओर अदन देश में एक बाटिका लगाई; और वहां आदम को जिसे उस ने रचा या, रख दिया। 9 और यहोवा परमेश्वर ने भूमि से सब भांति के वृझ, जो देखने में मनोहर और जिनके फल खाने में अच्छे हैं उगाए, और बाटिका के बीच में जीवन के वृझ को और भले या बुरे के ज्ञान के वृझ को भी लगाया। 10 और उस बाटिका को सींचने के लिथे एक महानदी अदन से निकली और वहां से आगे बहकर चार धारा में हो गई। 11 पहिली धारा का नाम पीशोन्‌ है, यह वही है जो हवीला नाम के सारे देश को जहां सोना मिलता है घेरे हुए है। 12 उस देश का सोना चोखा होता है, वहां मोती और सुलैमानी पत्यर भी मिलते हैं। 13 और दूसरी नदी का नाम गीहोन्‌ है, यह वही है जो कूश के सारे देश को घेरे हुए है। 14 और तीसरी नदी का नाम हिद्देकेल्‌ है, यह वही है जो अश्शूर्‌ के पूर्व की ओर बहती है। और चौयी नदी का नाम फरात है। 15 जब यहोवा परमेश्वर ने आदम को लेकर अदन की बाटिका में रख दिया, कि वह उस में काम करे और उसकी रझा करे, 16 तब यहोवा परमेश्वर ने आदम को यह आज्ञा दी, कि तू बाटिका के सब वृझोंका फल बिना खटके खा सकता है: 17 पर भले या बुरे के ज्ञान का जो वृझ है, उसका फल तू कभी न खाना : क्योंकि जिस दिन तू उसका फल खाए उसी दिन अवश्य मर जाएगा।। 18 फिर यहोवा परमेश्वर ने कहा, आदम का अकेला रहना अच्छा नहीं; मै उसके लिथे एक ऐसा सहाथक बनाऊंगा जो उस से मेल खाए। 19 और यहोवा परमेश्वर भूमि में से सब जाति के बनैले पशुओं, और आकाश के सब भँाति के पझियोंको रचकर आदम के पास ले आया कि देखे, कि वह उनका क्या क्या नाम रखता है; और जिस जिस जीवित प्राणी का जो जो नाम आदम ने रखा वही उसका नाम हो गया। 20 सो आदम ने सब जाति के घरेलू पशुओं, और आकाश के पझियों, और सब जाति के बनैले पशुओं के नाम रखे; परन्तु आदम के लिथे कोई ऐसा सहाथक न मिला जो उस से मेल खा सके। 21 तब यहोवा परमेश्वर ने आदम को भारी नीन्द में डाल दिया, और जब वह सो गया तब उस ने उसकी एक पसुली निकालकर उसकी सन्ती मांस भर दिया। 22 और यहोवा परमेश्वर ने उस पसुली को जो उस ने आदम में से निकाली यी, स्त्री बना दिया; और उसको आदम के पास ले आया। 23 और आदम ने कहा अब यह मेरी हड्डियोंमें की हड्डी और मेरे मांस में का मांस है : सो इसका नाम नारी होगा, क्योंकि यह नर में से निकाली गई है। 24 इस कारण पुरूष अपके माता पिता को छोड़कर अपक्की पत्नी से मिला रहेगा और वे एक तन बनें रहेंगे। 25 और आदम और उसकी पत्नी दोनोंनंगे थे, पर लजाते न थे।। उत्पत्ति 3 1 यहोवा परमेश्वर ने जितने बनैले पशु बनाए थे, उन सब में सर्प धूर्त या, और उस ने स्त्री से कहा, क्या सच है, कि परमेश्वर ने कहा, कि तुम इस बाटिका के किसी वृझ का फल न खाना ? 2 स्त्री ने सर्प से कहा, इस बाटिका के वृझोंके फल हम खा सकते हैं। 3 पर जो वृझ बाटिका के बीच में है, उसके फल के विषय में परमेश्वर ने कहा है कि न तो तुम उसको खाना और न उसको छूना, नहीं तो मर जाओगे। 4 तब सर्प ने स्त्री से कहा, तुम निश्चय न मरोगे, 5 वरन परमेश्वर आप जानता है, कि जिस दिन तुम उसका फल खाओगे उसी दिन तुम्हारी आंखे खुल जाएंगी, और तुम भले बुरे का ज्ञान पाकर परमेश्वर के तुल्य हो जाओगे। 6 सो जब स्त्री ने देखा कि उस वृझ का फल खाने में अच्छा, और देखने में मनभाऊ, और बुद्धि देने के लिथे चाहने योग्य भी है, तब उस ने उस में से तोड़कर खाया; और अपके पति को भी दिया, और उस ने भी खाया। 7 तब उन दोनोंकी आंखे खुल गई, और उनको मालूम हुआ कि वे नंगे है; सो उन्होंने अंजीर के पत्ते जोड़ जोड़ कर लंगोट बना लिथे। 8 तब यहोवा परमेश्वर जो दिन के ठंडे समय बाटिका में फिरता या उसका शब्द उनको सुनाई दिया। तब आदम और उसकी पत्नी बाटिका के वृझोंके बीच यहोवा परमेश्वर से छिप गए। 9 तब यहोवा परमेश्वर ने पुकारकर आदम से पूछा, तू कहां है? 10 उस ने कहा, मैं तेरा शब्द बारी में सुनकर डर गया क्योंकि मैं नंगा या; इसलिथे छिप गया। 11 उस ने कहा, किस ने तुझे चिताया कि तू नंगा है? जिस वृझ का फल खाने को मै ने तुझे बर्जा या, क्या तू ने उसका फल खाया है? 12 आदम ने कहा जिस स्त्री को तू ने मेरे संग रहने को दिया है उसी ने उस वृझ का फल मुझे दिया, और मै ने खाया। 13 तब यहोवा परमेश्वर ने स्त्री से कहा, तू ने यह क्या किया है? स्त्री ने कहा, सर्प ने मुझे बहका दिया तब मै ने खाया। 14 तब यहोवा परमेश्वर ने सर्प से कहा, तू ने जो यह किया है इसलिथे तू सब घरेलू पशुओं, और सब बनैले पशुओं से अधिक शापित है; तू पेट के बल चला करेगा, और जीवन भर मिट्टी चाटता रहेगा : 15 और मै तेरे और इस स्त्री के बीच में, और तेरे वंश और इसके वंश के बीच में बैर उत्पन्न करुंगा, वह तेरे सिर को कुचल डालेगा, और तू उसकी एड़ी को डसेगा। 16 फिर स्त्री से उस ने कहा, मै तेरी पीड़ा और तेरे गर्भवती होने के दु:ख को बहुत बढ़ाऊंगा; तू पीड़ित होकर बालक उत्पन्न करेगी; और तेरी लालसा तेरे पति की ओर होगी, और वह तुझ पर प्रभुता करेगा। 17 और आदम से उस ने कहा, तू ने जो अपक्की पत्नी की बात सुनी, और जिस वृझ के फल के विषय मै ने तुझे आज्ञा दी यी कि तू उसे न खाना उसको तू ने खाया है, इसलिथे भूमि तेरे कारण शापित है: तू उसकी उपज जीवन भर दु:ख के साय खाया करेगा : 18 और वह तेरे लिथे कांटे और ऊंटकटारे उगाएगी, और तू खेत की उपज खाएगा ; 19 और अपके माथे के पक्कीने की रोटी खाया करेगा, और अन्त में मिट्टी में मिल जाएगा; क्योंकि तू उसी में से निकाला गया है, तू मिट्टी तो है और मिट्टी ही में फिर मिल जाएगा। 20 और आदम ने अपक्की पत्नी का नाम हव्वा रखा; क्योंकि जितने मनुष्य जीवित हैं उन सब की आदिमाता वही हुई। 21 और यहोवा परमेश्वर ने आदम और उसकी पत्नी के लिथे चमड़े के अंगरखे बनाकर उनको पहिना दिए। 22 फिर यहोवा परमेश्वर ने कहा, मनुष्य भले बुरे का ज्ञान पाकर हम में से एक के समान हो गया है: इसलिथे अब ऐसा न हो, कि वह हाथ बढ़ाकर जीवन के वृझ का फल भी तोड़ के खा ले और सदा जीवित रहे। 23 तब यहोवा परमेश्वर ने उसको अदन की बाटिका में से निकाल दिया कि वह उस भूमि पर खेती करे जिस मे से वह बनाया गया या। 24 इसलिथे आदम को उस ने निकाल दिया और जीवन के वृझ के मार्ग का पहरा देने के लिथे अदन की बाटिका के पूर्व की ओर करुबोंको, और चारोंओर घूमनेवाली ज्वालामय तलवार को भी नियुक्त कर दिया।। उत्पत्ति 4 1 जब आदम अपक्की पत्नी हव्वा के पास गया तब उस ने गर्भवती होकर कैन को जन्म दिया और कहा, मै ने यहोवा की सहाथता से एक पुरूष पाया है। 2 फिर वह उसके भाई हाबिल को भी जन्मी, और हाबिल तो भेड़-बकरियोंका चरवाहा बन गया, परन्तु कैन भूमि की खेती करने वाला किसान बना। 3 कुछ दिनोंके पश्चात्‌ कैन यहोवा के पास भूमि की उपज में से कुछ भेंट ले आया। 4 और हाबिल भी अपक्की भेड़-बकरियोंके कई एक पहिलौठे बच्चे भेंट चढ़ाने ले आया और उनकी चर्बी भेंट चढ़ाई; तब यहोवा ने हाबिल और उसकी भेंट को तो ग्रहण किया, 5 परन्तु कैन और उसकी भेंट को उस ने ग्रहण न किया। तब कैन अति क्रोधित हुआ, और उसके मुंह पर उदासी छा गई। 6 तब यहोवा ने कैन से कहा, तू क्योंक्रोधित हुआ ? और तेरे मुंह पर उदासी क्योंछा गई है ? 7 यदि तू भला करे, तो क्या तेरी भेंट ग्रहण न की जाएगी ? और यदि तू भला न करे, तो पाप द्वार पर छिपा रहता है, और उसकी लालसा तेरी और होगी, और तू उस पर प्रभुता करेगा। 8 तब कैन ने अपके भाई हाबिल से कुछ कहा : और जब वे मैदान में थे, तब कैन ने अपके भाई हाबिल पर चढ़कर उसे घात किया। 9 तब यहोवा ने कैन से पूछा, तेरा भाई हाबिल कहां है ? उस ने कहा मालूम नहीं : क्या मै अपके भाई का रखवाला हूं ? 10 उस ने कहा, तू ने क्या किया है ? तेरे भाई का लोहू भूमि में से मेरी ओर चिल्लाकर मेरी दोहाई दे रहा है ! 11 इसलिथे अब भूमि जिस ने तेरे भाई का लोहू तेरे हाथ से पीने के लिथे अपना मुंह खोला है, उसकी ओर से तू शापित है। 12 चाहे तू भूमि पर खेती करे, तौभी उसकी पूरी उपज फिर तुझे न मिलेगी, और तू पृय्वी पर बहेतू और भगोड़ा होगा। 13 तब कैन ने यहोवा से कहा, मेरा दण्ड सहने से बाहर है। 14 देख, तू ने आज के दिन मुझे भूमि पर से निकाला है और मै तेरी दृष्टि की आड़ मे रहूंगा और पृय्वी पर बहेतू और भगोड़ा रहूंगा; और जो कोई मुझे पाएगा, मुझे घात करेगा। 15 इस कारण यहोवा ने उस से कहा, जो कोई कैन को घात करेगा उस से सात गुणा पलटा लिया जाएगा। और यहोवा ने कैन के लिथे एक चिन्ह ठहराया ऐसा ने हो कि कोई उसे पाकर मार डाले।। 16 तब कैन यहोवा के सम्मुख से निकल गया, और नोद्‌ नाम देश में, जो अदन के पूर्व की ओर है, रहने लगा। 17 जब कैन अपक्की पत्नी के पास गया जब वह गर्भवती हुई और हनोक को जन्मी, फिर कैन ने एक नगर बसाया और उस नगर का नाम अपके पुत्र के नाम पर हनोक रखा। 18 और हनोक से ईराद उत्पन्न हुआ, और ईराद ने महूयाएल को जन्म दिया, और महूयाएल ने मतूशाएल को, और मतूशाएल ने लेमेक को जन्म दिया। 19 और लेमेक ने दो स्त्रियां ब्याह ली : जिन में से एक का नाम आदा, और दूसरी को सिल्ला है। 20 और आदा ने याबाल को जन्म दिया। वह तम्बुओं में रहना और जानवरोंका पालन इन दोनो रीतियोंका उत्पादक हुआ। 21 और उसके भाई का नाम यूबाल है : वह वीणा और बांसुरी आदि बाजोंके बजाने की सारी रीति का उत्पादक हुआ। 22 और सिल्ला ने भी तूबल्कैन नाम एक पुत्र को जन्म दिया : वह पीतल और लोहे के सब धारवाले हयियारोंका गढ़नेवाला हुआ: और तूबल्कैन की बहिन नामा यी। 23 और लेमेक ने अपक्की पत्नियोंसे कहा, हे आदा और हे सिल्ला मेरी सुनो; हे लेमेक की पत्नियों, मेरी बात पर कान लगाओ: मैंने एक पुरूष को जो मेरे चोट लगाता या, अर्यात्‌ एक जवान को जो मुझे घायल करता या, घात किया है। 24 जब कैन का पलटा सातगुणा लिया जाएगा। तो लेमेक का सतहरगुणा लिया जाएगा। 25 और आदम अपक्की पत्नी के पास फिर गया; और उस ने एक पुत्र को जन्म दिया और उसका नाम यह कह के शेत रखा, कि परमेश्वर ने मेरे लिथे हाबिल की सन्ती, जिसको कैन ने घात किया, एक और वंश ठहरा दिया है। 26 और शेत के भी एक पुत्र उत्पन्न हुआ; और उस ने उसका नाम एनोश रखा, उसी समय से लोग यहोवा से प्रार्यना करने लगे।। उत्पत्ति 5 1 आदम की वंशावली यह है। जब परमेश्वर ने मनुष्य की सृष्टि की तब अपके ही स्वरूप में उसको बनाया; 2 उस ने नर और नारी करके मनुष्योंकी सृष्टि की और उन्हें आशीष दी, और उनकी सृष्टि के दिन उनका नाम आदम रखा। 3 जब आदम एक सौ तीस वर्ष का हुआ, तब उसके द्वारा उसकी समानता में उस ही के स्वरूप के अनुसार एक पुत्र उत्पन्न हुआ उसका नाम शेत रखा। 4 और शेत के जन्म के पश्चात्‌ आदम आठ सौ वर्ष जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुईं। 5 और आदम की कुल अवस्या नौ सौ तीस वर्ष की हुई : तत्पश्चात्‌ वह मर गया।। 6 जब शेत एक सौ पांच वर्ष का हुआ, तब उस ने एनोश को जन्म दिया। 7 और एनोश के जन्म के पश्चात्‌ शेत आठ सौ सात वर्ष जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुईं। 8 और शेत की कुल अवस्या नौ सौ बारह वर्ष की हुई : तत्पश्चात्‌ वह मर गया।। 9 जब एनोश नब्बे वर्ष का हुआ, तब उस ने केनान को जन्म दिया। 10 और केनान के जन्म के पश्चात्‌ एनोश आठ सौ पन्द्रह वर्ष जीवित रहा, और उसके और भी बेटे बेटियां हुई। 11 और एनोश की कुल अवस्या नौ सौ पांच वर्ष की हुई : तत्पश्चात्‌ वह मर गया।। 12 जब केनान सत्तर वर्ष का हुआ, तब उस ने महललेल को जन्म दिया। 13 और महललेल के जन्म के पश्चात्‌ केनान आठ सौ चालीस वर्ष जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई। 14 और केनान की कुल अवस्या नौ सौ दस वर्ष की हुई : तत्पश्चात्‌ वह मर गया।। 15 जब महललेल पैंसठ वर्ष का हुआ, तब उस ने थेरेद को जन्म दिया। 16 और थेरेद के जन्म के पश्चात्‌ महललेल आठ सौ तीस वर्ष जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई। 17 और महललेल की कुल अवस्या आठ सौ पंचानवे वर्ष की हुई : तत्पश्चात्‌ वह मर गया।। 18 जब थेरेद एक सौ बासठ वर्ष का हुआ, जब उस ने हनोक को जन्म दिया। 19 और हनोक के जन्म के पश्चात्‌ थेरेद आठ सौ वर्ष जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई। 20 और थेरेद की कुल अवस्या नौ सौ बासठ वर्ष की हुई : तत्पश्चात्‌ वह मर गया। 21 जब हनोक पैंसठ वर्ष का हुआ, तब उस ने मतूशेलह को जन्म दिया। 22 और मतूशेलह के जन्म के पश्चात्‌ हनोक तीन सौ वर्ष तक परमेश्वर के साय साय चलता रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई। 23 और हनोक की कुल अवस्या तीन सौ पैंसठ वर्ष की हुई। 24 और हनोक परमेश्वर के साय साय चलता या; फिर वह लोप हो गया क्योंकि परमेश्वर ने उसे उठा लिया। 25 जब मतूशेलह एक सौ सत्तासी वर्ष का हुआ, तब उस ने लेमेक को जन्म दिया। 26 और लेमेक के जन्म के पश्चात्‌ मतूशेलह सात सौ बयासी वर्ष जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई। 27 और मतूशेलह की कुल अवस्या नौ सौ उनहत्तर वर्ष की हुई : तत्पश्चात्‌ वह मर गया।। 28 जब लेमेक एक सौ बयासी वर्ष का हुआ, तब उस ने एक पुत्र जन्म दिया। 29 और यह कहकर उसका नाम नूह रखा, कि यहोवा ने जो पृय्वी को शाप दिया है, उसके विषय यह लड़का हमारे काम में, और उस कठिन परिश्र्म में जो हम करते हैं, हम को शान्ति देगा। 30 और नूह के जन्म के पश्चात्‌ लेमेक पांच सौ पंचानवे वर्ष जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई। 31 और लेमेक की कुल अवस्या सात सौ सतहत्तर वर्ष की हुई : तत्पश्चात्‌ वह मर गया।। 32 और नूह पांच सौ वर्ष का हुआ; और नूह ने शेम, और हाम और थेपेत को जन्म दिया।। उत्पत्ति 6 1 फिर जब मनुष्य भूमि के ऊपर बहुत बढ़ने लगे, और उनके बेटियां उत्पन्न हुई, 2 तब परमेश्वर के पुत्रोंने मनुष्य की पुत्रियोंको देखा, कि वे सुन्दर हैं; सो उन्होंने जिस जिसको चाहा उन से ब्याह कर लिया। 3 और यहोवा ने कहा, मेरा आत्मा मनुष्य से सदा लोंविवाद करता न रहेगा, क्योंकि मनुष्य भी शरीर ही है : उसकी आयु एक सौ बीस वर्ष की होगी। 4 उन दिनोंमें पृय्वी पर दानव रहते थे; और इसके पश्चात्‌ जब परमेश्वर के पुत्र मनुष्य की पुत्रियोंके पास गए तब उनके द्वारा जो सन्तान उत्पन्न हुए, वे पुत्र शूरवीर होते थे, जिनकी कीत्तिर् प्राचीनकाल से प्रचलित है। 5 और यहोवा ने देखा, कि मनुष्योंकी बुराई पृय्वी पर बढ़ गई है, और उनके मन के विचार में जो कुछ उत्पन्न होता है सो निरन्तर बुरा ही होता है। 6 और यहोवा पृय्वी पर मनुष्य को बनाने से पछताया, और वह मन में अति खेदित हुआ। 7 तब यहोवा ने सोचा, कि मै मनुष्य को जिसकी मै ने सृष्टि की है पृय्वी के ऊपर से मिटा दूंगा क्योंकि मैं उनके बनाने से पछताता हूं। 8 परन्तु यहोवा के अनुग्रह की दृष्टि नूह पर बनी रही।। 9 नूह की वंशावली यह है। नूह धर्मी पुरूष और अपके समय के लोगोंमें खरा या, और नूह परमेश्वर ही के साय साय चलता रहा। 10 और नूह से, शेम, और हाम, और थेपेत नाम, तीन पुत्र उत्पन्न हुए। 11 उस समय पृय्वी परमेश्वर की दृष्टि में बिगड़ गई यी, और उपद्रव से भर गई यी। 12 और परमेश्वर ने पृय्वी पर जो दृष्टि की तो क्या देखा, कि वह बिगड़ी हुई है; क्योंकि सब प्राणियोंने पृय्वी पर अपक्की अपक्की चाल चलन बिगाड़ ली यी। 13 तब परमेश्वर ने नूह से कहा, सब प्राणियोंके अन्त करने का प्रश्न मेरे साम्हने आ गया है; क्योंकि उनके कारण पृय्वी उपद्रव से भर गई है, इसलिथे मै उनको पृय्वी समेत नाश कर डालूंगा। 14 इसलिथे तू गोपेर वृझ की लकड़ी का एक जहाज बना ले, उस में कोठरियां बनाना, और भीतर बाहर उस पर राल लगाना। 15 और इस ढंग से उसको बनाना : जहाज की लम्बाई तीन सौ हाथ, चौड़ाई पचास हाथ, और ऊंचाई तीस हाथ की हो। 16 जहाज में एक खिड़की बनाना, और इसके एक हाथ ऊपर से उसकी छत बनाना, और जहाज की एक अलंग में एक द्वार रखना, और जहाज में पहिला, दूसरा, तीसरा खण्ड बनाना। 17 और सुन, मैं आप पृय्वी पर जलप्रलय करके सब प्राणियोंको, जिन में जीवन की आत्मा है, आकाश के नीचे से नाश करने पर हूं : और सब जो पृय्वी पर है मर जाएंगे। 18 परन्तु तेरे संग मै वाचा बान्धता हूं : इसलिथे तू अपके पुत्रों, स्त्री, और बहुओं समेत जहाज में प्रवेश करना। 19 और सब जीवित प्राणियोंमें से, तू एक एक जाति के दो दो, अर्यात्‌ एक नर और एक मादा जहाज में ले जाकर, अपके साय जीवित रखना। 20 एक एक जाति के पक्की, और एक एक जाति के पशु, और एक एक जाति के भूमि पर रेंगनेवाले, सब में से दो दो तेरे पास आएंगे, कि तू उनको जीवित रखे। 21 और भांति भांति का भोज्य पदार्य जो खाया जाता है, उनको तू लेकर अपके पास इकट्ठा कर रखना सो तेरे और उनके भोजन के लिथे होगा। 22 परमेश्वर की इस आज्ञा के अनुसार नूह ने किया। उत्पत्ति 7 1 और यहोवा ने नूह से कहा, तू अपके सारे घराने समेत जहाज में जा; क्योंकि मै ने इस समय के लोगोंमें से केवल तुझी को अपक्की दृष्टि में धर्मी देखा है। 2 सब जाति के शुद्ध पशुओं में से तो तू सात सात, अर्यात्‌ नर और मादा लेना : पर जो पशु शुद्ध नहीं है, उन में से दो दो लेना, अर्यात्‌ नर और मादा : 3 और आकाश के पझियोंमें से भी, सात सात, अर्यात्‌ नर और मादा लेना : कि उनका वंश बचकर सारी पृय्वी के ऊपर बना रहे। 4 क्योंकि अब सात दिन और बीतने पर मैं पृय्वी पर चालीस दिन और चालीस रात तक जल बरसाता रहूंगा; जितनी वस्तुएं मैं ने बनाईं है सब को भूमि के ऊपर से मिटा दूंगा। 5 यहोवा की इस आज्ञा के अनुसार नूह ने किया। 6 नूह की अवस्या छ: सौ वर्ष की यी, जब जलप्रलय पृय्वी पर आया। 7 नूह अपके पुत्रों, पत्नी और बहुओं समेत, जलप्रलय से बचने के लिथे जहाज में गया। 8 और शुद्ध, और अशुद्ध दोनो प्रकार के पशुओं में से, पझियों, 9 और भूमि पर रेंगनेवालोंमें से भी, दो दो, अर्यात्‌ नर और मादा, जहाज में नूह के पास गए, जिस प्रकार परमेश्वर ने नूह को आज्ञा दी यी। 10 सात दिन के उपरान्त प्रलय का जल पृय्वी पर आने लगा। 11 जब नूह की अवस्या के छ: सौवें वर्ष के दूसरे महीने का सत्तरहवां दिन आया; उसी दिन बड़े गहिरे समुद्र के सब सोते फूट निकले और आकाश के फरोखे खुल गए। 12 और वर्षा चालीस दिन और चालीस रात निरन्तर पृय्वी पर होती रही। 13 ठीक उसी दिन नूह अपके पुत्र शेम, हाम, और थेपेत, और अपक्की पत्नी, और तीनोंबहुओं समेत, 14 और उनके संग एक एक जाति के सब बनैले पशु, और एक एक जाति के सब घरेलू पशु, और एक एक जाति के सब पृय्वी पर रेंगनेवाले, और एक एक जाति के सब उड़नेवाले पक्की, जहाज में गए। 15 जितने प्राणियोंमें जीवन की आत्मा यी उनकी सब जातियोंमें से दो दो नूह के पास जहाज में गए। 16 और जो गए, वह परमेश्वर की आज्ञा के अनुसार सब जाति के प्राणियोंमें से नर और मादा गए। तब यहोवा ने उसका द्वार बन्द कर दिया। 17 और पृय्वी पर चालीस दिन तक प्रलय होता रहा; और पानी बहुत बढ़ता ही गया जिस से जहाज ऊपर को उठने लगा, और वह पृय्वी पर से ऊंचा उठ गया। 18 और जल बढ़ते बढ़ते पृय्वी पर बहुत ही बढ़ गया, और जहाज जल के ऊपर ऊपर तैरता रहा। 19 और जल पृय्वी पर अत्यन्त बढ़ गया, यहां तक कि सारी धरती पर जितने बड़े बड़े पहाड़ थे, सब डूब गए। 20 जल तो पन्द्रह हाथ ऊपर बढ़ गया, और पहाड़ भी डूब गए 21 और क्या पक्की, क्या घरेलू पशु, क्या बनैले पशु, और पृय्वी पर सब चलनेवाले प्राणी, और जितने जन्तु पृय्वी मे बहुतायत से भर गए थे, वे सब, और सब मनुष्य मर गए। 22 जो जो स्यल पर थे उन में से जितनोंके नयनोंमें जीवन का श्वास या, सब मर मिटे। 23 और क्या मनुष्य, क्या पशु, क्या रेंगनेवाले जन्तु, क्या आकाश के पक्की, जो जो भूमि पर थे, सो सब पृय्वी पर से मिट गए; केवल नूह, और जितने उसके संग जहाज में थे, वे ही बच गए। 24 और जल पृय्वी पर एक सौ पचास दिन तक प्रबल रहा।। उत्पत्ति 8 1 और परमेश्वर ने नूह की, और जितने बनैले पशु, और घरेलू पशु उसके संग जहाज में थे, उन सभोंकी सुधि ली : और परमेश्वर ने पृय्वी पर पवन बहाई, और जल घटने लगा। 2 और गहिरे समुद्र के सोते और आकाश के फरोखे बंद हो गए; और उस से जो वर्षा होती यी सो भी यम गई। 3 और एक सौ पचास दिन के पशचात्‌ जल पृय्वी पर से लगातार घटने लगा। 4 सातवें महीने के सत्तरहवें दिन को, जहाज अरारात नाम पहाड़ पर टिक गया। 5 और जल दसवें महीने तक घटता चला गया, और दसवें महीने के पहिले दिन को, पहाड़ोंकी चोटियाँ दिखलाई दीं। 6 फिर ऐसा हुआ कि चालीस दिन के पश्चात्‌ नूह ने अपके बनाए हुए जहाज की खिड़की को खोलकर, एक कौआ उड़ा दिया : 7 जब तक जल पृय्वी पर से सूख न गया, तब तक कौआ इधर उधर फिरता रहा। 8 फिर उस ने अपके पास से एक कबूतरी को उड़ा दिया, कि देखें कि जल भूमि से घट गया कि नहीं। 9 उस कबूतरी को अपके पैर के तले टेकने के लिथे कोई आधार ने मिला, सो वह उसके पास जहाज में लौट आई : क्योंकि सारी पृय्वी के ऊपर जल ही जल छाया या तब उस ने हाथ बढ़ाकर उसे अपके पास जहाज में ले लिया। 10 तब और सात दिन तक ठहरकर, उस ने उसी कबूतरी को जहाज में से फिर उड़ा दिया। 11 और कबूतरी सांफ के समय उसके पास आ गई, तो क्या देखा कि उसकी चोंच में जलपाई का एक नया पत्ता है; इस से नूह ने जान लिया, कि जल पृय्वी पर घट गया है। 12 फिर उस ने सात दिन और ठहरकर उसी कबूतरी को उड़ा दिया; और वह उसके पास फिर कभी लौटकर न आई। 13 फिर ऐसा हुआ कि छ: सौ एक वर्ष के पहिले महीने के पहिले दिन जल पृय्वी पर से सूख गया। तब नूह ने जहाज की छत खोलकर क्या देखा कि धरती सूख गई है। 14 और दूसरे महीने के सताईसवें दिन को पृय्वी पूरी रीति से सूख गई।। 15 तब परमेश्वर ने, नूह से कहा, 16 तू अपके पुत्रों, पत्नी, और बहुओं समेत जहाज में से निकल आ। 17 क्या पक्की, क्या पशु, क्या सब भांति के रेंगनेवाले जन्तु जो पृय्वी पर रेंगते हैं, जितने शरीरधारी जीवजन्तु तेरे संग हैं, उस सब को अपके साय निकाल ले आ, कि पृय्वी पर उन से बहुत बच्चे उत्पन्न हों; और वे फूलें-फलें, और पृय्वी पर फैल जाएं। 18 तब नूह, और उसके पुत्र, और पत्नी, और बहुएं, निकल आईं : 19 और सब चौपाए, रेंगनेवाले जन्तु, और पक्की, और जितने जीवजन्तु पृय्वी पर चलते फिरते हैं, सो सब जाति जाति करके जहाज में से निकल आए। 20 तब नूह ने यहोवा के लिथे एक वेदी बनाई; और सब शुद्ध पशुओं, और सब शुद्ध पझियोंमें से, कुछ कुछ लेकर वेदी पर होमबलि चढ़ाया। 21 इस पर यहोवा ने सुखदायक सुगन्ध पाकर सोचा, कि मनुष्य के कारण मैं फिर कभी भूमि को शाप न दूंगा, यद्यपि मनुष्य के मन में बचपन से जो कुछ उत्पन्न होता है सो बुरा ही होता है; तौभी जैसा मैं ने सब जीवोंको अब मारा है, वैसा उनको फिर कभी न मारूंगा। 22 अब से जब तक पृय्वी बनी रहेगी, तब तक बोने और काटने के समय, ठण्ड और तपन, धूपकाल और शीतकाल, दिन और रात, निरन्तर होते चले जाएंगे।। उत्पत्ति 9 1 फिर परमेश्वर ने नूह और उसके पुत्रोंको आशीष दी और उन से कहा कि फूलो-फलो, और बढ़ो, और पृय्वी में भर जाओ। 2 और तुम्हारा डर और भय पृय्वी के सब पशुओं, और आकाश के सब पझियों, और भूमि पर के सब रेंगनेवाले जन्तुओं, और समुद्र की सब मछलियोंपर बना रहेगा : वे सब तुम्हारे वश में कर दिए जाते हैं। 3 सब चलनेवाले जन्तु तुम्हारा आहार होंगे; जैसा तुम को हरे हरे छोटे पेड़ दिए थे, वैसा ही अब सब कुछ देता हूं। 4 पर मांस को प्राण समेत अर्यात्‌ लोहू समेत तुम न खाना। 5 और निश्चय मैं तुम्हारा लोहू अर्यात्‌ प्राण का पलटा लूंगा : सब पशुओं, और मनुष्यों, दोनोंसे मैं उसे लूंगा : मनुष्य के प्राण का पलटा मै एक एक के भाई बन्धु से लूंगा। 6 जो कोई मनुष्य का लोहू बहाएगा उसका लोहू मनुष्य ही से बहाथा जाएगा क्योंकि परमेश्वर ने मनुष्य को अपके ही स्वरूप के अनुसार बनाया है। 7 और तुम तो फूलो-फलो, और बढ़ो, और पृय्वी में बहुत बच्चे जन्मा के उस में भर जाओ।। 8 फिर परमेश्वर ने नूह और उसके पुत्रोंसे कहा, 9 सुनों, मैं तुम्हारे साय और तुम्हारे पश्चात्‌ जो तुम्हारा वंश होगा, उसके साय भी वाचा बान्धता हूं। 10 और सब जीवित प्राणियोंसे भी जो तुम्हारे संग है क्या पक्की क्या घरेलू पशु, क्या पृय्वी के सब बनैले पशु, पृय्वी के जितने जीवजन्तु जहाज से निकले हैं; सब के साय भी मेरी यह वाचा बन्धती है : 11 और मै तुम्हारे साय अपक्की इस वाचा को पूरा करूंगा; कि सब प्राणी फिर जलप्रलय से नाश न होंगे : और पृय्वी के नाश करने के लिथे फिर जलप्रलय न होगा। 12 फिर परमेश्वर ने कहा, जो वाचा मै तुम्हारे साय, और जितने जीवित प्राणी तुम्हारे संग हैं उन सब के साय भी युग युग की पीढिय़ोंके लिथे बान्धता हूं; उसका यह चिन्ह है : 13 कि मैं ने बादल मे अपना धनुष रखा है वह मेरे और पृय्वी के बीच में वाचा का चिन्ह होगा। 14 और जब मैं पृय्वी पर बादल फैलाऊं जब बादल में धनुष देख पकेगा। 15 तब मेरी जो वाचा तुम्हारे और सब जीवित शरीरधारी प्राणियोंके साय बान्धी है; उसको मैं स्मरण करूंगा, तब ऐसा जलप्रलय फिर न होगा जिस से सब प्राणियोंका विनाश हो। 16 बादल में जो धनुष होगा मैं उसे देख के यह सदा की वाचा स्मरण करूंगा जो परमेश्वर के और पृय्वी पर के सब जीवित शरीरधारी प्राणियोंके बीच बन्धी है। 17 फिर परमेश्वर ने नूह से कहा जो वाचा मैं ने पृय्वी भर के सब प्राणियोंके साय बान्धी है, उसका चिन्ह यही है।। 18 नूह के जो पुत्र जहाज में से निकले, वे शेम, हाम, और थेपेत थे : और हाम तो कनान का पिता हुआ। 19 नूह के तीन पुत्र थे ही हैं, और इनका वंश सारी पृय्वी पर फैल गया। 20 और नूह किसानी करने लगा, और उस ने दाख की बारी लगाई। 21 और वह दाखमधु पीकर मतवाला हुआ; और अपके तम्बू के भीतर नंगा हो गया। 22 तब कनान के पिता हाम ने, अपके पिता को नंगा देखा, और बाहर आकर अपके दोनोंभाइयोंको बतला दिया। 23 तब शेम और थेपेत दोनोंने कपड़ा लेकर अपके कन्धोंपर रखा, और पीछे की ओर उलटा चलकर अपके पिता के नंगे तन को ढ़ाप दिया, और वे अपना मुख पीछे किए हुए थे इसलिथे उन्होंने अपके पिता को नंगा न देखा। 24 जब नूह का नशा उतर गया, तब उस ने जान लिया कि उसके छोटे पुत्र ने उस से क्या किया है। 25 इसलिथे उस ने कहा, कनान शापित हो : वह अपके भाई बन्धुओं के दासोंका दास हो। 26 फिर उस ने कहा, शेम का परमेश्वर यहोवा धन्य है, और कनान शेम का दास होवे। 27 परमेश्वर थेपेत के वंश को फैलाए; और वह शेम के तम्बुओं मे बसे, और कनान उसका दास होवे। 28 जलप्रलय के पश्चात्‌ नूह साढ़े तीन सौ वर्ष जीवित रहा। 29 और नूह की कुल अवस्या साढ़े नौ सौ वर्ष की हुई : तत्पश्चात्‌ वह मर गया। उत्पत्ति 10 1 नूह के पुत्र जो शेम, हाम और थेपेत थे उनके पुत्र जलप्रलय के पश्चात्‌ उत्पन्न हुए : उनकी वंशावली यह है।। 2 थेपेत के पुत्र : गोमेर, मागोग, मादै, यावान, तूबल, मेशेक, और तीरास हुए। 3 और गोमेर के पुत्र : अशकनज, रीपत, और तोगर्मा हुए। 4 और यावान के वंश में एलीशा, और तर्शीश, और कित्ती, और दोदानी लोग हुए। 5 इनके वंश अन्यजातियोंके द्वीपोंके देशोंमें ऐसे बंट गए, कि वे भिन्न भिन्न भाषाओं, कुलों, और जातियोंके अनुसार अलग अलग हो गए।। 6 फिर हाम के पुत्र : कूश, और मिस्र, और फूत और कनान हुए। 7 और कूश के पुत्र सबा, हवीला, सबता, रामा, और सबूतका हुए : और रामा के पुत्र शबा और ददान हुए। 8 और कूश के वंश में निम्रोद भी हुआ; पृय्वी पर पहिला वीर वही हुआ है। 9 वही यहोवा की दृष्टि में पराक्रमी शिकार खेलनेवाला ठहरा, इस से यह कहावत चक्की है; कि निम्रोद के समान यहोवा की दृष्टि में पराक्रमी शिकार खेलनेवाला। 10 और उसके राज्य का आरम्भ शिनार देश में बाबुल, अक्कद, और कलने हुआ। 11 उस देश से वह निकलकर अश्शूर्‌ को गया, और नीनवे, रहोबोतीर, और कालह को, 12 और नीनवे और कालह के बीच रेसेन है, उसे भी बसाया, बड़ा नगर यही है। 13 और मिस्र के वंश में लूदी, अनामी, लहाबी, नप्तूही, 14 और पत्रुसी, कसलूही, और कप्तोरी लोग हुए, कसलूहियोंमे से तो पलिश्ती लोग निकले।। 15 फिर कनान के वंश में उसका ज्थेष्ठ सीदोन, तब हित्त, 16 और यबूसी, एमोरी, गिर्गाशी, 17 हिव्वी, अर्की, सीनी, 18 अर्वदी, समारी, और हमाती लोग भी हुए : फिर कनानियोंके कुल भी फैल गए। 19 और कनानियोंका सिवाना सीदोन से लेकर गरार के मार्ग से होकर अज्जा तक और फिर सदोम और अमोरा और अदमा और सबोयीम के मार्ग से होकर लाशा तक हुआ। 20 हाम के वंश में थे ही हुए; और थे भिन्न भिन्न कुलों, भाषाओं, देशों, और जातियोंके अनुसार अलग अलग हो गए।। 21 फिर शेम, जो सब एबेरवंशियोंका मूलपुरूष हुआ, और जो थेपेत का ज्थेष्ठ भाई या, उसके भी पुत्र उत्पन्न हुए। 22 शेम के पुत्र : एलाम, अश्शूर्‌, अर्पझद्‌, लूद और आराम हुए। 23 और आराम के पुत्र : ऊस, हूल, गेतेर और मश हुए। 24 और अर्पझद्‌ ने शेलह को, और शेलह ने एबेर को जन्म दिया। 25 और एबेर के दो पुत्र उत्पन्न हुए, एक का नाम पेलेग इस कारण रखा गया कि उसके दिनोंमें पृय्वी बंट गई, और उसके भाई का नाम योक्तान है। 26 और योक्तान ने अल्मोदाद, शेलेप, हसर्मावेत, थेरह, 27 यदोरवाम, ऊजाल, दिक्ला, 28 ओबाल, अबीमाएल, शबा, 29 ओपीर, हवीला, और योबाब को जन्म दिया : थे ही सब योक्तान के पुत्र हुए। 30 इनके रहने का स्यान मेशा से लेकर सपारा जो पूर्व में एक पहाड़ है, उसके मार्ग तक हुआ। 31 शेम के पुत्र थे ही हुए; और थे भिन्न भिन्न कुलों, भाषाओं, देशोंऔर जातियोंके अनुसार अलग अलग हो गए।। 32 नूह के पुत्रोंके घराने थे ही हैं : और उनकी जातियोंके अनुसार उनकी वंशावलियां थे ही हैं; और जलप्रलय के पश्चात्‌ पृय्वी भर की जातियां इन्हीं में से होकर बंट गई।। उत्पत्ति 11 1 सारी पृय्वी पर एक ही भाषा, और एक ही बोली यी। 2 उस समय लोग पूर्व की और चलते चलते शिनार देश में एक मैदान पाकर उस में बस गए। 3 तब वे आपस में कहने लगे, कि आओ; हम ईंटें बना बना के भली भंाति आग में पकाएं, और उन्होंने पत्यर के स्यान में ईंट से, और चूने के स्यान में मिट्टी के गारे से काम लिया। 4 फिर उन्होंने कहा, आओ, हम एक नगर और एक गुम्मट बना लें, जिसकी चोटी आकाश से बात करे, इस प्रकार से हम अपना नाम करें ऐसा न हो कि हम को सारी पृय्वी पर फैलना पके। 5 जब लोग नगर और गुम्मट बनाने लगे; तब इन्हें देखने के लिथे यहोवा उतर आया। 6 और यहोवा ने कहा, मैं क्या देखता हूं, कि सब एक ही दल के हैं और भाषा भी उन सब की एक ही है, और उन्होंने ऐसा ही काम भी आरम्भ किया; और अब जितना वे करने का यत्न करेंगे, उस में से कुछ उनके लिथे अनहोना न होगा। 7 इसलिथे आओ, हम उतर के उनकी भाषा में बड़ी गड़बड़ी डालें, कि वे एक दूसरे की बोली को न समझ सकें। 8 इस प्रकार यहोवा ने उनको, वहां से सारी पृय्वी के ऊपर फैला दिया; और उन्होंने उस नगर का बनाना छोड़ दिया। 9 इस कारण उस नगर को नाम बाबुल पड़ा; क्योंकि सारी पृय्वी की भाषा में जो गड़बड़ी है, सो यहोवा ने वहीं डाली, और वहीं से यहोवा ने मनुष्योंको सारी पृय्वी के ऊपर फैला दिया।। 10 शेम की वंशावली यह है। जल प्रलय के दो वर्ष पश्चात्‌ जब शेम एक सौ वर्ष का हुआ, तब उस ने अर्पझद्‌ को जन्म दिया। 11 और अर्पझद्‌ ने जन्म के पश्चात्‌ शेम पांच सौ वर्ष जीवित रहा; और उसके और भी बेटे बेटियां उत्पन्न हुई।। 12 जब अर्पझद्‌ पैंतीस वर्ष का हुआ, तब उस ने शेलह को जन्म दिया। 13 और शेलह के जन्म के पश्चात्‌ अर्पझद्‌ चार सौ तीन वर्ष और जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई।। 14 जब शेलह तीस वर्ष का हुआ, तब उसके द्वारा एबेर को जन्म हुआ। 15 और एबेर के जन्म के पश्चात्‌ शेलह चार सौ तीन वर्ष और जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई।। 16 जब एबेर चौंतीस वर्ष का हुआ, तब उसके द्वारा पेलेग का जन्म हुआ। 17 और पेलेग के जन्म के पश्चात्‌ एबेर चार सौ तीस वर्ष और जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई।। 18 जब पेलेग तीस वर्ष को हुआ, तब उसके द्वारा रू का जन्म हुआ। 19 और रू के जन्म के पश्चात्‌ पेलेग दो सौ नौ वर्ष और जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई।। 20 जब रू बत्तीस वर्ष का हुआ, तब उसके द्वारा सरूग का जन्म हुआ। 21 और सरूग के जन्म के पश्चात्‌ रू दो सौ सात वर्ष और जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई।। 22 जब सरूग तीस वर्ष का हुआ, तब उसके द्वारा नाहोर का जन्म हुआ। 23 और नाहोर के जन्म के पश्चात्‌ सरूग दो सौ वर्ष और जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई।। 24 जब नाहोर उनतीस वर्ष का हुआ, तब उसके द्वारा तेरह का जन्म हुआ। 25 और तेरह के जन्म के पश्चात्‌ नाहोर एक सौ उन्नीस वर्ष और जीवित रहा, और उसके और भी बेटे बेटियां उत्पन्न हुई।। 26 जब तक तेरह सत्तर वर्ष का हुआ, तब तक उसके द्वारा अब्राम, और नाहोर, और हारान उत्पन्न हुए।। 27 तेरह की यह वंशावली है। तेरह ने अब्राम, और नाहोर, और हारान को जन्म दिया; और हारान ने लूत को जन्म दिया। 28 और हारान अपके पिता के साम्हने ही, कस्‌दियोंके ऊर नाम नगर में, जो उसकी जन्मभूमि यी, मर गया। 29 अब्राम और नाहोर ने स्त्रियां ब्याह लीं : अब्राम की पत्नी का नाम तो सारै, और नाहोर की पत्नी का नाम मिल्का या, यह उस हारान की बेटी यी, जो मिल्का और यिस्का दोनोंका पिता या। 30 सारै तो बांफ यी; उसके संतान न हुई। 31 और तेरह अपना पुत्र अब्राम, और अपना पोता लूत जो हारान का पुत्र या, और अपक्की बहू सारै, जो उसके पुत्र अब्राम की पत्नी यी इन सभोंको लेकर कस्‌दियोंके ऊर नगर से निकल कनान देश जाने को चला; पर हारान नाम देश में पहुचकर वहीं रहने लगा। 32 जब तेरह दो सौ पांच वर्ष का हुआ, तब वह हारान देश में मर गया।। उत्पत्ति 12 1 यहोवा ने अब्राम से कहा, अपके देश, और अपक्की जन्मभूमि, और अपके पिता के घर को छोड़कर उस देश में चला जा जो मैं तुझे दिखाऊंगा। 2 और मैं तुझ से एक बड़ी जाति बनाऊंगा, और तुझे आशीष दूंगा, और तेरा नाम बड़ा करूंगा, और तू आशीष का मूल होगा। 3 और जो तुझे आशीर्वाद दें, उन्हें मैं आशीष दूंगा; और जो तुझे कोसे, उसे मैं शाप दूंगा; और भूमण्डल के सारे कुल तेरे द्वारा आशीष पाएंगे। 4 यहोवा के इस वचन के अनुसार अब्राम चला; और लूत भी उसके संग चला; और जब अब्राम हारान देश से निकला उस समय वह पचहत्तर वर्ष का या। 5 सो अब्राम अपक्की पत्नी सारै, और अपके भतीजे लूत को, और जो धन उन्होंने इकट्ठा किया या, और जो प्राणी उन्होंने हारान में प्राप्त किए थे, सब को लेकर कनान देश में जाने को निकल चला; और वे कनान देश में आ भी गए। 6 उस देश के बीच से जाते हुए अब्राम शकेम में, जहां मोरे का बांज वृझ है, पंहुचा; उस समय उस देश में कनानी लोग रहते थे। 7 तब यहोवा ने अब्राम को दर्शन देकर कहा, यह देश मैं तेरे वंश को दूंगा : और उस ने वहां यहोवा के लिथे जिस ने उसे दर्शन दिया या, एक वेदी बनाई। 8 फिर वहां से कूच करके, वह उस पहाड़ पर आया, जो बेतेल के पूर्व की ओर है; और अपना तम्बू उस स्यान में खड़ा किया जिसकी पच्छिम की ओर तो बेतेल, और पूर्व की ओर ऐ है; और वहां भी उस ने यहोवा के लिथे एक वेदी बनाई : और यहोवा से प्रार्यना की 9 और अब्राम कूच करके दक्खिन देश की ओर चला गया।। 10 और उस देश में अकाल पड़ा : और अब्राम मिस्र देश को चला गया कि वहां परदेशी होकर रहे -- क्योंकि देश में भयंकर अकाल पड़ा या। 11 फिर ऐसा हुआ कि मिस्र के निकट पहुंचकर, उस ने अपक्की पत्नी सारै से कहा, सुन, मुझे मालूम है, कि तू एक सुन्दर स्त्री है : 12 इस कारण जब मिस्री तुझे देखेंगे, तब कहेंगे, यह उसकी पत्नी है, सो वे मुझ को तो मार डालेंगे, पर तुझ को जीती रख लेंगे। 13 सो यह कहना, कि मैं उसकी बहिन हूं; जिस से तेरे कारण मेरा कल्याण हो और मेरा प्राण तेरे कारण बचे। 14 फिर ऐसा हुआ कि जब अब्राम मिस्र में आया, तब मिस्रियोंने उसकी पत्नी को देखा कि यह अति सुन्दर है। 15 और फिरौन के हाकिमोंने उसको देखकर फिरौन के साम्हने उसकी प्रशंसा की : सो वह स्त्री फिरौन के घर में रखी गई। 16 और उस ने उसके कारण अब्राम की भलाई की; सो उसको भेड़-बकरी, गाय-बैल, दास-दासियां, गदहे-गदहियां, और ऊंट मिले। 17 तब यहोवा ने फिरौन और उसके घराने पर, अब्राम की पत्नी सारै के कारण बड़ी बड़ी विपत्तियां डालीं। 18 सो फिरौन ने अब्राम को बुलवाकर कहा, तू ने मुझ से क्या किया है ? तू ने मुझे क्योंनहीं बताया कि वह तेरी पत्नी है ? 19 तू ने क्योंकहा, कि वह तेरी बहिन है ? मैं ने उसे अपक्की ही पत्नी बनाने के लिथे लिया; परन्तु अब अपक्की पत्नी को लेकर यहां से चला जा। 20 और फिरौन ने अपके आदमियोंको उसके विषय में आज्ञा दी और उन्होंने उसको और उसकी पत्नी को, सब सम्पत्ति समेत जो उसका या, विदा कर दिया।। उत्पत्ति 13 1 तब अब्राम अपक्की पत्नी, और अपक्की सारी सम्पत्ति लेकर, लूत को भी संग लिथे हुए, मिस्र को छोड़कर कनान के दक्खिन देश में आया। 2 अब्राम भेड़-बकरी, गाय-बैल, और सोने-रूपे का बड़ा धनी या। 3 फिर वह दक्खिन देश से चलकर, बेतेल के पास उसी स्यान को पहुंचा, जहां उसका तम्बू पहले पड़ा या, जो बेतेल और ऐ के बीच में है। 4 यह स्यान उस वेदी का है, जिसे उस ने पहले बनाई यी, और वहां अब्राम ने फिर यहोवा से प्रार्यना की। 5 और लूत के पास भी, जो अब्राम के साय चलता या, भेड़-बकरी, गाय-बैल, और तम्बू थे। 6 सो उस देश में उन दोनोंकी समाई न हो सकी कि वे इकट्ठे रहें : क्योंकि उनके पास बहुत धन या इसलिथे वे इकट्ठे न रह सके। 7 सो अब्राम, और लूत की भेड़-बकरी, और गाय-बैल के चरवाहोंके बीच में फगड़ा हुआ : और उस समय कनानी, और परिज्जी लोग, उस देश में रहते थे। 8 तब अब्राम लूत से कहने लगा, मेरे और तेरे बीच, और मेरे और तेरे चरवाहोंके बीच में फगड़ा न होने पाए; क्योंकि हम लोग भाई बन्धु हैं। 9 क्या सारा देश तेरे साम्हने नहीं? सो मुझ से अलग हो, यदि तू बाईं ओर जाए तो मैं दहिनी ओर जाऊंगा; और यदि तू दहिनी ओर जाए तो मैं बाईं ओर जाऊंगा। 10 तब लूत ने आंख उठाकर, यरदन नदी के पास वाली सारी तराई को देखा, कि वह सब सिंची हुई है। 11 जब तक यहोवा ने सदोम और अमोरा को नाश न किया या, तब तक सोअर के मार्ग तक वह तराई यहोवा की बाटिका, और मिस्र देश के समान उपजाऊ यी। 12 अब्राम तो कनान देश में रहा, पर लूत उस तराई के नगरोंमें रहने लगा; और अपना तम्बू सदोम के निकट खड़ा किया। 13 सदोम के लोग यहोवा के लेखे में बड़े दुष्ट और पापी थे। 14 जब लूत अब्राम से अलग हो गया तब उसके पश्चात्‌ यहोवा ने अब्राम से कहा, आंख उठाकर जिस स्यान पर तू है वहां से उत्तर-दक्खिन, पूर्व-पश्चिम, चारोंओर दृष्टि कर। 15 क्योंकि जितनी भूमि तुझे दिखाई देती है, उस सब को मैं तुझे और तेरे वंश को युग युग के लिथे दूंगा। 16 और मैं तेरे वंश को पृय्वी की धूल के किनकोंकी नाई बहुत करूंगा, यहां तक कि जो कोई पृय्वी की धूल के किनकोंको गिन सकेगा वही तेरा वंश भी गिन सकेगा। 17 उठ, इस देश की लम्बाई और चौड़ाई में चल फिर; क्योंकि मैं उसे तुझी को दूंगा। 18 इसके पशचात्‌ अब्राम अपना तम्बू उखाड़कर, मम्रे के बांजोंके बीच जो हेब्रोन में थे जाकर रहने लगा, और वहां भी यहोवा की एक वेदी बनाई।। उत्पत्ति 14 1 शिनार के राजा अम्रापेल, और एल्लासार के राजा अर्योक, और एलाम के राजा कदोर्लाओमेर, और गोयीम के राजा तिदाल के दिनोंमें ऐसा हुआ, 2 कि उन्होंने सदोम के राजा बेरा, और अमोरा के राजा बिर्शा, और अदमा के राजा शिनाब, और सबोयीम के राजा शेमेबेर, और बेला जो सोअर भी कहलाता है, इन राजाओं के विरूद्ध युद्ध किया। 3 इन पांचोंने सिद्दीम नाम तराई में, जो खारे ताल के पास है, एका किया। 4 बारह वर्ष तक तो थे कदोर्लाओमेर के अधीन रहे; पर तेरहवें वर्ष में उसके विरूद्ध उठे। 5 सो चौदहवें वर्ष में कदोर्लाओमेर, और उसके संगी राजा आए, और अशतरोत्कनम में रपाइयोंको, और हाम में जूजियोंको, और शबेकिर्यातैम में एमियोंको, 6 और सेईर नाम पहाड़ में होरियोंको, मारते मारते उस एल्पारान तक जो जंगल के पास है पहुंच गए। 7 वहां से वे लौटकर एन्मिशपात को आए, जो कादेश भी कहलाता है, और अमालेकियोंके सारे देश को, और उन एमोरियोंको भी जीत लिया, जो हससोन्तामार में रहते थे। 8 तब सदोम, अमोरा, अदमा, सबोयीम, और बेला, जो सोअर भी कहलाता है, इनके राजा निकले, और सिद्दीम नाम तराई। में, उनके साय युद्ध के लिथे पांति बान्धी। 9 अर्यात्‌ एलाम के राजा कदोर्लाओमेर, गोयीम के राजा तिदाल, शिनार के राजा अम्रापेल, और एल्लासार के राजा अर्योक, इन चारोंके विरूद्ध उन पांचोंने पांति बान्धी। 10 सिद्दीम नाम तराई में जहां लसार मिट्टी के गड़हे ही गड़हे थे; सदोम और अमोरा के राजा भागते भागते उन में गिर पके, और जो बचे वे पहाड़ पर भाग गए। 11 तब वे सदोम और अमोरा के सारे धन और भोजन वस्तुओं को लूट लाट कर चले गए। 12 और अब्राम का भतीजा लूत, जो सदोम में रहता या; उसको भी धन समेत वे लेकर चले गए। 13 तब एक जन जो भागकर बच निकला या उस ने जाकर इब्री अब्राम को समाचार दिया; अब्राम तो एमोरी मम्रे, जो एश्कोल और आनेर का भाई या, उसके बांज वृझोंके बीच में रहता या; और थे लोग अब्राम के संग वाचा बान्धे हुए थे। 14 यह सुनकर कि उसका भतीजा बन्धुआई में गया है, अब्राम ने अपके तीन सौ अठारह शिझित, युद्ध कौशल में निपुण दासोंको लेकर जो उसके कुटुम्ब में उत्पन्न हुए थे, अस्त्र शस्त्र धारण करके दान तक उनका पीछा किया। 15 और अपके दासोंके अलग अलग दल बान्धकर रात को उन पर चढ़ाई करके उनको मार लिया और होबा तक, जो दमिश्क की उत्तर ओर है, उनका पीछा किया। 16 और सारे धन को, और अपके भतीजे लूत, और उसके धन को, और स्त्रियोंको, और सब बन्धुओं को, लौटा ले आया। 17 जब वह कदोर्लाओमेर और उसके सायी राजाओं को जीतकर लौटा आता या तब सदोम का राजा शावे नाम तराई में, जो राजा की भी कहलाती है, उस से भेंट करने के लिथे आया। 18 जब शालेम का राजा मेल्कीसेदेक, जो परमप्रधान ईश्वर का याजक या, रोटी और दाखमधु ले आया। 19 और उस ने अब्राम को यह आशीर्वाद दिया, कि परमप्रधान ईश्वर की ओर से, जो आकाश और पृय्वी का अधिक्कारनेी है, तू धन्य हो। 20 और धन्य है परमप्रधान ईश्वर, जिस ने तेरे द्रोहियोंको तेरे वश में कर दिया है। तब अब्राम ने उसको सब का दशमांश दिया। 21 जब सदोम के राजा ने अब्राम से कहा, प्राणियोंको तो मुझे दे, और धन को अपके पास रख। 22 अब्राम ने सदोम के राजा ने कहा, परमप्रधान ईश्वर यहोवा, जो आकाश और पृय्वी का अधिक्कारनेी है, 23 उसकी मैं यह शपय खाता हूं, कि जो कुछ तेरा है उस में से न तो मै एक सूत, और न जूती का बन्धन, न कोई और वस्तु लूंगा; कि तू ऐसा न कहने पाए, कि अब्राम मेरे ही कारण धनी हुआ। 24 पर जो कुछ इन जवानोंने खा लिया है और उनका भाग जो मेरे साय गए थे; अर्यात्‌ आनेर, एश्कोल, और मम्रे मैं नहीं लौटाऊंगा वे तो अपना अपना भाग रख लें।। उत्पत्ति 15 1 इन बातोंके पश्चात्‌ यहोवा को यह वचन दर्शन में अब्राम के पास पहुंचा, कि हे अब्राम, मत डर; तेरी ढाल और तेरा अत्यन्त बड़ा फल मैं हूं। 2 अब्राम ने कहा, हे प्रभु यहोवा मैं तो निर्वंश हूं, और मेरे घर का वारिस यह दमिश्की एलीएजेर होगा, सो तू मुझे क्या देगा ? 3 और अब्राम ने कहा, मुझे तो तू ने वंश नहीं दिया, और क्या देखता हूं, कि मेरे घर में उत्पन्न हुआ एक जन मेरा वारिस होगा। 4 तब यहोवा का यह वचन उसके पास पहुंचा, कि यह तेरा वारिस न होगा, तेरा जो निज पुत्र होगा, वही तेरा वारिस होगा। 5 और उस ने उसको बाहर ले जाके कहा, आकाश की ओर दृष्टि करके तारागण को गिन, क्या तू उनको गिन सकता है ? फिर उस ने उस से कहा, तेरा वंश ऐसा ही होगा। 6 उस ने यहोवा पर विश्वास किया; और यहोवा ने इस बात को उसके लेखे में धर्म गिना। 7 और उस ने उस से कहा मैं वही यहोवा हूं जो तुझे कस्‌दियोंके ऊर नगर से बाहर ले आया, कि तुझ को इस देश का अधिक्कारने दूं। 8 उस ने कहा, हे प्रभु यहोवा मैं कैसे जानूं कि मैं इसका अधिक्कारनेी हूंगा ? 9 यहोवा ने उस से कहा, मेरे लिथे तीन वर्ष की एक कलोर, और तीन वर्ष की एक बकरी, और तीन वर्ष का एक मेंढ़ा, और एक पिण्डुक और कबूतर का एक बच्चा ले। 10 और इन सभोंको लेकर, उस ने बीच में से दो टुकड़े कर दिया, और टुकड़ोंको आम्हने-साम्हने रखा : पर चिडिय़ाओं को उस ने टुकड़े न किया। 11 और जब मांसाहारी पक्की लोयोंपर फपके, तब अब्राम ने उन्हें उड़ा दिया। 12 जब सूर्य अस्त होने लगा, तब अब्राम को भारी नींद आई; और देखो, अत्यन्त भय और अन्धकार ने उसे छा लिया। 13 तब यहोवा ने अब्राम से कहा, यह निश्चय जान कि तेरे वंश पराए देश में परदेशी होकर रहेंगे, और उसके देश के लोगोंके दास हो जाएंगे; और वे उनको चार सौ वर्ष लोंदु:ख देंगे; 14 फिर जिस देश के वे दास होंगे उसको मैं दण्ड दूंगा : और उसके पश्चात्‌ वे बड़ा धन वहां से लेकर निकल आएंगे। 15 तू तो अपके पितरोंमें कुशल के साय मिल जाएगा; तुझे पूरे बुढ़ापे में मिट्टी दी जाएगी। 16 पर वे चौयी पीढ़ी में यहां फिर आएंगे : क्योंकि अब तक एमोरियोंका अधर्म पूरा नहीं हुआ। 17 और ऐसा हुआ कि जब सूर्य अस्त हो गया और घोर अन्धकार छा गया, तब एक अंगेठी जिस में से धुआं उठता या और एक जलता हुआ पक्कीता देख पड़ा जो उन टुकड़ोंके बीच में से होकर निकल गया। 18 उसी दिन यहोवा ने अब्राम के साय यह वाचा बान्धी, कि मिस्र के महानद से लेकर परात नाम बड़े नद तक जितना देश है, 19 अर्यात्‌, केनियों, कनिज्जियों, कद्क़ोनियों, 20 हित्तियों, पक्कीज्जियों, रपाइयों, 21 एमोरियों, कनानियों, गिर्गाशियोंऔर यबूसियोंका देश मैं ने तेरे वंश को दिया है।। उत्पत्ति 16 1 अब्राम की पत्नी सारै के कोई सन्तान न यी : और उसके हाजिरा नाम की एक मिस्री लौंडी यी। 2 सो सारै ने अब्राम से कहा, देख, यहोवा ने तो मेरी कोख बन्द कर रखी है सो मैं तुझ से बिनती करती हूं कि तू मेरी लौंडी के पास जा : सम्भव है कि मेरा घर उसके द्वारा बस जाए। 3 सो सारै की यह बात अब्राम ने मान ली। सो जब अब्राम को कनान देश में रहते दस वर्ष बीत चुके तब उसकी स्त्री सारै ने अपक्की मिस्री लौंडी हाजिरा को लेकर अपके पति अब्राम को दिया, कि वह उसकी पत्नी हो। 4 और वह हाजिरा के पास गया, और वह गर्भवती हुई और जब उस ने जाना कि वह गर्भवती है तब वह अपक्की स्वामिनी को अपक्की दृष्टि में तुच्छ समझने लगी। 5 तब सारै ने अब्राम से कहा, जो मुझ पर उपद्रव हुआ सो तेरे ही सिर पर हो : मैं ने तो अपक्की लौंडी को तेरी पत्नी कर दिया; पर जब उस ने जाना कि वह गर्भवती है, तब वह मुझे तुच्छ समझने लगी, सो यहोवा मेरे और तेरे बीच में न्याय करे। 6 अब्राम ने सारै से कहा, देख तेरी लौंडी तेरे वश में है : जैसा तुझे भला लगे वैसा ही उसके साय कर। सो सारै उसको दु:ख देने लगी और वह उसके साम्हने से भाग गई। 7 तब यहोवा के दूत ने उसके जंगल में शूर के मार्ग पर जल के एक सोते के पास पाकर कहा, 8 हे सारै की लौंडी हाजिरा, तू कहां से आती और कहां को जाती है ? उस ने कहा, मैं अपक्की स्वामिनी सारै के साम्हने से भग आई हूं। 9 यहोवा के दूत ने उस से कहा, अपक्की स्वामिनी के पास लौट जा और उसके वश में रह। 10 और यहोवा के दूत ने उस से कहा, मैं तेरे वंश को बहुत बढ़ाऊंगा, यहां तक कि बहुतायत के कारण उसकी गणना न हो सकेगी। 11 और यहोवा के दूत ने उस से कहा, देख तू गर्भवती है, और पुत्र जनेगी, सो उसका नाम इश्माएल रखना; क्योंकि यहोवा ने तेरे दु:ख का हाल सुन लिया है। 12 और वह मनुष्य बनैले गदहे के समान होगा उसका हाथ सबके विरूद्ध उठेगा, और सब के हाथ उसके विरूद्ध उठेंगे; और वह अपके सब भाई बन्धुओं के मध्य में बसा रहेगा। 13 तब उस ने यहोवा का नाम जिस ने उस से बातें की यीं, अत्ताएलरोई रखकर कहा कि, कया मैं यहां भी उसको जाते हुए देखने पाई जो मेरा देखनेहारा है ? 14 इस कारण उस कुएं का नाम लहैरोई कुआं पड़ा; वह तो कादेश और बेरेद के बीच में है। 15 सो हाजिरा अब्राम के द्वारा एक पुत्र जनी : और अब्राम ने अपके पुत्र का नाम, जिसे हाजिरा जनी, इश्माएल रखा। 16 जब हाजिरा ने अब्राम के द्वारा इश्माएल को जन्म दिया उस समय अब्राम छियासी वर्ष का या। उत्पत्ति 17 1 जब अब्राम निन्नानवे वर्ष का हो गया, तब यहोवा ने उसको दर्शन देकर कहा मैं सर्वशक्तिमान ईश्वर हूं; मेरी उपस्यिति में चल और सिद्ध होता जा। 2 और मैं तेरे साय वाचा बान्धूंगा, और तेरे वंश को अत्यन्त ही बढ़ाऊंगा, और तेरे वंश को अत्यन्त ही बढ़ाऊंगा। 3 तब अब्राम मुंह के बल गिरा : और परमेश्वर उस से योंबातें कहता गया, 4 देख, मेरी वाचा तेरे साय बन्धी रहेगी, इसलिथे तू जातियोंके समूह का मूलपिता हो जाएगा। 5 सो अब से तेरा नाम अब्राम न रहेगा परन्तु तेरा नाम इब्राहीम होगा क्योंकि मैं ने तुझे जातियोंके समूह का मूलपिता ठहरा दिया है। 6 और मैं तुझे अत्यन्त ही फुलाऊं फलाऊंगा, और तुझ को जाति जाति का मूल बना दूंगा, और तेरे वंश में राजा उत्पन्न होंगे। 7 और मैं तेरे साय, और तेरे पश्चात्‌ पीढ़ी पीढ़ी तक तेरे वंश के साय भी इस आशय की युग युग की वाचा बान्धता हूं, कि मैं तेरा और तेरे पश्चात्‌ तेरे वंश का भी परमेश्वर रहूंगा। 8 और मैं तुझ को, और तेरे पश्चात्‌ तेरे वंश को भी, यह सारा कनान देश, जिस में तू परदेशी होकर रहता है, इस रीति दूंगा कि वह युग युग उनकी निज भूमि रहेगी, और मैं उनका परमेश्वर रहूंगा। 9 फिर परमेश्वर ने इब्राहीम से कहा, तू भी मेरे साय बान्धी हुई वाचा का पालन करना; तू और तेरे पश्चात्‌ तेरा वंश भी अपक्की अपक्की पीढ़ी में उसका पालन करे। 10 मेरे साय बान्धी हुई वाचा, जो तुझे और तेरे पश्चात्‌ तेरे वंश को पालनी पकेगी, सो यह है, कि तुम में से एक एक पुरूष का खतना हो। 11 तुम अपक्की अपक्की खलड़ी का खतना करा लेना; जो वाचा मेरे और तुम्हारे बीच में है, उसका यही चिन्ह होगा। 12 पीढ़ी पीढ़ी में केवल तेरे वंश ही के लोग नहीं पर जो तेरे घर में उत्पन्न हों, वा परदेशियोंको रूपा देकर मोल लिथे जाएं, ऐसे सब पुरूष भी जब आठ दिन के होंजाएं, तब उनका खतना किया जाए। 13 जो तेरे घर में उत्पन्न हो, अयवा तेरे रूपे से मोल लिया जाए, उसका खतना अवश्य ही किया जाए; सो मेरी वाचा जिसका चिन्ह तुम्हारी देह में होगा वह युग युग रहेगी। 14 जो पुरूष खतनारहित रहे, अर्यात्‌ जिसकी खलड़ी का खतना न हो, वह प्राणी अपके लोगोंमे से नाश किया जाए, क्योंकि उस ने मेरे साय बान्धी हुई वाचा को तोड़ दिया।। 15 फिर परमेश्वर ने इब्राहीम से कहा, तेरी जो पत्नी सारै है, उसको तू अब सारै न कहना, उसका नाम सारा होगा। 16 और मैं उसको आशीष दूंगा, और तुझ को उसके द्वारा एक पुत्र दूंगा; और मैं उसको ऐसी आशीष दूंगा, कि वह जाति जाति की मूलमाता हो जाएगी; और उसके वंश में राज्य राज्य के राजा उत्पन्न होंगे। 17 तब इब्राहीम मुंह के बल गिर पड़ा और हंसा, और अपके मन ही मन कहने लगा, क्या सौ वर्ष के पुरूष के भी सन्तान होगा और क्या सारा जो नब्बे वर्ष की है पुत्र जनेगी ? 18 और इब्राहीम ने परमेश्वर से कहा, इश्माएल तेरी दृष्टि में बना रहे! यही बहुत है। 19 तब परमेश्वर ने कहा, निश्चय तेरी पत्नी सारा के तुझ से एक पुत्र उत्पन्न होगा; और तू उसका नाम इसहाक रखना : और मैं उसके साय ऐसी वाचा बान्धूंगा जो उसके पश्चात्‌ उसके वंश के लिथे युग युग की वाचा होगी। 20 और इश्माएल के विषय में भी मै ने तेरी सुनी है : मैं उसको भी आशीष दूंगा, और उसे फुलाऊं फलाऊंगा और अत्यन्त ही बढ़ा दूंगा; उस से बारह प्रधान उत्पन्न होंगे, और मैं उस से एक बड़ी जाति बनाऊंगा। 21 परन्तु मैं अपक्की वाचा इसहाक ही के साय बान्धूंगा जो सारा से अगले वर्ष के इसी नियुक्त समय में उत्पन्न होगा। 22 तब परमेश्वर ने इब्राहीम से बातें करनी बन्द कीं और उसके पास से ऊपर चढ़ गया। 23 तब इब्राहीम ने अपके पुत्र इश्माएल को, उसके घर में जितने उत्पन्न हुए थे, और जितने उसके रूपके से मोल लिथे गए थे, निदान उसके घर में जितने पुरूष थे, उन सभोंको लेके उसी दिन परमेश्वर के वचन के अनुसार उनकी खलड़ी का खतना किया। 24 जब इब्राहीम की खलड़ी का खतना हुआ तब वह निन्नानवे वर्ष का या। 25 और जब उसके पुत्र इश्माएल की खलड़ी का खतना हुआ तब वह तेरह वर्ष का या। 26 इब्राहीम और उसके पुत्र इश्माएल दोनोंका खतना एक ही दिन हुआ। 27 और उसके घर में जितने पुरूष थे जो घर में उत्पन्न हुए, तया जो परदेशियोंके हाथ से मोल लिथे गए थे, सब का खतना उसके साय ही हुआ।। उत्पत्ति 18 1 इब्राहीम मम्रे के बांजो के बीच कड़ी धूप के समय तम्बू के द्वार पर बैठा हुआ या, तब यहोवा ने उसे दर्शन दिया : 2 और उस ने आंख उठाकर दृष्टि की तो क्या देखा, कि तीन पुरूष उसके साम्हने खड़े हैं : जब उस ने उन्हे देखा तब वह उन से भेंट करने के लिथे तम्बू के द्वार से दौड़ा, और भूमि पर गिरकर दण्डवत्‌ की और कहने लगा, 3 हे प्रभु, यदि मुझ पर तेरी अनुग्रह की दृष्टि है तो मैं बिनती करता हूं, कि अपके दास के पास से चले न जाना। 4 मैं योड़ा सा जल लाता हूं और आप अपके पांव धोकर इस वृझ के तले विश्रम करें। 5 फिर मैं एक टुकड़ा रोटी ले आऊं और उस से आप अपके जीव को तृप्त करें; तब उसके पश्चात्‌ आगे बढें : क्योंकि आप अपके दास के पास इसी लिथे पधारे हैं। उन्होंने कहा, जैसा तू कहता है वैसा ही कर। 6 सो इब्राहीम ने तम्बू में सारा के पास फुर्ती से जाकर कहा, तीन सआ मैदा फुर्ती से गून्ध, और फुलके बना। 7 फिर इब्राहीम गाय बैल के फुण्ड में दौड़ा, और एक कोमल और अच्छा बछड़ा लेकर अपके सेवक को दिया, और उसने फुर्ती से उसको पकाया। 8 तब उस ने मक्खन, और दूध, और वह बछड़ा, जो उस ने पकवाया या, लेकर उनके आगे परोस दिया; और आप वृझ के तले उनके पास खड़ा रहा, और वे खाने लगे। 9 उन्होंने उस से पूछा, तेरी पत्नी सारा कहां है? उस ने कहा, वह तो तम्बू में है। 10 उस ने कहा मैं वसन्त ऋतु में निश्चय तेरे पास फिर आऊंगा; और तब तेरी पत्नी सारा के एक पुत्र उत्पन्न होगा। और सारा तम्बू के द्वार पर जो इब्राहीम के पीछे या सुन रही यी। 11 इब्राहीम और सारा दोनो बहुत बूढ़े थे; और सारा का स्त्रीधर्म बन्द हो गया या 12 सो सारा मन में हंस कर कहने लगी, मैं तो बूढ़ी हूं, और मेरा पति भी बूढ़ा है, तो क्या मुझे यह सुख होगा? 13 तब यहोवा ने इब्राहीम से कहा, सारा यह कहकर कयोंहंसी, कि क्या मेरे, जो ऐसी बुढिय़ा हो गई हूं, सचमुच एक पुत्र उत्पन्न होगा? 14 क्या यहोवा के लिथे कोई काम कठिन है? नियत समय में, अर्यात्‌ वसन्त ऋतु में, मैं तेरे पास फिर आऊंगा, और सारा के पुत्र उत्पन्न होगा। 15 तब सारा डर के मारे यह कहकर मुकर गई, कि मैं नहीं हंसी। उस ने कहा, नहीं; तू हंसी तो यी।। 16 फिर वे पुरूष वहां से चलकर, सदोम की ओर ताकने लगे : और इब्राहीम उन्हें विदा करने के लिथे उनके संग संग चला। 17 तब यहोवा ने कहा, यह जो मैं करता हूं सो क्या इब्राहीम से छिपा रखूं ? 18 इब्राहीम से तो निश्चय एक बड़ी और सामर्यी जाति उपकेगी, और पृय्वी की सारी जातियां उसके द्वारा आशीष पाएंगी। 19 क्योंकि मैं जानता हूं, कि वह अपके पुत्रोंऔर परिवार को जो उसके पीछे रह जाएंगे आज्ञा देगा कि वे यहोवा के मार्ग में अटल बने रहें, और धर्म और न्याय करते रहें, इसलिथे कि जो कुछ यहोवा ने इब्राहीम के विषय में कहा है उसे पूरा करे। 20 क्योंकि मैं जानता हूं, कि वह अपके पुत्रोंऔर परिवार को जो उसके पीछे रह जाएंगे आज्ञा देगा कि वे यहोवा के मार्ग में अटल बने रहें, और धर्म और न्याय करते रहें, इसलिथे कि जो कुछ यहोवा ने इब्राहीम के विषय में कहा है उसे पूरा करे। 21 इसलिथे मैं उतरकर देखूंगा, कि उसकी जैसी चिल्लाहट मेरे कान तक पहुंची है, उन्होंने ठीक वैसा ही काम किया है कि नहीं : और न किया हो तो मैं उसे जान लूंगा। 22 सो वे पुरूष वहां से मुड़ के सदोम की ओर जाने लगे : पर इब्राहीम यहोवा के आगे खड़ा रह गया। 23 तब इब्राहीम उसके समीप जाकर कहने लगा, क्या सचमुच दुष्ट के संग धर्मी को भी नाश करेगा ? 24 कदाचित्‌ उस नगर में पचास धर्मी हों: तो क्या तू सचमुच उस स्यान को नाश करेगा और उन पचास धमिर्योंके कारण जो उस में हो न छोड़ेगा ? 25 इस प्रकार का काम करना तुझ से दूर रहे कि दुष्ट के संग धर्मी को भी मार डाले और धर्मी और दुष्ट दोनोंकी एक ही दशा हो। 26 यहोवा ने कहा यदि मुझे सदोम में पचास धर्मी मिलें, तो उनके कारण उस सारे स्यान को छोडूंगा। 27 फिर इब्राहीम ने कहा, हे प्रभु, सुन मैं तो मिट्टी और राख हूं; तौभी मैं ने इतनी ढिठाई की कि तुझ से बातें करूं। 28 कदाचित्‌ उन पचास धमिर्योंमे पांच घट जाए : तो क्या तू पांच ही के घटने के कारण उस सारे नगर का नाश करेगा ? उस ने कहा, यदि मुझे उस में पैंतालीस भी मिलें, तौभी उसका नाश न करूंगा। 29 फिर उस ने उस से यह भी कहा, कदाचित्‌ वहां चालीस मिलें। उस ने कहा, तो मैं चालीस के कारण भी ऐसा ने करूंगा। 30 फिर उस ने कहा, हे प्रभु, क्रोध न कर, तो मैं कुछ और कहूं : कदाचित्‌ वहां तीस मिलें। उस ने कहा यदि मुझे वहां तीस भी मिलें, तौभी ऐसा न करूंगा। 31 फिर उस ने कहा, हे प्रभु, सुन, मैं ने इतनी ढिठाई तो की है कि तुझ से बातें करूं : कदाचित्‌ उस में बीस मिलें। उस ने कहा, मैं बीस के कारण भी उसका नाश न करूंगा। 32 फिर उस ने कहा, हे प्रभु, क्रोध न कर, मैं एक ही बार और कहूंगा : कदाचित्‌ उस में दस मिलें। उस ने कहा, तो मैं दस के कारण भी उसका नाश न करूंगा। 33 जब यहोवा इब्राहीम से बातें कर चुका, तब चला गया : और इब्राहीम अपके घर को लौट गया।। उत्पत्ति 19 1 सांफ को वे दो दूत सदोम के पास आए : और लूत सदोम के फाटक के पास बैठा या : सो उनको देखकर वह उन से भेंट करने के लिथे उठा; और मुंह के बल फुककर दण्डवत्‌ कर कहा; 2 हे मेरे प्रभुओं, अपके दास के घर में पधारिए, और रात भर विश्रम कीजिए, और अपके पांव धोइथे, फिर भोर को उठकर अपके मार्ग पर जाइए। उन्होंने कहा, नहीं; हम चौक ही में रात बिताएंगे। 3 और उस ने उन से बहुत बिनती करके उन्हें मनाया; सो वे उसके साय चलकर उसके घर में आए; और उस ने उनके लिथे जेवनार तैयार की, और बिना खमीर की रोटियां बनाकर उनको खिलाई। 4 उनके सो जाने के पहिले, उस सदोम नगर के पुरूषोंने, जवानोंसे लेकर बूढ़ोंतक, वरन चारोंओर के सब लोगोंने आकर उस घर को घेर लिया; 5 और लूत को पुकारकर कहने लगे, कि जो पुरूष आज रात को तेरे पास आए हैं वे कहां हैं? उनको हमारे पास बाहर ले आ, कि हम उन से भोग करें। 6 तब लूत उनके पास द्वार बाहर गया, और किवाड़ को अपके पीछे बन्द करके कहा, 7 हे मेरे भाइयों, ऐसी बुराई न करो। 8 सुनो, मेरी दो बेटियां हैं जिन्होंने अब तक पुरूष का मुंह नहीं देखा, इच्छा हो तो मैं उन्हें तुम्हारे पास बाहर ले आऊं, और तुम को जैसा अच्छा लगे वैसा व्यवहार उन से करो : पर इन पुरूषोंसे कुछ न करो; क्योंकि थे मेरी छत के तले आए हैं। 9 उनहोंने कहा, हट जा। फिर वे कहने लगे, तू एक परदेशी होकर यहां रहने के लिथे आया पर अब न्यायी भी बन बैठा है : सो अब हम उन से भी अधिक तेरे साय बुराई करेंगे। और वे पुरूष लूत को बहुत दबाने लगे, और किवाड़ तोड़ने के लिथे निकट आए। 10 तब उन पाहुनोंने हाथ बढ़ाकर, लूत को अपके पास घर में खींच लिया, और किवाड़ को बन्द कर दिया। 11 और उन्होंने क्या छोटे, क्या बड़े, सब पुरूषोंको जो घर के द्वार पर थे अन्धा कर दिया, सो वे द्वार को टटोलते टटोलते यक गए। 12 फिर उन पाहुनोंने लूत से पूछा, यहां तेरे और कौन कौन हैं? दामाद, बेटे, बेटियां, वा नगर में तेरा जो कोई हो, उन सभोंको लेकर इस स्यान से निकल जा। 13 क्योंकि हम यह स्यान नाश करने पर हैं, इसलिथे कि उसकी चिल्लाहट यहोवा के सम्मुख बढ़ गई है; और यहोवा ने हमें इसका सत्यनाश करने के लिथे भेज दिया है। 14 तब लूत ने निकलकर अपके दामादोंको, जिनके साय उसकी बेटियोंकी सगाई हो गई यी, समझा के कहा, उठो, इस स्यान से निकल चलो : क्योंकि यहोवा इस नगर को नाश किया चाहता है। पर वह अपके दामादोंकी दृष्टि में ठट्ठा करनेहारा सा जान पड़ा। 15 जब पह फटने लगी, तब दूतोंने लूत से फुर्ती कराई और कहा, कि उठ, अपक्की पत्नी और दोनो बेटियोंको जो यहां हैं ले जा : नहीं तो तू भी इस नगर के अधर्म में भस्म हो जाएगा। 16 पर वह विलम्ब करता रहा, इस से उन पुरूषोंने उसका और उसकी पत्नी, और दोनोंबेटियोंको हाथ पकड़ लिया; क्योंकि यहोवा की दया उस पर यी : और उसको निकालकर नगर के बाहर कर दिया। 17 और ऐसा हुआ कि जब उन्होंने उनको बाहर निकाला, तब उस ने कहा अपना प्राण लेकर भाग जा; पीछे की और न ताकना, और तराई भर में न ठहरना; उस पहाड़ पर भाग जाना, नहीं तो तू भी भस्म हो जाएगा। 18 लूत ने उन से कहा, हे प्रभु, ऐसा न कर : 19 देख, तेरे दास पर तेरी अनुग्रह की दृष्टि हुई है, और तू ने इस में बड़ी कृपा दिखाई, कि मेरे प्राण को बचाया है; पर मैं पहाड़ पर भाग नहीं सकता, कहीं ऐसा न हो, कि कोई विपत्ति मुझ पर आ पके, और मैं मर जाऊं : 20 देख, वह नगर ऐसा निकट है कि मैं वहां भाग सकता हूं, और वह छोटा भी है : मुझे वहीं भाग जाने दे, क्या वह छोटा नहीं हैं? और मेरा प्राण बच जाएगा। 21 उस ने उस से कहा, देख, मैं ने इस विषय में भी तेरी बिनती अंगीकार की है, कि जिस नगर की चर्चा तू ने की है, उसको मैं नाश न करूंगा। 22 फुर्ती से वहां भाग जा; क्योंकि जब तक तू वहां न पहुचे तब तक मैं कुछ न कर सकूंगा। इसी कारण उस नगर का नाम सोअर पड़ा। 23 लूत के सोअर के निकट पहुचते ही सूर्य पृय्वी पर उदय हुआ। 24 तब यहोवा ने अपक्की ओर से सदोम और अमोरा पर आकाश से गन्धक और आग बरसाई; 25 और उन नगरोंको और सम्पूर्ण तराई को, और नगरोंको और उस सम्पूर्ण तराई को, और नगरोंके सब निवासिक्कों, भूमि की सारी उपज समेत नाश कर दिया। 26 लूत की पत्नी ने जो उसके पीछे यी दृष्टि फेर के पीछे की ओर देखा, और वह नमक का खम्भा बन गई। 27 भोर को इब्राहीम उठकर उस स्यान को गया, जहां वह यहोवा के सम्मुख खड़ा या; 28 और सदोम, और अमोरा, और उस तराई के सारे देश की ओर आंख उठाकर क्या देखा, कि उस देश में से धधकती हुई भट्टी का सा धुआं उठ रहा है। 29 और ऐसा हुआ, कि जब परमेश्वर ने उस तराई के नगरोंको, जिन में लूत रहता या, उलट पुलट कर नाश किया, तब उस ने इब्राहीम को याद करके लूत को उस घटना से बचा लिया। 30 और लूत ने सोअर को छोड़ दिया, और पहाड़ पर अपक्की दोनोंबेटियोंसमेत रहने लगा; क्योंकि वह सोअर में रहने से डरता या : इसलिथे वह और उसकी दोनोंबेटियां वहां एक गुफा में रहने लगे। 31 तब बड़ी बेटी ने छोटी से कहा, हमारा पिता बूढ़ा है, और पृय्वी भर में कोई ऐसा पुरूष नहीं जो संसार की रीति के अनुसार हमारे पास आए : 32 सो आ, हम अपके पिता को दाखमधु पिलाकर, उसके साय सोएं, जिस से कि हम अपके पिता के वंश को बचाए रखें। 33 सो उन्होंने उसी दिन रात के समय अपके पिता को दाखमधु पिलाया, तब बड़ी बेटी जाकर अपके पिता के पास लेट गई; पर उस ने न जाना, कि वह कब लेटी, और कब उठ गई। 34 और ऐसा हुआ कि दूसरे दिन बड़ी ने छोटी से कहा, देख, कल रात को मैं अपके पिता के साय सोई : सो आज भी रात को हम उसको दाखमधु पिलाएं; तब तू जाकर उसके साय सोना कि हम अपके पिता के द्वारा वंश उत्पन्न करें। 35 सो उन्होंने उस दिन भी रात के समय अपके पिता को दाखमधु पिलाया : और छोटी बेटी जाकर उसके पास लौट गई : पर उसको उसके भी सोने और उठने के समय का ज्ञान न या। 36 इस प्रकार से लूत की दोनो बेटियां अपके पिता से गर्भवती हुई। 37 और बड़ी एक पुत्र जनी, और उसका नाम मोआब रखा : वह मोआब नाम जाति का जो आज तक है मूलपिता हुआ। 38 और छोटी भी एक पुत्र जनी, और उसका नाम बेनम्मी रखा; वह अम्मोन्‌ वंशियोंका जो आज तक हैं मूलपिता हुआ।। उत्पत्ति 20 1 फिर इब्राहीम वहां से कूच कर दक्खिन देश में आकर कादेश और शूर के बीच में ठहरा, और गरार में रहने लगा। 2 और इब्राहीम अपक्की पत्नी सारा के विषय में कहने लगा, कि वह मेरी बहिन है : सो गरार के राजा अबीमेलेक ने दूत भेजकर सारा को बुलवा लिया। 3 रात को परमेश्वर ने स्वप्न में अबीमेलेक के पास आकर कहा, सुन, जिस स्त्री को तू ने रख लिया है, उसके कारण तू मर जाएगा, क्योंकि वह सुहागिन है। 4 परन्तु अबीमेलेक उसके पास न गया या : सो उस ने कहा, हे प्रभु, क्या तू निर्दोष जाति का भी घात करेगा ? 5 क्या उसी ने स्वयं मुझ से नहीं कहा, कि वह मेरी बहिन है ? और उस स्त्री ने भी आप कहा, कि वह मेरा भाई है : मैं ने तो अपके मन की खराई और अपके व्यवहार की सच्चाई से यह काम किया। 6 परमेश्वर ने उस से स्वप्न में कहा, हां, मैं भी जानता हूं कि अपके मन की खराई से तू ने यह काम किया है और मैं ने तुझे रोक भी रखा कि तू मेरे विरूद्ध पाप न करे : इसी कारण मैं ने तुझ को उसे छूने नहीं दिया। 7 सो अब उस पुरूष की पत्नी को उसे फेर दे; क्योंकि वह नबी है, और तेरे लिथे प्रार्यना करेगा, और तू जीता रहेगा : पर यदि तू उसको न फेर दे तो जान रख, कि तू, और तेरे जितने लोग हैं, सब निश्चय मर जाएंगे। 8 बिहान को अबीमेलेक ने तड़के उठकर अपके सब कर्मचारियोंको बुलवाकर थे सब बातें सुनाई : और वे लोग बहुत डर गए। 9 तब अबीमेलेक ने इब्राहीम को बुलवाकर कहा, तू ने हम से यह क्या किया है ? और मैं ने तेरा क्या बिगाड़ा या, कि तू ने मेरे और मेरे राज्य के ऊपर ऐसा बड़ा पाप डाल दिया है ? तू ने मुझ से वह काम किया है जो उचित न या। 10 फिर अबीमेलेक ने इब्राहीम से पूछा, तू ने क्या समझकर ऐसा काम किया ? 11 इब्राहीम ने कहा, मैं ने यह सोचा या, कि इस स्यान में परमेश्वर का कुछ भी भय न होगा; सो थे लोग मेरी पत्नी के कारण मेरा घात करेंगे। 12 और फिर भी सचमुच वह मेरी बहिन है, वह मेरे पिता की बेटी तो है पर मेरी माता की बेटी नहीं; फिर वह मेरी पत्नी हो गई। 13 और ऐसा हुआ कि जब परमेश्वर ने मुझे अपके पिता का घर छोड़कर निकलने की आज्ञा दी, तब मैं ने उस से कहा, इतनी कृपा तुझे मुझ पर करनी होगी : कि हम दोनोंजहां जहां जाएं वहां वहां तू मेरे विषय में कहना, कि यह मेरा भाई है। 14 तब अबीमेलेक ने भेड़-बकरी, गाय-बैल, और दास-दासियां लेकर इब्राहीम को दीं, और उसकी पत्नी सारा को भी उसे फेर दिया। 15 और अबीमेलेक ने कहा, देख, मेरा देश तेरे साम्हने है; जहां तुझे भावे वहां रह। 16 और सारा से उस ने कहा, देख, मैं ने तेरे भाई को रूपे के एक हजार टुकड़े दिए हैं : देख, तेरे सारे संगियोंके साम्हने वही तेरी आंखोंका पर्दा बनेगा, और सभोंके साम्हने तू ठीक होगी। 17 तब इब्राहीम ने यहोवा से प्रार्यना की, और यहोवा ने अबीमेलेक, और उसकी पत्नी, और दासिक्कों चंगा किया और वे जनने लगीं। 18 क्योंकि यहोवा ने इब्राहीम की पत्नी सारा के कारण अबीमेलेक के घर की सब स्त्रियोंकी कोखोंको पूरी रीति से बन्द कर दिया या।। उत्पत्ति 21 1 सो यहोवा ने जैसा कहा या वैसा ही सारा की सुधि लेके उसके साय अपके वचन के अनुसार किया। 2 सो सारा को इब्राहीम से गर्भवती होकर उसके बुढ़ापे में उसी नियुक्त समय पर जो परमेश्वर ने उस से ठहराया या एक पुत्र उत्पन्न हुआ। 3 और इब्राहीम ने अपके पुत्र का नाम जो सारा से उत्पन्न हुआ या इसहाक रखा। 4 और जब उसका पुत्र इसहाक आठ दिन का हुआ, तब उस ने परमेश्वर की आज्ञा के अनुसार उसक खतना किया। 5 और जब इब्राहीम का पुत्र इसहाक उत्पन्न हुआ तब वह एक सौ वर्ष का या। 6 और सारा ने कहा, परमेश्वर ने मुझे प्रफुल्लित कर दिया है; इसलिथे सब सुननेवाले भी मेरे साय प्रफुल्लित होंगे। 7 फिर उस ने यह भी कहा, कि क्या कोई कभी इब्राहीम से कह सकता या, कि सारा लड़कोंको दूध पिलाएगी ? पर देखो, मुझ से उसके बुढ़ापे में एक पुत्र उत्पन्न हुआ। 8 और वह लड़का बढ़ा और उसका दूध छुड़ाया गया : और इसहाक के दूध छुड़ाने के दिन इब्राहीम ने बड़ी जेवनार की। 9 तब सारा को मिस्री हाजिरा का पुत्र, जो इब्राहीम से उत्पन्न हुआ या, हंसी करता हुआ देख पड़ा। 10 सो इस कारण उस ने इब्राहीम से कहा, इस दासी को पुत्र सहित बरबस निकाल दे : क्योंकि इस दासी का पुत्र मेरे पुत्र इसहाक के साय भागी न होगा। 11 यह बात इब्राहीम को अपके पुत्र के कारण बुरी लगी। 12 तब परमेश्वर ने इब्राहीम से कहा, उस लड़के और अपक्की दासी के कारण तुझे बुरा न लगे; जो बात सारा तुझ से कहे, उसे मान, क्योंकि जो तेरा वंश कहलाएगा सो इसहाक ही से चलेगा। 13 दासी के पुत्र से भी मैं एक जाति उत्पन्न करूंगा इसलिथे कि वह तेरा वंश है। 14 सो इब्राहीम ने बिहान को तड़के उठकर रोटी और पानी से भरी चमड़े की यैली भी हाजिरा को दी, और उसके कन्धे पर रखी, और उसके लड़के को भी उसे देकर उसको विदा किया : सो वह चक्की गई, और बेर्शेबा के जंगल में भ्रमण करने लगी। 15 जब यैली का जल चुक गया, तब उस ने लड़के को एक फाड़ी के नीचे छोड़ दिया। 16 और आप उस से तीर भर के टप्पे पर दूर जाकर उसके साम्हने यह सोचकर बैठ गई, कि मुझ को लड़के की मृत्यु देखनी न पके। तब वह उसके साम्हने बैठी हुई चिल्ला चिल्ला के रोने लगी। 17 और परमेश्वर ने उस लड़के की सुनी; और उसके दूत ने स्वर्ग से हाजिरा को पुकार के कहा, हे हाजिरा तुझे क्या हुआ ? मत डर; क्योंकि जहां तेरा लड़का है वहां से उसकी आवाज परमेश्वर को सुन पक्की है। 18 उठ, अपके लड़के को उठा और अपके हाथ से सम्भाल क्योंकि मैं उसके द्वारा एक बड़ी जाति बनाऊंगा। 19 परमेश्वर ने उसकी आंखे खोल दी, और उसको एक कुंआ दिखाई पड़ा; सो उस ने जाकर यैली को जल से भरकर लड़के को पिलाया। 20 और परमेश्वर उस लड़के के साय रहा; और जब वह बड़ा हुआ, तब जंगल में रहते रहते धनुर्धारी बन गया। 21 वह तो पारान नाम जंगल में रहा करता या : और उसकी माता ने उसके लिथे मिस्र देश से एक स्त्री मंगवाई।। 22 उन दिनोंमें ऐसा हुआ कि अबीमेलेक अपके सेनापति पीकोल को संग लेकर इब्राहीम से कहने लगा, जो कुछ तू करता है उस में परमेश्वर तेरे संग रहता है : 23 सो अब मुझ से यहां इस विषय में परमेश्वर की किरिया खा, कि तू न तो मुझ से छल करेगा, और न कभी मेरे वंश से करेगा, परन्तु जैसी करूणा मैं ने तुझ पर की है, वैसी ही तू मुझ पर और इस देश पर भी जिस में तू रहता है करेगा 24 इब्राहीम ने कहा, मैं किरिया खाऊंगा। 25 और इब्राहीम ने अबीमेलेक को एक कुएं के विषय में, जो अबीमेलेक के दासोंने बरीयाई से ले लिया या, उलाहना दिया। 26 तब अबीमेलेक ने कहा, मै नहीं जानता कि किस ने यह काम किया : और तू ने भी मुझे नहीं बताया, और न मै ने आज से पहिले इसके विषय में कुछ सुना। 27 तक इब्राहीम ने भेड़-बकरी, और गाय-बैल लेकर अबीमेलेक को दिए; और उन दोनोंने आपस में वाचा बान्धी। 28 और इब्राहीम ने भेड़ की सात बच्ची अलग कर रखीं। 29 तब अबीमेलेक ने इब्राहीम से पूछा, इन सात बच्चियोंका, जो तू ने अलग कर रखी हैं, क्या प्रयोजन है ? 30 उस ने कहा, तू इन सात बच्चियोंको इस बात की साझी जानकर मेरे हाथ से ले, कि मै ने कुंआ खोदा है। 31 उन दोनोंने जो उस स्यान में आपस में किरिया खाई, इसी कारण उसका नाम बेर्शेबा पड़ा। 32 जब उन्होंने बेर्शेबा में परस्पर वाचा बान्धी, तब अबीमेलेक, और उसका सेनापति पीकोल उठकर पलिश्तियोंके देश में लौट गए। 33 और इब्राहीम ने बेर्शेबा में फाऊ का एक वृझ लगाया, और वहां यहोवा, जो सनातन ईश्वर है, उस से प्रार्यना की। 34 और इब्राहीम पलिश्तियोंके देश में बहुत दिनोंतक परदेशी होकर रहा।। उत्पत्ति 22 1 इन बातोंके पश्चात्‌ ऐसा हुआ कि परमेश्वर ने, इब्राहीम से यह कहकर उसकी पक्कीझा की, कि हे इब्राहीम : उस ने कहा, देख, मैं यहां हूं। 2 उस ने कहा, अपके पुत्र को अर्यात्‌ अपके एकलौते पुत्र इसहाक को, जिस से तू प्रेम रखता है, संग लेकर मोरिय्याह देश में चला जा, और वहां उसको एक पहाड़ के ऊपर जो मैं तुझे बताऊंगा होमबलि करके चढ़ा। 3 सो इब्राहीम बिहान को तड़के उठा और अपके गदहे पर काठी कसकर अपके दो सेवक, और अपके पुत्र इसहाक को संग लिया, और होमबलि के लिथे लकड़ी चीर ली; तब कूच करके उस स्यान की ओर चला, जिसकी चर्चा परमेश्वर ने उस से की यी। 4 तीसरे दिन इब्राहीम ने आंखें उठाकर उस स्यान को दूर से देखा। 5 और उस ने अपके सेवकोंसे कहा गदहे के पास यहीं ठहरे रहो; यह लड़का और मैं वहां तक जाकर, और दण्डवत्‌ करके, फिर तुम्हारे पास लौट आऊंगा। 6 सो इब्राहीम ने होमबलि की लकड़ी ले अपके पुत्र इसहाक पर लादी, और आग और छुरी को अपके हाथ में लिया; और वे दोनोंएक साय चल पके। 7 इसहाक ने अपके पिता इब्राहीम से कहा, हे मेरे पिता; उस ने कहा, हे मेरे पुत्र, क्या बात है उस ने कहा, देख, आग और लकड़ी तो हैं; पर होमबलि के लिथे भेड़ कहां है ? 8 इब्राहीम ने कहा, हे मेरे पुत्र, परमेश्वर होमबलि की भेड़ का उपाय आप ही करेगा। 9 सो वे दोनोंसंग संग आगे चलते गए। और वे उस स्यान को जिसे परमेश्वर ने उसको बताया या पहुंचे; तब इब्राहीम ने वहां वेदी बनाकर लकड़ी को चुन चुनकर रखा, और अपके पुत्र इसहाक को बान्ध के वेदी पर की लकड़ी के ऊपर रख दिया। 10 और इब्राहीम ने हाथ बढ़ाकर छुरी को ले लिया कि अपके पुत्र को बलि करे। 11 तब यहोवा के दूत ने स्वर्ग से उसको पुकार के कहा, हे इब्राहीम, हे इब्राहीम; उस ने कहा, देख, मैं यहां हूं। 12 उस ने कहा, उस लड़के पर हाथ मत बढ़ा, और न उस से कुछ कर : क्योंकि तू ने जो मुझ से अपके पुत्र, वरन अपके एकलौते पुत्र को भी, नहीं रख छोड़ा; इस से मै अब जान गया कि तू परमेश्वर का भय मानता है। 13 तब इब्राहीम ने आंखे उठाई, और क्या देखा, कि उसके पीछे एक मेढ़ा अपके सींगो से एक फाड़ी में बफा हुआ है : सो इब्राहीम ने जाके उस मेंढ़े को लिया, और अपके पुत्र की सन्ती होमबलि करके चढ़ाया। 14 और इब्राहीम ने उस स्यान का नाम यहोवा यिरे रखा : इसके अनुसार आज तक भी कहा जाता है, कि यहोवा के पहाड़ पर उपाय किया जाएगा। 15 फिर यहोवा के दूत ने दूसरी बार स्वर्ग से इब्राहीम को पुकार के कहा, 16 यहोवा की यह वाणी है, कि मैं अपक्की ही यह शपय खाता हूं, कि तू ने जो यह काम किया है कि अपके पुत्र, वरन अपके एकलौते पुत्र को भी, नहीं रख छोड़ा; 17 इस कारण मैं निश्चय तुझे आशीष दूंगा; और निश्चय तेरे वंश को आकाश के तारागण, और समुद्र के तीर की बालू के किनकोंके समान अनगिनित करूंगा, और तेरा वंश अपके शत्रुओं के नगरोंका अधिक्कारनेी होगा : 18 और पृय्वी की सारी जातियां अपके को तेरे वंश के कारण धन्य मानेंगी : क्योंकि तू ने मेरी बात मानी है। 19 तब इब्राहीम अपके सेवकोंके पास लौट आया, और वे सब बेर्शेबा को संग संग गए; और इब्राहीम बेर्शेबा में रहता रहा।। 20 इन बातोंके पश्चात्‌ ऐसा हुआ कि इब्राहीम को यह सन्देश मिला, कि मिल्का के तेरे भाई नाहोर से सन्तान उत्पन्न हुए हैं। 21 मिल्का के पुत्र तो थे हुए, अर्यात्‌ उसका जेठा ऊस, और ऊस का भाई बूज, और कमूएल, जो अराम का पिता हुआ। 22 फिर केसेद, हज़ो, पिल्दाश, यिद्‌लाप, और बतूएल। 23 इन आठोंको मिल्का इब्राहीम के भाई नाहोर के जन्माए जनी। और बतूएल ने रिबका को उत्पन्न किया। 24 फिर नाहोर के रूमा नाम एक रखेली भी यी; जिस से तेबह, गहम, तहश, और माका, उत्पन्न हुए।। उत्पत्ति 23 1 सारा तो एक सौ सत्ताईस बरस की अवस्या को पहुंची; और जब सारा की इतनी अवस्या हुई; 2 तब वह किर्यतर्बा में मर गई। यह तो कनान देश में है, और हेब्रोन भी कहलाता है : सो इब्राहीम सारा के लिथे रोने पीटने को वंहा गया। 3 तब इब्राहीम अपके मुर्दे के पास से उठकर हित्तियोंसे कहने लगा, 4 मैं तुम्हारे बीच पाहुन और परदेशी हूं : मुझे अपके मध्य में कब्रिस्तान के लिथे ऐसी भूमि दो जो मेरी निज की हो जाए, कि मैं अपके मुर्दे को गाड़के अपके आंख की ओट करूं। 5 हित्तियोंने इब्राहीम से कहा, 6 हे हमारे प्रभु, हमारी सुन : तू तो हमारे बीच में बड़ा प्रधान है : सो हमारी कब्रोंमें से जिसको तू चाहे उस में अपके मुर्दे को गाड़; हम में से कोई तुझे अपक्की कब्र के लेने से न रोकेगा, कि तू अपके मुर्दे को उस में गाड़ने न पाए। 7 तब इब्राहीम उठकर खड़ा हुआ, और हित्तियोंके सम्मुख, जो उस देश के निवासी थे, दण्डवत करके कहने लगा, 8 यदि तुम्हारी यह इच्छा हो कि मैं अपके मुर्दे को गाड़के अपक्की आंख की ओट करूं, तो मेरी प्रार्यना है, कि सोहर के पुत्र एप्रोन से मेरे लिथे बिनती करो, 9 कि वह अपक्की मकपेलावाली गुफा, जो उसकी भूमि की सीमा पर है; उसका पूरा दाम लेकर मुझे दे दे, कि वह तुम्हारे बीच कब्रिस्तान के लिथे मेरी निज भूमि हो जाए। 10 और एप्रोन तो हित्तियोंके बीच वहां बैठा हुआ या। सो जितने हित्ती उसके नगर के फाटक से होकर भीतर जाते थे, उन सभोंके साम्हने उस ने इब्राहीम को उत्तर दिया, 11 कि हे मेरे प्रभु, ऐसा नहीं, मेरी सुन; वह भूमि मैं तुझे देता हूं, और उस में जो गुफा है, वह भी मैं तुझे देता हूं; अपके जातिभाइयोंके सम्मुख मैं उसे तुझ को दिए देता हूं: सो अपके मुर्दे को कब्र में रख। 12 तब इब्राहीम ने उस देश के निवासियोंके साम्हने दण्डवत की। 13 और उनके सुनते हुए एप्रोन से कहा, यदि तू ऐसा चाहे, तो मेरी सुन : उस भूमि का जो दाम हो, वह मैं देना चाहता हूं; उसे मुझ से ले ले, तब मैं अपके मुर्दे को वहां गाडूंगा। 14 एप्रोन ने इब्राहीम को यह उत्तर दिया, 15 कि, हे मेरे प्रभु, मेरी बात सुन; एक भूमि का दाम तो चार सौ शेकेल रूपा है; पर मेरे और तेरे बीच में यह क्या है ? अपके मुर्दे को कब्र मे रख। 16 इब्राहीम न एप्रोन की मानकर उसको उतना रूपा तौल दिया, जितना उस ने हित्तियोंके सुनते हुए कहा या, अर्यात्‌ चार सौ ऐसे शेकेल जो व्यापारियोंमें चलते थे। 17 सो एप्रोन की भूमि, जो मम्रे के सम्मुख की मकपेला में यी, वह गुफा समेत, और उन सब वृझोंसमेत भी जो उस में और उसके चारोंऔर सीमा पर थे, 18 जितने हित्ती उसके नगर के फाटक से होकर भीतर जाते थे, उन सभोंके साम्हने इब्राहीम के अधिक्कारने में पक्की रीति से आ गई। 19 इसके पश्चात्‌ इब्राहीम ने अपक्की पत्नी सारा को, उस मकपेला वाली भूमि की गुफा में जो मम्रे के अर्यात्‌ हेब्रोन के साम्हने कनान देश में है, मिट्टी दी। 20 और वह भूमि गुफा समेत, जो उस में यी, हित्तियोंकी ओर से कब्रिस्तान के लिथे इब्राहीम के अधिक्कारने में पक्की रीति से आ गई। उत्पत्ति 24 1 इब्राहीम वृद्ध या और उसकी आयु बहुत भी और यहोवा ने सब बातोंमें उसको आशीष दी यी। 2 सो इब्राहीम ने अपके उस दास से, जो उसके घर में पुरनिया और उसकी सारी सम्पत्ति पर अधिक्कारनेी या, कहा, अपना हाथ मेरी जांघ के नीचे रख : 3 और मुझ से आकाश और पृय्वी के परमेश्वर यहोवा की इस विषय में शपय खा, कि तू मेरे पुत्र के लिथे कनानियोंकी लड़कियोंमें से जिनके बीच मैं रहता हूं, किसी को न ले आएगा। 4 परन्तु तू मेरे देश में मेरे ही कुटुम्बियोंके पास जाकर मेरे पुत्र इसहाक के लिथे एक पत्नी ले आएगा। 5 दास ने उस से कहा, कदाचित्‌ वह स्त्री इस देश में मेरे साय आना न चाहे; तो क्या मुझे तेरे पुत्र को उस देश में जहां से तू आया है ले जाना पकेगा ? 6 इब्राहीम ने उस से कहा, चौकस रह, मेरे पुत्र को वहां कभी न ले जाना। 7 स्वर्ग का परमेश्वर यहोवा, जिस ने मुझे मेरे पिता के घर से और मेरी जन्मभूमि से ले आकर मुझ से शपय खाकर कहा, कि मैं यह देश तेरे वंश को दूंगा; वही अपना दूत तेरे आगे आगे भेजेगा, कि तू मेरे पुत्र के लिथे वहां से एक स्त्री ले आए। 8 और यदि वह स्त्री तेरे साय आना न चाहे तब तो तू मेरी इस शपय से छूट जाएगा : पर मेरे पुत्र को वहां न ले जाना। 9 तब उस दास ने अपके स्वामी इब्राहीम की जांघ के नीचे अपना हाथ रखकर उस से इसी विषय की शपय खाई। 10 तब वह दास अपके स्वामी के ऊंटो में से दस ऊंट छंाटकर उसके सब उत्तम उत्तम पदार्योंमें से कुछ कुछ लेकर चला : और मसोपोटामिया में नाहोर के नगर के पास पहुंचा। 11 और उस ने ऊंटोंको नगर के बाहर एक कुएं के पास बैठाया, वह संध्या का समय या, जिस समय स्त्रियां जल भरने के लिथे निकलती है। 12 सो वह कहने लगा, हे मेरे स्वामी इब्राहीम के परमेश्वर, यहोवा, आज मेरे कार्य को सिद्ध कर, और मेरे स्वामी इब्राहीम पर करूणा कर। 13 देख मैं जल के इस सोते के पास खड़ा हूं; और नगरवासियोंकी बेटियोंजल भरने के लिथे निकली आती हैं : 14 सो ऐसा होने दे, कि जिस कन्या से मैं कहूं, कि अपना घड़ा मेरी ओर फुका, कि मैं पीऊं; और वह कहे, कि ले, पी ले, पीछे मैं तेरे ऊंटो को भी पीलाऊंगी : सो वही हो जिसे तू ने अपके दास इसहाक के लिथे ठहराया हो; इसी रीति मैं जान लूंगा कि तू ने मेरे स्वामी पर करूणा की है। 15 और ऐसा हुआ कि जब वह कह ही रहा या कि रिबका, जो इब्राहीम के भाई नाहोर के जन्माथे मिल्का के पुत्र, बतूएल की बेटी यी, वह कन्धे पर घड़ा लिथे हुए आई। 16 वह अति सुन्दर, और कुमारी यी, और किसी पुरूष का मुंह न देखा या : वह कुएं में सोते के पास उतर गई, और अपना घड़ा भर के फिर ऊपर आई। 17 तब वह दास उस से भेंट करने को दौड़ा, और कहा, अपके घड़े मे से योड़ा पानी मुझे पिला दे। 18 उस ने कहा, हे मेरे प्रभु, ले, पी ले: और उस ने फुर्ती से घड़ा उतारकर हाथ में लिथे लिथे उसको पिला दिया। 19 जब वह उसको पिला चुकी, तक कहा, मैं तेरे ऊंटोंके लिथे भी तब तक पानी भर भर लाऊंगी, जब तक वे पी न चुकें। 20 तब वह फुर्ती से अपके घड़े का जल हौदे में उण्डेलकर फिर कुएं पर भरने को दौड़ गई; और उसके सब ऊंटोंके लिथे पानी भर दिया। 21 और वह पुरूष उसकी ओर चुपचाप अचम्भे के साय ताकता हुआ यह सोचता या, कि यहोवा ने मेरी यात्रा को सुफल किया है कि नहीं। 22 जब ऊंट पी चुके, तब उस पुरूष ने आध तोले सोने का एक नत्य निकालकर उसको दिया, और दस तोले सोने के कंगन उसके हाथोंमें पहिना दिए; 23 और पूछा, तू किस की बेटी है? यह मुझ को बता दे। क्या तेरे पिता के घर में हमारे टिकने के लिथे स्यान है ? 24 उस ने उत्तर दिया, मैं तो नाहोर के जन्माए मिल्का के पुत्र बतूएल की बेटी हूं। 25 फिर उस ने उस से कहा, हमारे वहां पुआल और चारा बहुत है, और टिकने के लिथे स्यान भी है। 26 तब उस पुरूष ने सिर फुकाकर यहोवा को दण्डवत्‌ करके कहा, 27 धन्य है मेरे स्वामी इब्राहीम का परमेश्वर यहोवा, कि उस ने अपक्की करूणा और सच्चाई को मेरे स्वामी पर से हटा नहीं लिया : यहोवा ने मुझ को ठीक मार्ग पर चलाकर मेरे स्वामी के भाई बन्धुओं के घर पर पहुचा दिया है। 28 और उस क्न्या ने दौड़कर अपक्की माता के घर में यह सारा वृत्तान्त कह सुनाया। 29 तब लाबान जो रिबका का भाई या, सो बाहर कुएं के निकट उस पुरूष के पास दौड़ा गया। 30 और ऐसा हुआ कि जब उस ने वह नत्य और अपक्की बहिन रिबका के हाथोंमें वे कंगन भी देखे, और उसकी यह बात भी सुनी, कि उस पुरूष ने मुझ से ऐसी बातें कहीं; तब वह उस पुरूष के पास गया; और क्या देखा, कि वह सोते के निकट ऊंटोंके पास खड़ा है। 31 उस ने कहा, हे यहोवा की ओर से धन्य पुरूष भीतर आ : तू क्योंबाहर खड़ा है ? मैं ने घर को, और ऊंटो के लिथे भी स्यान तैयार किया है। 32 और वह पुरूष घर में गया; और लाबान ने ऊंटोंकी काठियां खोलकर पुआल और चारा दिया; और उसके, और उसके संगी जनो के पांव धोने को जल दिया। 33 तब इब्राहीम के दास के आगे जलपान के लिथे कुछ रखा गया : पर उस ने कहा मैं जब तक अपना प्रयोजन न कह दूं, तब तक कुछ न खाऊंगा। लाबान ने कहा, कह दे। 34 तक उस ने कहा, मैं तो इब्राहीम का दास हूं। 35 और यहोवा ने मेरे स्वामी को बड़ी आशीष दी है; सो वह महान पुरूष हो गया है; और उस ने उसको भेड़-बकरी, गाय-बैल, सोना-रूपा, दास-दासियां, ऊंट और गदहे दिए है। 36 और मेरे स्वामी की पत्नी सारा के बुढ़ापे में उस से एक पुत्र उत्पन्न हुआ है। और उस पुत्र को इब्राहीम ने अपना सब कुछ दे दिया है। 37 और मेरे स्वामी ने मुझे यह शपय खिलाई, कि मैं उसके पुत्र के लिथे कनानियोंकी लड़कियोंमें से जिन के देश में वह रहता है, कोई स्त्री न ले आऊंगा। 38 मैं उसके पिता के घर, और कुल के लोगोंके पास जाकर उसके पुत्र के लिथे एक स्त्री ले आऊंगा। 39 तब मैं ने अपके स्वामी से कहा, कदाचित्‌ वह स्त्री मेरे पीछे न आए। 40 तब उस ने मुझ से कहा, यहोवा, जिसके साम्हने मैं चलता आया हूं, वह तेरे संग अपके दूत को भेजकर तेरी यात्रा को सुफल करेगा; सो तू मेरे कुल, और मेरे पिता के घराने में से मेरे पुत्र के लिथे एक स्त्री ले आ सकेगा। 41 तू तब ही मेरी इस शपय से छूटेगा, जब तू मेरे कुल के लोगोंके पास पहुंचेगा; अर्यात्‌ यदि वे मुझे कोई स्त्री न दें, तो तू मेरी श्पय से छूटेगा। 42 सो मैं आज उस कुएं के निकट आकर कहने लगा, हे मेरे स्वामी इब्राहीम के परमेश्वर यहोवा, यदि तू मेरी इस यात्रा को सुफल करता हो : 43 तो देख मैं जल के इस कुएं के निकट खड़ा हूं; सो ऐसा हो, कि जो कुमारी जल भरने के लिथे निकल आए, और मैं उस से कहूं, अपके घड़े में से मुझे योड़ा पानी पिला; 44 और वह मुझ से कहे, पी ले और मै तेरे ऊंटो के पीने के लिथे भी पानी भर दूंगी : वह वही स्त्री हो जिसको तू ने मेरे स्वामी के पुत्र के लिथे ठहराया हो। 45 मैं मन ही मन यह कह ही रहा या, कि देख रिबका कन्धे पर घड़ा लिथे हुए निकल आई; फिर वह सोते के पास उतरके भरने लगी : और मै ने उस से कहा, मुझे पिला दे। 46 और उस ने फुर्ती से अपके घड़े को कन्धे पर से उतारके कहा, ले, पी ले, पीछे मैं तेरे ऊंटोंको भी पिलाऊंगी : सो मैं ने पी लिया, और उस ने ऊंटोंको भी पिला दिया। 47 तब मैं ने उस से पूछा, कि तू किस की बेटी है ? और उस ने कहा, मैं तो नाहोर के जन्माए मिल्का के पुत्र बतूएल की बेटी हूं : तब मैं ने उसकी नाक में वह नत्य, और उसके हाथोंमें वे कंगन पहिना दिए। 48 फिर मैं ने सिर फुकाकर यहोवा को दण्डवत्‌ किया, और अपके स्वामी इब्राहीम के परमेश्वर यहोवा को धन्य कहा, क्योंकि उस ने मुझे ठीक मार्ग से पहुंचाया कि मै अपके स्वामी के पुत्र के लिथे उसकी भतीजी को ले जाऊं। 49 सो अब, यदि तू मेरे स्वामी के साय कृपा और सच्चाई का व्यवहार करना चाहते हो, तो मुझ से कहो : और यदि नहीं चाहते हो, तौभी मुझ से कह दो; ताकि मैं दाहिनी ओर, वा बाईं ओर फिर जाऊं। 50 तब लाबान और बतूएल ने उत्तर दिया, यह बात यहोवा की ओर से हुई है : सो हम लोग तुझ से न तो भला कह सकते हैं न बुरा। 51 देख, रिबका तेरे साम्हने है, उसको ले जा, और वह यहोवा के वचन के अनुसार, तेरे स्वामी के पुत्र की पत्नी हो जाए। 52 उनका यह वचन सुनकर, इब्राहीम के दास ने भूमि पर गिरके यहोवा को दण्डवत्‌ किया। 53 फिर उस दास ने सोने और रूपे के गहने, और वस्त्र निकालकर रिबका को दिए : और उसके भाई और माता को भी उस ने अनमोल अनमोल वस्तुएं दी। 54 तब उस ने अपके संगी जनोंसमेत भोजन किया, और रात वहीं बिताई : और तड़के उठकर कहा, मुझ को अपके स्वामी के पास जाने के लिथे विदा करो। 55 रिबका के भाई और माता ने कहा, कन्या को हमारे पास कुछ दिन, अर्यात्‌ कम से कम दस दिन रहने दे; फिर उसके पश्चात्‌ वह चक्की जाएगी। 56 उस ने उन से कहा, यहोवा ने जो मेरी यात्रा को सुफल किया है; सो तुम मुझे मत रोको अब मुझे विदा कर दो, कि मैं अपके स्वामी के पास जाऊं। 57 उन्होंने कहा, हम कन्या को बुलाकर पूछते हैं, और देखेंगे, कि वह क्या कहती है। 58 सो उन्होंने रिबका को बुलाकर उस से पूछा, क्या तू इस मनुष्य के संग जाएगी? उस ने कहा, हां मैं जाऊंगी। 59 तब उन्होंने अपक्की बहिन रिबका, और उसकी धाय और इब्राहीम के दास, और उसके सायी सभोंको विदा किया। 60 और उन्होंने रिबका को आशीर्वाद देके कहा, हे हमारी बहिन, तू हजारोंलाखोंकी आदिमाता हो, और तेरा वंश अपके बैरियोंके नगरोंका अधिक्कारनेी हो। 61 इस पर रिबका अपक्की सहेलियोंसमेत चक्की; और ऊंट पर चढ़के उस पुरूष के पीछे हो ली : सो वह दास रिबका को साय लेकर चल दिया। 62 इसहाक जो दक्खिन देश में रहता या, सो लहैरोई नाम कुएं से होकर चला आता या। 63 और सांफ के समय वह मैदान में ध्यान करने के लिथे निकला या : और उस ने आंखे उठाकर क्या देखा, कि ऊंट चले आ रहे हैं। 64 और रिबका ने भी आंख उठाकर इसहाक को देखा, और देखते ही ऊंट पर से उतर पक्की 65 तब उस ने दास से पूछा, जो पुरूष मैदान पर हम से मिलने को चला आता है, सो कौन है? दास ने कहा, वह तो मेरा स्वामी है। तब रिबका ने घूंघट लेकर अपके मुंह को ढ़ाप लिया। 66 और दास ने इसहाक से अपना सारा वृत्तान्त वर्णन किया। 67 तब इसहाक रिबका को अपक्की माता सारा के तम्बू में ले आया, और उसको ब्याहकर उस से प्रेम किया : और इसहाक को माता की मृत्यु के पश्चात्‌ शान्ति हुई।। उत्पत्ति 25 1 तब इब्राहीम ने एक और पत्नी ब्याह ली जिसका नाम कतूरा या। 2 और उस से जिम्रान, योझान, मदना, मिद्यान, यिशबाक, और शूह उत्पन्न हुए। 3 और योझान से शबा और ददान उत्पन्न हुए। और ददान के वंश में अश्शूरी, लतूशी, और लुम्मी लोग हुए। 4 और मिद्यान के पुत्र एपा, एपेर, हनोक, अबीदा, और एल्दा हुए, से सब कतूरा के सन्तान हुए। 5 इसहाक को तो इब्राहीम ने अपना सब कुछ दिया। 6 पर अपक्की रखेलियोंके पुत्रोंको, कुछ कुछ देकर अपके जीते जी अपके पुत्र इसहाक के पास से पूरब देश में भेज दिया। 7 इब्राहीम की सारी अवस्या एक सौ पचहत्तर वर्ष की हुई। 8 और इब्राहीम का दीर्घायु होने के कारण अर्यात्‌ पूरे बुढ़ापे की अवस्या में प्राण छूट गया। 9 और उसके पुत्र इसहाक और इश्माएल ने, हित्ती सोहर के पुत्र एप्रोन की मम्रे के सम्मुखवाली भूमि में, जो मकपेला की गुफा यी, उस में उसको मिट्टी दी गई। 10 अर्यात्‌ जो भूमि इब्राहीम ने हित्तियोंसे मोल ली यी : उसी में इब्राहीम, और उस की पत्नी सारा, दोनोंको मिट्टी दी गई। 11 इब्राहीम के मरने के पश्चात्‌ परमेश्वर ने उसके पुत्र इसहाक को जो लहैरोई नाम कुएं के पास रहता या आशीष दी।। 12 इब्राहीम का पुत्र इश्माएल जो सारा की लौंडी हाजिरा मिस्री से उत्पन्न हुआ या, उसकी यह वंशावली है। 13 इश्माएल के पुत्रोंके नाम और वंशावली यह है : अर्यात्‌ इश्माएल का जेठा पुत्र नबायोत, फिर केदार, अद्‌बेल, मिबसाम, 14 मिश्मा, दूमा, मस्सा, 15 हदर, तेमा, यतूर, नपीश, और केदमा। 16 इश्माएल के पुत्र थे ही हुए, और इन्हीं के नामोंके अनुसार इनके गांवों, और छावनियोंके नाम भी पके; और थे ही बारह अपके अपके कुल के प्रधान हुए। 17 इश्माएल की सारी अवस्या एक सौ सैंतीस वर्ष की हुई : तब उसके प्राण छूट गए, और वह अपके लोगोंमें जा मिला। 18 और उसके वंश हवीला से शूर तक, जो मिस्र के सम्मुख अश्शूर्‌ के मार्ग में है, बस गए। और उनका भाग उनके सब भाईबन्धुओं के सम्मुख पड़ा।। 19 इब्राहीम के पुत्र इसहाक की वंशावली यह है : इब्राहीम से इसहाक उत्पन्न हुआ। 20 और इसहाक ने चालीस वर्ष का होकर रिबका को, जो पद्दनराम के वासी, अरामी बतूएल की बेटी, और अरामी लाबान की बहिन भी, ब्याह लिया। 21 इसहाक की पत्नी तो बांफ यी, सो उस ने उसके निमित्त यहोवा से बिनती की: और यहोवा ने उसकी बिनती सुनी, सो उसकी पत्नी रिबका गर्भवती हुई। 22 और लड़के उसके गर्भ में आपस में लिपटके एक दूसरे को मारने लगे : तब उस ने कहा, मेरी जो ऐसी ही दशा रहेगी तो मैं क्योंकर जीवित रहूंगी? और वह यहोवा की इच्छा पूछने को गई। 23 तब यहोवा ने उस से कहा तेरे गर्भ में दो जातियां हैं, और तेरी कोख से निकलते ही दो राज्य के लोग अलग अलग होंगे, और एक राज्य के लोग दूसरे से अधिक सामर्यी होंगे और बड़ा बेटा छोटे के अधीन होगा। 24 जब उसके पुत्र उत्पन्न होने का समय आया, तब क्या प्रगट हुआ, कि उसके गर्भ में जुड़वे बालक है। 25 और पहिला जो उत्पन्न हुआ सो लाल निकला, और उसका सारा शरीर कम्बल के समान रोममय या; सो उसका नाम एसाव रखा गया। 26 पीछे उसका भाई अपके हाथ से एसाव की एड़ी पकडे हुए उत्पन्न हुआ; और उसका नाम याकूब रखा गया। और जब रिबका ने उनको जन्म दिया तब इसहाक साठ वर्ष का या। 27 फिर वे लड़के बढ़ने लगे और एसाव तो वनवासी होकर चतुर शिकार खेलनेवाला हो गया, पर याकूब सीधा मनुष्य या, और तम्बुओं में रहा करता या। 28 और इसहाक तो एसाव के अहेर का मांस खाया करता या, इसलिथे वह उस से प्रीति रखता या : पर रिबका याकूब से प्रीति रखती यी।। 29 याकूब भोजन के लिथे कुछ दाल पका रहा या : और एसाव मैदान से यका हुआ आया। 30 तब एसाव ने याकूब से कहा, वह जो लाल वस्तु है, उसी लाल वस्तु में से मुझे कुछ खिला, क्योंकि मैं यका हूं। इसी कारण उसका नाम एदोम भी पड़ा। 31 याकूब ने कहा, अपना पहिलौठे का अधिक्कारने आज मेरे हाथ बेच दे। 32 एसाव ने कहा, देख, मै तो अभी मरने पर हूं : सो पहिलौठे के अधिक्कारने से मेरा क्या लाभ होगा ? 33 याकूब ने कहा, मुझ से अभी शपय खा : सो उस ने उस से शपय खाई : और अपना पहिलौठे का अधिक्कारने याकूब के हाथ बेच डाला। 34 इस पर याकूब ने एसाव को रोटी और पकाई हुई मसूर की दाल दी; और उस ने खाया पिया, तब उठकर चला गया। योंएसाव ने अपना पहिलौठे का अधिक्कारने तुच्छ जाना।। ";
        TestData.chineseText = "江南地土窪下，雖屬卑溫，一交四月便值黃霉節氣，五月六月就是三伏炎天，酷日當 空\t；無論行道之人汗流浹背，頭額焦枯，即在家住的也吼得氣喘，無處存著。\r\n上等除 了富室大家，涼亭水閣，搖扇乘涼，安閑自在；\t次等便是山僧野叟，散發披襟，逍遙 於長鬆蔭樹之下，方可過得；那些中等小家無計布擺，只得二月中旬覓得幾株羊眼豆 ，種在屋前屋後閑空地邊，或拿幾株木頭、幾根竹竿搭個棚子，搓些草索，周圍結彩 的相似。 不半月間，那豆藤在地上長將起來，彎彎曲曲依傍竹木隨著棚子牽纏滿了，卻比造的 涼亭反透氣涼快。\n那些人家或老或少、或男或女，或拿根凳子，或掇張椅子，或鋪條 涼蓆，隨高逐低坐在下面，搖著扇子，乘著風涼。\r鄉老們有說朝報的，有說新聞的， 有說故事的。除了這些，男人便說人家內眷，某老娘賢，某大娘妒，大分說賢的少， 說妒的多；那女人便說人家丈夫，某官人好，某漢子不好，大分愛丈夫的少，妒丈夫 的多。\t\r\n\t可見『妒』之一字，男男女女日日在口裡提起、心裡轉動。如今我也不說別的 ，就把『妒』字說個暢炔，倒也不負這個搭豆棚的意思。你們且安心聽著。 \n當日有幾個少年朋友同著幾個老成的人也坐在豆棚之下，右手拿著一把扇子，左手拿 著不知甚麼閑書，看到鬧熱所在，有一首五言四句的詩，忽然把扇於在凳上一拍，叫 將起來，便道：『說得太過！說得太過！』那老成人便立起身子道：『卻是為何？那 少年便把書遞與他，一手指道：『他如何說「青竹蛇兒口，黃蜂尾上針。兩般猶未毒 ，最毒婦人心」？做待的人想是受了婦人閑氣，故意說得這樣利害。難道婦人的心比 這二種惡物還毒些不成？』那老成人便接口說道：『你們後生小夥子不曾經受，不曾 出門看見幾處，又不曾逢人說著幾個，如何肯信？即在下今年已及五旬年紀，寧可做 個鰥夫，不敢娶個婆子。實實在江湖上看見許多，人頭上說將來又聽得許多，一處有 一處的利害，一人有一人的狠毒，我也說不得許多。曾有一個好事的人，把古的妒婦 心腸並近日間見的妒婦實跡備悉纂成一冊《妒鑒》，刻了書本，四處流傳。初意不過 要這些男子看在眼裡，也好防備一番；\r\n又要女人看在肚裡，也好懲創一番。男男女女 好過日子。這個功德卻比唐僧往西天取來的聖經還增十分好處。那曉得婦人一經看過 ，反道「妒」之一字從古流傳，應該有的。竟把那《妒鑒》上事跡看得平平常常，各 人另要搜尋出一番意見，做得新新奇奇，又要那人在正本《妒鑒》之後刻一本「補遺 」、二集、三集，乃在婦道中稱個表表豪傑，纔暢快他的意思哩！』又有一個老成人 接口道：『這《妒鑒》上有的卻是現在結局的事，何足為奇？還有妒到千年萬載做了 鬼、成了神纔是希罕的事。那少年聽見兩個老成人說得觔觔節節，就拱著手說道：『 請教！請教！』那老成人說道：『這段書長著哩，你們須烹幾大壺極好的鬆蘿祘片、 上細的龍井芽茶，再添上幾大盤精緻細料的點心，纔與你們說哩！』那少年們道：『 不難不難，都是有的。只要說得真實，不要騙了點心、茶吃，隨口說些謊話哄弄我們 。我們雖是年幼不曾讀書，也要質證他人方肯信哩！』那老成人不慌不忙，就把扇子 折攏了放在凳角頭，立起身來，說道：\t『某年某月，我同幾個夥計販了藥材前往山東 發賣。\r\n騎著驢子，隨了車馱，一程走到濟南府章邱縣臨濟鎮之南數里間，遇著一條大 河。只見兩邊船隻、牲口，你來我往，你往我來，稠稠密密，都也不在心上。見有許 多婦人，或有過去的，或有過來的。那丑頭怪腦的，隨他往來，得個平常；凡有一二 分姿色的，到彼處卻不敢便就過去，一到那邊，都把兩鬢蓬蓬鬆鬆扯將下來，將幾根 亂草插在髻上，又把破舊衣服換在身上，打扮得十分不像樣了，方敢走到河邊過渡。 臨上船時，還將地上的浮土灰泥擦抹幾把，纔放心走上船，得個平平安安渡過河去。 若是略象模樣婦人不肯毀容易服，渡到大河中間，風波陡作，捲起那醃腌臢臢的浪頭 直進船內，把貨物潑濕，衣服穢污，或有時把那婦人隨風捲入水內，連人影也不見了 。\r\n\t\t你道甚麼妖魔鬼怪在彼作如此的兇險惡孽？我俏俏在那左近飯店輕輕訪問。\t那裡人 都要過渡，懼怕他的，不敢明白顯易說出他的來頭。只有一個老人家在那裡處蒙館的 ，說道：這個神道其來久矣。在唐時有個人做一篇《述異記》，說道：此河名叫妒婦 津，乃是晉時朝代泰始年號中，一人姓劉名伯玉，有妻段氏名明光，其性妒忌；伯玉 偶然飲了幾杯餓酒，不知不覺在段氏面前誦了曹子建的《洛神賦》幾句道：『其形也 翩若驚鴻，婉若游龍。榮曜秋菊，華茂春鬆。彷彿兮若輕雲之蔽月；飄靗兮若流風之 迴雪。遠而望之，皎若太陽之昇朝霞；迫而察之，灼若芙蕖之出淥波。穠纖得中，修 短合度。肩若削成，腰如約素。延頸秀項，皜質呈露。芳澤無加，鉛華弗御。雲髻峨 峨，修眉聯娟，丹脣外朗，皜齒內鮮，明眸善睞，靨輔承權。瑰姿艷逸，儀靜體閑。 柔情綽態，媚於語言。 奇服曠世，骨象應圖。披羅衣之璀粲兮，珥瑤碧之華琚。戴金翠之首飾，綴明珠以耀 軀。踐遠遊之文履，曳霧綃之輕裾。微幽蘭之芳藹兮，步蜘躕於山隅。 讀至此，不覺把案上一拍，失口說道：『我生平若娶得這樣個標緻婦人，由你潑天的 功名富貴要他什麼！吾一生心滿意足矣！』此乃是醉後無心說這兩句放肆的閑話，那 知段氏聽了心中火起，就發話道：『君何看得水神的面目標緻就十二分尊重，當面把 我奚落？若說水神的好處，我死何愁不為水神！』 不曾說完，一溜煙竟走出門去。那伯玉那知就裡。不料段氏走到河濱，做個鷂子翻身 之勢，望著深處從空一跳，就從水面沈下去了。伯玉慌得魂不附體，放聲大哭。急急 喚人打撈，那有蹤影？整整哭了七日，喉乾嗓咽，一交跌倒朦朧暈去。只見段氏從水 面上走近前來說道：『君家所喜水神，吾今得為神矣！ 君須過此，吾將邀子為偕老焉！』言未畢，段氏即將手把伯玉衣袂一扯，似欲同入水 狀，伯玉驚得魂飛天外，猛力一迸，忽然甦醒，乃是南柯一夢。伯玉勉強獨自回家。 詎料段氏陰魂不散，日日在津口忽然作聲，忽時現形，只要伺候丈夫過津，希遂前約 。不料伯玉心餒，終身不渡此津。故後來凡有美色婦人渡此津者，皆改妝易貌，然後 得濟。不然就要興風作浪，行到河水中間便遭不測之虞了。』那些後生道：『這段氏 好沒分曉，只該妒著自己丈夫，如何連別的女人也妒了？』又有個老者道：『這個學 究說的乃是做了鬼還妒的事，適纔說成了神還妒的事，卻在那裡？』內中一個老者道 ：『待我來說個明白！那妒婦津天下卻有兩處，這山東的看來也還平常，如今說的纔 是利害哩！』 那後生輩聽見此說，一個個都站將起來，神情錯愕，問道：『這個卻在何處？』老者 便道：『在山東對門山西晉地太原府綿縣地方。行到彼處未及十里，路上人娓娓說長 說短，都是這津頭的舊事，我卻不信。看看行到津口，也有許多過往婦人妝村扮丑， 亦如山東的光景，也不為異。直到那大樹林下，露出一個半大的廟宇，我跳下牲口， 把韁繩、鞭子遞與驢夫，把衣袖扯將下來，整頓了一番，依著照牆背後轉到甬道上去 。抬頭一看，也就把我唬了一驚：只見兩個螭頭直沖霄漢，四圍鷹爪高接雲煙；八寶 妝成鴛鴦瓦脊耀得眼花，渾金鑄就饕餮門環閃人心怕。左邊立的朱髭赤發、火輪火馬 ，人都猜道祝融部下神兵；右邊站的青面獠牙、皂蓋玄旗，我卻認做瘟疫司中牙將。 中間坐著一個碧眼高顴、紫色傴兜面孔、張著簸箕大的紅嘴，乃是個半老婦人，手持 焦木短棍，惡狠狠橫踞在上；旁邊立著一個短小身材、傴僂苦楚形狀的男人，朝著左 側神廚角裡，卻是為何？正待要問，那驢夫搖手道：「莫要開言，走罷走罷！」只得 上驢行路。走了五六里，悄問再三，驢夫方說：「這個娘娘叫做石尤奶奶，旁邊漢子 叫做介之推，直是秦漢以前列國分爭時節晉國人氏。只因晉獻公寵愛了一個驪姬，害 了太子申生，又要害次子重耳。重耳無奈，只得奔逃外國求生。介之推乃是上大夫介 立之子，年紀甫及二十，纔娶一妻，也是上大夫石吁之女，名曰石尤。兩個原生得風 流標緻，過得似水如魚，真個才子佳人天生一對、蓋世無雙的了。卻為重耳猝然遭變 ，立刻起程；之推是東宮侍衛之臣，義不容緩，所以奮不顧身，一轡頭隨他走了，不 曾回家說得明白。就是路中要央個熟人寄信回時，那重耳是晉國公子，隨行有五人： 一個是魏鮤，一個是狐偃，一個是顛頡，一個是趙衰，這個就是之推了。急切裡一時 逃走，恐怕漏了消息驪姬知道，唆聳獻公登時興兵發馬，隨後追趕，不當穩便；都是 改頭換面，襤襤褸褸，夜住曉行，甚是苦楚。石氏在家那曉得這段情節？只說：『正 在恩愛之間，如何這冤家嚯地拋閃？想是有了外遇，頓然把我丟棄！』叫天搶地，忿 恨一回，痛哭一回，咒詛一回，癡想一回，恨不得從半空中將之推一把頭揪在跟前， 生生的咬嚼下肚，方得快心遂意。不料一日一日，一年一年，胸中漸漸長起一塊刀砍 不開、斧打不碎、堅凝如石一般，叫做妒塊。俗語說，女傍有石，石畔無皮，病入膏 肓，再銷熔不得的了。那知之推乃是個忠誠苦節之臣，隨了重耳四遠八方，艱難險阻 ，無不嘗遍。一日逃到深山，七日不得火食，重耳一病幾危。 隨行者雖有五人，獨有之推將股上肉割將下來，煎湯進與重耳食之，救得性命。不覺 荏荏苒苒過了一十九年，重耳方得歸國，立為文公，興起霸來。後來那四個從龍之臣 都補了大官受了厚祿，獨之推一人當日身雖隨著文公周行，那依戀妻子的心腸端然如 舊。一返故國便到家中訪問原妻石氏下落，十餘年前早已搬在那綿竹山中去了，之推 即往山中探訪消息。石氏方在家把泥塑一個丈夫，朝夕打罵得，不已，忽然相見，兩 個顏色俱蒼，卻不認得，細說因由，方纔廝認，忽便震天動地假哭起來。之推把前情 說了一番，那石氏便罵道：『負心賊！閃我多年，故把假言搪塞。』只是不信。少不 得婦人家的舊規，手撾口咬、頭撞腳踢了一回。弄得之推好像敗陣傷亡，垂頭喪氣， 一言也不敢發，只指望待他氣過，溫存幾時，依舊要出山做官受職去的。那知石氏心 毒得緊，原在家中整治得一條紅錦九股套索在衣箱內，取將出來，把之推扣頸縛住， 頃刻不離，一毫展動不得。 說道：『我也不願金紫富貴，流浪天涯，只願在家兩兩相對，齏鹽苦守，還要補完我 十九年的風流趣興，由那一班命運大的做官罷了。』之推既被拘係，上不能具疏奏聞 朝廷，下不能寫書邀人勸解，在晉文公也不知之推在於何處。倒是同難五人中一人不 見之推出山，朝廷又不問他下落，私心十分想慕，不肯甘心，造下一首四言鄙俚之句 ，貼於宮門，暗暗打動文公意思。詩曰：『有龍矯矯，頓失其所。五蛇從之，周流天 下。 龍飢乏食，一蛇割股。龍返於淵，安其壤土。四蛇入穴，皆有處所。一蛇無穴，號於 中野。』一時間宮門傳誦，奏聞文公。 文公惶愧不已，遂喚魏鮤遍訪之推下落。之推身已被係，安得出來？魏鮤是個武夫， 那裡耐煩終日各處搜求，況且綿竹之山七百里開闊，實難蹤跡。卻算計道：『我四下 裡放起火來，燒得急了，怕他不奔將出來！』此時乃是初春天氣，山上草木尚是乾枯 的，順著風勢教人舉火，一霎時漫天漫地卷將起來。那知之推看見四下火起，心知魏 鮤訪求蹤跡，爭奈做了個藤纏螃蟹、草縛團魚，一時出頭不得。即使遇著魏鮤，磨滅 得不成冠裳中人體面，一時忿恨在心，不如速死為快！因而乘著石氏睡熟，也就放一 把無情火來。那火卻也利害，起初不過微煙裊裊，攪著石罅巒光，在山間住久的還不 覺得。未幾，火勢透上樹枝，惹著鬆油柏節，因風煽火，火熾風狂，從空舒卷，就地 亂滾將來。一霎時，百道金蛇昂頭擺尾，千群赤馬縱鬣長嘶。四壁廂嗶嗶叭叭之聲勝 似元宵爆竹，半天裡騰騰閃閃之燄不減三月咸陽。逃出來的狐狸，跳不動的麂鹿，都 成肉爛皮焦；叫不響的鴉鷹，飛不動的鸞鶴，盡是毛摧羽爍。此時石氏上天無路，入 地無門，奔前不能，退後不得，漸漸四下緊逼將來，就把之推一把抱定說道：『此後 再不妒了！』卻也悔之晚矣。那知石氏見火勢逼近，絕不著忙，只願與之推相抱相偎 ，毫無退悔，故此火勢雖狂，介子夫妻到底安然不動。略不多時，之推與石氏俱成灰 燼。後來魏鮤搜山，看見兩個燒死屍骸，方曉得之推夫婦已自盡了。正要收取骸骨， 中間尚有一堆餘火未熄。魏鮤仔細上前看時，卻又不青不紅，不紫不綠，一團鬼火相 似，真也奇異。忙教左右將那燒不過的樹枝撥開看時，乃是斗大一塊鵝卵石滾來滾去 。那火光亦漸漸微了，石子中間卻又放出一道黑氣，上沖霄漢，風吹不斷。魏鮤同一 伙人見得恁般作怪，即忙寫了一道本章，把此一塊寶貝進上文公，大略說之推高隱之 士，不願公侯，自甘焚死。紀載他焚燒之時，正是清明節前一日。文公心中惻然，即 便遣官設祭一壇，望空遙奠，又命下國中，人家門首俱要插柳為記，不許舉火，只許 吃些隔夜冷食。至今傳下一個禁煙寒食的故事。 那塊寶貝也只道甚麼活佛、神仙修煉成的金剛舍利子一樣，忙教後宮娘娘、妃嬪好好 收藏。那知這物卻是禍胎，自從進宮之後，人人不睦，個個參差。後來文公省得此物 在內作祟，無法解禳。 直到週天王老庫中，請出后妃傳下來百鍊降魔破妒金剛寶錘，當中一下將來，打得粉 花零碎，漫天塞地化作萬斛微塵，至今散在民間，這黑氣常時發現。此是外傳，不在 話下。且說那石氏自經大火逼近之際，抱著耿耿英靈，從那烈燄之中一把扭定了介之 推，走闖到上帝駕前，大聲訴說其從前心事。上帝心裡也曉得妒婦罪孽非輕，但守著 丈夫一十九年，心頭積恨一時也便泯滅不得。適值有一班散花仙女又在殿前，懼憐他 兩個夫婦都有不得已一片血誠，在生不曾受得文公所封綿上之田，死後也教他夫妻受 了綿地血食。但是妒心到底不化，凡有過水的婦人，都不容他畫眉搽粉、大袖長衫， 俱要改換裝束。那男人到廟裡看的，也不許說石尤奶奶面目變得醜惡、生前過失。 但有奉承奶奶幾句、數落之推幾句的，路上俱得平安順利。 近日有個鄉間婦人，故意妝扮妖妖嬈嬈渡水而過，卻不見甚麼顯應。 此是石奶奶偶然赴會他出，不及堤防，錯失的事。那知這婦人意氣揚揚，走到廟裡賣 嘴弄脣，說道：『石奶奶如今也不靈了，我如此打扮，端的平安過了渡來。』說未畢 口，那班手下的幫妒將帥火速報知，一霎時狂風大作，把那婦人平空吹入水裡淹死了 。查得當日立廟時節，之推夫婦原是衣冠齊楚併肩坐的，為因這事平空把之推塑像忽 然改向朝著左側坐了。地方不安，改塑正了，不久就坍。如今地方上人理會奶奶意思 ，故意塑了這個模樣。此段說話，卻不是成了神還要妒的故事麼？ 至今那一鄉女人氣性極是粗暴，男人個個守法，不敢放肆一些。 凡到津口，只見陰風慘慘，恨霧漫漫，都是石奶奶狠毒英靈障蔽定的。唐時有人到那 裡送行吟詩，有『無將故人酒，不及石尤風』之句，也就是個證了。那幾個後生聽了 嚷道：『大奇！大奇！方纔那首「青竹蛇兒」的詩可見說得不差,不差。』又有一個 說道：『今日搭個豆棚，到是我們一個講學書院，天色將晚，各各回家，老丈明日倘 再肯賜教，千萬早臨。晚生們當備壺酒相候，不似今日草草一茶已也。』 總評《太平廣記》云：『婦人屬金，男子屬木，金剋木，故男受制於女也。』然則女 妒男懼，乃先天稟來，不在化誨條例矣。 雖然，子即以生剋推之，木生火，火能剋金；金生水，水又生木。則相剋相濟，又是 男可制女妙事。故天下分受其氣，所以『妒』、『懼』得半，而理勢常平。艾衲道人 《閑話》第一則就把『妒』字闡發，須知不是左袒婦人，為他增燄也。妒可名津，美 婦易貌；鬱結成塊，後宮參差。此一種可鄙可惡景象，縷縷言之，人人切齒傷心，猶 之經史中『內君子，外小人』。 揣摩小人處，十分荼毒氣概；揣摩君子處，十分狼狽情形。究竟正氣常存，奇衷終餒 ，是良史先賢之一番大補救也。知此則《閑話》第一及妒婦，所謂詩首《關罘，書稱 『矨降』可也。  第二則      范少伯水葬西施 范少伯水葬西施俗語云：『酒逢知己千鍾少，話不投機半句多。』可見飲酒也要知己 。若遇著不知己的，就是半杯也飲不下去；說話也怕不投機，若遇著投機，隨你說千 說萬，都是耳躲順聽、心上喜歡，還只恐那個人三言兩語說完就掃興了。 大凡有意思的高人，彼此相遇，說理談玄，一問一答，娓娓不倦；假使對著沒意思的 ，就如滿頭澆栗，一句也不入耳。倒是那四方怪事、日用常情，後生小子聞所未聞， 最是投機的了。 昨日新搭的豆棚雖有些根苗枝葉長將起來，那豆藤還未延得滿，棚上尚有許多空處， 日色曬將下來，就如說故事的，說到要緊中間尚未說完，剩了許多空隙，終不爽快。 如今不要把話說得煩了。再說那些後生，自昨日聽得許多妒話在肚裡，到家燈下紛紛 的又向家人父子重說一遍。有的道是說評話造出來的，未肯真信，也有信道古來有這 樣狠妒的婦人，也有半信半疑的，尚要處處問人，各自窮究。弄得幾個後生心窩潭裡 、夢寐之中，顛顛倒倒，只等天亮就要往豆棚下聽說古話。 那日色正中，人頭上還未走動。直待日色蹉西，有在市上做生意回來的，有在田地上 做工閑空的，漸漸走到豆棚下，各佔一個空處坐下。不多時，老者也笑嘻嘻的走來， 說道：『眾位哥哥卻早在此，想是昨日約下，今朝又要說甚麼古話了。』 後生俱欣欣然道：『老伯伯！昨日原許下的，我們今日備了酒餚，要聽你說好些話哩 。但今日不要說那妒婦，弄得我們後生輩面上沒甚光輝，卻要說個女人才色兼全，又 有德性，好好收成結果的，也讓我們男人燥一燥皮胃。』那老者把頭側了一側，說道 ：『天地間也沒有這十全的事，紅顏薄命，自古皆然。或者有色的未必有才，有才的 未必有色，有色有才的未必有德，即使有才、有色、有德的，後來也未必就有好的結 局。三皇以前遠不可考，只就三代夏、商、周而言，當在興時，看來雖有幾個賢聖之 後，那纔、貌、德、色也不聞有全備之稱。及至亡國之時，每代出了個妖物，倒是纔 色兼備的。』眾後生說：『那興夏禹王的是那一個？』老者道：『待我慢慢想來。記 得禹王之父，名叫伯鯀，娶了有莘氏的女，名叫修己。看見天上流星貫昴，感孕而生 了禹王於道之石紐鄉。那時洪水滔天，禹王娶了塗山氏做親，方得四日，因其父親治 水無功，堯帝把他殺在羽山。虞舜保奏禹王纔能堪以治水，即便出門。在外過了一十 三年，自家門首走過三次，並不道是家裡邊，進去看看妻子。 那塗山氏也曉得丈夫之性孤古乖怪，也並不出門外來看看丈夫。 不幾年間，洪水平定，堯帝賜禹王玄圭，告成其功。後來虞舜把天下亦讓與他，塗山 氏做了皇后，豈不是個有才有德的？但當日也不曾有人說他怎的標緻，此正是賢聖之 君在德不在貌也。 後來傳了十六、七代，傳到履癸，是為帝桀。平生好勇，力敵萬人，兩手能伸鐵鉤； 貪虐荒淫，傷害百姓。曾去伐那諸侯。有施氏見桀王無道，無計可施，止有一女，名為妹喜，生得十分美貌，多才多技，堪 以進獻。那桀王果然一見魂迷，無事不從，無言不聽。把百姓之財盡數搜索攏來，如 水用去；將那珍饈百味堆將起來，肉山相似。造下許多美酒，傾在池中，可通船隻往 來；兩邊的酒糟疊起成堤，人到上面可望十里。凡遊覽至此，上邊打一聲鼓，下邊人 低頭叩到池中飲酒，就像牛吃水的相似，叫做牛飲，不下有三千餘人，妹喜方以為樂 。如此淫縱，萬民嗟怨，虧殺成湯皇帝出來，把妹喜殺了，桀王放於南巢。如今江南 廬州府巢縣地方，就是那無道之君結果處了。此是第一個女中妖物也。 『夏王的天下傳到商時，商朝代代也有賢聖之後，只是平平常常，也無才德之顯。直 傳到二十八代，生一個紂王出來。 他天性聰明，作事敏捷，力氣勇猛可以抵對猛獸。說來的話都是意想不到的，如有人 欲諫止他，就先曉得把言語搪塞在先，人卻開口不得。自己做了不好的事，他卻有無 數巧言搪塞過了。 終日興工動作，做那輿馬宮室之類，件件窮工極巧。就愛上一個諸侯有蘇氏之女，名 喚妲己。寵幸異常，惟其所好，無不依從。當初夏桀無道做下的酒池肉林也就摹仿他 做將起來。又叫宮中男女赤體而行淫污之事，隨地而做，也不怕觸犯天帝。宮中開了 九市，長夜酣歌，沈湎不散，朝政不理，四方怨望。妲已看見人民恨他，威令不行， 乃重為刑闢，以火燒紅熨鬥叫人拿著，手就爛了；更立一銅柱，炭火逼紅，叫人抱柱 ，立刻焦枯，名為炮烙之刑。還有許多慘刻刑罰，卻難盡說。那紂王只要妲己喜歡， 那裡顧得後來？武王興兵伐紂，紂王自焚而死。 假使妲己有這個美色，沒有這種惡纔，也不到得這地方，此又是一個有色有才的妖物 證見了。那時武王之父文王是個聖人，就有一個母親后妃最是賢德。其纔又能內助， 並無妒心。文王姬妾甚多，生了百子，果然千古難得的。當日就有《關罘、《麟趾》 之詩，誦他懿德。尚有人譏刺道：「此詩乃是周公所作，若是周婆決無此言。」這不 是譏刺后妃，只為天下妒婦多了故作此語，越顯得后妃之賢不可及了。到後來周幽王 時，又生出一個妖物，卻比夏商的更不相同，幾乎把周家八百年的社稷一時斷送了。 這個妖物叫做褒姒。雖則是幽王之後，其來頭卻在五六百年前夏時就有種了。』眾後 生道：『這個妖物果是奇怪，怎麼夏時就種這個禍胎在那裡呢？』老者道：『夏德衰 了，褒姒之祖與夏同姓，那時變作二龍降於王庭，乃作人言，「我乃褒國之君也。」 夏王怒而殺之，那龍口裡吐出些津沫來，就不見了。臣子見是龍吐出的，卻為奇異， 就盛在水桶之內，封錮在寶藏庫中。直到周厲王時，到庫中打開桶來看時，那津沫就 地亂滾，直入宮中，撞到幼女身傍，就不見了。此女纔得十二三歲，有了娠孕。是時 民間有個謠言道：『壓弧箕服，實亡周國。」後來鄉間一個男子手拿山桑之弓，一個 婦人手拿草結之衣，上街來賣，市人見他應著重謠，就要報官，二人慌忙逃竄。適然 撞著有孕的童女，生下一個女兒，棄於道傍。那對夫婦憐憫他，收養在懷，逃入褒國 。後值褒君有罪係於獄中，遂將此女獻上。周王見他美貌，收在後官。舉止端莊，並 不開口一笑。若論平常不肯笑的婦人，此是最尊重有德的了。那知這個不笑，卻是相 關甚大，得他一笑，正是傾國傾城之笑，故此一時不能遽然啟齒。周幽王千方百計引 誘著他，褒姒全然不動。那時周王國中有令，凡有外寇之警，舉起烽臺上號火為信， 都來救應。幽王無端卻放一把空火，各路諸侯來時，卻無寇警。 褒姒見哄動諸侯撲了一空，不覺啞然一笑。後來犬戎入犯，兵臨城下，幽王著急，燒 盡了烽臺上火，那諸侯只當戲耍，都不來了。幽王遂被犬戎所殺。卻不又是一個亡國 的妖物麼？如此看來，纔全德備的婦人委實不大見有。』眾少年接口道：『亡國之妖 顛倒朝綱，窮奢極欲，至今人說將來，個個痛恨，人人都是曉得的。昨日前村中做戲 ，我看了一本《浣紗記》，做出西施住居薴蘿山下，范大夫前訪後訪，內中唱出一句 ，說「江東百姓，全是賴卿卿」。可見越國復得興霸，那些文官武將全然無用，那西 施倒是第一個功臣。後來看到同范大夫兩個泛湖而去，人都說他俱成了神仙。這個卻 不是纔色俱備、又成功業、又有好好結果的麼？』老者道：『戲文雖則如此說，人卻 另有一個意思。看見多少功成名遂的人遇著猜忌之王，不肯見機而去，如文種大夫， 畢竟為勾踐所殺。故此假說他成仙，不過要打動天地間富貴功名的人，處在盛滿之地 ，做個急流勇退的樣子，那有真正成仙的道理？我在一本野史上看見的卻又不同。 說這西子住居若耶溪畔，本是一個村莊女子。那范大夫看見富貴家女人打扮，調脂弄 粉，高髻宮妝，委實平時看得厭了。一日山行，忽然遇著淡雅新妝波俏女子，就道標 緻之極。其實也只平常。又見他小門深巷許多丑頭怪腦的東施圍聚左右，獨有他年紀 不大不小，舉止閑雅，又曉得幾句在行說話，怎麼范大夫不就動心？那曾見未室人的 閨女就曉得與人施禮、與人說話？ 說得投機，就分一縷所浣之紗贈作表記？又曉得甚麼惹害相思等語？一別三年，在別 人也丟在腦後多時了，那知人也不去娶他，他也不曾嫁人，心裡遂害了一個癡心痛玻 及至相逢，話到那國勢傾頹，靠他做事，他也就呆呆的跟他走了。可見平日他在山裡 住著，原沒甚麼父母拘管得他，要與沒識熟的男子說話就說幾句，要隨沒下落的男子 走路也就走了。 一路行來，混混帳帳，到了越國。學了些吹彈欲舞，馬扁的伎倆，送入吳邦。吳王是 個蘇州空頭，只要肉肉麻麻奉承幾句，那左右許多幫閑篾片，不上三分的就說十分， 不上五六分就說千古罕見的了。況且伯嚊嚭暗裡得了許多賄賂，他說好的，誰敢不加 意幫襯？吳王沒主意的，眾人贊得昏了，自然一見留心，如得珍寶。古語云：「士為 知己者死，女為悅己者容。」那吳王既待你如此恩情，只該從中調停那越王歸國，兩 不相犯。 一面扶持吳王興些霸業，前不負越，後不負吳，這便真是千載奇傑女子。何苦先許身";
        return TestData;
    }());
    LZUTF8.TestData = TestData;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    function repeatString(str, count) {
        var result = "";
        for (var i = 0; i < count; i++)
            result += str;
        return result;
    }
    LZUTF8.repeatString = repeatString;
    function truncateUTF16String(str, truncatedLength) {
        var lastCharCode = str.charCodeAt(truncatedLength - 1);
        if (lastCharCode >= 0xD800 && lastCharCode <= 0xDBFF)
            return str.substr(0, truncatedLength - 1);
        else
            return str.substr(0, truncatedLength);
        ;
    }
    LZUTF8.truncateUTF16String = truncateUTF16String;
    function verifyEncoding(input, expectedEncoding) {
        switch (expectedEncoding) {
            case "ByteArray":
                return input instanceof Uint8Array;
            case "Buffer":
                return LZUTF8.runningInNodeJS() && Buffer.isBuffer(input);
            case "Base64":
                return typeof input === "string" && /^[A-Za-z0-9\+\/]*\=?\=?$/.test(input);
            case "BinaryString":
                if (typeof input != "string")
                    return false;
                if (input == "") {
                    return true;
                }
                for (var p = 0; p < input.length - 1; p++) {
                    if (input.charCodeAt(p) >= 32768)
                        return false;
                }
                if (input.charCodeAt(input.length - 1) < 32768)
                    return false;
                return true;
            case "StorageBinaryString":
                if (typeof input != "string")
                    return false;
                if (input == "") {
                    return true;
                }
                for (var p = 0; p < input.length - 1; p++) {
                    var charCode = input.charCodeAt(p);
                    if (charCode == 0 || charCode == 32768 || charCode == 32769 || charCode > 32770)
                        return false;
                }
                if (input.charCodeAt(input.length - 1) != 32768 && input.charCodeAt(input.length - 1) != 32769)
                    return false;
                return true;
            default:
                throw new Error("Unsupported expected encoding '" + expectedEncoding + "'");
        }
    }
    LZUTF8.verifyEncoding = verifyEncoding;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    if (LZUTF8.runningInNodeJS()) {
        process.on('uncaughtException', function (e) {
            LZUTF8.log(e);
        });
    }
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    describe("Encodings:", function () {
        describe("BinaryString", function () {
            it("Encodes and decodes a simple set of bytes", function () {
                var bytes = new Uint8Array([1, 2, 3, 4, 5]);
                var encodedString = LZUTF8.Encoding.BinaryString.encode(bytes);
                var decodedValues = LZUTF8.Encoding.BinaryString.decode(encodedString);
                expect(decodedValues).toEqual(bytes);
                expect(LZUTF8.verifyEncoding(encodedString, "BinaryString")).toBe(true);
            });
            it("Encodes and decodes random bytes", function () {
                for (var j = 0; j < 100; j++) {
                    for (var i = 0; i < 100; i++) {
                        var randomValues = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(i, 0, 256));
                        var encodedString = LZUTF8.Encoding.BinaryString.encode(randomValues);
                        var decodedValues = LZUTF8.Encoding.BinaryString.decode(encodedString);
                        expect(randomValues).toEqual(decodedValues);
                        expect(LZUTF8.verifyEncoding(encodedString, "BinaryString")).toBe(true);
                    }
                }
            });
            it("Decodes concatenated binary strings correctly", function () {
                for (var j = 0; j < 100; j++) {
                    for (var i = 0; i < 100; i++) {
                        var randomValues1 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var randomValues2 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var randomValues3 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var randomValues4 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var randomValues5 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var encodedString1 = LZUTF8.Encoding.BinaryString.encode(randomValues1);
                        var encodedString2 = LZUTF8.Encoding.BinaryString.encode(randomValues2);
                        var encodedString3 = LZUTF8.Encoding.BinaryString.encode(randomValues3);
                        var encodedString4 = LZUTF8.Encoding.BinaryString.encode(randomValues4);
                        var encodedString5 = LZUTF8.Encoding.BinaryString.encode(randomValues5);
                        var decodedConcatenatedStrings = LZUTF8.Encoding.BinaryString.decode(encodedString1 + encodedString2 + encodedString3 + encodedString4 + encodedString5);
                        var joinedRandomValues = LZUTF8.ArrayTools.concatUint8Arrays([randomValues1, randomValues2, randomValues3, randomValues4, randomValues5]);
                        expect(decodedConcatenatedStrings).toEqual(joinedRandomValues);
                    }
                }
            });
            it("Handles undefined, null or empty arrays (encoding)", function () {
                expect(function () { return LZUTF8.encodeBinaryString(undefined); }).toThrow();
                expect(function () { return LZUTF8.encodeBinaryString(null); }).toThrow();
                expect(LZUTF8.encodeBinaryString(new Uint8Array(0))).toEqual("");
            });
            it("Handles undefined, null or empty strings (decoding)", function () {
                expect(function () { return LZUTF8.decodeBinaryString(undefined); }).toThrow();
                expect(function () { return LZUTF8.decodeBinaryString(null); }).toThrow();
                expect(LZUTF8.decodeBinaryString("")).toEqual(new Uint8Array(0));
            });
            /*
            if (typeof sessionStorage !== "undefined") {
                it("Produces strings that can be stored in sessionStorage", () => {
                    for (let i = 0; i < 1000; i++) {
                        const randomBinaryData = new Uint8Array(Random.getRandomIntegerArrayOfLength(Random.getRandomIntegerInRange(0, i), 0, 256));
                        const encodedData = encodeBinaryString(randomBinaryData);
                        sessionStorage.setItem('lzutf8_test_storage_binary_string', encodedData);
                        const readResult = sessionStorage.getItem('lzutf8_test_storage_binary_string');
                        sessionStorage.removeItem('lzutf8_test_storage_binary_string');

                        expect(readResult).toEqual(encodedData);
                        expect(verifyEncoding(readResult, "BinaryString")).toBe(true);
                        expect(decodeBinaryString(readResult!)).toEqual(randomBinaryData);
                    }
                });
            }
            */
        });
    });
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    describe("LZ-UTF8:", function () {
        describe("Test inputs:", function () {
            var addTestsForInputString = function (testStringTitle, inputString) {
                describe(testStringTitle + ":", function () {
                    describe("Basic tests with diffferent types of hash tables:", function () {
                        var compressor1;
                        var compressor2;
                        var compressedData1;
                        var compressedData2;
                        beforeEach(function () {
                            compressor1 = new LZUTF8.Compressor(false);
                            compressor2 = new LZUTF8.Compressor(true);
                            compressedData1 = compressor1.compressBlock(inputString);
                            compressedData2 = compressor2.compressBlock(inputString);
                        });
                        it("Compresses correctly with simple hash table", function () {
                            expect(LZUTF8.decompress(compressedData1)).toEqual(inputString);
                            expect(compressedData1.length).toBeLessThan(LZUTF8.encodeUTF8(inputString).length);
                        });
                        it("Compresses correctly with custom hash table", function () {
                            expect(LZUTF8.decompress(compressedData2)).toEqual(inputString);
                            expect(compressedData2.length).toBeLessThan(LZUTF8.encodeUTF8(inputString).length);
                        });
                        it("Outputs the exact same data for both the simple and custom hash tables", function () {
                            expect(compressedData1).toEqual(compressedData2);
                        });
                        it("Creates a simple hash table with a bucket count larger than 0", function () {
                            expect(compressor1.prefixHashTable.getUsedBucketCount()).toBeGreaterThan(0);
                        });
                        it("Creates a custom hash table with a bucket count larger than 0", function () {
                            expect(compressor2.prefixHashTable.getUsedBucketCount()).toBeGreaterThan(0);
                        });
                        it("Both the simple and custom hash tables have the same bucket usage", function () {
                            expect(compressor1.prefixHashTable.getUsedBucketCount()).toEqual(compressor2.prefixHashTable.getUsedBucketCount());
                        });
                        it("Both the simple and custom hash tables have the same total element count", function () {
                            expect(compressor1.prefixHashTable.getTotalElementCount()).toEqual(compressor2.prefixHashTable.getTotalElementCount());
                        });
                    });
                    describe("Multi-part compression/decompression:", function () {
                        it("Compresses and decompresses correctly when input and output are divided into multiple arbitrary parts", function () {
                            var inputStringAsUTF8 = LZUTF8.encodeUTF8(inputString);
                            var part1 = inputStringAsUTF8.subarray(0, Math.floor(inputStringAsUTF8.length * 0.377345));
                            var part2 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.377345), Math.floor(inputStringAsUTF8.length * 0.377345) + 2);
                            var part3 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.377345) + 2, Math.floor(inputStringAsUTF8.length * 0.719283471));
                            var part4 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.719283471), Math.floor(inputStringAsUTF8.length * 0.822345178225));
                            var part5 = inputStringAsUTF8.subarray(Math.floor(inputStringAsUTF8.length * 0.822345178225));
                            var compressor = new LZUTF8.Compressor();
                            var compressedData1 = compressor.compressBlock(part1);
                            var compressedData2 = compressor.compressBlock(part2);
                            var compressedData3 = compressor.compressBlock(part3);
                            var compressedData4 = compressor.compressBlock(part4);
                            var compressedData5 = compressor.compressBlock(part5);
                            var joinedCompressedData = LZUTF8.ArrayTools.concatUint8Arrays([compressedData1, compressedData2, compressedData3, compressedData4, compressedData5]);
                            var decompressor = new LZUTF8.Decompressor();
                            var decompressedString1 = decompressor.decompressBlockToString(joinedCompressedData.subarray(0, Math.floor(joinedCompressedData.length * 0.2123684521)));
                            var decompressedString2 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.2123684521), Math.floor(joinedCompressedData.length * 0.41218346219)));
                            var decompressedString3 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.41218346219), Math.floor(joinedCompressedData.length * 0.74129384652)));
                            var decompressedString4 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.74129384652), Math.floor(joinedCompressedData.length * 0.74129384652) + 2));
                            var decompressedString5 = decompressor.decompressBlockToString(new Uint8Array(0));
                            var decompressedString6 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.74129384652) + 2, Math.floor(joinedCompressedData.length * 0.9191234791281724)));
                            var decompressedString7 = decompressor.decompressBlockToString(joinedCompressedData.subarray(Math.floor(joinedCompressedData.length * 0.9191234791281724)));
                            expect(decompressedString1 + decompressedString2 + decompressedString3 + decompressedString4 + decompressedString5 + decompressedString6 + decompressedString7).toEqual(inputString);
                        });
                        it("Compresses and decompresses correctly when input and output are divided into hundreds of small random parts", function () {
                            var truncatedLength = 5001;
                            var truncatedInputString = LZUTF8.truncateUTF16String(inputString, truncatedLength);
                            var input = LZUTF8.encodeUTF8(truncatedInputString);
                            var compressor = new LZUTF8.Compressor();
                            var compressedParts = [];
                            for (var offset = 0; offset < input.length;) {
                                var randomLength = Math.floor(Math.random() * 4);
                                var endOffset = Math.min(offset + randomLength, input.length);
                                var part = compressor.compressBlock(input.subarray(offset, endOffset));
                                compressedParts.push(part);
                                offset += randomLength;
                            }
                            var joinedCompressedParts = LZUTF8.ArrayTools.concatUint8Arrays(compressedParts);
                            var decompressor = new LZUTF8.Decompressor();
                            var decompressedParts = [];
                            var _loop_1 = function (offset) {
                                expect(joinedCompressedParts).toBeDefined();
                                var randomLength = Math.floor(Math.random() * 4);
                                var endOffset = Math.min(offset + randomLength, joinedCompressedParts.length);
                                var part = decompressor.decompressBlock(joinedCompressedParts.subarray(offset, endOffset));
                                expect(function () { return LZUTF8.Encoding.UTF8.decode(part); }).not.toThrow(); // Make sure the part is a valid and untruncated UTF-8 sequence
                                decompressedParts.push(part);
                                offset += randomLength;
                                out_offset_1 = offset;
                            };
                            var out_offset_1;
                            for (var offset = 0; offset < input.length;) {
                                _loop_1(offset);
                                offset = out_offset_1;
                            }
                            var joinedDecompressedParts = LZUTF8.ArrayTools.concatUint8Arrays(decompressedParts);
                            expect(LZUTF8.decodeUTF8(joinedDecompressedParts)).toEqual(truncatedInputString);
                        });
                    });
                    describe("Special properties:", function () {
                        it("Will decompresses the uncompressed string to itself (assuring UTF-8 backwards compatibility)", function () {
                            var decompressedUncompressedString = LZUTF8.decompress(LZUTF8.encodeUTF8(inputString));
                            expect(decompressedUncompressedString).toEqual(inputString);
                        });
                    });
                });
            };
            addTestsForInputString("Lorem ipsum", LZUTF8.TestData.loremIpsum);
            addTestsForInputString("Chinese text", LZUTF8.TestData.chineseText);
            addTestsForInputString("Hindi text", LZUTF8.TestData.hindiText);
            addTestsForInputString("Random unicode characters (up to codepoint 1112064)", LZUTF8.Random.getRandomUTF16StringOfLength(2000));
            addTestsForInputString("Long mixed text", LZUTF8.TestData.hindiText + LZUTF8.TestData.loremIpsum + LZUTF8.TestData.hindiText + LZUTF8.TestData.chineseText + LZUTF8.TestData.chineseText);
            addTestsForInputString("Repeating String 'aaaaaaa'..", LZUTF8.repeatString("aaaaaaaaaa", 2000));
        });
        describe("Synchronous operations with different input and output encodings", function () {
            var sourceAsString = LZUTF8.TestData.hindiText.substr(0, 100);
            var sourceAsByteArray = LZUTF8.encodeUTF8(sourceAsString);
            function addTestForEncodingCombination(testedSourceEncoding, testedCompressedEncoding, testedDecompressedEncoding) {
                it("Successfuly compresses a " + testedSourceEncoding + " to a " + testedCompressedEncoding + " and decompresses to a " + testedDecompressedEncoding, function () {
                    var source;
                    if (testedSourceEncoding == "String")
                        source = sourceAsString;
                    else
                        source = sourceAsByteArray;
                    var compressedData = LZUTF8.compress(source, { outputEncoding: testedCompressedEncoding });
                    expect(LZUTF8.verifyEncoding(compressedData, testedCompressedEncoding)).toBe(true);
                    var decompressedData = LZUTF8.decompress(compressedData, { inputEncoding: testedCompressedEncoding, outputEncoding: testedDecompressedEncoding });
                    if (testedDecompressedEncoding == "String")
                        expect(decompressedData).toEqual(sourceAsString);
                    else if (testedDecompressedEncoding == "ByteArray")
                        expect(decompressedData).toEqual(sourceAsByteArray);
                });
            }
            addTestForEncodingCombination("String", "ByteArray", "String");
            addTestForEncodingCombination("String", "ByteArray", "ByteArray");
            addTestForEncodingCombination("String", "BinaryString", "String");
            addTestForEncodingCombination("String", "BinaryString", "ByteArray");
            addTestForEncodingCombination("String", "StorageBinaryString", "String");
            addTestForEncodingCombination("String", "StorageBinaryString", "ByteArray");
            addTestForEncodingCombination("String", "Base64", "String");
            addTestForEncodingCombination("String", "Base64", "ByteArray");
            if (LZUTF8.runningInNodeJS()) {
                addTestForEncodingCombination("String", "Buffer", "String");
                addTestForEncodingCombination("String", "Buffer", "ByteArray");
            }
            addTestForEncodingCombination("ByteArray", "ByteArray", "String");
            addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray");
            addTestForEncodingCombination("ByteArray", "BinaryString", "String");
            addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray");
            addTestForEncodingCombination("ByteArray", "StorageBinaryString", "String");
            addTestForEncodingCombination("ByteArray", "StorageBinaryString", "ByteArray");
            addTestForEncodingCombination("ByteArray", "Base64", "String");
            addTestForEncodingCombination("ByteArray", "Base64", "ByteArray");
            if (LZUTF8.runningInNodeJS()) {
                addTestForEncodingCombination("ByteArray", "Buffer", "String");
                addTestForEncodingCombination("ByteArray", "Buffer", "ByteArray");
            }
        });
        describe("Asynchronous operations with different input and output encodings:", function () {
            var sourceAsString = LZUTF8.TestData.hindiText.substr(0, 100);
            var sourceAsByteArray = LZUTF8.encodeUTF8(sourceAsString);
            function addTestForEncodingCombination(testedSourceEncoding, testedCompressedEncoding, testedDecompressedEncoding, webWorkerEnabled) {
                it("Successfuly compresses a " + testedSourceEncoding + " to a " + testedCompressedEncoding + " and decompresses to a " + testedDecompressedEncoding, function (done) {
                    var source;
                    if (testedSourceEncoding == "String")
                        source = sourceAsString;
                    else
                        source = sourceAsByteArray;
                    LZUTF8.compressAsync(source, { outputEncoding: testedCompressedEncoding, useWebWorker: webWorkerEnabled, blockSize: 31 }, function (compressedData) {
                        expect(LZUTF8.verifyEncoding(compressedData, testedCompressedEncoding)).toBe(true);
                        LZUTF8.decompressAsync(compressedData, { inputEncoding: testedCompressedEncoding, outputEncoding: testedDecompressedEncoding, useWebWorker: webWorkerEnabled, blockSize: 23 }, function (decompressedData) {
                            if (testedDecompressedEncoding == "String")
                                expect(decompressedData).toEqual(sourceAsString);
                            else if (testedDecompressedEncoding == "ByteArray")
                                expect(decompressedData).toEqual(sourceAsByteArray);
                            done();
                        });
                    });
                });
            }
            // Async tests without web worker
            describe("Without web worker:", function () {
                addTestForEncodingCombination("String", "ByteArray", "String", false);
                addTestForEncodingCombination("String", "ByteArray", "ByteArray", false);
                addTestForEncodingCombination("String", "BinaryString", "String", false);
                addTestForEncodingCombination("String", "BinaryString", "ByteArray", false);
                addTestForEncodingCombination("String", "StorageBinaryString", "String", false);
                addTestForEncodingCombination("String", "StorageBinaryString", "ByteArray", false);
                addTestForEncodingCombination("String", "Base64", "String", false);
                addTestForEncodingCombination("String", "Base64", "ByteArray", false);
                if (LZUTF8.runningInNodeJS()) {
                    addTestForEncodingCombination("String", "Buffer", "String", false);
                    addTestForEncodingCombination("String", "Buffer", "ByteArray", false);
                }
                addTestForEncodingCombination("ByteArray", "ByteArray", "String", false);
                addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray", false);
                addTestForEncodingCombination("ByteArray", "BinaryString", "String", false);
                addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray", false);
                addTestForEncodingCombination("ByteArray", "StorageBinaryString", "String", false);
                addTestForEncodingCombination("ByteArray", "StorageBinaryString", "ByteArray", false);
                addTestForEncodingCombination("ByteArray", "Base64", "String", false);
                addTestForEncodingCombination("ByteArray", "Base64", "ByteArray", false);
                if (LZUTF8.runningInNodeJS()) {
                    addTestForEncodingCombination("ByteArray", "Buffer", "String", false);
                    addTestForEncodingCombination("ByteArray", "Buffer", "ByteArray", false);
                }
            });
            describe("With web worker (if supported):", function () {
                addTestForEncodingCombination("String", "ByteArray", "String", true);
                addTestForEncodingCombination("String", "ByteArray", "ByteArray", true);
                addTestForEncodingCombination("String", "BinaryString", "String", true);
                addTestForEncodingCombination("String", "BinaryString", "ByteArray", true);
                addTestForEncodingCombination("String", "StorageBinaryString", "String", true);
                addTestForEncodingCombination("String", "StorageBinaryString", "ByteArray", true);
                addTestForEncodingCombination("String", "Base64", "String", true);
                addTestForEncodingCombination("String", "Base64", "ByteArray", true);
                addTestForEncodingCombination("ByteArray", "ByteArray", "String", true);
                addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray", true);
                addTestForEncodingCombination("ByteArray", "BinaryString", "String", true);
                addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray", true);
                addTestForEncodingCombination("ByteArray", "StorageBinaryString", "String", true);
                addTestForEncodingCombination("ByteArray", "StorageBinaryString", "ByteArray", true);
                addTestForEncodingCombination("ByteArray", "Base64", "String", true);
                addTestForEncodingCombination("ByteArray", "Base64", "ByteArray", true);
            });
            describe("With automatic setting for web worker:", function () {
                addTestForEncodingCombination("String", "ByteArray", "String", undefined);
                addTestForEncodingCombination("String", "ByteArray", "ByteArray", undefined);
                addTestForEncodingCombination("String", "BinaryString", "String", undefined);
                addTestForEncodingCombination("String", "BinaryString", "ByteArray", undefined);
                addTestForEncodingCombination("String", "StorageBinaryString", "String", undefined);
                addTestForEncodingCombination("String", "StorageBinaryString", "ByteArray", undefined);
                addTestForEncodingCombination("String", "Base64", "String", undefined);
                addTestForEncodingCombination("String", "Base64", "ByteArray", undefined);
                if (LZUTF8.runningInNodeJS()) {
                    addTestForEncodingCombination("String", "Buffer", "String", undefined);
                    addTestForEncodingCombination("String", "Buffer", "ByteArray", undefined);
                }
                addTestForEncodingCombination("ByteArray", "ByteArray", "String", undefined);
                addTestForEncodingCombination("ByteArray", "ByteArray", "ByteArray", undefined);
                addTestForEncodingCombination("ByteArray", "BinaryString", "String", undefined);
                addTestForEncodingCombination("ByteArray", "BinaryString", "ByteArray", undefined);
                addTestForEncodingCombination("ByteArray", "StorageBinaryString", "String", undefined);
                addTestForEncodingCombination("ByteArray", "StorageBinaryString", "ByteArray", undefined);
                addTestForEncodingCombination("ByteArray", "Base64", "String", undefined);
                addTestForEncodingCombination("ByteArray", "Base64", "ByteArray", undefined);
                if (LZUTF8.runningInNodeJS()) {
                    addTestForEncodingCombination("ByteArray", "Buffer", "String", undefined);
                    addTestForEncodingCombination("ByteArray", "Buffer", "ByteArray", undefined);
                }
            });
            describe("Simultanous async operations:", function () {
                var randomString1 = LZUTF8.Random.getRandomUTF16StringOfLength(1001);
                var randomString2 = LZUTF8.Random.getRandomUTF16StringOfLength(1301);
                it("Successfuly compconstes two async operation started in parallel (without web worker)", function (done) {
                    var firstIsDone = false;
                    var secondIsDone = false;
                    LZUTF8.compressAsync(randomString1, { blockSize: 221, useWebWorker: false }, function (result) {
                        expect(LZUTF8.decompress(result)).toEqual(randomString1);
                        firstIsDone = true;
                        if (secondIsDone)
                            done();
                    });
                    LZUTF8.compressAsync(randomString2, { blockSize: 321, useWebWorker: false }, function (result) {
                        expect(LZUTF8.decompress(result)).toEqual(randomString2);
                        secondIsDone = true;
                        if (firstIsDone)
                            done();
                    });
                });
                it("Successfuly executes two async operation started in parallel (with web worker if supported)", function (done) {
                    var firstIsDone = false;
                    var secondIsDone = false;
                    LZUTF8.compressAsync(LZUTF8.TestData.chineseText, { useWebWorker: true }, function (result) {
                        expect(LZUTF8.decompress(result)).toEqual(LZUTF8.TestData.chineseText);
                        firstIsDone = true;
                        if (secondIsDone)
                            done();
                    });
                    LZUTF8.compressAsync(LZUTF8.TestData.loremIpsum, { useWebWorker: true }, function (result) {
                        expect(LZUTF8.decompress(result)).toEqual(LZUTF8.TestData.loremIpsum);
                        secondIsDone = true;
                        if (firstIsDone)
                            done();
                    });
                });
            });
            describe("Async operations with a custom web worker URI", function () {
                beforeEach(function () {
                    LZUTF8.WebWorker.terminate();
                    LZUTF8.WebWorker.scriptURI = "../build/development/lzutf8.js";
                });
                afterEach(function () {
                    LZUTF8.WebWorker.terminate();
                    LZUTF8.WebWorker.scriptURI = undefined;
                });
                if (LZUTF8.WebWorker.createGlobalWorkerIfNeeded()) {
                    addTestForEncodingCombination("ByteArray", "BinaryString", "String", true);
                }
            });
        });
        describe("Error handling:", function () {
            it("Throws on undefined or null input for synchronous compression and decompression", function () {
                expect(function () { return LZUTF8.compress(undefined); }).toThrow();
                expect(function () { return LZUTF8.compress(null); }).toThrow();
                expect(function () { return LZUTF8.decompress(undefined); }).toThrow();
                expect(function () { return LZUTF8.decompress(null); }).toThrow();
                var compressor = new LZUTF8.Compressor();
                expect(function () { return compressor.compressBlock(undefined); }).toThrow();
                expect(function () { return compressor.compressBlock(null); }).toThrow();
                var decompressor = new LZUTF8.Decompressor();
                expect(function () { return decompressor.decompressBlock(undefined); }).toThrow();
                expect(function () { return decompressor.decompressBlock(null); }).toThrow();
            });
            // Async with web workers
            it("Invokes callback with error for undefined input in asynchronous compression (with web workers)", function (done) {
                LZUTF8.compressAsync(undefined, { useWebWorker: true }, function (result, error) {
                    expect(result).toBe(undefined);
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("Invokes callback with error for invalid input type in asynchronous compression (with web workers)", function (done) {
                LZUTF8.compressAsync(new Date(), { useWebWorker: true }, function (result, error) {
                    expect(result).toBe(undefined);
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("Invokes callback with error for undefined input in asynchronous decompression (with web workers)", function (done) {
                LZUTF8.decompressAsync(undefined, { useWebWorker: true }, function (result, error) {
                    expect(result).toBe(undefined);
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("Invokes callback with error for invalid input type in asynchronous decompression (with web workers)", function (done) {
                LZUTF8.decompressAsync(new Date(), { inputEncoding: "Base64", useWebWorker: true }, function (result, error) {
                    expect(result).toBe(undefined);
                    expect(error).toBeDefined();
                    done();
                });
            });
            // Async without web workers
            it("Invokes callback with error for undefined input in asynchronous compression (without web workers)", function (done) {
                LZUTF8.compressAsync(undefined, { useWebWorker: false }, function (result, error) {
                    expect(result).toBe(undefined);
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("Invokes callback with error for invalid input type in asynchronous compression (without web workers)", function (done) {
                LZUTF8.compressAsync(new Date(), { useWebWorker: false }, function (result, error) {
                    expect(result).toBe(undefined);
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("Invokes callback with error for undefined input in asynchronous decompression (without web workers)", function (done) {
                LZUTF8.decompressAsync(undefined, { useWebWorker: false }, function (result, error) {
                    expect(result).toBe(undefined);
                    expect(error).toBeDefined();
                    done();
                });
            });
            it("Invokes callback with error for invalid input type in asynchronous decompression (without web workers)", function (done) {
                LZUTF8.decompressAsync(new Date(), { inputEncoding: "Base64", useWebWorker: false }, function (result, error) {
                    expect(result).toBe(undefined);
                    expect(error).toBeDefined();
                    done();
                });
            });
        });
        describe("Trivial cases:", function () {
            it("Handles zero length input for compression and decompression", function () {
                expect(LZUTF8.compress(new Uint8Array(0))).toEqual(new Uint8Array(0));
                expect(LZUTF8.decompress(new Uint8Array(0))).toEqual("");
                expect(LZUTF8.decompress(new Uint8Array(0), { outputEncoding: "ByteArray" })).toEqual(new Uint8Array(0));
                var compressor = new LZUTF8.Compressor();
                expect(compressor.compressBlock(new Uint8Array(0))).toEqual(new Uint8Array(0));
                var decompressor = new LZUTF8.Decompressor();
                expect(decompressor.decompressBlock(new Uint8Array(0))).toEqual(new Uint8Array(0));
                expect(decompressor.decompressBlockToString(new Uint8Array(0))).toEqual("");
            });
            if (LZUTF8.runningInNodeJS()) {
                it("Automatically converts Buffers to Uint8Arrays (sync)", function () {
                    var compressedText = LZUTF8.compress(new Buffer(LZUTF8.TestData.loremIpsum));
                    var decompressedText = LZUTF8.decompress(new Buffer(compressedText));
                    expect(decompressedText).toEqual(LZUTF8.TestData.loremIpsum);
                });
                it("Automatically converts Buffers to Uint8Arrays (sync, incremental)", function () {
                    var compressor = new LZUTF8.Compressor();
                    var compressedText = compressor.compressBlock(new Buffer(LZUTF8.TestData.loremIpsum));
                    var decompressor = new LZUTF8.Decompressor();
                    var decompressedText = decompressor.decompressBlock(new Buffer(compressedText));
                    expect(LZUTF8.decodeUTF8(decompressedText)).toEqual(LZUTF8.TestData.loremIpsum);
                });
                it("Automatically converts Buffers to Uint8Arrays (async)", function (done) {
                    LZUTF8.compressAsync(new Buffer(LZUTF8.TestData.loremIpsum), {}, function (compressedText) {
                        LZUTF8.decompressAsync(new Buffer(compressedText), {}, function (decompressedText) {
                            expect(decompressedText).toEqual(LZUTF8.TestData.loremIpsum);
                            done();
                        });
                    });
                });
            }
        });
        describe("Special bytestream features:", function () {
            it("Allows concatenation of multiple compressed and uncompressed streams to a single, valid compressed stream", function () {
                var compressdData1 = LZUTF8.compress(LZUTF8.TestData.chineseText);
                var rawData = LZUTF8.encodeUTF8(LZUTF8.TestData.hindiText);
                var compressedData2 = LZUTF8.compress(LZUTF8.TestData.chineseText);
                var compressedData3 = LZUTF8.compress(LZUTF8.TestData.loremIpsum);
                var mixedData = LZUTF8.ArrayTools.concatUint8Arrays([compressdData1, rawData, compressedData2, compressedData3]);
                var decompressedMixedData = LZUTF8.decompress(mixedData);
                expect(decompressedMixedData).toEqual(LZUTF8.TestData.chineseText + LZUTF8.TestData.hindiText + LZUTF8.TestData.chineseText + LZUTF8.TestData.loremIpsum);
            });
        });
        if (LZUTF8.runningInNodeJS()) {
            describe("Node.js streams integration:", function () {
                it("Correctly compresses and decompresses through streams", function (done) {
                    var compressionStream = LZUTF8.createCompressionStream();
                    var decompressionStream = LZUTF8.createDecompressionStream();
                    compressionStream.pipe(decompressionStream);
                    compressionStream.write(LZUTF8.TestData.hindiText);
                    decompressionStream.on("readable", function () {
                        var result = decompressionStream.read().toString("utf8");
                        expect(result).toEqual(LZUTF8.TestData.hindiText);
                        done();
                    });
                });
            });
        }
    });
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    describe("Encodings:", function () {
        describe("StorageBinaryString", function () {
            it("Encodes and decodes a simple set of bytes", function () {
                var bytes = new Uint8Array([1, 2, 3, 4, 5]);
                var encodedString = LZUTF8.Encoding.StorageBinaryString.encode(bytes);
                var decodedValues = LZUTF8.Encoding.StorageBinaryString.decode(encodedString);
                expect(decodedValues).toEqual(bytes);
                expect(LZUTF8.verifyEncoding(encodedString, "StorageBinaryString")).toBe(true);
            });
            it("Encodes and decodes random bytes", function () {
                for (var j = 0; j < 100; j++) {
                    for (var i = 0; i < 100; i++) {
                        var randomValues = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(i, 0, 256));
                        var encodedString = LZUTF8.Encoding.StorageBinaryString.encode(randomValues);
                        var decodedValues = LZUTF8.Encoding.StorageBinaryString.decode(encodedString);
                        expect(LZUTF8.verifyEncoding(encodedString, "StorageBinaryString")).toBe(true);
                        expect(randomValues).toEqual(decodedValues);
                    }
                }
            });
            it("Decodes concatenated binary strings correctly", function () {
                for (var j = 0; j < 100; j++) {
                    for (var i = 0; i < 100; i++) {
                        var randomValues1 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var randomValues2 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var randomValues3 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var randomValues4 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var randomValues5 = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var encodedString1 = LZUTF8.Encoding.StorageBinaryString.encode(randomValues1);
                        var encodedString2 = LZUTF8.Encoding.StorageBinaryString.encode(randomValues2);
                        var encodedString3 = LZUTF8.Encoding.StorageBinaryString.encode(randomValues3);
                        var encodedString4 = LZUTF8.Encoding.StorageBinaryString.encode(randomValues4);
                        var encodedString5 = LZUTF8.Encoding.StorageBinaryString.encode(randomValues5);
                        var decodedConcatenatedStrings = LZUTF8.Encoding.StorageBinaryString.decode(encodedString1 + encodedString2 + encodedString3 + encodedString4 + encodedString5);
                        var joinedRandomValues = LZUTF8.ArrayTools.concatUint8Arrays([randomValues1, randomValues2, randomValues3, randomValues4, randomValues5]);
                        expect(decodedConcatenatedStrings).toEqual(joinedRandomValues);
                    }
                }
            });
            it("Handles undefined, null or empty arrays (encoding)", function () {
                expect(function () { return LZUTF8.encodeStorageBinaryString(undefined); }).toThrow();
                expect(function () { return LZUTF8.encodeStorageBinaryString(null); }).toThrow();
                expect(LZUTF8.encodeStorageBinaryString(new Uint8Array(0))).toEqual("");
            });
            it("Handles undefined, null or empty strings (decoding)", function () {
                expect(function () { return LZUTF8.decodeStorageBinaryString(undefined); }).toThrow();
                expect(function () { return LZUTF8.decodeStorageBinaryString(null); }).toThrow();
                expect(LZUTF8.decodeStorageBinaryString("")).toEqual(new Uint8Array(0));
            });
            if (typeof sessionStorage !== "undefined") {
                it("Produces strings that can be stored in sessionStorage", function () {
                    for (var i = 0; i < 1000; i++) {
                        var randomBinaryData = new Uint8Array(LZUTF8.Random.getRandomIntegerArrayOfLength(LZUTF8.Random.getRandomIntegerInRange(0, i), 0, 256));
                        var encodedData = LZUTF8.encodeStorageBinaryString(randomBinaryData);
                        sessionStorage.setItem('lzutf8_test_storage_binary_string', encodedData);
                        var readResult = sessionStorage.getItem('lzutf8_test_storage_binary_string');
                        sessionStorage.removeItem('lzutf8_test_storage_binary_string');
                        expect(readResult).toEqual(encodedData);
                        expect(LZUTF8.verifyEncoding(readResult, "StorageBinaryString")).toBe(true);
                        expect(LZUTF8.decodeStorageBinaryString(readResult)).toEqual(randomBinaryData);
                    }
                });
            }
        });
    });
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Benchmark = /** @class */ (function () {
        function Benchmark(benchmarkContext, options) {
            this.benchmarkContext = benchmarkContext;
            if (options)
                this.defaultOptions = options;
            else
                options = { maximumSamples: 20, maximumTime: 100 };
            this.sampleResults = [];
        }
        Benchmark.prototype.run = function (benchmarkedFunction, testTitle, options) {
            this.sampleResults.length = 0;
            if (!options)
                options = this.defaultOptions;
            var sampleCount = 0;
            var testStartTime = LZUTF8.Timer.getTimestamp();
            do {
                // Setup
                if (this.benchmarkContext.beforeEach)
                    this.benchmarkContext.beforeEach();
                // Actual run
                var sampleStartTime = LZUTF8.Timer.getTimestamp();
                benchmarkedFunction.call(this.benchmarkContext);
                var sampleEndTime = LZUTF8.Timer.getTimestamp();
                //
                // Teardown
                if (this.benchmarkContext.afterEach)
                    this.benchmarkContext.afterEach();
                // Calcs
                var sampleElapsedTime = sampleEndTime - sampleStartTime;
                this.sampleResults.push(sampleElapsedTime);
                //console.log("Iteration " + iterationCount + ": " + iterationElapsedTime.toFixed(3));
                sampleCount++;
            } while (sampleCount < options.maximumSamples && LZUTF8.Timer.getTimestamp() - testStartTime < options.maximumTime);
            // calculate result time
            var result = this.getResult();
            var message = testTitle + ": " + result.toFixed(3) + "ms (" + (1000 / result).toFixed(0) + " runs/s, " + sampleCount + " sampled)";
            LZUTF8.log(message, true);
            return result;
        };
        Benchmark.prototype.runAll = function (excludeList) {
            var excludedFunctions = ["beforeEach", "afterEach", "constructor"];
            excludedFunctions = excludedFunctions.concat(excludeList);
            var propertyList = Object.getOwnPropertyNames(Object.getPrototypeOf(this.benchmarkContext));
            for (var _i = 0, propertyList_1 = propertyList; _i < propertyList_1.length; _i++) {
                var propertyName = propertyList_1[_i];
                if ((typeof this.benchmarkContext[propertyName] === "function") && excludedFunctions.indexOf(propertyName) === -1 && excludedFunctions.indexOf(this.benchmarkContext[propertyName]) === -1)
                    this.run(this.benchmarkContext[propertyName], propertyName);
            }
        };
        Benchmark.prototype.getResult = function () {
            this.sampleResults.sort(function (a, b) { return a - b; });
            return this.sampleResults[Math.floor(this.sampleResults.length / 2)];
        };
        Benchmark.run = function (testFunction, testTitle, context, options) {
            if (context === void 0) { context = {}; }
            var benchmark = new Benchmark(context);
            return benchmark.run(testFunction, testTitle, options);
        };
        return Benchmark;
    }());
    LZUTF8.Benchmark = Benchmark;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressionBenchmarks = /** @class */ (function () {
        function CompressionBenchmarks() {
        }
        CompressionBenchmarks.prototype.beforeEach = function () {
        };
        CompressionBenchmarks.prototype.compressHindiText = function () {
            this.compressedString = LZUTF8.compress(LZUTF8.TestData.hindiText);
        };
        CompressionBenchmarks.prototype.decompressHindiText = function () {
            LZUTF8.decompress(this.compressedString);
        };
        CompressionBenchmarks.prototype.compressChineseText = function () {
            this.compressedString = LZUTF8.compress(LZUTF8.TestData.chineseText);
        };
        CompressionBenchmarks.prototype.decompressChineseText = function () {
            LZUTF8.decompress(this.compressedString);
        };
        CompressionBenchmarks.prototype.compressLoremIpsum = function () {
            this.compressedString = LZUTF8.compress(LZUTF8.TestData.loremIpsum);
        };
        CompressionBenchmarks.prototype.decompressLoremIpsum = function () {
            LZUTF8.decompress(this.compressedString);
        };
        CompressionBenchmarks.start = function () {
            var bench = new CompressionBenchmarks();
            var benchmark = new LZUTF8.Benchmark(bench, { maximumSamples: 1000, maximumTime: 200, logToDocument: true });
            benchmark.runAll([]);
        };
        return CompressionBenchmarks;
    }());
    LZUTF8.CompressionBenchmarks = CompressionBenchmarks;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var EncodingBenchmarks = /** @class */ (function () {
        function EncodingBenchmarks() {
            this.randomUTF16String = LZUTF8.getRandomUTF16StringOfLength(250000);
            this.randomBytes = LZUTF8.encodeUTF8(this.randomUTF16String);
            //log(this.randomBytes.length);
        }
        EncodingBenchmarks.prototype.encodeBase64 = function () {
            this.base64String = LZUTF8.encodeBase64(this.randomBytes);
        };
        EncodingBenchmarks.prototype.decodeBase64 = function () {
            LZUTF8.decodeBase64(this.base64String);
        };
        EncodingBenchmarks.prototype.encodeBinaryString = function () {
            this.binaryString = LZUTF8.encodeBinaryString(this.randomBytes);
        };
        EncodingBenchmarks.prototype.decodeBinaryString = function () {
            LZUTF8.decodeBinaryString(this.binaryString);
        };
        EncodingBenchmarks.prototype.encodeUTF8 = function () {
            this.encodedRandomString = LZUTF8.encodeUTF8(this.randomUTF16String);
        };
        EncodingBenchmarks.prototype.decodeUTF8 = function () {
            LZUTF8.decodeUTF8(this.encodedRandomString);
        };
        EncodingBenchmarks.start = function () {
            var bench = new EncodingBenchmarks();
            var benchmark = new LZUTF8.Benchmark(bench, { maximumSamples: 1000, maximumTime: 200, logToDocument: true });
            benchmark.runAll([]);
        };
        return EncodingBenchmarks;
    }());
    LZUTF8.EncodingBenchmarks = EncodingBenchmarks;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CLI;
    (function (CLI) {
        CLI.start = function () {
            var compareByteArraysAndLogToConsole = function (array1, array2) {
                if (array1.length !== array2.length) {
                    LZUTF8.log("Arrays did not match: Array 1 length is " + array1.length + ", Array 2 length is " + array2.length);
                    return false;
                }
                for (var i = 0; i < array1.length; i++)
                    if (array1[i] !== array1[i]) {
                        LZUTF8.log("Arrays did not match: array1[" + i + "] === " + array1[i] + ", array2[" + i + "] === " + array2[i]);
                        return false;
                    }
                return true;
            };
            var NodeFS = require("fs");
            function getFileSize(filePath) {
                return NodeFS.statSync(filePath).size;
            }
            var cmdArguments = process.argv.slice(2);
            var command = cmdArguments[0];
            var sourceFilePath = cmdArguments[1];
            var destinationFilePath = cmdArguments[2];
            if (cmdArguments.length == 0) {
                LZUTF8.log("Usage: node lzutf8-cli [command] [source] [destination?]");
                LZUTF8.log("");
                LZUTF8.log("Commands:");
                LZUTF8.log("  c   Compress [source] to [destination]");
                LZUTF8.log("  d   Decompress [source] to [destination]");
                LZUTF8.log("  t   Test compression and decompression correctness using [source]");
                process.exit(1);
            }
            if (!sourceFilePath) {
                LZUTF8.log("No source file specified");
                process.exit(1);
            }
            if (!NodeFS.existsSync(sourceFilePath)) {
                LZUTF8.log("Source file \"" + sourceFilePath + "\" doesn't exist");
                process.exit(1);
            }
            if (command == "c") {
                if (!destinationFilePath)
                    destinationFilePath = sourceFilePath + ".lzutf8";
                var sourceReadStream = NodeFS.createReadStream(sourceFilePath);
                var destWriteStream = NodeFS.createWriteStream(destinationFilePath);
                var compressionStream = LZUTF8.createCompressionStream();
                var timer_1 = new LZUTF8.Timer();
                var resultStream = sourceReadStream.pipe(compressionStream).pipe(destWriteStream);
                resultStream.on("close", function () {
                    var elapsedTime = timer_1.getElapsedTime();
                    LZUTF8.log("Compressed " + getFileSize(sourceFilePath) + " to " + getFileSize(destinationFilePath) + " bytes in " + elapsedTime.toFixed(2) + "ms (" + (getFileSize(sourceFilePath) / 1000000 / elapsedTime * 1000).toFixed(2) + "MB/s).");
                });
            }
            else if (command == "d") {
                if (!destinationFilePath) {
                    LZUTF8.log("No destination file path specified");
                    process.exit(1);
                }
                var sourceReadStream = NodeFS.createReadStream(sourceFilePath);
                var destWriteStream = NodeFS.createWriteStream(destinationFilePath);
                var decompressionStream = LZUTF8.createDecompressionStream();
                var timer_2 = new LZUTF8.Timer();
                var resultStream = sourceReadStream.pipe(decompressionStream).pipe(destWriteStream);
                resultStream.on("close", function () {
                    var elapsedTime = timer_2.getElapsedTime();
                    LZUTF8.log("Decompressed " + getFileSize(sourceFilePath) + " to " + getFileSize(destinationFilePath) + " bytes in " + elapsedTime.toFixed(2) + "ms (" + (getFileSize(destinationFilePath) / 1000000 / elapsedTime * 1000).toFixed(2) + "MB/s).");
                });
            }
            else if (command == "t") {
                var temporaryFilePath_1 = sourceFilePath + "." + (Math.random() * Math.pow(10, 8)).toFixed(0);
                var sourceReadStream = NodeFS.createReadStream(sourceFilePath);
                var destWriteStream = NodeFS.createWriteStream(temporaryFilePath_1);
                var compressionStream = LZUTF8.createCompressionStream();
                var decompressionStream = LZUTF8.createDecompressionStream();
                var timer_3 = new LZUTF8.Timer();
                var compressionCorrectnessTestStream = sourceReadStream.pipe(compressionStream).pipe(decompressionStream).pipe(destWriteStream);
                compressionCorrectnessTestStream.on("close", function () {
                    var sourceFileContent = LZUTF8.BufferTools.bufferToUint8Array(NodeFS.readFileSync(sourceFilePath));
                    var temporaryFileContent = LZUTF8.BufferTools.bufferToUint8Array(NodeFS.readFileSync(temporaryFilePath_1));
                    NodeFS.unlinkSync(temporaryFilePath_1);
                    var result = compareByteArraysAndLogToConsole(sourceFileContent, temporaryFileContent);
                    if (result == true)
                        LZUTF8.log("Test result: *Passed* in " + timer_3.getElapsedTime().toFixed(2) + "ms");
                    else
                        LZUTF8.log("Test result: *Failed* in " + timer_3.getElapsedTime().toFixed(2) + "ms");
                });
            }
            else {
                LZUTF8.log("Invalid command: \"" + command + "\"");
                process.exit(1);
            }
        };
    })(CLI = LZUTF8.CLI || (LZUTF8.CLI = {}));
})(LZUTF8 || (LZUTF8 = {}));
//# sourceMappingURL=lzutf8.js.map