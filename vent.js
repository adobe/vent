(function(global) {
  var DEBUG = 0;

  // The event is in the capturing phase.
  var CAPTURING_PHASE = 1;

  // The event is being evaluated at the target element.
  var AT_TARGET = 2;

  // The event is in the bubbling phase.
  var BUBBLING_PHASE = 3;

  /**
    Check if there is a common element in two arrays

    @ignore
  */
  function intersects(left, right) {
    for (var i = 0; i < left.length; i++) {
      if (right.indexOf(left[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  /**
    Get the right method to match selectors on

    @ignore
  */
  var matchesSelector = (function() {
    var proto = Element.prototype;
    var matchesSelector = (
      proto.matches ||
      proto.matchesSelector ||
      proto.webkitMatchesSelector ||
      proto.mozMatchesSelector ||
      proto.msMatchesSelector ||
      proto.oMatchesSelector
    );

    if (!matchesSelector) {
      throw new Error('Vent: Browser does not support matchesSelector');
    }

    return matchesSelector;
  }());

  /**
    @class Vent
    @classdesc Event delegation that works.
  */
  var Vent = function(elOrSelector) {
    if (this === global) {
      throw new Error('Vent must be invoked with the new keyword');
    }

    var el;
    if (typeof elOrSelector === 'string') {
      el = document.querySelector(elOrSelector);
    }
    else {
      el = elOrSelector;
    }

    // Store element
    this.el = el;

    // Map of event names to array of events
    this._eventsByType = {};

    // All events
    this._allEvents = [];

    var self = this;

    /**
      Handles all events added with Vent

      @ignore
    */
    this._handleEvent = function(event) {
      var phase = event.eventPhase;

      // Get a copy of the listeners
      // Without this, removing an event inside of a callback will cause errors
      var listeners = self._eventsByType[event.type].slice();

      var target = event.target;
      // If the event was triggered on a text node, delegation should assume the target is its parent
      if (target.nodeType === Node.TEXT_NODE) {
        target = target.parentNode;
      }

      if (listeners) {
        // Check for events matching the event name
        var listener;
        for (var i = 0; i < listeners.length; i++) {
          listener = listeners[i];

          if (DEBUG > 1) {
            console.log(
              '\nlistener.selector: '+ (listener.selector) +
              '\ntarget !== self.el? '+ (target !== self.el) +
              '\nlistener.selector: '+ (listener.selector) +
              '\nmatches? '+ matchesSelector.call(target, listener.selector)
            );
          }

          if (
            // Check if the target elements matches the selector
            (
              // Always trigger if no selector provided
              listener.selector === null ||
              (
                // Only trigger if the event isn't triggered directly on the element
                target !== self.el &&
                // And if the selector matches
                matchesSelector.call(target, listener.selector)
              )
            )
            // Todo: Check capture phase
            // && (listener.useCapture ? phase === CAPTURING_PHASE : true)
          ) {
            listener.handler.call(event.target, event);
          }
        }
      }
      // Call handlers in the right scope, passing the event
    };
  }

  /**
    Add an event listener.

    @param {String} eventName
      The event name to listen for, including an option namespace.
    @param {String} [selector]
      The selector to use for event delegation.
    @param {Function} handler
      The function that will be called when the event is triggered.
    @param {Boolean} [useCapture]
      Whether or not to listen during the capturing or bubbling phase.

    @returns {Vent} this, chainable.
  */
  Vent.prototype.on = function(eventName, selector, handler, useCapture) {
    if (typeof selector === 'function') {
      useCapture = handler;
      handler = selector;
      selector = null;
    }

    // Be null if not provided
    if (typeof selector === 'undefined') {
      selector = null;
    }

    if (typeof useCapture === 'undefined') {
      useCapture = null;
    }

    // Extract namespaces
    var namespaces = null;
    var dotIndex = eventName.indexOf('.');
    if (dotIndex !== -1) {
      namespaces = eventName.slice(dotIndex+1).split('.');
      eventName = eventName.slice(0, dotIndex);
    }

    // Add master listener
    if (!this._eventsByType[eventName]) {
      this._eventsByType[eventName] = [];

      // @todo: set useCapture correctly
      this.el.addEventListener(eventName, this._handleEvent);
    }

    // Create an object with the events information
    var eventObject = {
      eventName: eventName,
      handler: handler,
      namespaces: namespaces,
      selector: selector,
      useCapture: useCapture
    };

    // Store relative to the current type and with everyone else
    this._eventsByType[eventName].push(eventObject);
    this._allEvents.push(eventObject);
  };

  /**
    Remove an event listener.

    @param {String} eventName
      The event name to stop listening for, including optional namespace(s).
    @param {String} [selector]
      The selector that was used for event delegation.
    @param {Function} handler
      The function that was passed to <code>on()</code>.
    @param {Boolean} [useCapture]
      Only remove listeners with <code>useCapture</code> set to the value passed in.

    @returns {Vent} this, chainable.
  */
  Vent.prototype.off = function(eventName, selector, handler, useCapture) {
    if (typeof selector === 'function') {
      useCapture = handler;
      handler = selector;
      selector = null;
    }

    // Be null if not provided
    if (typeof eventName === 'undefined') {
      eventName = null;
    }

    if (typeof selector === 'undefined') {
      selector = null;
    }

    if (typeof handler === 'undefined') {
      handler = null;
    }

    if (typeof useCapture === 'undefined') {
      useCapture = null;
    }

    // Extract namespaces
    var namespaces = null;
    if (eventName) {
      var dotIndex = eventName.indexOf('.');
      if (dotIndex !== -1) {
        namespaces = eventName.slice(dotIndex+1).split('.');
        eventName = eventName.slice(0, dotIndex);
      }
    }

    // Be null
    if (eventName === '') {
      eventName = null;
    }

    var event;
    var index;
    var events = this._allEvents;
    for (var i = 0; i < this._allEvents.length; i++) {
      event = this._allEvents[i];

      if (DEBUG > 1) {
        console.log(
          '\neventName: '+eventName +
          '\nselector: '+selector +
          '\nnamespaces: ['+((namespaces && namespaces.join(',')) || '')+']' +
          '\nuseCapture: '+useCapture +
          '\n\nevent.selector: '+event.selector +
          '\nevent.namespaces: ['+((event.namespaces && event.namespaces.join(',')) || '')+']' +
          '\nevent.useCapture: '+event.useCapture +
          '\n\nintersects? '+ ((namespaces && event.namespaces && intersects(namespaces, event.namespaces)) || false)
        );
      }

      if (
        (eventName === null || event.eventName === eventName) &&
        (selector === null || event.selector === selector) &&
        (handler === null || event.handler === handler) &&
        (useCapture === null || event.useCapture === useCapture) &&
        (
          // Remove matching events, regardless of namespace
          namespaces === null ||
          // Listener specifies a matching namespace
          (event.namespaces && intersects(namespaces, event.namespaces))
        )
      ) {
        if (DEBUG > 1) {
          console.log('Removing event');
        }
        // Remove the event info
        this._allEvents.splice(i, 1);

        // Array length changed, so check the same index on the next iteration
        i--;

        // Don't stop now! We want to remove all matching events

        // Get index in eventsByType map
        if (!this._eventsByType[event.eventName]) {
          throw new Error('Vent: Missing eventsByType for '+event.eventName);
        }

        index = this._eventsByType[event.eventName].indexOf(event);

        if (index !== -1) {
          var mapList = this._eventsByType[event.eventName];

          // Remove from the map
          mapList.splice(index, 1);

          // Remove actual listener if none are left
          if (mapList.length === 0) {
            // Remove the listener
            this.el.removeEventListener(event.eventName, this._handleEvent);

            this._eventsByType[event.eventName] = null;
          }
        }
        else {
          throw new Error('Vent: Event existed in allEvents, but did not exist in eventsByType');
        }
      }
    }

    return this;
  };

  /**
    Trigger an event

    @param {String} eventName
      The name of the event to trigger.
    @param {Object} [options]
      CustomEvent options.
    @param {Object} [options.bubbles=true]
      Whether the event should bubble.
    @param {Object} [options.cancelable=true]
      Whether the event should be cancelable.
    @param {Object} [options.detail]
      Data to pass to handlers as <code>event.detail</code>
  */
  if (typeof CustomEvent === 'function') {
    // Use native CustomEvent on platforms that support it
    // Note, defaultPrevented will not be set correctly if CustomEvent is polyfilled
    Vent.prototype.trigger = function(eventName, options) {
      options = options || { bubbles: true, cancelable: true };

      var event = new CustomEvent(eventName, options);
      this.el.dispatchEvent(event);

      return event;
    };
  }
  else {
    // Use createEvent for old browsers
    Vent.prototype.trigger = function() {
      options = options || { bubbles: true, cancelable: true };

      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(inType, options.bubbles, options.cancelable, options.detail);

      var defaultPrevented = !this.el.dispatchEvent(event);

      if (defaultPrevented !== event.defaultPrevented) {
        // dispatchEvent() doesn't correctly set defaultPrevented in IE 9
        // However, it does return the correct value when dispatchEvent() called
        // Furthermore, the returned event's defaultPrevented property is readonly
        // To work around this, we create a new event object with the correct defaultPrevented
        // Note: The patched event object will not have the correct prototype and will not be an instance of an event
        var patchedEvent = {};
        for (var prop in event) {
          patchedEvent[prop] = event[prop];
        }

        // Store the correct value for defaultPrevented
        patchedEvent.defaultPrevented = defaultPrevented;

        // Store the original event
        patchedEvent.originalEvent = event;

        return patchedEvent;
      }

      return event;
    };
  }

  Vent.prototype.destroy = function() {
    // Remove all events
    this.off();

    // Remove all references
    this._eventsByType = null;
    this._allEvents = null;
    this.el = null;
  };

  // Expose globally
  global.Vent = Vent;
}(this));
