(function(global) {
  /**
    Check if the first array contains every element in the second array

    @ignore
  */
  function contains(set, subSet) {
    for (var i = 0; i < subSet.length; i++) {
      if (set.indexOf(subSet[i]) === -1) {
        return false;
      }
    }
    return true;
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

  // The following functions will be used as handlers and will detach themselves automatically
  function _stopPropagation(event) {
    Event.prototype.stopPropagation.call(event);
    _removeVentStopPropagationListeners(event);
  }

  function _stopImmediatePropagation(event) {
    Event.prototype.stopImmediatePropagation.call(event);
    _removeVentStopPropagationListeners(event);
  }

  // The following functions will be used when overriding event's stopProp methods
  function ventStopPropagation() {
    _stopPropagation(this);
  }

  function ventStopImmediatePropagation() {
    _stopImmediatePropagation(this);
  }

  // This method is used to clean up after Vent when stopPropagation has been called in a Vent listener
  function _removeVentStopPropagationListeners(event) {
    if (event._ventStopPropListeners) {
      // Remove all listeners we added on any element
      // It is possible that another Vent instance may have added more stopProp listeners, hence the array
      var listener;
      for (var i = 0; i < event._ventStopPropListeners.length; i++) {
        listener = event._ventStopPropListeners[i];
        listener.element.removeEventListener(event.type, listener.handler, listener.useCapture);
      }

      // Drop references
      event._ventStopPropListeners = null;
    }

    // Restore previous method since this event is done for
    event.stopImmediatePropagation = Event.prototype.stopImmediatePropagation;
    event.stopPropagation = Event.prototype.stopPropagation;
    event._ventRoot = null;
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
    @classdesc DOM event delegation

    @param {HTMLElement|String} elementOrSelector
      The element or selector indicating the element to use as the delegation root.
  */
  function Vent(elementOrSelector) {
    if (this === global) {
      throw new Error('Vent must be invoked with the new keyword');
    }

    var root;
    if (typeof elementOrSelector === 'string') {
      root = document.querySelector(elementOrSelector);
    }
    else {
      root = elementOrSelector;
    }

    // Store a reference to the root element
    // This is the node at which we'll listen to events
    this.root = root;

    // Map of event names to array of events
    // Don't inherit from Object so we don't collide with properties on its prototype
    this._listenersByType = Object.create(null);

    /*
      A list of all of the listener objects tracked by this instance
      Each item takes the following form:
      {
        eventName: String,
        handler: Function,
        namespaces: Array<string>,
        selector: String | null,
        useCapture: Boolean,
        isScoped: Boolean
      }
    */
    this._allListeners = [];

    // Ensure _executeListeners always executes in the scope of this instance
    this._executeListeners = this._executeListeners.bind(this);
  }

  /**
    This function is responsible for checking if listeners should be executed for the current event

    @ignore
  */
  Vent.prototype._executeListenersAtElement = function(target, listeners, event, useCapture) {
    var root = this.root;
    var id = this._id;

    var listener;
    var returnValue;

    // Execute each listener that meets the criteria
    executeListeners: for (var listenerIndex = 0; listenerIndex < listeners.length; listenerIndex++) {
      listener = listeners[listenerIndex];

      if (
        // Check if the target elements matches for this listener
        (
          (
            // When no selector is provided
            listener.selector === null &&
            (
              // Execute if we've landed on the root
              target === root
            )
          ) ||
          (
            // document does not support matches()
            target !== document &&
            // Don't bother with delegation on the root element
            target !== root &&
            // Check if the event is delegated
            listener.selector !== null &&
            // Only execute  if the selector matches
            (
              // Check if the selector has context
              listener.isScoped ?
              // Run the match using the root element's ID
              matchesSelector.call(target, '[__vent-id__="'+id+'"] '+listener.selector)
              // Run the match without context
              : matchesSelector.call(target, listener.selector)
            )
          )
        ) &&
        // Check if the event is the in right phase
        (listener.useCapture === useCapture)
      ) {
        // Call handlers in the scope of the original target, passing the event along
        returnValue = listener.handler.call(event.target, event);

        // Prevent default and stopPropagation if the handler returned false
        if (returnValue === false) {
          event.preventDefault();
          event.stopPropagation();
        }

        if (event._ventImmediatePropagationStopped) {
          // Do not process any more event handlers and stop bubbling
          break executeListeners;
        }
      } // end if
    } // end executeListeners
  };

  /**
    Add an event listener so we can stop the propagation of the actual event during the desired phase.

    Vent always listens to events in the capture phase so we can explicitly control behavior
    In order for stopPropagation and stopImmediatePropagation to correctly stop handlers from being called, we have to get tricky
    If a Vent listener calls stopPropagation, we need to simulate this so that listeners added natively are not called as expected
    To achieve this, we'll add an event listener that will call stopPropagation on the real event in the correct phase
    We'll also need to clean these listeners up if stopPropagation is called

    @private
  */
  Vent.prototype._addStopPropagationListener = function(event, element, handler, useCapture) {
    // Add a listener to stop propagation
    element.addEventListener(event.type, handler, useCapture);

    // Store references to added listeners so we can remove them
    // If stopPropagation is called, we'll blow all of these listeners away
    event._ventStopPropListeners = event._ventStopPropListeners || [];
    event._ventStopPropListeners.push({
      element: element,
      useCapture: useCapture,
      handler: handler
    });

    // Store a reference so we can remove our final listener
    event._ventRoot = this.root;
  };

  /**
    Handles all events added with Vent

    @private
    @memberof Vent
  */
  Vent.prototype._executeListeners = function(event) {
    var listeners = this._listenersByType[event.type];

    if (!listeners) {
      throw new Error('Vent: _executeListeners called in response to '+event.type+', but we are not listening to it');
    }

    if (listeners.length) {
      // Get a copy of the listeners
      // Without this, removing an event inside of a callback will cause errors
      listeners = listeners.slice();

      // Store a reference to the target
      // If the event was fired on a text node, delegation should assume the target is its parent
      var target = event.target;
      if (target.nodeType === Node.TEXT_NODE) {
        target = target.parentNode;
      }

      // Override stopPropagation/stopImmediatePropagation so we know if we should stop processing events
      event.stopPropagation = function() {
        event._ventPropagationStopped = true;
      };

      event.stopImmediatePropagation = function() {
        event._ventImmediatePropagationStopped = true;
      };

      // Build an array of the DOM tree between the root and the element that dispatched the event
      // The HTML specification states that, if the tree is modified during dispatch, the event should bubble as it was before
      // Building this list before we dispatch allows us to simulate that behavior
      var tempTarget = target;
      var targetList = [];
      buildTree: while (tempTarget && tempTarget !== this.root) {
        targetList.push(tempTarget);
        tempTarget = tempTarget.parentNode;
      }
      targetList.push(this.root);

      var targetListIndex;
      var currentTargetElement;
      var stopPropagationListener;

      // Simulate the capture phase by trickling down the target list
      trickleDown: for (targetListIndex = targetList.length - 1; targetListIndex >= 0; targetListIndex--) {
        if (!listeners.length) {
          // Stop trickling down if there are no more listeners to execute
          break trickleDown;
        }
        currentTargetElement = targetList[targetListIndex];
        this._executeListenersAtElement(currentTargetElement, listeners, event, true);

        // Stop if a handler told us to stop trickling down the DOM
        if (
          event._ventImmediatePropagationStopped ||
          event._ventPropagationStopped
        ) {
          // Stop simulating trickle down
          break trickleDown;
        }
      }

      // Stop if a handler told us to stop trickling down the DOM
      if (
        event._ventImmediatePropagationStopped ||
        event._ventPropagationStopped
      ) {
        // Use the appropriate listener
        stopPropagationListener = event._ventImmediatePropagationStopped ? _stopImmediatePropagation : _stopPropagation;

        // Stop propagation once the actual event reaches the node in question
        this._addStopPropagationListener(event, currentTargetElement, stopPropagationListener, true);
      }
      else if (listeners.length) {
        // If listeners remain and propagation was not stopped, simulate the bubble phase by bubbling up the target list
        bubbleUp: for (targetListIndex = 0; targetListIndex < targetList.length; targetListIndex++) {
          if (!listeners.length) {
            // Stop bubbling up if there are no more listeners to execute
            break bubbleUp;
          }
          currentTargetElement = targetList[targetListIndex];
          this._executeListenersAtElement(currentTargetElement, listeners, event, false);

          // Stop simulating the bubble phase if a handler told us to
          if (
            event._ventImmediatePropagationStopped ||
            event._ventPropagationStopped
          ) {
            break bubbleUp;
          }
        }

        // Stop if a handler told us to stop bubbling up the DOM
        if (
          event._ventImmediatePropagationStopped ||
          event._ventPropagationStopped
        ) {
          // Use the appropriate listener
          stopPropagationListener = event._ventImmediatePropagationStopped ? _stopImmediatePropagation : _stopPropagation;

          // Stop propagation once the actual event reaches the node in question
          this._addStopPropagationListener(event, currentTargetElement, stopPropagationListener, false);
        }
      }
    }

    if (
      event._ventImmediatePropagationStopped ||
      event._ventPropagationStopped
    ) {
      // We will have added a listener that will stop propagation of the actual event,
      // which may or may not be called if a native listener calls stopPropagation
      // To make sure we clean up, we'll override the stopProp methods so we can clean up after ourselves
      // If this wasn't done, it would be possible for a native event to stopImmediatePropagation such that our stopProp listener sticks around,
      // which would cause unexpected behavior for subsequent events
      event.stopPropagation = ventStopPropagation;
      event.stopImmediatePropagation = ventStopImmediatePropagation;
    }
    else {
      // Otherwise, restore the normal stopPropagation listeners as there is nothing to clean up
      event.stopPropagation = Event.prototype.stopPropagation;
      event.stopImmediatePropagation = Event.prototype.stopImmediatePropagation;
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
      The function that will be called when the event is fired.
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
    var listenerList = this._listenersByType[eventName];
    if (!listenerList) {
      listenerList = this._listenersByType[eventName] = [];

      // Add the actual listener
      this.root.addEventListener(eventName, this._executeListeners, true);
    }

    // Set the special ID attribute if the selector is scoped
    var listenerIsScoped = isScoped(selector);
    if (listenerIsScoped) {
      // Normalize selectors so they don't use :scope
      selector = selector.replace(scopedSelectorRegex, '>');

      // Store a unique ID and set a special attribute we'll use to scope
      this._id = this._id || lastID++;
      this.root.setAttribute('__vent-id__', this._id);
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
          // Listener matches all specified namespaces
          (listener.namespaces && contains(listener.namespaces, namespaces))
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
            // Remove the actual listener, if necessary
            this.root.removeEventListener(listener.eventName, this._executeListeners, true);

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
      Dispatch a custom event at the root element.
      @memberof Vent

      @param {String} eventName
        The name of the event to dispatch.
      @param {Object} [options]
        CustomEvent options.
      @param {Object} [options.bubbles=true]
        Whether the event should bubble.
      @param {Object} [options.cancelable=true]
        Whether the event should be cancelable.
      @param {Object} [options.detail]
        Data to pass to handlers as <code>event.detail</code>
    */
    Vent.prototype.dispatch = function(eventName, options) {
      options = options || {};

      if (typeof options.bubbles === 'undefined') {
        options.bubbles = true;
      }

      if (typeof options.cancelable === 'undefined') {
        options.cancelable = true;
      }

      var event = new CustomEvent(eventName, options);
      this.root.dispatchEvent(event);

      return event;
    };
  }
  else {
    // Use createEvent for old browsers
    Vent.prototype.dispatch = function(eventName, options) {
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
      var defaultPrevented = !this.root.dispatchEvent(event);

      // Check if the defaultPrevented status was correctly stored back to the event object
      if (defaultPrevented !== event.defaultPrevented) {
        // dispatchEvent() doesn't correctly set event.defaultPrevented in IE 9
        // However, it does return false if preventDefault() was called
        // Unfortunately, the returned event's defaultPrevented property is read-only
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
    this.root = null;
  };

  // Expose globally
  global.Vent = Vent;
}(this));
