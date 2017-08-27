# About me

I'm a software developer, specializing in **library and server** development. My current area of interest is mainly the **web** platform.

I believe my style of work may be characterized as being very **thorough and self-disciplined**. I strive for precision, clarity, readability, simplicity and testability of source code and program organization.

My recent work (during the past 4 years or so) has been mostly concentrated on intensive, **independent development** of permissively licensed software libraries and server software. An overview of these projects, their associated skill-sets, as well as a comprehensive set of **links to real-world source code**, is included.

**Contact info**:
```
Rotem Dan <rotemdan@gmail.com>
(+972) 52 437 5345
Tel Aviv, Israel
```

## Particular areas of knowledge or of special interest

* **Internet protocol suite**: detailed technical knowledge of the [HTTP](https://en.wikipedia.org/wiki/Http), [TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) and [UDP](https://en.wikipedia.org/wiki/User_Datagram_Protocol) protocols and varying conceptual familiarity with more complex or recent protocols like [SSL/TLS handshake](https://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_handshake)s, [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2), [QUIC](https://en.wikipedia.org/wiki/QUIC), [WebRTC and its data channels](https://www.html5rocks.com/en/tutorials/webrtc/datachannels/), [NAT Traversal](https://en.wikipedia.org/wiki/NAT_traversal), peer-to-peer constructs like [DHT](https://en.wikipedia.org/wiki/Distributed_hash_table)s and networks like [BitTorrent](https://en.wikipedia.org/wiki/BitTorrent), [IPFS](https://en.wikipedia.org/wiki/InterPlanetary_File_System), [Tor](https://en.wikipedia.org/wiki/Tor_(anonymity_network)).
* **Applied Cryptography and Information Security**: functional understanding and capacity to synthesize secure protocols and schemes using primitives such as [symmetric](https://en.wikipedia.org/wiki/Symmetric-key_algorithm) and [public key schemes](https://en.wikipedia.org/wiki/Public-key_cryptography), [secure hashes](https://en.wikipedia.org/wiki/Cryptographic_hash_function) and [MAC](https://en.wikipedia.org/wiki/Message_authentication_code)s, [digital signatures](https://en.wikipedia.org/wiki/Digital_signature), [Diffie-Hellman key exchange](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange), and [Merkle trees](https://en.wikipedia.org/wiki/Merkle_tree). Familiarity with higher level cryptographic protocols such as [OTR](https://en.wikipedia.org/wiki/Off-the-Record_Messaging) and [Signal](https://en.wikipedia.org/wiki/Signal_Protocol) secure messaging protocols, [cryptocurrencies](https://en.wikipedia.org/wiki/Cryptocurrencies) and [blockchains](https://en.wikipedia.org/wiki/Blockchain) (e.g. [Bitcoin](https://en.wikipedia.org/wiki/Bitcoin), [Ethereum](https://en.wikipedia.org/wiki/Ethereum)).
* **Applicative data structures, algorithms and design patterns**: efficient implementation of common data structures and their corresponding [persistent variants](https://en.wikipedia.org/wiki/Persistent_data_structure), data and operational processing algorithms like searching and indexing, task scheduling and concurrency control, resource management, encoding and parsing. As well as writing auxiliary tools such as testing and benchmarking frameworks, creating wrappers and designing programmer-friendly APIs and abstractions.
* **Programming language design and functional programming concepts**: conceptual familiarity with [type systems](https://en.wikipedia.org/wiki/Type_system) and [subtyping](https://en.wikipedia.org/wiki/Subtyping), [polymorphism](https://en.wikipedia.org/wiki/Polymorphism_(computer_science)) and [variance](https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)), [contract programming](https://en.wikipedia.org/wiki/Design_by_contract), [OO](https://en.wikipedia.org/wiki/Object-oriented_programming) and application of functional constructs such as [higher-order functions](https://en.wikipedia.org/wiki/Higher-order_function), [immutability](https://en.wikipedia.org/wiki/Immutable_object) and [pure functions](https://en.wikipedia.org/wiki/Pure_function), [currying](https://en.wikipedia.org/wiki/Currying) and [monadic composition](https://en.wikipedia.org/wiki/Monad_(functional_programming)) into day-to-day programming.


## Programming languages and platforms (in order of proficiency)

* JavaScript (ES6+)/TypeScript and the Node.js standard library (advanced)
* Go and its standard library (advanced)
* HTML(5), CSS, LESS (intermediate-advanced)
* C#/.NET (intermediate-advanced)
* SQL (intermediate)
* Haskell, Scala, Python (basic-intermediate, syntax and concepts only)

## Major projects

During the past 4 years I've designed and developed an open-source data framework broadly titled **[ZincBase](https://github.com/zincbase)**, split into:

* **[ZincDB](https://github.com/zincbase/zincdb)**: A JavaScript **database and real-time synchronization library** which includes features like offline storage, background execution within workers, hierarchal data organization, end-to-end encryption (TypeScript, ~16,000 LOC, MIT License).
* **[ZincServer](https://github.com/zincbase/zincserver)**: Independent server component which bundles a custom on-disk **transactional storage engine** with a  **high-performance HTTP server** (Go, ~6,000 LOC, Apache 2.0 License).
* **[ZincEditor](https://github.com/zincbase/zinceditor)** is a corresponding web-based, real-time **database editor** in an early stage of development and is based on a React/Redux like architecture (TypeScript, ~500 LOC without shared library code, MIT License).

Their combined feature-set **intersects with** software and cloud services like [**Firebase**](https://firebase.google.com/) (real-time single and multi-user data sync), [**PouchDB**](https://pouchdb.com/) (in-browser and offline storage abstractions) and [**Apache Kafka**](https://kafka.apache.org/) (real-time server-side message storage and dispatch). The project has been published but should be seen as mostly experimental in nature. The client-side library is planned to be modularized into multiple smaller independent libraries, which would be gradually adapted and prepared for production use.

**[LZ-UTF8](https://github.com/rotemdan/lzutf8.js)** (TypeScript ~4,000 LOC) is a high-performance **string compression library** and stream format. The library is in active use.

## Development skills, illustrated through real-world source code

_(Links follow to TypeScript code within the [ZincDB repository](https://github.com/zincbase/zincdb)):_

* Managing [complex/nested asynchronous control flow using async/await](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/LocalDBOperations.ts#L450).
* Devising methods and protocols for [real-time data synchronization](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/LocalDB.ts#L367) and [conflict resolution](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/LocalDB.ts#L527).
* An [abstract keyed storage interface](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/Storage%20Adapters/StorageAdapter.ts#L3) that transparently plugs-in to various storage adapters. Currently supports [IndexedDB](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/Storage%20Adapters/IndexedDBAdapter.ts#L3), [WebSQL](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/Storage%20Adapters/WebSQLAdapter.ts#L5), [Web Storage](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/Storage%20Adapters/WebStorageAdapter.ts#L11) (i.e. LocalStorage/SessionStorage), [Node-SQLite](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/Storage%20Adapters/NodeSQLiteAdapter.ts#L6) (Node.js library), [LevelUP](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/Storage%20Adapters/LevelUpAdapter.ts#L5) (Node.js library), [In-memory](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/Storage%20Adapters/InMemoryAdapter.ts#L3).
* An abstract [dispatcher module](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Dispatcher/TokenizedDispatcher.ts#L1), which is used to enable ZincDB to transparently exchange messages with various types of workers ([Dedicated workers](https://github.com/zincbase/zincdb/blob/f6d8d232c6789ef46b682a4648a394c00f60dddb/src/DB/LocalDB/Workers/LocalDBWebWorker.ts#L5), [Node.js forked processes](https://github.com/zincbase/zincdb/blob/38187067d008729c2ea0473d5316a5877a712bd0/src/DB/LocalDB/Workers/LocalDBNodeWorker.ts#L5), [virtual workers](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Dispatcher/MethodDispatcher.ts#L2), Shared and Service workers (planned)).
* A [unified HTTP request wrapper](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Base/HTTPClient.ts#L2) that makes use of either [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest), [Fetch API](https://developer.mozilla.org/en/docs/Web/API/Fetch_API) or Node's [`http`](https://nodejs.org/api/http.html) and [`https`](https://nodejs.org/api/https.html) modules, depending on availability.
* Implementing [deep object tree query and manipulation](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/LocalDBOperations.ts#L273) using [keypath specifiers](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Keypath/Keypath.ts#L2) with support for [multi-operation transactions](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/LocalDBTransaction.ts#L3).
* JS object tree iteration tools (with cycle detection): [deep cloning](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/ObjectTools/deepClone.ts#L4), [deep comparison](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/ObjectTools/deepCompare.ts#L3), [deep search](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/ObjectTools/deepContains.ts#L3), [deep reducer](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/ObjectTools/deepReduce.ts#L3).
<!--
* Optimized, pure JavaScript implementations of [Base64](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Encoding/Base64.ts#L3), [Hexadecimal](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Encoding/Hex.ts#L3), [UTF-8](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Encoding/UTF8.ts#L3) and original encodings like [OmniBinary](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Encoding/OmniBinary.ts#L3) and [OmniJson](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Encoding/OmniJson.ts#L3) (which extends JSON to serialize additional JS types, bringing it closer to a full structural clone) and [RegExp serialization](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Encoding/RegExpString.ts#L3).
-->

<!--
* Efficient [parser and serializer for keypath strings](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Keypath/Keypath.ts#L2) and [various operations involving them](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Keypath/Keypath.ts#L83).
* [Promise queue](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Scheduling/PromiseQueue.ts#L5), used to serialize multiple independent asynchronous operations and other scheduling utilities.
* [High-resolution timer and monotonic time source](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Scheduling/Timer.ts#L4) that works across a large variety of browsers/platforms.
* A fast [seeded congruential pseudo-random number generator](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Random/SeededRandom.ts#L9) (mostly used to ensure reproducibility of randomized tests).
* A simple [micro-benchmarking tool](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/benchmarks/src/Benchmark.ts#L2).
-->

_(Links follow to Go code within the [ZincServer repository](https://github.com/zincbase/zincserver)):_

* Controlling [complex concurrent execution sequences](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/DatastoreOperations.go#L64) using various synchronization primitives, such as (RW) mutexes, monitors, semaphores, channels, optimistic CC, persistent data structures.
* Designing a [concurrent data architecture](https://github.com/zincbase/zincserver/blob/master/docs/Technical%20overview.md#managing-concurrency-between-readers-writers-and-compactions) allowing true parallel datastore reads, writes and compactions enabled through a combination of [append only files](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/DatastoreOperations.go#L284), [non-destructive disk operations](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/FileSystemSafeWin.go#L12) and [persistent, multi-view indexes and state descriptors](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/DatastoreState.go#L9).
* Designing a system for [live server reconfiguration](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/DatastoreConfigSnapshot.go#L6) using immutable snapshots.
* Implementing server-side real-time publish/subscribe through [websockets](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/ServerDatastoreHandler.go#L324) and [long polling](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/ServerDatastoreHandler.go#L278).
* Creating [memory efficient and lazy iterators](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/EntryStreamIterator.go#L7), binary [serializers and deserializers](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/EntrySerializer.go#L1).
* Formulating [very minimalistic REST API](https://github.com/zincbase/zincserver/blob/master/docs/REST%20API%20reference.md)s and [binary transmission/storage formats](https://github.com/zincbase/zincserver/blob/master/docs/Binary%20format%20specification.md).

<!--
* Considerations for [security and user authorization](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/ServerDatastoreHandler.go#L154).
* In-memory caching and [read prefetching](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/PrefetchingReaderAt.go#L9).
* Implementing [reference counted file descriptor management](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/FileDescriptorReferenceCounter.go#L10) to ensure deterministic release of file descriptors.
* Dealing with more subtle aspects of the HTTP standard like [CORS](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/ServerDatastoreHandler.go#L75), browser caching, chunked-transfers, range-requests, special response codes/states and compressed responses.

* Investigating very technical and [hard-to-find details about the atomicity and crash-resistance of various file systems operation sequences](https://www.usenix.org/node/186195) and working around [subtle differences between various platforms and operating systems](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/OpenWithDeleteSharingWin.go#L11).
-->

_(Links follow to TypeScript code within the [ZincEditor codebase](https://github.com/zincbase/zincdb/tree/master/editor),
note the editor is still at a [relatively early stage](https://github.com/zincbase/zinceditor/issues) at this point):_

* Defining (mostly) pure [React.js components](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/editor/src/Editor/Components.tsx#L2).
* Implementing [a unidirectional dataflow](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/editor/src/Editor/Editor.tsx#L27) inspired by Redux, making use of a [custom immutable tree implementation](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Keypath/Keypath.ts#L197).

_(Links follow to TypeScript code within the [LZ-UTF8 repository](https://github.com/rotemdan/lzutf8.js)):_

* An optimized LZ77 [compressor](https://github.com/rotemdan/lzutf8.js/blob/8f9df05f3aec86df29ea1f58e169b6f4b1d485c7/src/Compression/Compressor.ts#L35) and [decompressor](https://github.com/rotemdan/lzutf8.js/blob/8f9df05f3aec86df29ea1f58e169b6f4b1d485c7/src/Decompression/Decompressor.ts#L17).
* A [cache-locality optimized custom hash table based on open-addressed compacting buckets](https://github.com/rotemdan/lzutf8.js/blob/8f9df05f3aec86df29ea1f58e169b6f4b1d485c7/src/Compression/CompressorCustomHashTable.ts#L16).

_(Links follow to TypeScript code within the [speak-the-web repository]((https://github.com/rotemdan/speak-the-web)), a **screen reader browser extension**):_

* Using jQuery to [scan through DOM node heritage to locate suitable candidates for readable text containers](https://github.com/rotemdan/speak-the-web/blob/b8a7dbd25e405b6c24c391dd310045ad4dbece47/src/speak-the-web.user.ts#L111).
* Various routines for [recursively iterating into DOM nodes and calculation of bounding viewport rectangles for text node unions](https://github.com/rotemdan/speak-the-web/blob/b8a7dbd25e405b6c24c391dd310045ad4dbece47/src/DomUtils.ts#L25) (used to highlight currently spoken word).

## Testing and verification skills, illustrated

Development of these projects required very extensive and sophisticated testing procedures, which includes:

_(Links follow to test code in various repositories)_

* Writing many [parameterized](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/LocalDB.spec.ts#L6) ([#2](https://github.com/rotemdan/lzutf8.js/blob/e90225d5f938240699d0bc99a8c935f9167b5850/tests/src/CompressionTests.spec.ts#L217)), [randomized](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/DB/LocalDB/LocalDB.spec.ts#L132) ([#2](https://github.com/rotemdan/lzutf8.js/blob/e90225d5f938240699d0bc99a8c935f9167b5850/tests/src/CompressionTests.spec.ts#L80)) and [fuzz](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/ServerDatastoreHandler_error_test.go#L158) test suites.
* Applying various verification techniques like [pairing to reference/simplified algorithm implementations](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Cryptography/AES_CBC.spec.ts#L7) ([#2](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Encoding/UTF8.spec.ts#L5)).
* Development of a [specialized state simulator](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/ServerDatastoreHandler_simulator_test.go#L4) for [intermediate verification of random sequences of REST operations](https://github.com/zincbase/zincserver/blob/56fb15e97d18696372edfb3e4a807150c27ff10f/ServerDatastoreHandler_operations_test.go#L225).
* Creating a [random JS object tree generator](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Random/RandomObjectGenerator.ts#L6).
* Generating test cases for [boundary values](https://en.wikipedia.org/wiki/Boundary-value_analysis) ([planned](https://github.com/zincbase/zincdb/issues/70)).

(Testing frameworks used: JS: [Mocha](https://github.com/mochajs/mocha)/[Expectations.js](https://github.com/spmason/expectations). Go: [Ginkgo](https://github.com/onsi/ginkgo)/[Gomega](https://github.com/onsi/gomega))

## Example bug reports to third parties

_(Link follows to Microsoft Edge/IE issue tracker):_

* Analyzing and reporting a [very difficult to reproduce regression bug](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9243268/) causing workers to become unresponsive to messages, that was apparently introduced due to a security update to both Edge and IE11 (unfortunately still not fixed in IE).

_(Link follows to the TypeScript issue tracker):_

* Tracking and reporting a [significant emitter bug](https://github.com/Microsoft/TypeScript/issues/14357) breaking async loops when executed over polyfilled Promise implementation (now fixed).

<!--
* Native JavaScript implementations (automatically substituted by Node.js [`crypto`](https://nodejs.org/api/crypto.html) or WebCrypto if available/applicable) of [AES-128-CBC](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Cryptography/AES_CBC_JS.ts#L3), [AES-128-CTR](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Cryptography/AES_CTR_JS.ts#L3), [PKCS7](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Cryptography/PKCS7.ts#L3), [SHA-1](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Cryptography/SHA1.ts#L3) (core implementations of AES and SHA-1 transforms are adapted from public domain and permissively licensed third-party code), as well as a [cryptographically secure pseudo-random generator based on a simplified version of the Fortuna algorithm](https://github.com/zincbase/zincdb/blob/3bdfa687759b75a2306442fa4780146fcb67053c/src/Library/Cryptography/Random.ts#L86).
-->
