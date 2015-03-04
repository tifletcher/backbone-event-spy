// primitive event logging for Backbone and require.js
// run this after backbone and require are available, but before other modules are loaded
// at the console say <namespace>.D.logAll() and watch the events flow ...

(function (production, namespace, command) {

	if (production) return;

	var matchString = function (needle, haystack) {
		if (typeof needle === "string") return needle === haystack;
		if (needle instanceof RegExp) return haystack.match(needle);
		return false;
	};

	var matchConstructor = function (instance, constructors) {
		if (constructors instanceof Array && constructors.length > 0)
			return _.any(constructors, function (ctor) { return instance instanceof ctor; });
		else return true;
	};

	var logFilter = {};
	var logThisEvent = function (_this, _arguments, initContext) {
		return (!logFilter.name || matchString(logFilter.name, _arguments[0])) &&
			(!logFilter.module || matchString(logFilter.module, initContext)) &&
			(!logFilter.constructor || matchConstructor(_this, logFilter.constructor));
	};

	var loggingOn = false;
	var getTriggerWithContext = function (initContext) {
		return function () {
			if (loggingOn && logThisEvent(this, arguments, initContext)) {
				console.log("TRIGGERED FROM: " + initContext);
				console.log("-> context:", this);
				console.log("-> arguments:", arguments);
			}
			return trigger.apply(this, arguments);
		};
	};

	var backbone;
	var trigger;
	requirejs.onResourceLoad = function (context, map, depArray) {
		if (map.name === 'vendor/backbone') {
			backbone = window.Backbone;
			trigger = backbone.Events.trigger;
		}

		if (!production && backbone && trigger) {
			var t = getTriggerWithContext(map.name);
			_.each([
				window.Backbone.Events,
				window.Backbone.Collection.prototype,
				window.Backbone.History.prototype,
				window.Backbone.Model.prototype,
				window.Backbone.Router.prototype,
				window.Backbone.View.prototype
			], function (obj) {
				obj.trigger = t;
			});
		}
	};

	var commands = {};
	commands.startLogging = function () {
		loggingOn = true;
	};
	commands.stopLogging = function () {
		loggingOn = false;
	};
	commands.resetFilter = function () {
		logFilter = {};
	};
	commands.showFilters = function () {
		console.log(logFilter);
	};
	commands.logAll = function () {
		commands.resetFilter();
		commands.startLogging();
	};
	commands.logByName = function (name) {
		if (typeof name === "string" || name instanceof RegExp) {
			commands.startLogging();
			logFilter.name = name;
		}
		else console.log("filter setup failed: takes a string or regex");
	};
	commands.logByModule = function (module) {
		if (typeof module === "string" || module instanceof RegExp) {
			commands.startLogging();
			logFilter.module = module;
		}
		else console.log("filter setup failed: takes a string or regex");
	};
	commands.logByConstructors = function (ctors) {
		if (ctors instanceof Array && ctors.length > 0) {
			commands.startLogging();
			logFilter.constructor = ctors;
		}
		else console.log("filter setup failed: takes an array of constructors");
	};
	
	namespace[command] = commands;

})(false, window, "D");
