var App;
(function (App) {
    var AppEvent = (function () {
        function AppEvent() {
            this.handlers = [];
        }
        AppEvent.prototype.trigger = function (eventArgs) {
            for (var i = 0; i < this.handlers.length; i++)
                this.handlers[i](eventArgs);
        };
        AppEvent.prototype.addHandler = function (handler) {
            if (!handler)
                throw new TypeError("AppEvent.addHandler: undefined of null handler");
            this.handlers.push(handler);
        };
        AppEvent.prototype.addOneTimeHandler = function (handler) {
            var _this = this;
            if (!handler)
                throw new TypeError("AppEvent.addOneTimeHandler: undefined of null handler");
            var wrappedHandler = function (eventArgs) {
                handler(eventArgs);
                _this.removeHandler(wrappedHandler);
            };
            this.handlers.push(wrappedHandler);
        };
        AppEvent.prototype.removeHandler = function (handler) {
            if (!handler)
                throw new TypeError("AppEvent.removeHandler: undefined of null handler");
            var index = this.handlers.indexOf(handler);
            if (index >= 0)
                this.handlers.splice(index, 1);
        };
        AppEvent.prototype.removeAllHandlers = function () {
            this.handlers.length = 0;
        };
        AppEvent.prototype.containsHandler = function (handler) {
            if (!handler)
                throw new TypeError("AppEvent.containsHandler: undefined of null handler");
            return this.handlers.indexOf(handler) >= 0;
        };
        Object.defineProperty(AppEvent.prototype, "hasHandlers", {
            get: function () {
                return this.handlers.length > 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AppEvent.prototype, "handlerCount", {
            get: function () {
                return this.handlers.length;
            },
            enumerable: true,
            configurable: true
        });
        return AppEvent;
    })();
    App.AppEvent = AppEvent;
})(App || (App = {}));
var App;
(function (App) {
    var DOMSelection = (function () {
        function DOMSelection(selector) {
            if (selector.jquery)
                this.selection = selector;
            else
                this.selection = jQuery(selector);
        }
        DOMSelection.prototype.select = function (selector) {
            return new DOMSelection(this.selection.find(selector));
        };
        DOMSelection.prototype.forEach = function (action) {
            for (var i = 0; i < this.selection.length; i++)
                action(new DOMSelection(this.selection.eq(i)));
        };
        DOMSelection.prototype.forEachIndex = function (action) {
            for (var i = 0; i < this.selection.length; i++)
                action(new DOMSelection(this.selection.eq(i)), i);
        };
        DOMSelection.prototype.where = function (predicate) {
            return new DOMSelection(this.selection.filter(function (index, element) { return predicate(new DOMSelection(this)); }));
        };
        DOMSelection.prototype.toSelectorArray = function () {
            var selectorArray = new Array();
            this.forEach(function (element) { return selectorArray.push(element); });
            return selectorArray;
        };
        DOMSelection.prototype.getAttribute = function (attributeName) {
            return this.selection.attr(attributeName);
        };
        DOMSelection.prototype.setAttribute = function (attributeName, value) {
            this.selection.attr(attributeName, value);
        };
        DOMSelection.prototype.removeAttribute = function (attributeName) {
            this.selection.removeAttr(attributeName);
        };
        DOMSelection.prototype.getProperty = function (propertyName) {
            return this.selection.prop(propertyName);
        };
        DOMSelection.prototype.setProperty = function (propertyName, value) {
            return this.selection.prop(propertyName, value);
        };
        DOMSelection.prototype.addClass = function (className) {
            this.selection.addClass(className);
        };
        DOMSelection.prototype.removeClass = function (className) {
            this.selection.removeClass(className);
        };
        DOMSelection.prototype.toggleClass = function (className) {
            this.selection.toggleClass(className);
        };
        DOMSelection.prototype.hasClass = function (className) {
            return this.selection.hasClass(className);
        };
        DOMSelection.prototype.getStyle = function (propertyName) {
            return this.selection.css(propertyName);
        };
        DOMSelection.prototype.setStyle = function (propertyName, value) {
            this.selection.css(propertyName, value);
        };
        DOMSelection.prototype.getInnerHTML = function () {
            return this.selection.html();
        };
        DOMSelection.prototype.setInnerHTML = function (html) {
            this.selection.html(html);
        };
        DOMSelection.prototype.getOuterHTML = function () {
            return this.selection[0].outerHTML;
        };
        DOMSelection.prototype.setOuterHTML = function (html) {
            this.selection.each(function (index, element) { (element).outerHTML = html; });
        };
        DOMSelection.prototype.append = function (content) {
            if (content instanceof DOMSelection)
                this.selection.append(content.selection);
            else
                this.selection.append(content);
        };
        DOMSelection.prototype.prepend = function (content) {
            if (content instanceof DOMSelection)
                this.selection.prepend(content.selection);
            else
                this.selection.prepend(content);
        };
        DOMSelection.prototype.insertAfter = function (target) {
            this.selection.insertAfter(target.selection);
        };
        DOMSelection.prototype.insertBefore = function (target) {
            this.selection.insertBefore(target.selection);
        };
        DOMSelection.prototype.getText = function () {
            return this.selection.text();
        };
        DOMSelection.prototype.getTextIncludingLineBreaks = function () {
            var htmlFragment = DOM.select('<div>' + this.getInnerHTML().replace(/<br>/g, "&#10;") + '</div>');
            return htmlFragment.getText();
        };
        DOMSelection.prototype.getValue = function () {
            return this.selection.val();
        };
        DOMSelection.prototype.setValue = function (newValue) {
            this.selection.val(newValue);
        };
        DOMSelection.prototype.remove = function () {
            this.selection.remove();
        };
        DOMSelection.prototype.setData = function (key, value) {
            this.selection.data(key, value);
        };
        DOMSelection.prototype.getData = function (key) {
            return this.selection.data(key);
        };
        DOMSelection.prototype.removeData = function (key, value) {
            this.selection.removeData(key);
        };
        DOMSelection.prototype.addEventHandler = function (eventNames, handler, selector) {
            var wrappedHandler = function (e) { return handler(e, new DOMSelection(e.target)); };
            this.selection.on(eventNames, selector, wrappedHandler);
        };
        DOMSelection.prototype.addOneTimeEventHandler = function (eventNames, handler, selector) {
            var wrappedHandler = function (e) { return handler(e, new DOMSelection(e.target)); };
            this.selection.one(eventNames, selector, wrappedHandler);
        };
        DOMSelection.prototype.removeEventHandler = function (eventNames, selector, handler) {
            this.selection.off(eventNames, selector, handler);
        };
        DOMSelection.prototype.focus = function () {
            this.selection.focus();
        };
        DOMSelection.prototype.blur = function () {
            this.selection.blur();
        };
        DOMSelection.prototype.click = function () {
            this.selection.click();
        };
        DOMSelection.prototype.clone = function () {
            return new DOMSelection(this.selection.clone());
        };
        DOMSelection.prototype.getIndex = function (selector) {
            return this.selection.index(selector);
        };
        DOMSelection.prototype.getParent = function (selector) {
            return new DOMSelection(this.selection.parent(selector));
        };
        DOMSelection.prototype.getAncestors = function (selector) {
            return new DOMSelection(this.selection.parents(selector));
        };
        DOMSelection.prototype.getPredecessor = function (selector) {
            return new DOMSelection(this.selection.prev(selector));
        };
        Object.defineProperty(DOMSelection.prototype, "length", {
            get: function () {
                return this.selection.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DOMSelection.prototype, "exists", {
            get: function () {
                return this.selection.length > 0;
            },
            enumerable: true,
            configurable: true
        });
        DOMSelection.prototype.get = function (index) {
            return this.selection.get(index);
        };
        DOMSelection.prototype.is = function (selector) {
            return this.selection.is(selector);
        };
        DOMSelection.prototype.getOuterWidth = function () {
            return this.selection.outerWidth(true);
        };
        DOMSelection.prototype.getOuterHeight = function () {
            return this.selection.outerHeight(true);
        };
        DOMSelection.prototype.getWidth = function () {
            return this.selection.width();
        };
        DOMSelection.prototype.setWidth = function (value) {
            this.selection.width(value);
        };
        DOMSelection.prototype.getHeight = function () {
            return this.selection.height();
        };
        DOMSelection.prototype.setHeight = function (value) {
            this.selection.height(value);
        };
        DOMSelection.prototype.getPositionRelativeToDocument = function () {
            return this.selection.offset();
        };
        DOMSelection.prototype.setPositionRelativeToDocument = function (position) {
            this.selection.offset(position);
        };
        DOMSelection.prototype.getPositionRelativeToParent = function () {
            return this.selection.position();
        };
        DOMSelection.prototype.getNextSibling = function () {
            return new DOMSelection(this.selection.next());
        };
        DOMSelection.prototype.getChildren = function () {
            return new DOMSelection(this.selection.children());
        };
        DOMSelection.prototype.getScrollLeft = function () {
            return this.selection.scrollLeft();
        };
        DOMSelection.prototype.setScrollLeft = function (value) {
            this.selection.scrollLeft(value);
        };
        DOMSelection.prototype.getScrollTop = function () {
            return this.selection.scrollTop();
        };
        DOMSelection.prototype.setScrollTop = function (value) {
            this.selection.scrollTop(value);
        };
        DOMSelection.prototype.focusAndSetCaretPositionToContentEnd = function () {
            if (this.is("input")) {
                this.focus();
                var value = this.getValue();
                this.setValue("");
                this.setValue(value);
                return;
            }
            var element = this.selection.get(0);
            element.focus();
            var range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        };
        DOMSelection.prototype.triggerEvent = function (name, parameters) {
            this.selection.trigger(name, parameters);
        };
        Object.defineProperty(DOMSelection.prototype, "jqueryObject", {
            get: function () {
                return this.selection;
            },
            enumerable: true,
            configurable: true
        });
        return DOMSelection;
    })();
    App.DOMSelection = DOMSelection;
    var DOM = (function () {
        function DOM() {
        }
        Object.defineProperty(DOM, "window", {
            get: function () {
                return new DOMSelection(window);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DOM, "document", {
            get: function () {
                return new DOMSelection(document);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DOM, "head", {
            get: function () {
                return new DOMSelection("head");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DOM, "body", {
            get: function () {
                return DOM.select("body");
            },
            enumerable: true,
            configurable: true
        });
        DOM.select = function (selector) {
            return new DOMSelection(selector);
        };
        DOM.onReady = function (handler) {
            jQuery(window).ready(handler);
        };
        DOM.onLoad = function (handler) {
            jQuery(window).load(handler);
        };
        DOM.addStylesheet = function (stylesheet) {
            DOM.head.append("<style type='text/css'>" + stylesheet + "<style>");
        };
        return DOM;
    })();
    App.DOM = DOM;
})(App || (App = {}));
var App;
(function (App) {
    var Tools = (function () {
        function Tools() {
        }
        Tools.padTwoDigitNumber = function (num) {
            var numString = num.toString();
            if (numString.length === 1)
                return "0" + numString;
            else
                return numString;
        };
        Tools.formatUnixTimestampToShortDate = function (timestamp) {
            var dateString = "";
            if (typeof timestamp == "number") {
                var dateObject = new Date(timestamp);
                dateString = Tools.padTwoDigitNumber(dateObject.getUTCDate() + 1) + "/" + Tools.padTwoDigitNumber(dateObject.getUTCMonth() + 1) + "/" + dateObject.getUTCFullYear();
            }
            return dateString;
        };
        Tools.chooseMostAppropriateMagnitudeForValue = function (value, orderedMagnitudes) {
            if (orderedMagnitudes == null || orderedMagnitudes.length == 0)
                throw new Error("chooseMostAppropriateMagnitudeForValue: invalid parameter");
            if (value <= orderedMagnitudes[0])
                return orderedMagnitudes[0];
            for (var i = 1; i < orderedMagnitudes.length; i++)
                if (orderedMagnitudes[i] >= value)
                    return orderedMagnitudes[i - 1];
            return orderedMagnitudes[orderedMagnitudes.length - 1];
        };
        Tools.repeat = function (func, count) {
            for (var i = 0; i < count; i++)
                func(i);
        };
        Tools.parseQueryString = function (queryString) {
            var splitQueryString = queryString.split("&");
            var resultObject = {};
            for (var i = 0; i < splitQueryString.length; i++) {
                var splitParameter = splitQueryString[i].split("=");
                if (splitParameter[0] == "")
                    continue;
                if (splitParameter.length == 2)
                    resultObject[splitParameter[0]] = splitParameter[1];
                else if (splitParameter.length == 1)
                    resultObject[splitParameter[0]] = "";
            }
            return resultObject;
        };
        Tools.setStringCharacter = function (str, position, newCharacter) {
            return str.substr(0, position) + newCharacter + str.substr(position + 1);
        };
        return Tools;
    })();
    App.Tools = Tools;
})(App || (App = {}));
var App;
(function (App) {
    var OhmsLawCalculatorLogic = (function () {
        function OhmsLawCalculatorLogic() {
            this.reset();
        }
        OhmsLawCalculatorLogic.prototype.reset = function () {
            var _this = this;
            OhmsLawCalculatorLogic.variables.forEach(function (name) { return _this.setVariable(name, undefined); });
        };
        Object.defineProperty(OhmsLawCalculatorLogic.prototype, "hasAllValues", {
            get: function () {
                return (this.voltage != null || this.current != null || this.resistance != null || this.power != null);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OhmsLawCalculatorLogic.prototype, "isConsistent", {
            get: function () {
                if (!this.hasAllValues)
                    return false;
                var consistenencyResult = (this.voltage == this.current * this.resistance) &&
                    (this.current == this.voltage / this.resistance) &&
                    (this.resistance == this.voltage / this.current) &&
                    (this.power == this.voltage * this.current);
                return consistenencyResult;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OhmsLawCalculatorLogic.prototype, "numberOfKnownVariables", {
            get: function () {
                var _this = this;
                var count = 0;
                OhmsLawCalculatorLogic.variables.forEach(function (name) {
                    if (_this.getVariable(name) != null)
                        count++;
                });
                return count;
            },
            enumerable: true,
            configurable: true
        });
        OhmsLawCalculatorLogic.prototype.trySolvingAllVariables = function () {
            if (this.numberOfKnownVariables == 2) {
                if (this.voltage == null)
                    this.voltage = this.trySolvingForVoltage();
                if (this.current == null)
                    this.current = this.trySolvingForCurrent();
                if (this.resistance == null)
                    this.resistance = this.trySolvingForResistance();
                if (this.power == null)
                    this.power = this.trySolvingForPower();
                return true;
            }
            return false;
        };
        OhmsLawCalculatorLogic.prototype.trySolvingForVoltage = function () {
            var _this = this;
            return OhmsLawCalculatorLogic.getFirstValidResult(function () { return _this.current * _this.resistance; }, function () { return _this.power / _this.current; }, function () { return Math.sqrt(_this.power * _this.resistance); });
        };
        OhmsLawCalculatorLogic.prototype.trySolvingForCurrent = function () {
            var _this = this;
            return OhmsLawCalculatorLogic.getFirstValidResult(function () { return _this.voltage / _this.resistance; }, function () { return _this.power / _this.voltage; }, function () { return Math.sqrt(_this.power / _this.resistance); });
        };
        OhmsLawCalculatorLogic.prototype.trySolvingForResistance = function () {
            var _this = this;
            return OhmsLawCalculatorLogic.getFirstValidResult(function () { return _this.voltage / _this.current; }, function () { return _this.voltage * _this.voltage / _this.power; }, function () { return _this.power / _this.current * _this.current; });
        };
        OhmsLawCalculatorLogic.prototype.trySolvingForPower = function () {
            var _this = this;
            return OhmsLawCalculatorLogic.getFirstValidResult(function () { return _this.voltage * _this.current; }, function () { return _this.voltage * _this.voltage / _this.resistance; }, function () { return _this.current * _this.current * _this.resistance; });
        };
        OhmsLawCalculatorLogic.prototype.getVariable = function (name) {
            if (OhmsLawCalculatorLogic.variables.indexOf(name) === -1)
                throw "Invalid variable name '" + name + "' supplied";
            if (name == "voltage")
                return this.voltage;
            else if (name == "current")
                return this.current;
            else if (name == "resistance")
                return this.resistance;
            else if (name == "power")
                return this.power;
        };
        OhmsLawCalculatorLogic.prototype.setVariable = function (name, value) {
            if (OhmsLawCalculatorLogic.variables.indexOf(name) === -1)
                throw "Invalid variable name '" + name + "' supplied";
            if (name == "voltage")
                this.voltage = value;
            else if (name == "current")
                this.current = value;
            else if (name == "resistance")
                this.resistance = value;
            else if (name == "power")
                this.power = value;
        };
        OhmsLawCalculatorLogic.getFirstValidResult = function () {
            var functionsReturningANumber = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                functionsReturningANumber[_i - 0] = arguments[_i];
            }
            for (var i = 0; i < functionsReturningANumber.length; i++) {
                var result = functionsReturningANumber[i]();
                if (!isNaN(result))
                    return result;
            }
            return undefined;
        };
        OhmsLawCalculatorLogic.variables = ["voltage", "current", "resistance", "power"];
        return OhmsLawCalculatorLogic;
    })();
    App.OhmsLawCalculatorLogic = OhmsLawCalculatorLogic;
})(App || (App = {}));
var App;
(function (App) {
    var OhmsLawCalculatorUIAbstractor = (function () {
        function OhmsLawCalculatorUIAbstractor() {
            var _this = this;
            this.variableValueModified = new App.AppEvent();
            this.variableMultiplierModified = new App.AppEvent();
            this.lockRequested = new App.AppEvent();
            this.unlockRequested = new App.AppEvent();
            this.resetRequested = new App.AppEvent();
            this.refreshRequested = new App.AppEvent();
            this.container.select("input[type='text'], input[type='number']").addEventHandler("input", function (e, target) { return _this.onRowValueModified(e, target); });
            this.container.select("select").addEventHandler("change", function (e, target) { return _this.onRowMultiplierModified(e, target); });
            this.container.select("button#resetButton").addEventHandler("click", function () { return _this.resetRequested.trigger(); });
            this.container.select("span.fa-lock").addEventHandler("mousedown", function (e, target) { return _this.onLockMouseDown(e, target); });
            this.container.select("#autoAdjustCheckbox").addEventHandler("click", function (e, target) { return _this.onAutoAdjustCheckboxClicked(e, target); });
            var autoAdjustPreference = localStorage["OhmsLawCalculator_AutoAdjustEnabled"];
            if (autoAdjustPreference !== undefined &&
                autoAdjustPreference !== this.container.select("#autoAdjustCheckbox").getProperty("checked").toString()) {
                this.container.select("#autoAdjustCheckbox").triggerEvent("click");
            }
        }
        OhmsLawCalculatorUIAbstractor.prototype.getRowInputValue = function (id) {
            var rowSelector = this.getRowForVariableType(id);
            var inputValue = rowSelector.select("input").getValue();
            if (inputValue == "")
                return NaN;
            else
                return parseFloat(inputValue);
        };
        OhmsLawCalculatorUIAbstractor.prototype.setRowInputValue = function (id, newValue) {
            var rowSelector = this.getRowForVariableType(id);
            if (newValue == null || isNaN(newValue))
                rowSelector.select("input").setValue("");
            else
                rowSelector.select("input").setValue(newValue.toPrecision(5));
        };
        OhmsLawCalculatorUIAbstractor.prototype.getRowMultiplier = function (id) {
            return parseFloat(this.getRowForVariableType(id).select("option:selected").getValue());
        };
        OhmsLawCalculatorUIAbstractor.prototype.setRowMultiplier = function (id, newValue) {
            var selectElement = this.getRowForVariableType(id).select("select");
            selectElement.setValue(newValue);
            selectElement.jqueryObject.selectmenu();
            selectElement.jqueryObject.selectmenu("refresh", true);
        };
        OhmsLawCalculatorUIAbstractor.prototype.getAdjustedRowInputValue = function (id) {
            return this.getRowInputValue(id) * this.getRowMultiplier(id);
        };
        OhmsLawCalculatorUIAbstractor.prototype.setAdjustedRowInputValue = function (id, newValue) {
            this.setRowInputValue(id, newValue * (1 / this.getRowMultiplier(id)));
        };
        OhmsLawCalculatorUIAbstractor.prototype.onRowValueModified = function (e, target) {
            if (target.getProperty("type") === "text") {
                var inputString = target.getValue();
                if (inputString !== "" && !/^[\+\-]?\d*(\.?\d*)?(e[\+\-]?\d*)?$/.test(inputString)) {
                    target.setValue(target.getData("previousValue"));
                    return;
                }
                target.setData("previousValue", target.getValue());
            }
            this.variableValueModified.trigger(this.getContainingRowID(target));
        };
        OhmsLawCalculatorUIAbstractor.prototype.onRowMultiplierModified = function (e, target) {
            this.variableMultiplierModified.trigger(this.getContainingRowID(target));
        };
        OhmsLawCalculatorUIAbstractor.prototype.getContainingRowID = function (target) {
            return target.getAncestors("tr").getAttribute("id");
        };
        OhmsLawCalculatorUIAbstractor.prototype.getRowForVariableType = function (type) {
            return this.container.select("tr#" + type);
        };
        OhmsLawCalculatorUIAbstractor.prototype.getLockState = function (id) {
            return this.getRowForVariableType(id).select("span.fa-lock").getAttribute("data-locked") === "true";
        };
        OhmsLawCalculatorUIAbstractor.prototype.setLockState = function (id, newState) {
            var lockIcon = this.getRowForVariableType(id).select("span.fa-lock");
            lockIcon.setAttribute("data-locked", newState.toString());
            if (newState)
                lockIcon.setAttribute("title", "Unlock the '" + id + "' variable");
            else
                lockIcon.setAttribute("title", "Lock the '" + id + "' variable");
        };
        OhmsLawCalculatorUIAbstractor.prototype.getReadonlyState = function (id) {
            return this.getRowForVariableType(id).select("input").getAttribute("readonly") === "readonly";
        };
        OhmsLawCalculatorUIAbstractor.prototype.setInputReadonlyState = function (id, newValue) {
            var inputElement = this.getRowForVariableType(id).select("input");
            if (newValue === true)
                inputElement.setAttribute("readonly", "true");
            else
                inputElement.removeAttribute("readonly");
        };
        OhmsLawCalculatorUIAbstractor.prototype.setMultiplierReadonlyState = function (id, newValue) {
            var selectElement = this.getRowForVariableType(id).select("select");
            if (newValue === true)
                selectElement.jqueryObject.selectmenu("disable");
            else
                selectElement.jqueryObject.selectmenu("enable");
        };
        Object.defineProperty(OhmsLawCalculatorUIAbstractor.prototype, "lockedVariables", {
            get: function () {
                var _this = this;
                return App.OhmsLawCalculatorLogic.variables.filter(function (name) { return _this.getLockState(name); });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OhmsLawCalculatorUIAbstractor.prototype, "unlockedVariables", {
            get: function () {
                var _this = this;
                return App.OhmsLawCalculatorLogic.variables.filter(function (name) { return !_this.getLockState(name); });
            },
            enumerable: true,
            configurable: true
        });
        OhmsLawCalculatorUIAbstractor.prototype.onLockMouseDown = function (e, target) {
            var id = this.getContainingRowID(target);
            if (this.getLockState(id) == false)
                this.lockRequested.trigger(id);
            else
                this.unlockRequested.trigger(id);
        };
        OhmsLawCalculatorUIAbstractor.prototype.resetValues = function () {
            var _this = this;
            App.OhmsLawCalculatorLogic.variables.forEach(function (name) { return _this.setAdjustedRowInputValue(name, undefined); });
        };
        OhmsLawCalculatorUIAbstractor.prototype.resetMultipliers = function () {
            var _this = this;
            App.OhmsLawCalculatorLogic.variables.forEach(function (name) { return _this.setRowMultiplier(name, 1); });
        };
        OhmsLawCalculatorUIAbstractor.prototype.resetLocks = function () {
            var _this = this;
            App.OhmsLawCalculatorLogic.variables.forEach(function (name) { return _this.setLockState(name, false); });
        };
        OhmsLawCalculatorUIAbstractor.prototype.resetInputReadonlyState = function () {
            var _this = this;
            App.OhmsLawCalculatorLogic.variables.forEach(function (name) { return _this.setInputReadonlyState(name, false); });
        };
        OhmsLawCalculatorUIAbstractor.prototype.resetMultiplierReadonlyState = function () {
            var _this = this;
            App.OhmsLawCalculatorLogic.variables.forEach(function (name) { return _this.setMultiplierReadonlyState(name, false); });
        };
        Object.defineProperty(OhmsLawCalculatorUIAbstractor.prototype, "container", {
            get: function () {
                return App.DOM.select("div#container");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OhmsLawCalculatorUIAbstractor.prototype, "autoAdjustEnabled", {
            get: function () {
                return this.container.select("#autoAdjustCheckbox").is(":checked");
            },
            enumerable: true,
            configurable: true
        });
        OhmsLawCalculatorUIAbstractor.prototype.onAutoAdjustCheckboxClicked = function (e, target) {
            localStorage["OhmsLawCalculator_AutoAdjustEnabled"] = target.getProperty("checked");
            this.refreshRequested.trigger();
        };
        return OhmsLawCalculatorUIAbstractor;
    })();
    App.OhmsLawCalculatorUIAbstractor = OhmsLawCalculatorUIAbstractor;
})(App || (App = {}));
var App;
(function (App) {
    var OhmsLawCalculatorPresenter = (function () {
        function OhmsLawCalculatorPresenter() {
            var _this = this;
            if (jQuery["browser"].mobile)
                App.DOM.select("input[type='text']").setAttribute("type", "number");
            this.ui = new App.OhmsLawCalculatorUIAbstractor();
            this.onResetRequested();
            this.ui.variableValueModified.addHandler(function (e) { return _this.onUIVariableValueModified(e); });
            this.ui.variableMultiplierModified.addHandler(function (e) { return _this.onVariableMultiplierModified(e); });
            this.ui.resetRequested.addHandler(function () { return _this.onResetRequested(); });
            this.ui.lockRequested.addHandler(function (e) { return _this.onLockRequested(e); });
            this.ui.unlockRequested.addHandler(function (e) { return _this.onUnlockRequested(e); });
            this.ui.refreshRequested.addHandler(function () { return _this.onRefreshRequested(); });
        }
        OhmsLawCalculatorPresenter.prototype.onUIVariableValueModified = function (modifiedVariable) {
            this.onLockRequested(modifiedVariable);
            this.trySolvingAllVariablesAndUpdateResultsInUI();
        };
        OhmsLawCalculatorPresenter.prototype.trySolvingAllVariablesAndUpdateResultsInUI = function () {
            var _this = this;
            var calculator = new App.OhmsLawCalculatorLogic();
            this.ui.lockedVariables.forEach(function (variableName) {
                calculator.setVariable(variableName, _this.ui.getAdjustedRowInputValue(variableName));
            });
            var success = calculator.trySolvingAllVariables();
            this.ui.unlockedVariables.forEach(function (variableName) {
                if (success) {
                    var calculatedValue = calculator.getVariable(variableName);
                    if (_this.ui.autoAdjustEnabled) {
                        if (calculatedValue != null)
                            _this.ui.setRowMultiplier(variableName, App.Tools.chooseMostAppropriateMagnitudeForValue(calculatedValue, [0.000001, 0.001, 1, 1000, 1000000, 1000000000]));
                        else
                            _this.ui.setRowMultiplier(variableName, 1);
                    }
                    _this.ui.setAdjustedRowInputValue(variableName, calculatedValue);
                }
                else
                    _this.ui.setAdjustedRowInputValue(variableName, undefined);
            });
        };
        OhmsLawCalculatorPresenter.prototype.onVariableMultiplierModified = function (modifiedVariable) {
            if (this.ui.lockedVariables.indexOf(modifiedVariable) > 0)
                this.onUIVariableValueModified(modifiedVariable);
            else
                this.trySolvingAllVariablesAndUpdateResultsInUI();
        };
        OhmsLawCalculatorPresenter.prototype.onLockRequested = function (variableName) {
            if (this.ui.getLockState(variableName) == false && this.ui.lockedVariables.length < 2) {
                this.ui.setLockState(variableName, true);
                this.refreshLocksAndReadonlyStates();
            }
        };
        OhmsLawCalculatorPresenter.prototype.onUnlockRequested = function (variableName) {
            if (this.ui.getLockState(variableName) == true) {
                this.ui.setLockState(variableName, false);
                this.refreshLocksAndReadonlyStates();
            }
        };
        OhmsLawCalculatorPresenter.prototype.refreshLocksAndReadonlyStates = function () {
            var _this = this;
            this.ui.resetInputReadonlyState();
            this.ui.resetMultiplierReadonlyState();
            if (this.ui.lockedVariables.length == 2) {
                this.ui.unlockedVariables.forEach(function (name) { return _this.ui.setInputReadonlyState(name, true); });
                if (this.ui.autoAdjustEnabled)
                    this.ui.unlockedVariables.forEach(function (name) { return _this.ui.setMultiplierReadonlyState(name, true); });
            }
        };
        OhmsLawCalculatorPresenter.prototype.onResetRequested = function () {
            this.ui.resetValues();
            this.ui.resetMultipliers();
            this.ui.resetLocks();
            this.refreshLocksAndReadonlyStates();
        };
        OhmsLawCalculatorPresenter.prototype.onRefreshRequested = function () {
            this.trySolvingAllVariablesAndUpdateResultsInUI();
            this.refreshLocksAndReadonlyStates();
        };
        OhmsLawCalculatorPresenter.start = function () {
            App.DOM.onReady(function () {
                var presenter = new OhmsLawCalculatorPresenter();
            });
        };
        return OhmsLawCalculatorPresenter;
    })();
    App.OhmsLawCalculatorPresenter = OhmsLawCalculatorPresenter;
})(App || (App = {}));
//# sourceMappingURL=OhmsLawCalculator.js.map