(function(global) {
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

  /*
    Matches selectors that are scoped, such as:
      > selector
      :scope > selector
  */
  var scopedSelectorRegex = /^\s*(>|:scope\s*>)/;

  /**
    Check if the provided selector is scoped (has context)

    @ignore
  */
  function isScoped(selector) {
    return selector && scopedSelectorRegex.test(selector);
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

  // The next ID we'll use for scoped delegation
  var lastID = 0;

  /**
    @class Vent
    @classdesc Event delegation that works.
  */
  function Vent(elOrSelector) {
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
    // Don't inherit from Object so we don't collide with properties on its prototype
    this._listenersByType = Object.create(null);

    // All events
    this._allListeners = [];

    var self = this;
    /**
      Execute all listeners that should happen in the capture phase

      @private
      @memberof Vent
    */
    this._executeCapturePhaseListeners = function(event) {
      // Tell _executeListeners to deal with capture phase events only
      self._executeListeners(event, true);
    };

    /**
      Execute all listeners that should happen in the bubble phase

      @private
      @memberof Vent
    */
    this._executeBubblePhaseListeners = function(event) {
      // Tell _executeListeners to deal with bubble phase events only
      self._executeListeners(event, false);
    };
  }

  /**
    Handles all events added with Vent

    @private
    @memberof Vent
  */
  Vent.prototype._executeListeners = function(event, captureOnly) {
    var listeners = this._listenersByType[event.type];

    if (!listeners) {
      throw new Error('Vent: _executeListeners called in response to event we are not listening to');
    }

    // Get a copy of the listeners
    // Without this, removing an event inside of a callback will cause errors
    listeners = listeners.slice();

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

        if (
          // Check if the target elements matches the selector
          (
            // Always trigger if no selector provided
            listener.selector === null ||
            (
              // Only trigger if the event isn't triggered directly on the element
              target !== this.el &&
              // And if the selector matches
              (
                // Check if the selector has context
                listener.isScoped ?
                // Run the match using the root element's ID
                matchesSelector.call(target, '[__vent-id__="'+this._id+'"] '+listener.selector)
                // Run the match without context
                : matchesSelector.call(target, listener.selector)
              )
            )
          ) &&
          // Check if the event is the in right phase
          (listener.useCapture === captureOnly)
        ) {
          // Call handlers in the right scope, passing the event
          listener.handler.call(event.target, event);
        }
      }
    }
  };

  /**
    Add an event listener.
    @memberof Vent

    @param {String} eventName
      The event name to listen for, including optional namespace(s).
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

    if (typeof handler !== 'function') {
      throw new Error('Vent: Cannot add listener with non-function handler');
    }

    // Be null if every falsy (undefined or empty string passed)
    if (!selector) {
      selector = null;
    }

    // false by default
    // This matches the HTML API
    if (typeof useCapture === 'undefined') {
      useCapture = false;
    }

    // Extract namespaces
    var namespaces = null;
    var dotIndex = eventName.indexOf('.');
    if (dotIndex !== -1) {
      namespaces = eventName.slice(dotIndex+1).split('.');
      eventName = eventName.slice(0, dotIndex);
    }

    // Get/create the list for the event type
    var listenerList = this._listenersByType[eventName] = this._listenersByType[eventName] || [];

    // Check if we need to add actual listeners for the given phase
    if (useCapture && !listenerList.capturePhaseListenerAdded) {
      // Add the capture phase listener
      this.el.addEventListener(eventName, this._executeCapturePhaseListeners, true);
      listenerList.capturePhaseListenerAdded = true;
    }
    else if (!listenerList.bubblePhaseListenerAdded) {
      // Add the bubble phase listener
      this.el.addEventListener(eventName, this._executeBubblePhaseListeners, false);
      listenerList.bubblePhaseListenerAdded = true;
    }

    // Set the special ID attribute if the selector is scoped
    var listenerIsScoped = isScoped(selector);
    if (listenerIsScoped) {
      // Normalize selectors so they don't use :scope
      selector = selector.replace(scopedSelectorRegex, '>');

      // Store a unique ID and set a special attribute we'll use to scope
      this._id = this._id || lastID++;
      this.el.setAttribute('__vent-id__', this._id);
    }

    // Create an object with the event's information
    var eventObject = {
      eventName: eventName,
      handler: handler,
      namespaces: namespaces,
      selector: selector,
      useCapture: useCapture,
      isScoped: listenerIsScoped
    };

    // Store relative to the current type and with everyone else
    listenerList.push(eventObject);
    this._allListeners.push(eventObject);
  };

  /**
    Remove an event listener.
    @memberof Vent

    @param {String} [eventName]
      The event name to stop listening for, including optional namespace(s).
    @param {String} [selector]
      The selector that was used for event delegation.
    @param {Function} [handler]
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

    var listener;
    var index;
    var listeners = this._allListeners;
    for (var i = 0; i < listeners.length; i++) {
      listener = listeners[i];

      if (
        (eventName === null || listener.eventName === eventName) &&
        (selector === null || listener.selector === selector) &&
        (handler === null || listener.handler === handler) &&
        (useCapture === null || listener.useCapture === useCapture) &&
        (
          // Remove matching listeners, regardless of namespace
          namespaces === null ||
          // Listener specifies a matching namespace
          (listener.namespaces && intersects(namespaces, listener.namespaces))
        )
      ) {
        // Remove the listeners info
        this._allListeners.splice(i, 1);

        // Array length changed, so check the same index on the next iteration
        i--;

        // Get index in listenersByType map
        if (!this._listenersByType[listener.eventName]) {
          throw new Error('Vent: Missing listenersByType for '+listener.eventName);
        }

        // Find the event info in the other lookup list
        index = this._listenersByType[listener.eventName].indexOf(listener);
        if (index !== -1) {
          var mapList = this._listenersByType[listener.eventName];

          // Remove from the map
          mapList.splice(index, 1);

          // Check if we've removed all the listeners for this event type
          if (mapList.length === 0) {
            // Remove the actual listeners, if necessary
            if (mapList.bubblePhaseListenerAdded) {
              this.el.removeEventListener(listener.eventName, this._executeBubblePhaseListeners, false);
            }

            if (mapList.capturePhaseListenerAdded) {
              this.el.removeEventListener(listener.eventName, this._executeCapturePhaseListeners, true);
            }

            // Avoid using delete operator for performance
            this._listenersByType[listener.eventName] = null;
          }
        }
        else {
          throw new Error('Vent: Event existed in allEvents, but did not exist in listenersByType');
        }
        // Don't stop now! We want to remove all matching listeners, so continue to loop
      }
    }

    return this;
  };

  if (typeof CustomEvent === 'function') {
    // Use native CustomEvent on platforms that support it
    // Note: defaultPrevented will not be set correctly if CustomEvent is polyfilled

    /**
      Trigger an event
      @memberof Vent

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
    Vent.prototype.trigger = function(eventName, options) {
      options = options || {};

      if (typeof options.bubbles === 'undefined') {
        options.bubbles = true;
      }

      if (typeof options.cancelable === 'undefined') {
        options.cancelable = true;
      }

      var event = new CustomEvent(eventName, options);
      this.el.dispatchEvent(event);

      return event;
    };
  }
  else {
    // Use createEvent for old browsers
    Vent.prototype.trigger = function(eventName, options) {
      options = options || {};

      if (typeof options.bubbles === 'undefined') {
        options.bubbles = true;
      }

      if (typeof options.cancelable === 'undefined') {
        options.cancelable = true;
      }

      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(eventName, options.bubbles, options.cancelable, options.detail);

      // Dispatch the event, checking the return value to see if preventDefault() was called
      var defaultPrevented = !this.el.dispatchEvent(event);

      // Check if the defaultPrevented status was correctly stored back to the event object
      if (defaultPrevented !== event.defaultPrevented) {
        // dispatchEvent() doesn't correctly set event.defaultPrevented in IE 9
        // However, it does return false if preventDefault() was called
        // Unfortunately, the returned event's defaultPrevented property is readonly
        // We need to work around this such that (patchedEvent instanceof Event) === true
        // First, we'll create an object that uses the event as its prototype
        // This gives us an object we can modify that is still technically an instanceof Event
        var patchedEvent = Object.create(event);

        // Next, we set the correct value for defaultPrevented on the new object
        // We cannot simply assign defaultPrevented, it causes a "Invalid Calling Object" error in IE 9
        // For some reason, defineProperty doesn't cause this
        Object.defineProperty(patchedEvent, 'defaultPrevented', { value: defaultPrevented });

        return patchedEvent;
      }

      return event;
    };
  }

  /**
    Destroy this instance, removing all events and references.
    @memberof Vent
  */
  Vent.prototype.destroy = function() {
    // Remove all events
    this.off();

    // Remove all references
    this._listenersByType = null;
    this._allListeners = null;
    this.el = null;
  };

  // Expose globally
  global.Vent = Vent;
}(this));
