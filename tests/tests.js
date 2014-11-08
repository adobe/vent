/* global -event */
describe('Vent', function() {
  var target;
  var vent;

  /**
    Dispatch an event
  */
  function dispatch(eventName, element, options) {
    options = options || { bubbles: true, cancelable: true };
    element = element || document;

    var event;
    if (typeof CustomEvent === 'function') {
      event = new CustomEvent(eventName, options);
    }
    else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent(eventName, options.bubbles, options.cancelable, options.detail);
    }

    element.dispatchEvent(event);
    return event;
  }

  beforeEach(function() {
    target = document.createElement('div');
    target.id = 'target';
    target.className = 'target';
    document.body.appendChild(target);
    vent = new Vent(target);
  });

  afterEach(function() {
    if (target.parentNode === document.body) {
      document.body.removeChild(target);
    }
    // vent.destroy();
  });

  it('should be defined in the global namespace', function() {
    expect(window).to.have.property('Vent');
  });

  it('should throw if invoked without new', function() {
    expect(function() {
      Vent(target);
    }).to.throw();
  });

  it('should accept elements', function() {
    var vent = new Vent(target);
    expect(vent.el).to.equal(target);
  });

  it('should accept selectors', function() {
    var vent = new Vent('#target');
    expect(vent.el).to.equal(target);
  });

  it('should throw if on() called with a non-function handler', function() {
    expect(function() {
      vent('customEvent');
    }).to.throw();

    expect(function() {
      vent('customEvent', null);
    }).to.throw();

    expect(function() {
      vent('customEvent', 'string');
    }).to.throw();
  });

  describe('event removal', function() {
    it('should fire other listeners when event of the same type is removed', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      vent.on('event_1', spy_1);
      vent.on('event_1', spy_2);

      dispatch('event_1', target);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after dispatching event');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after dispatching event');

      vent.off('event_1', spy_1);

      spy_1.reset();
      spy_2.reset();

      dispatch('event_1', target);

      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after removing listener');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after removing listener');
    });

    it('should add and call listeners readded after all events of the same type are removed', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_3 = sinon.spy();
      vent.on('event_1', spy_1);
      vent.on('event_1', spy_2);

      dispatch('event_1', target);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after dispatching event');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after dispatching event');

      vent.off('event_1', spy_1);
      vent.off('event_1', spy_2);

      spy_1.reset();
      spy_2.reset();

      dispatch('event_1', target);

      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after removing listener');
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after removing listener');

      vent.on('event_1', spy_3);
      dispatch('event_1', target);

      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after removing listener');
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after removing listener');
      expect(spy_3.callCount).to.equal(1, 'spy_3 call count after removing listener');
    });

    it('should remove all events when off() is called', function() {
      var spy_1 = sinon.spy();
      var spy_1_delegate = sinon.spy();
      var spy_2 = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var content = target.querySelector('.content');

      vent.on('event_1', spy_1);
      vent.on('event_1', '.content', spy_1_delegate);
      vent.on('event_2', spy_2);

      dispatch('event_1', target);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after dispatching event');

      dispatch('event_1', content);
      expect(spy_1_delegate.callCount).to.equal(1, 'spy_1_delegate call count after dispatching event on delegate');
      expect(spy_1.callCount).to.equal(2, 'spy_1 call count after dispatching event on delegate');

      dispatch('event_2', target);
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after dispatching event');

      vent.off();

      spy_1.reset();
      spy_1_delegate.reset();
      spy_2.reset();

      dispatch('event_1', target);
      dispatch('event_1', content);
      dispatch('event_2', target);

      dispatch('event_1', target);
      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after off()');

      dispatch('event_1', content);
      expect(spy_1_delegate.callCount).to.equal(0, 'spy_1_delegate call count after off()');

      dispatch('event_2', target);
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after off()');
    });

    it('should remove all events of a specific type when off(type) is called', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_other = sinon.spy();

      vent.on('event_main', spy_1);
      vent.on('event_main', spy_2);
      vent.on('event_other', spy_other);

      dispatch('event_main', target);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after dispatching event');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after dispatching event');

      dispatch('event_other', target);
      expect(spy_other.callCount).to.equal(1, 'spy_other call count after dispatching event');

      vent.off('event_main');

      spy_1.reset();
      spy_2.reset();
      spy_other.reset();

      dispatch('event_main', target);
      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after off(event_main)');
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after off(event_main)');

      dispatch('event_other', target);
      expect(spy_other.callCount).to.equal(1, 'spy_other call count after off(event_main) after dispatching event');
    });

    it('should remove all events of a specific type on a specific selector when off(type, selector) is called', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_direct = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var content = target.querySelector('.content');

      vent.on('event_main', '.content', spy_1);
      vent.on('event_main', '.content', spy_2);
      vent.on('event_main', spy_direct);

      dispatch('event_main', content);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after dispatching event');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after dispatching event');
      expect(spy_direct.callCount).to.equal(1, 'spy_direct call count after dispatching event');

      vent.off('event_main', '.content');

      spy_1.reset();
      spy_2.reset();
      spy_direct.reset();

      dispatch('event_main', content);
      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after off(event_main)');
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after off(event_main)');
      expect(spy_direct.callCount).to.equal(1, 'spy_direct call count after off(event_main) after dispatching event');
    });

    it('should remove all events of a specific type, on a specific selector, with a specific handler when off(type, selector, handler) is called', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_delegate = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var content = target.querySelector('.content');

      vent.on('event_main', spy_1);
      vent.on('event_main', spy_1);

      vent.on('event_main', '.content', spy_2);
      vent.on('event_main', spy_2);

      vent.on('event_main', '.content', spy_delegate);
      vent.on('event_main', '.content', spy_delegate);

      dispatch('event_main', content);
      expect(spy_1.callCount).to.equal(2, 'spy_1 call count after dispatching event');
      expect(spy_2.callCount).to.equal(2, 'spy_2 call count after dispatching event');
      expect(spy_delegate.callCount).to.equal(2, 'spy_delegate call count after dispatching event');

      vent.off('event_main', '.content', spy_delegate);

      spy_1.reset();
      spy_2.reset();
      spy_delegate.reset();

      dispatch('event_main', content);
      expect(spy_1.callCount).to.equal(2, 'spy_1 call count after off(event_main, .content, spy_1)');
      expect(spy_2.callCount).to.equal(2, 'spy_2 call count after off(event_main, .content, spy_1)');
      expect(spy_delegate.callCount).to.equal(0, 'spy_delegate call count after off(event_main, .content, spy_1)');
    });

    it('should remove all events regardless of type or selector when off(null, null, handler) is called', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var content = target.querySelector('.content');

      vent.on('event_main', '.content', spy_1);
      vent.on('event_main', '.content', spy_1);
      vent.on('event_main', spy_1);
      vent.on('event_main', spy_1);

      vent.on('event_main', '.content', spy_2);
      vent.on('event_main', spy_2);

      dispatch('event_main', content);
      expect(spy_1.callCount).to.equal(4, 'spy_1 call count after dispatching event');
      expect(spy_2.callCount).to.equal(2, 'spy_2 call count after dispatching event');

      vent.off(null, null, spy_1);

      spy_1.reset();
      spy_2.reset();

      dispatch('event_main', content);
      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after off(event_main, .content, spy_1)');
      expect(spy_2.callCount).to.equal(2, 'spy_2 call count after off(event_main, .content, spy_1)');
    });

    it('should remove all events of a specific type, on a specific selector, with a specific handler, with useCapture = true when off(type, selector, handler, capture) is called', function() {
      var spy_bubble = sinon.spy();
      var spy_capture = sinon.spy();
      var spy_other = sinon.spy();
      var spy_noSelector = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var content = target.querySelector('.content');

      vent.on('event_main', '.content', spy_capture, true);
      vent.on('event_main', '.content', spy_bubble, false);
      vent.on('event_main', '.content', spy_other);
      vent.on('event_main', spy_noSelector);

      dispatch('event_main', content);

      expect(spy_noSelector.callCount).to.equal(1, 'spy_noSelector call count after dispatching event');
      expect(spy_capture.callCount).to.equal(1, 'spy_capture call count after dispatching event');
      expect(spy_bubble.callCount).to.equal(1, 'spy call count after dispatching event');
      expect(spy_other.callCount).to.equal(1, 'spy_other call count after dispatching event');

      vent.off('event_main', '.content', spy_capture, true);

      spy_noSelector.reset();
      spy_capture.reset();
      spy_bubble.reset();
      spy_other.reset();

      dispatch('event_main', content);

      expect(spy_noSelector.callCount).to.equal(1, 'spy_noSelector call count after off(event_main, .content, spy_capture, true)');
      expect(spy_capture.callCount).to.equal(0, 'spy_capture call count after off(event_main, .content, spy_capture, true)');
      expect(spy_bubble.callCount).to.equal(1, 'spy_bubble call count after off(event_main, .content, spy_capture, true)');
      expect(spy_other.callCount).to.equal(1, 'spy_other call count after off(event_main, .content, spy_capture, true)');
    });

    it('should remove all events of a specific type, on a specific selector, with a specific handler, with useCapture = false when off(type, selector, handler, capture) is called', function() {
      var spy_bubble = sinon.spy();
      var spy_capture = sinon.spy();
      var spy_other = sinon.spy();
      var spy_noSelector = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var content = target.querySelector('.content');

      vent.on('event_main', '.content', spy_capture, true);
      vent.on('event_main', '.content', spy_bubble, false);
      vent.on('event_main', '.content', spy_other);
      vent.on('event_main', spy_noSelector);

      dispatch('event_main', content);

      expect(spy_noSelector.callCount).to.equal(1, 'spy_noSelector call count after dispatching event');
      expect(spy_capture.callCount).to.equal(1, 'spy_capture call count after dispatching event');
      expect(spy_bubble.callCount).to.equal(1, 'spy call count after dispatching event');
      expect(spy_other.callCount).to.equal(1, 'spy_other call count after dispatching event');

      vent.off('event_main', '.content', spy_bubble, false);

      spy_noSelector.reset();
      spy_capture.reset();
      spy_bubble.reset();
      spy_other.reset();

      dispatch('event_main', content);

      expect(spy_noSelector.callCount).to.equal(1, 'spy_noSelector call count after off(event_main, .content, spy_capture, false)');
      expect(spy_capture.callCount).to.equal(1, 'spy_capture call count after off(event_main, .content, spy_capture, false)');
      expect(spy_bubble.callCount).to.equal(0, 'spy_bubble call count after off(event_main, .content, spy_capture, false)');
      expect(spy_other.callCount).to.equal(1, 'spy_other call count after off(event_main, .content, spy_capture, false)');
    });

  });

  describe('propagation', function() {

    it('should stop prevent default and stop propagation, but not stop immediate propagation if one returns false', function() {
      var spy_inner = sinon.spy();
      var spy_outer = sinon.spy();
      var spy_nativeSameAsVent = sinon.spy();
      var spy_nativeDirectlyOnDispatcher = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Nested lists.html'];
      var inner = target.querySelector('.inner');

      vent.on('customEvent', '.inner', function() {
        spy_inner();
        return false;
      });

      vent.on('customEvent', '.outer', spy_outer);

      // This listener is added at the same level as the Vent instance's event listener
      // This listener SHOULD NOT execute as we intended to stop propagation on an element lower in the DOM
      target.addEventListener('customEvent', spy_nativeSameAsVent);

      // This listener is added at the level the event was dispatched from
      // This listener SHOULD execute as we did not intend to stop immediate propagation
      inner.addEventListener('customEvent', spy_nativeDirectlyOnDispatcher);

      dispatch('customEvent', inner);

      expect(spy_inner.callCount).to.equal(1, 'spy_inner call count after event dispatched');
      expect(spy_outer.callCount).to.equal(0, 'spy_outer call count after event dispatched and handler returned false');
      expect(spy_nativeSameAsVent.callCount).to.equal(0, 'spy_nativeSameAsVent call count after event dispatched and handler returned false');
      expect(spy_nativeDirectlyOnDispatcher.callCount).to.equal(1, 'spy_nativeDirectlyOnDispatcher call count after event dispatched and handler returned false');
    });

    it('should call handlers when child elements trigger events', function() {
      var spy_outer = sinon.spy();
      var spy_3 = sinon.spy();
      var spy_3_3 = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Nested lists.html'];
      var li_3_3 = target.querySelector('._3_3');

      var vent = new Vent('#list');

      vent.on('click', spy_outer);

      vent.on('click', '._3', spy_3);

      vent.on('click', '._3_3', spy_3_3);

      dispatch('click', li_3_3);

      expect(spy_3_3.callCount).to.equal(1, 'spy_3_3 call count after event dispatched');
      expect(spy_3.callCount).to.equal(1, 'spy_3 call count after event dispatched');
      expect(spy_outer.callCount).to.equal(1, 'spy_outer call count after event dispatched');

      expect(spy_3_3.calledBefore(spy_3)).to.equal(true, 'spy_3_3 called before spy_3_3');
      expect(spy_3.calledBefore(spy_outer)).to.equal(true, 'spy_3 called before spy_outer');
    });

    it('should not call other listeners or propagate if stopImmediatePropagation() called', function() {
      console.log('stopImmediatePropagation() test');
      var spy_ventInner = sinon.spy();
      var spy_ventInBetween = sinon.spy();
      var spy_ventRoot = sinon.spy();
      var spy_nativeSameAsVent = sinon.spy();
      var spy_nativeAbove = sinon.spy();
      var spy_nativeInBetween = sinon.spy();
      var spy_nativeDirectlyOnDispatcher = sinon.spy();

      /*
        |-----------------------------------------------------------------|
        |    .outerContainer                                              |
        |    spy_nativeAbove()                                            |
        |                                                                 |
        |   |---------------------------------------------------------|   |
        |   | .innerContainer                                         |   |
        |   |   Vent#_executeListeners()                              |   |
        |   |   spy_nativeSameAsVent()                                |   |
        |   |   spy_ventRoot()                                        |   |
        |   |                                                         |   |
        |   |   |-------------------------------------------------|   |   |
        |   |   |  .outer                                         |   |   |
        |   |   |    spy_nativeInBetween()                        |   |   |
        |   |   |    spy_ventInBetween()                          |   |   |
        |   |   |                                                 |   |   |
        |   |   |   -------------------------------------------   |   |   |
        |   |   |   |  .inner                                 |   |   |   |
        |   |   |   |    spy_nativeDirectlyOnDispatcher()     |   |   |   |
        |   |   |   |    spy_ventInner()                      |   |   |   |
        |   |   |   |                                         |   |   |   |
        |   |   |   -------------------------------------------   |   |   |
        |   |   |                                                 |   |   |
        |   |   |-------------------------------------------------|   |   |
        |   |                                                         |   |
        |   |---------------------------------------------------------|   |
        |                                                                 |
        |-----------------------------------------------------------------|
      */

      // Consider the outerContainer to be the target
      var outerContainer = target;
      outerContainer.className = 'outerContainer';

      // Create an inner container that we'll attach Vent to
      var innerContainer = document.createElement('div');
      innerContainer.className = 'innerContainer';
      outerContainer.appendChild(innerContainer);

      var vent = new Vent(innerContainer); // just be be explicit: we're listening on target

      // Added on the root
      vent.on('customEvent', function() {
        console.log('spy_ventRoot');
        spy_ventRoot();
      });

      innerContainer.innerHTML = window.__html__['tests/snippets/Nested lists.html'];
      var inner = innerContainer.querySelector('.inner');

      vent.on('customEvent', '.inner', function(event) {
        console.log('spy_ventInner + stopImmedatePropagation');
        event.stopImmediatePropagation();
        spy_ventInner();
      });

      vent.on('customEvent', '.outer', spy_ventInBetween);

      // This listener is added at one level above the Vent instance's event listener
      outerContainer.addEventListener('customEvent', function() {
        console.log('spy_nativeAbove');
        spy_nativeAbove();
      }, false);

      // This listener is added at the same level as the Vent instance's event listener
      innerContainer.addEventListener('customEvent', function() {
        console.log('spy_nativeSameAsVent');
        spy_nativeSameAsVent();
      }, false);

      // Listeners added here WILL run because we add a listener later to stopImmediatePropagation()
      // @todo: document this
      // This listener is added inbetween the element that dispatches the event and the element that the Vent instance's event listener is on
      // outer.addEventListener('customEvent', function() {
      //   console.log('spy_nativeInBetween');
      //   spy_nativeInBetween();
      // }, false);

      // This listener is added on the actual element that dispatches the event after the Vent instance's
      inner.addEventListener('customEvent', function() {
        // This should NOT run
        console.log('spy_nativeDirectlyOnDispatcher');
        spy_nativeDirectlyOnDispatcher();
      }, false);

      dispatch('customEvent', inner);

      // The listener on the element that dispatched this event SHOULD fire
      expect(spy_ventInner.callCount).to.equal(1, 'spy_ventInner call count after event dispatched');

      // Listeners on the element ABOVE the one that dispatched should NOT get called
      expect(spy_ventInBetween.callCount).to.equal(0, 'spy_ventInBetween call count after event dispatched and stopImmediatePropagation() called');
      expect(spy_nativeInBetween.callCount).to.equal(0, 'spy_nativeInBetween');

      // Since this listener was added AFTER vent, stopImmediatePropagation() should make it not run
      // However, since the listener we add to simulate this happens during dispatch, this is impossible
      // expect(spy_nativeDirectlyOnDispatcher.callCount).to.equal(0, 'spy_nativeDirectlyOnDispatcher call count after event dispatched and stopImmediatePropagation() called');

      // This listener SHOULD NOT execute if we're simulating stopImmedatePropagation() correctly
      // The event should not bubble upwards
      expect(spy_nativeInBetween.callCount).to.equal(0, 'spy_nativeInBetween');

      // This listener SHOULD NOT execute if we're simulating stopImmediatePropagation() correctly
      // The remaining listeners on the element should not execute
      expect(spy_nativeSameAsVent.callCount).to.equal(0, 'spy_nativeSameAsVent call count after event dispatched and stopImmediatePropagation() called');

      // This listener SHOULD NOT execute if we're simulating stopImmediatePropagation() correctly
      // The remaining listeners on the element should not execute
      expect(spy_ventRoot.callCount).to.equal(0, 'spy_ventRoot call count after event dispatched and stopImmediatePropagation() called');

      // However, the event should not propagate further
      expect(spy_nativeAbove.callCount).to.equal(0, 'spy_nativeAbove call count after event dispatched and stopImmediatePropagation() called');
    });

    it('should stop propagating if stopPropagation() called', function() {
      console.log('stopPropagation() test');
      var spy_ventInner = sinon.spy();
      var spy_ventInBetween = sinon.spy();
      var spy_ventRoot = sinon.spy();
      var spy_nativeSameAsVent = sinon.spy();
      var spy_nativeAbove = sinon.spy();
      var spy_nativeInBetween = sinon.spy();
      var spy_nativeDirectlyOnDispatcher = sinon.spy();

      /*
        |-----------------------------------------------------------------|
        |    .outerContainer                                              |
        |    spy_nativeAbove()                                            |
        |                                                                 |
        |   |---------------------------------------------------------|   |
        |   | .innerContainer                                         |   |
        |   |   Vent#_executeListeners()                              |   |
        |   |   spy_nativeSameAsVent()                                |   |
        |   |   spy_ventRoot()                                        |   |
        |   |                                                         |   |
        |   |   |-------------------------------------------------|   |   |
        |   |   |  .outer                                         |   |   |
        |   |   |    spy_nativeInBetween()                        |   |   |
        |   |   |    spy_ventInBetween()                          |   |   |
        |   |   |                                                 |   |   |
        |   |   |   -------------------------------------------   |   |   |
        |   |   |   |  .inner                                 |   |   |   |
        |   |   |   |    spy_nativeDirectlyOnDispatcher()     |   |   |   |
        |   |   |   |    spy_ventInner()                      |   |   |   |
        |   |   |   |                                         |   |   |   |
        |   |   |   -------------------------------------------   |   |   |
        |   |   |                                                 |   |   |
        |   |   |-------------------------------------------------|   |   |
        |   |                                                         |   |
        |   |---------------------------------------------------------|   |
        |                                                                 |
        |-----------------------------------------------------------------|
      */

      // Consider the outerContainer to be the target
      var outerContainer = target;
      outerContainer.className = 'outerContainer';

      // Create an inner container that we'll attach Vent to
      var innerContainer = document.createElement('div');
      innerContainer.className = 'innerContainer';
      outerContainer.appendChild(innerContainer);

      var vent = new Vent(innerContainer); // just be be explicit: we're listening on target

      // Added on the root
      vent.on('customEvent', function() {
        console.log('spy_ventRoot');
        spy_ventRoot();
      });

      innerContainer.innerHTML = window.__html__['tests/snippets/Nested lists.html'];
      var inner = innerContainer.querySelector('.inner');
      var outer = innerContainer.querySelector('.outer');

      vent.on('customEvent', '.inner', function(event) {
        console.log('spy_ventInner + stopPropagation');
        event.stopPropagation();
        spy_ventInner();
      });

      vent.on('customEvent', '.outer', spy_ventInBetween);

      // This listener is added at one level above the Vent instance's event listener
      outerContainer.addEventListener('customEvent', function() {
        console.log('spy_nativeAbove');
        spy_nativeAbove();
      }, false);

      // This listener is added at the same level as the Vent instance's event listener
      innerContainer.addEventListener('customEvent', function() {
        console.log('spy_nativeSameAsVent');
        spy_nativeSameAsVent();
      }, false);

      // This listener is added inbetween the element that dispatches the event and the element that the Vent instance's event listener is on
      outer.addEventListener('customEvent', function() {
        console.log('spy_nativeInBetween');
        spy_nativeInBetween();
      }, false);

      // This listener is added until the Ven instance's, on the actaul element that dispatches the event
      inner.addEventListener('customEvent', function() {
        console.log('spy_nativeDirectlyOnDispatcher');
        spy_nativeDirectlyOnDispatcher();
      }, false);

      dispatch('customEvent', inner);

      // The listener on the element that dispatched this event SHOULD fire
      expect(spy_ventInner.callCount).to.equal(1, 'spy_ventInner call count after event dispatched');

      // Listeners on the element ABOVE the one that dispatched should NOT get called
      expect(spy_ventInBetween.callCount).to.equal(0, 'spy_ventInBetween call count after event dispatched and stopPropagation() called');
      expect(spy_nativeInBetween.callCount).to.equal(0, 'spy_nativeInBetween');

      // Since we are only stopping upward propagation, not immedate, this listener should run
      expect(spy_nativeDirectlyOnDispatcher.callCount).to.equal(1, 'spy_nativeDirectlyOnDispatcher call count after event dispatched and stopPropagation() called');

      // This listener SHOULD NOT execute if we're simulating stopPropagation() correctly
      // The event should not bubble upwards
      expect(spy_nativeInBetween.callCount).to.equal(0, 'spy_nativeInBetween');

      // This listener SHOULD NOT execute if we're simulating stopPropagation() correctly
      // The remaining listeners on the element should not execute
      expect(spy_nativeSameAsVent.callCount).to.equal(0, 'spy_nativeSameAsVent call count after event dispatched and stopPropagation() called');

      // This listener SHOULD NOT execute if we're simulating stopPropagation() correctly
      // The remaining listeners on the element should not execute
      expect(spy_ventRoot.callCount).to.equal(0, 'spy_ventRoot call count after event dispatched and stopPropagation() called');

      // However, the event should not propagate further
      expect(spy_nativeAbove.callCount).to.equal(0, 'spy_nativeAbove call count after event dispatched and stopPropagation() called');
    });
  });

  describe('stopPropagation and stopImmediatePropagation behavior', function() {

    // This is impossible as the native listeners have not executed by the time we have executed our bubble phase listeners
    // @todo document this
    it.skip('should not execute the bubble phase listeners if a native event listener calls stopPropagation() in the capture phase', function() {
      target.innerHTML = window.__html__['tests/snippets/Nested.html'];
      var node0 = target.querySelector('#node0');
      var node1 = target.querySelector('#node1');
      var node2 = target.querySelector('#node2');

      var vent = new Vent(node0);

      // A listener in the capture phase UNDER where Vent is listening
      var spy_capture_native_node1 = sinon.spy();
      node1.addEventListener('customEvent', function(event) {
        console.log('spy_capture_native_node1 + stopPropagation');
        spy_capture_native_node1();
        event.stopPropagation();
      }, true);

      // A Vent listener on the root in the bubble phase
      var spy_bubble_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        console.log('spy_bubble_vent_node2');
        spy_bubble_vent_node2();
      }, false);

      dispatch('customEvent', node2);

      expect(spy_capture_native_node1.callCount).to.equal(1, 'spy_capture_native_node1 after event dispatched');
      expect(spy_bubble_vent_node2.callCount).to.equal(0, 'spy_bubble_vent_node2 after event dispatched and stopPropagation() called');
    });

    // This is impossible as the native listeners have not executed by the time we have executed our bubble phase listeners
    // @todo document this
    it.skip('should not execute the bubble phase listeners if a native event listener calls stopPropagation() in the bubble phase', function() {
      target.innerHTML = window.__html__['tests/snippets/Nested.html'];
      var node0 = target.querySelector('#node0');
      var node1 = target.querySelector('#node1');
      var node2 = target.querySelector('#node2');

      var vent = new Vent(node0);

      // A listener in the capture phase UNDER where Vent is listening
      var spy_capture_native_node1 = sinon.spy();
      node1.addEventListener('customEvent', function(event) {
        console.log('spy_capture_native_node1 + stopPropagation');
        spy_capture_native_node1();
        event.stopPropagation();
      }, false);

      // A Vent listener on the root in the bubble phase
      var spy_bubble_vent_node2 = sinon.spy();
      vent.on('customEvent', function() {
        console.log('spy_bubble_vent_node2');
        spy_bubble_vent_node2();
      }, false);

      dispatch('customEvent', node2);

      expect(spy_capture_native_node1.callCount).to.equal(1, 'spy_capture_native_node1 after event dispatched');
      expect(spy_bubble_vent_node2.callCount).to.equal(0, 'spy_bubble_vent_node2 after event dispatched and stopPropagation() called');
    });

    it('should have correct behavior for stopPropagation() for listeners added in the bubble phase', function() {
      target.innerHTML = window.__html__['tests/snippets/Nested.html'];
      var node0 = target.querySelector('#node0');
      var node1 = target.querySelector('#node1');
      var node2 = target.querySelector('#node2');
      var node3 = target.querySelector('#node3');
      var node4 = target.querySelector('#node4');

      var vent = new Vent(node0);

      // Listeners at the root, above where stopPropagation was called
      var spy_bubble_vent_node0 = sinon.spy();
      vent.on('customEvent', function() {
        // Should NOT be called
        console.log('spy_bubble_vent_node0');
        spy_bubble_vent_node0();
      }, false);

      var spy_bubble_native_node0 = sinon.spy();
      node0.addEventListener('customEvent', function() {
        // Should NOT be called
        console.log('spy_bubble_native_node0');
        spy_bubble_native_node0();
      }, false);

      // Listeners above where stopPropagation was called
      var spy_bubble_vent_node1 = sinon.spy();
      vent.on('customEvent', '#node1', function() {
        // Should NOT be called
        console.log('spy_bubble_vent_node1');
        spy_bubble_vent_node1();
      }, false);

      var spy_bubble_native_node1 = sinon.spy();
      node1.addEventListener('customEvent', function() {
        // Should NOT be called
        console.log('spy_bubble_native_node1');
        spy_bubble_native_node1();
      }, false);

      // Listeners at the level where stopPropagation is called
      var spy_bubble_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function(event) {
        console.log('spy_bubble_vent_node2 + stopPropagation');
        event.stopPropagation();
        spy_bubble_vent_node2();
      }, false);

      var spy_bubble_vent_node2_2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        console.log('spy_bubble_vent_node2_2');
        spy_bubble_vent_node2_2();
      }, false);

      var spy_bubble_native_node2 = sinon.spy();
      node2.addEventListener('customEvent', function() {
        // Should be called
        console.log('spy_bubble_native_node2');
        spy_bubble_native_node2();
      }, false);

      // Listeners one level above the node that dispatches the event
      var spy_bubble_vent_node3 = sinon.spy();
      vent.on('customEvent', '#node3', function() {
        // Should be called
        console.log('spy_bubble_vent_node3');
        spy_bubble_vent_node3();
      }, false);

      var spy_bubble_native_node3 = sinon.spy();
      node3.addEventListener('customEvent', function() {
        // Should be called
        console.log('spy_bubble_native_node3');
        spy_bubble_native_node3();
      }, false);

      // Listeners on the node that dispatches the event
      var spy_bubble_vent_node4 = sinon.spy();
      vent.on('customEvent', '#node4', function() {
        // Should be called
        console.log('spy_bubble_vent_node4');
        spy_bubble_vent_node4();
      }, false);

      var spy_bubble_native_node4 = sinon.spy();
      node4.addEventListener('customEvent', function() {
        // Should be called
        console.log('spy_bubble_native_node4');
        spy_bubble_native_node4();
      }, false);

      // Dispatch at the lowest level
      dispatch('customEvent', node4);

      // Listeners at the level of stopPropagation SHOULD be called
      expect(spy_bubble_vent_node2.callCount).to.equal(1, 'spy_bubble_vent_node2 call count after event dispatched');
      expect(spy_bubble_vent_node2_2.callCount).to.equal(1, 'spy_bubble_vent_node2_2 call count after event dispatched');
      expect(spy_bubble_native_node2.callCount).to.equal(1, 'spy_bubble_native_node2 call count after event dispatched');

      // Listeners below the stopPropagation SHOULD be called
      expect(spy_bubble_vent_node3.callCount).to.equal(1, 'spy_bubble_vent_node3 call count after event dispatched');
      expect(spy_bubble_native_node3.callCount).to.equal(1, 'spy_bubble_native_node3 call count after event dispatched');
      expect(spy_bubble_vent_node4.callCount).to.equal(1, 'spy_bubble_vent_node4 call count after event dispatched');
      expect(spy_bubble_native_node4.callCount).to.equal(1, 'spy_bubble_native_node4 call count after event dispatched');

      // Listeners above the stopPropagation call should NOT be called
      expect(spy_bubble_vent_node0.callCount).to.equal(0, 'spy_bubble_vent_node0 call count after event dispatched');
      expect(spy_bubble_native_node0.callCount).to.equal(0, 'spy_bubble_native_node0 call count after event dispatched');
      expect(spy_bubble_vent_node1.callCount).to.equal(0, 'spy_bubble_vent_node1 call count after event dispatched');
      expect(spy_bubble_native_node1.callCount).to.equal(0, 'spy_bubble_native_node1 call count after event dispatched');

      // Make sure listeners were called in the right order
      expect(spy_bubble_vent_node3.calledBefore(spy_bubble_vent_node2)).to.equal(true, 'spy_bubble_vent_node3 called before spy_bubble_vent_node2');
      expect(spy_bubble_vent_node4.calledBefore(spy_bubble_vent_node3)).to.equal(true, 'spy_bubble_vent_node4 called before spy_bubble_vent_node3');
    });

    it('should have correct behavior for stopImmediatePropagation() for listeners added in the bubble phase', function() {
      target.innerHTML = window.__html__['tests/snippets/Nested.html'];
      var node0 = target.querySelector('#node0');
      var node1 = target.querySelector('#node1');
      var node3 = target.querySelector('#node3');
      var node4 = target.querySelector('#node4');

      var vent = new Vent(node0);

      // Listeners at the root, above where stopImmediatePropagation was called
      var spy_bubble_vent_node0 = sinon.spy();
      vent.on('customEvent', function() {
        // Should NOT be called
        console.log('spy_bubble_vent_node0');
        spy_bubble_vent_node0();
      }, false);

      var spy_bubble_native_node0 = sinon.spy();
      node0.addEventListener('customEvent', function() {
        // Should NOT be called
        console.log('spy_bubble_native_node0');
        spy_bubble_native_node0();
      }, false);

      // Listeners above where stopImmediatePropagation was called
      var spy_bubble_vent_node1 = sinon.spy();
      vent.on('customEvent', '#node1', function() {
        // Should NOT be called
        console.log('spy_bubble_vent_node1');
        spy_bubble_vent_node1();
      }, false);

      var spy_bubble_native_node1 = sinon.spy();
      node1.addEventListener('customEvent', function() {
        // Should NOT be called
        console.log('spy_bubble_native_node1');
        spy_bubble_native_node1();
      }, false);

      // Listeners at the level where stopImmediatePropagation is called
      var spy_bubble_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function(event) {
        console.log('spy_bubble_vent_node2 + stopImmediatePropagation');
        event.stopImmediatePropagation();
        spy_bubble_vent_node2();
      }, false);

      var spy_bubble_vent_node2_2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        console.log('spy_bubble_vent_node2_2');
        spy_bubble_vent_node2_2();
      }, false);

      // var node2 = target.querySelector('#node2');
      // var spy_bubble_native_node2 = sinon.spy();
      // node2.addEventListener('customEvent', function() {
      //   // Should be called
      //   console.log('spy_bubble_native_node2');
      //   spy_bubble_native_node2();
      // }, false);

      // Listeners one level above the node that dispatches the event
      var spy_bubble_vent_node3 = sinon.spy();
      vent.on('customEvent', '#node3', function() {
        // Should be called
        console.log('spy_bubble_vent_node3');
        spy_bubble_vent_node3();
      }, false);

      var spy_bubble_native_node3 = sinon.spy();
      node3.addEventListener('customEvent', function() {
        // Should be called
        console.log('spy_bubble_native_node3');
        spy_bubble_native_node3();
      }, false);

      // Listeners on the node that dispatches the event
      var spy_bubble_vent_node4 = sinon.spy();
      vent.on('customEvent', '#node4', function() {
        // Should be called
        console.log('spy_bubble_vent_node4');
        spy_bubble_vent_node4();
      }, false);

      var spy_bubble_native_node4 = sinon.spy();
      node4.addEventListener('customEvent', function() {
        // Should be called
        console.log('spy_bubble_native_node4');
        spy_bubble_native_node4();
      }, false);

      // Dispatch at the lowest level
      dispatch('customEvent', node4);

      // The listener that calls stopImmediatePropagation SHOULD be called
      expect(spy_bubble_vent_node2.callCount).to.equal(1, 'spy_bubble_vent_node2 call count after event dispatched');

      // Listeners at the level of stopImmediatePropagation should NOT be called
      expect(spy_bubble_vent_node2_2.callCount).to.equal(0, 'spy_bubble_vent_node2_2 call count after event dispatched');

      // Unfortunately, this is impossible as the listener that does the stopImmediatePropagation call is added when the event is dispatched
      // @todo document this
      // expect(spy_bubble_native_node2.callCount).to.equal(0, 'spy_bubble_native_node2 call count after event dispatched');

      // Listeners below the stopImmediatePropagation SHOULD be called
      expect(spy_bubble_vent_node3.callCount).to.equal(1, 'spy_bubble_vent_node3 call count after event dispatched');
      expect(spy_bubble_native_node3.callCount).to.equal(1, 'spy_bubble_native_node3 call count after event dispatched');
      expect(spy_bubble_vent_node4.callCount).to.equal(1, 'spy_bubble_vent_node4 call count after event dispatched');
      expect(spy_bubble_native_node4.callCount).to.equal(1, 'spy_bubble_native_node4 call count after event dispatched');

      //Listeners above the stopImmediatePropagation call should NOT be called
      expect(spy_bubble_vent_node0.callCount).to.equal(0, 'spy_bubble_vent_node0 call count after event dispatched');
      expect(spy_bubble_native_node0.callCount).to.equal(0, 'spy_bubble_native_node0 call count after event dispatched');
      expect(spy_bubble_vent_node1.callCount).to.equal(0, 'spy_bubble_vent_node1 call count after event dispatched');
      expect(spy_bubble_native_node1.callCount).to.equal(0, 'spy_bubble_native_node1 call count after event dispatched');

      // Make sure listeners were called in the right order
      expect(spy_bubble_vent_node3.calledBefore(spy_bubble_vent_node2)).to.equal(true, 'spy_bubble_vent_node3 called before spy_bubble_vent_node2');
      expect(spy_bubble_vent_node4.calledBefore(spy_bubble_vent_node3)).to.equal(true, 'spy_bubble_vent_node4 called before spy_bubble_vent_node3');
    });

  });

  describe('useCapture', function() {
    it('should call capture and bubble phase listeners in the right order', function() {
      target.innerHTML = window.__html__['tests/snippets/Nested.html'];
      var node0 = target.querySelector('#node0');
      var node3 = target.querySelector('#node3');

      var vent = new Vent(node0);

      var spy_capture_vent_node0 = sinon.spy();
      vent.on('customEvent', function() {
        console.log('spy_capture_vent_node0');
        spy_capture_vent_node0();
      }, true);

      var spy_capture_vent_node0_2 = sinon.spy();
      vent.on('customEvent', function() {
        console.log('spy_capture_vent_node0_2');
        spy_capture_vent_node0_2();
      }, true);

      var spy_capture_vent_node1 = sinon.spy();
      vent.on('customEvent', '#node1', function() {
        console.log('spy_capture_vent_node1');
        spy_capture_vent_node1();
      }, true);

      var spy_capture_vent_node1_2 = sinon.spy();
      vent.on('customEvent', '#node1', function() {
        console.log('spy_capture_vent_node1_2');
        spy_capture_vent_node1_2();
      }, true);

      var spy_capture_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        console.log('spy_capture_vent_node2');
        spy_capture_vent_node2();
      }, true);

      var spy_capture_vent_node2_2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        console.log('spy_capture_vent_node2_2');
        spy_capture_vent_node2_2();
      }, true);

      var spy_capture_vent_node3 = sinon.spy();
      vent.on('customEvent', '#node3', function() {
        console.log('spy_capture_vent_node3');
        spy_capture_vent_node3();
      }, true);

      var spy_capture_vent_node3_2 = sinon.spy();
      vent.on('customEvent', '#node3', function() {
        console.log('spy_capture_vent_node3_2');
        spy_capture_vent_node3_2();
      }, true);

      var spy_bubble_vent_node3 = sinon.spy();
      vent.on('customEvent', '#node3', function() {
        console.log('spy_bubble_vent_node3');
        spy_bubble_vent_node3();
      }, false);

      var spy_bubble_vent_node3_2 = sinon.spy();
      vent.on('customEvent', '#node3', function() {
        console.log('spy_bubble_vent_node3_2');
        spy_bubble_vent_node3_2();
      }, false);

      var spy_bubble_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        console.log('spy_bubble_vent_node2');
        spy_bubble_vent_node2();
      }, false);

      var spy_bubble_vent_node2_2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        console.log('spy_bubble_vent_node2_2');
        spy_bubble_vent_node2_2();
      }, false);

      var spy_bubble_vent_node1 = sinon.spy();
      vent.on('customEvent', '#node1', function() {
        console.log('spy_bubble_vent_node1');
        spy_bubble_vent_node1();
      }, false);

      var spy_bubble_vent_node1_2 = sinon.spy();
      vent.on('customEvent', '#node1', function() {
        console.log('spy_bubble_vent_node1_2');
        spy_bubble_vent_node1_2();
      }, false);

      var spy_bubble_vent_node0 = sinon.spy();
      vent.on('customEvent', function() {
        console.log('spy_bubble_vent_node0');
        spy_bubble_vent_node0();
      }, false);

      var spy_bubble_vent_node0_2 = sinon.spy();
      vent.on('customEvent', function() {
        console.log('spy_bubble_vent_node0_2');
        spy_bubble_vent_node0_2();
      }, false);

      dispatch('customEvent', node3);

      // Make sure the capture phase listeners were called
      expect(spy_capture_vent_node0.callCount).to.equal(1, 'spy_capture_vent_node0 call count after event dispatched');
      expect(spy_capture_vent_node0_2.callCount).to.equal(1, 'spy_capture_vent_node0_2 call count after event dispatched');
      expect(spy_capture_vent_node1.callCount).to.equal(1, 'spy_capture_vent_node1 call count after event dispatched');
      expect(spy_capture_vent_node1_2.callCount).to.equal(1, 'spy_capture_vent_node1_2 call count after event dispatched');
      expect(spy_capture_vent_node2.callCount).to.equal(1, 'spy_capture_vent_node2 call count after event dispatched');
      expect(spy_capture_vent_node2_2.callCount).to.equal(1, 'spy_capture_vent_node2_2 call count after event dispatched');
      expect(spy_capture_vent_node3.callCount).to.equal(1, 'spy_capture_vent_node3 call count after event dispatched');
      expect(spy_capture_vent_node3_2.callCount).to.equal(1, 'spy_capture_vent_node3_2 call count after event dispatched');

      expect(spy_bubble_vent_node0.callCount).to.equal(1, 'spy_bubble_vent_node0 call count after event dispatched');
      expect(spy_bubble_vent_node0_2.callCount).to.equal(1, 'spy_bubble_vent_node0_2 call count after event dispatched');
      expect(spy_bubble_vent_node1.callCount).to.equal(1, 'spy_bubble_vent_node1 call count after event dispatched');
      expect(spy_bubble_vent_node1_2.callCount).to.equal(1, 'spy_bubble_vent_node1_2 call count after event dispatched');
      expect(spy_bubble_vent_node2.callCount).to.equal(1, 'spy_bubble_vent_node2 call count after event dispatched');
      expect(spy_bubble_vent_node2_2.callCount).to.equal(1, 'spy_bubble_vent_node2_2 call count after event dispatched');
      expect(spy_bubble_vent_node3.callCount).to.equal(1, 'spy_bubble_vent_node3 call count after event dispatched');
      expect(spy_bubble_vent_node3_2.callCount).to.equal(1, 'spy_bubble_vent_node3_2 call count after event dispatched');

      // Make sure the capture phase listeners were called in the right order
      expect(spy_capture_vent_node0.calledBefore(spy_capture_vent_node0_2)).to.equal(true, 'spy_capture_vent_node0 called before spy_capture_vent_node0_2');
      expect(spy_capture_vent_node0_2.calledBefore(spy_capture_vent_node1)).to.equal(true, 'spy_capture_vent_node0_2 called before spy_capture_vent_node1');
      expect(spy_capture_vent_node1.calledBefore(spy_capture_vent_node1_2)).to.equal(true, 'spy_capture_vent_node1 called before spy_capture_vent_node1_2');
      expect(spy_capture_vent_node1_2.calledBefore(spy_capture_vent_node2)).to.equal(true, 'spy_capture_vent_node1_2 called before spy_capture_vent_node2');
      expect(spy_capture_vent_node2.calledBefore(spy_capture_vent_node2_2)).to.equal(true, 'spy_capture_vent_node2 called before spy_capture_vent_node2_2');
      expect(spy_capture_vent_node2_2.calledBefore(spy_capture_vent_node3)).to.equal(true, 'spy_capture_vent_node2_2 called before spy_capture_vent_node3');
      expect(spy_capture_vent_node3.calledBefore(spy_capture_vent_node3_2)).to.equal(true, 'spy_capture_vent_node3 called before spy_capture_vent_node3_2');

      // Make sure capture was called before bubble
      expect(spy_capture_vent_node3_2.calledBefore(spy_bubble_vent_node3)).to.equal(true, 'spy_capture_vent_node3_2 called before spy_bubble_vent_node3');

      // Make sure the bubble phase listeners were called in the right order
      expect(spy_bubble_vent_node3.calledBefore(spy_bubble_vent_node3_2)).to.equal(true, 'spy_bubble_vent_node3 called before spy_bubble_vent_node3_2');
      expect(spy_bubble_vent_node3_2.calledBefore(spy_bubble_vent_node2)).to.equal(true, 'spy_bubble_vent_node3_2 called before spy_bubble_vent_node2');
      expect(spy_bubble_vent_node2.calledBefore(spy_bubble_vent_node2_2)).to.equal(true, 'spy_bubble_vent_node2 called before spy_bubble_vent_node2_2');
      expect(spy_bubble_vent_node2_2.calledBefore(spy_bubble_vent_node1)).to.equal(true, 'spy_bubble_vent_node2_2 called before spy_bubble_vent_node1');
      expect(spy_bubble_vent_node1.calledBefore(spy_bubble_vent_node1_2)).to.equal(true, 'spy_bubble_vent_node1 called before spy_bubble_vent_node1_2');
      expect(spy_bubble_vent_node1_2.calledBefore(spy_bubble_vent_node0)).to.equal(true, 'spy_bubble_vent_node1_2 called before spy_bubble_vent_node0');
      expect(spy_bubble_vent_node0.calledBefore(spy_bubble_vent_node0_2)).to.equal(true, 'spy_bubble_vent_node0 called before spy_bubble_vent_node0_2');
    });

    it('should have correct behavior for stopPropagation() for listeners added in the bubble phase', function() {
      target.innerHTML = window.__html__['tests/snippets/Nested.html'];
      var node0 = target.querySelector('#node0');
      var node1 = target.querySelector('#node1');
      var node2 = target.querySelector('#node2');
      var node3 = target.querySelector('#node3');

      var vent = new Vent(node0);

      var spy_capture_vent_node0 = sinon.spy();
      vent.on('customEvent', function() {
        // Should be called
        console.log('spy_capture_vent_node0');
        spy_capture_vent_node0();
      }, true);

      var spy_capture_native_node0 = sinon.spy();
      node0.addEventListener('customEvent', function() {
        // Should be called
        console.log('spy_capture_native_node0');
        spy_capture_native_node0();
      }, true);

      var spy_capture_vent_node1 = sinon.spy();
      vent.on('customEvent', '#node1', function(event) {
        // Should be called
        console.log('spy_capture_vent_node1 + stopPropagation');
        spy_capture_vent_node1();

        event.stopPropagation();
      }, true);

      var spy_capture_vent_node1_2 = sinon.spy();
      vent.on('customEvent', '#node1', function() {
        // Should be called
        console.log('spy_capture_vent_node1_2');
        spy_capture_vent_node1_2();
      }, true);

      var spy_capture_native_node1 = sinon.spy();
      node1.addEventListener('customEvent', function() {
        // Should be called
        console.log('spy_capture_native_node1');
        spy_capture_native_node1();
      }, true);

      var spy_capture_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        // Should NOT be called
        console.log('spy_capture_vent_node2');
        spy_capture_vent_node2();
      }, true);

      var spy_capture_native_node2 = sinon.spy();
      node2.addEventListener('customEvent', function() {
        // Should NOT be called
        console.log('spy_capture_native_node2');
        spy_capture_native_node2();
      }, true);

      var spy_bubble_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        // Should NOT be called
        console.log('spy_bubble_vent_node2');
        spy_bubble_vent_node2();
      }, false);

      dispatch('customEvent', node3);

      // Make sure the capture phase listeners were called
      expect(spy_capture_vent_node0.callCount).to.equal(1, 'spy_capture_vent_node0 call count after event dispatched');
      expect(spy_capture_native_node0.callCount).to.equal(1, 'spy_capture_native_node0 call count after event dispatched');
      expect(spy_capture_vent_node1.callCount).to.equal(1, 'spy_capture_vent_node1 call count after event dispatched');
      expect(spy_capture_vent_node1_2.callCount).to.equal(1, 'spy_capture_vent_node1_2 call count after event dispatched');
      expect(spy_capture_native_node1.callCount).to.equal(1, 'spy_capture_native_node1 call count after event dispatched');

      // Since we called stopPropagation(), deeper listeners should NOT have been called
      expect(spy_capture_vent_node2.callCount).to.equal(0, 'spy_capture_vent_node2 call count after event dispatched');

      // Since we called stopPropagation(), bubble listeners should NOT have been called
      expect(spy_bubble_vent_node2.callCount).to.equal(0, 'spy_bubble_vent_node2 call count after event dispatched');

      // Since we called stopPropagation(), bubble listeners should NOT have been called
      expect(spy_capture_native_node2.callCount).to.equal(0, 'spy_capture_native_node2 call count after event dispatched');

      // Make sure the capture phase listeners were called in the right order
      expect(spy_capture_vent_node0.calledBefore(spy_capture_vent_node1)).to.equal(true, 'spy_capture_vent_node0 called before spy_capture_vent_node1');
    });

    it('should have correct behavior for stopImmediatePropagation() for listeners added in the capture phase', function() {
      target.innerHTML = window.__html__['tests/snippets/Nested.html'];
      var node0 = target.querySelector('#node0');
      var node2 = target.querySelector('#node2');
      var node3 = target.querySelector('#node3');

      var vent = new Vent(node0);

      var spy_capture_vent_node0 = sinon.spy();
      vent.on('customEvent', function() {
        console.log('spy_capture_vent_node0');
        spy_capture_vent_node0();
      }, true);

      var spy_capture_native_node0 = sinon.spy();
      node0.addEventListener('customEvent', function() {
        console.log('spy_capture_native_node0');
        spy_capture_native_node0();
      }, true);

      var spy_capture_vent_node1 = sinon.spy();
      vent.on('customEvent', '#node1', function(event) {
        console.log('spy_capture_vent_node1 + stopImmediatePropagation');
        spy_capture_vent_node1();

        event.stopImmediatePropagation();
      }, true);

      var spy_capture_vent_node1_2 = sinon.spy();
      vent.on('customEvent', '#node1', function() {
        console.log('spy_capture_vent_node1_2');
        spy_capture_vent_node1_2();
      }, true);

      // This is impossible
      // @todo document this
      // var node1 = target.querySelector('#node1');
      // var spy_capture_native_node1 = sinon.spy();
      // node1.addEventListener('customEvent', function(event) {
      //   // Should NOT be called
      //   console.log('spy_capture_native_node1');
      //   spy_capture_native_node1();
      // }, true);

      var spy_capture_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        // Should NOT be called
        console.log('spy_capture_vent_node2');
        spy_capture_vent_node2();
      }, true);

      var spy_capture_native_node2 = sinon.spy();
      node2.addEventListener('customEvent', function() {
        // Should NOT be called
        console.log('spy_capture_native_node2');
        spy_capture_native_node2();
      }, true);

      var spy_bubble_vent_node2 = sinon.spy();
      vent.on('customEvent', '#node2', function() {
        // Should NOT be called
        console.log('spy_bubble_vent_node2');
        spy_bubble_vent_node2();
      }, false);

      dispatch('customEvent', node3);

      // Make sure the capture phase listeners were called
      expect(spy_capture_native_node0.callCount).to.equal(1, 'spy_capture_native_node0 call count after event dispatched');
      expect(spy_capture_vent_node0.callCount).to.equal(1, 'spy_capture_vent_node0 call count after event dispatched');
      expect(spy_capture_vent_node1.callCount).to.equal(1, 'spy_capture_vent_node1 call count after event dispatched');

      // Since we called stopImmediatePropagation, listeners at the same level should not have been called
      expect(spy_capture_vent_node1_2.callCount).to.equal(0, 'spy_capture_native_node1_2 call count after event dispatched');
      // expect(spy_capture_native_node1.callCount).to.equal(0, 'spy_capture_native_node1 call count after event dispatched');

      // Since we called stopPropagation(), deeper listeners should NOT have been called
      expect(spy_capture_vent_node2.callCount).to.equal(0, 'spy_capture_vent_node2 call count after event dispatched');

      // Since we called stopPropagation(), bubble listeners should NOT have been called
      expect(spy_bubble_vent_node2.callCount).to.equal(0, 'spy_bubble_vent_node2 call count after event dispatched');

      // Since we called stopPropagation(), bubble listeners should NOT have been called
      expect(spy_capture_native_node2.callCount).to.equal(0, 'spy_capture_native_node2 call count after event dispatched');

      // Make sure the capture phase listeners were called in the right order
      expect(spy_capture_vent_node0.calledBefore(spy_capture_vent_node1)).to.equal(true, 'spy_capture_vent_node0 called before spy_capture_vent_node1');
    });

    // This is impossible as we always execute bubble listeners in the capture phase
    // @todo document this
    it.skip('should set the correct phase for capture/bubble events', function() {
      var vent = new Vent(target);
      var bubbleSpy = sinon.spy();
      var captureSpy = sinon.spy();
      var bubblePhase;
      var capturePhase;

      target.innerHTML = window.__html__['tests/snippets/Nested.html'];
      var node1 = target.querySelector('#node1');

      vent.on('customEvent', '#node0', function(event) {
        bubblePhase = event.eventPhase;
        bubbleSpy();
      }, false);

      vent.on('customEvent', '#node0', function(event) {
        capturePhase = event.eventPhase;
        captureSpy();
      }, true);

      dispatch('customEvent', node1);

      expect(captureSpy.callCount).to.equal(1, 'captureSpy call count after event dispatched');
      expect(bubbleSpy.callCount).to.equal(1, 'bubbleSpy call count after event dispatched');

      expect(capturePhase).to.equal(1, 'Phase for capture listener');
      expect(bubblePhase).to.equal(3, 'Phase for bubble listener');

      expect(captureSpy.calledBefore(bubbleSpy)).to.equal(true, 'captureSpy called before bubbleSpy');
    });
  });

  describe('basic events', function() {

    it('should add, handle, and remove events directly on an element', function() {
      var spy = sinon.spy();

      vent.on('customEvent', spy);

      dispatch('customEvent', target);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event');

      vent.off('customEvent', spy);

      spy.reset();

      dispatch('customEvent', target);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and dispatching event');
    });

    it('should support silly event names', function() {
      var spy = sinon.spy();

      vent.on('hasOwnProperty', spy);

      dispatch('hasOwnProperty', target);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event');

      vent.off('hasOwnProperty', spy);

      spy.reset();

      dispatch('hasOwnProperty', target);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and dispatching event');
    });

    it('should add direct event when passed empty string for selector', function() {
      var spy = sinon.spy();

      vent.on('customEvent', '', spy);

      dispatch('customEvent', target);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event');

      vent.off('customEvent', spy);

      spy.reset();

      dispatch('customEvent', target);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and dispatching event');
    });

    it('should add, handle, and remove events directly on the window', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      dispatch('customEvent', window);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event');

      vent.off('customEvent', spy);

      spy.reset();

      dispatch('customEvent', window);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and dispatching event');
    });

    it('should handle events that bubble to window from document', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      dispatch('customEvent', document);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event');

      vent.off('customEvent', spy);

      spy.reset();

      dispatch('customEvent', document);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and dispatching event');
    });

    it('should handle events that bubble to window from document.documentElement', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      dispatch('customEvent', document.documentElement);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event');

      vent.off('customEvent', spy);

      spy.reset();

      dispatch('customEvent', document.documentElement);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and dispatching event');
    });

    it('should handle events that bubble to window from document.body', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      dispatch('customEvent', document.body);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event');

      vent.off('customEvent', spy);

      spy.reset();

      dispatch('customEvent', document.body);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and dispatching event');
    });

    it('should call all listeners when first listener removed during event callback', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_3 = sinon.spy();

      vent.on('customEvent', function spy_1_handler() {
        vent.off('customEvent', spy_1_handler);
        spy_1();
      });
      vent.on('customEvent', spy_2);
      vent.on('customEvent', spy_3);

      dispatch('customEvent', target);

      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after dispatching event on target element');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after dispatching event on target element');
      expect(spy_3.callCount).to.equal(1, 'spy_3 call count after dispatching event on target element');
    });

    it('should call all listeners when middle listener removed during event callback', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_3 = sinon.spy();

      vent.on('customEvent', spy_1);
      vent.on('customEvent', function spy_2_handler() {
        vent.off('customEvent', spy_2_handler);
        spy_2();
      });
      vent.on('customEvent', spy_3);

      dispatch('customEvent', target);

      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after dispatching event on target element');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after dispatching event on target element');
      expect(spy_3.callCount).to.equal(1, 'spy_3 call count after dispatching event on target element');
    });

    it('should call all listeners when last listener removed during event callback', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_3 = sinon.spy();

      vent.on('customEvent', spy_1);
      vent.on('customEvent', spy_2);
      vent.on('customEvent', function spy_3_handler() {
        vent.off('customEvent', spy_3_handler);
        spy_3();
      });

      dispatch('customEvent', target);

      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after dispatching event on target element');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after dispatching event on target element');
      expect(spy_3.callCount).to.equal(1, 'spy_3 call count after dispatching event on target element');
    });
  });

  describe('dispatch', function() {
    it('should dispatch events', function() {
      var spy = sinon.spy();
      vent.on('customEvent', spy);
      vent.dispatch('customEvent');
      expect(spy.callCount).to.equal(1, 'spy call count after event dispatched');
    });

    it('should set options.bubbles = true by default', function() {
      var spy_window = sinon.spy();
      target.addEventListener('customEvent', spy_window);

      vent.dispatch('customEvent');
      expect(spy_window.callCount).to.equal(1, 'spy_window call count after event dispatched');

      vent.dispatch('customEvent', { cancelable: false });
      expect(spy_window.callCount).to.equal(2, 'spy_window call count after event dispatched again');
    });

    it('should support options.bubbles = false', function() {
      var spy_window = sinon.spy();
      var spy_direct = sinon.spy();

      window.addEventListener('customEvent', spy_window);
      target.addEventListener('customEvent', spy_direct);

      vent.dispatch('customEvent', {
        bubbles: false
      });

      expect(spy_window.callCount).to.equal(0, 'spy_window call count after event dispatched');
      expect(spy_direct.callCount).to.equal(1, 'spy_direct call count after event dispatched');
    });

    it('should correctly set event.defaultPrevented if event.preventDefault() called', function() {
      var spy_window = sinon.spy();

      window.addEventListener('customEvent', function(event) {
        event.preventDefault();
        spy_window();
      });

      var event = vent.dispatch('customEvent');

      expect(spy_window.callCount).to.equal(1, 'spy_window call count after event dispatched');
      expect(event.defaultPrevented).to.equal(true, 'event.defaultPrevented after event dispatched');
      expect(event).to.be.instanceof(Event);
    });
  });

  describe('delegation', function() {

    it('should add, handle, and remove events with basic delegation', function() {
      var spy = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      // Give the root the same selector to see if it fails
      target.className = 'content';

      var section = target.querySelector('.section');
      var content = target.querySelector('.content');

      vent.on('customEvent', '.content', spy);

      dispatch('customEvent', target);

      expect(spy.callCount).to.equal(0, 'spy call count after dispatching event on root element');

      spy.reset();

      dispatch('customEvent', section);

      expect(spy.callCount).to.equal(0, 'spy call count after dispatching event on other element');

      spy.reset();

      dispatch('customEvent', content);

      expect(spy.callCount).to.equal(1, 'spy call count after dispatching event on delegate element');
    });

    it('should add, handle, and remove events with and without basic delegation', function() {
      var spy_target = sinon.spy();
      var spy_delegate = sinon.spy();

      // Add a child element to delegate to
      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];

      var content = target.querySelector('.content');

      vent.on('customEvent', '.section', spy_delegate);
      vent.on('customEvent', spy_target);

      dispatch('customEvent', content);

      expect(spy_delegate.callCount).to.equal(1, 'spy_delegate call count after dispatching event on other element');
      expect(spy_target.callCount).to.equal(1, 'spy_target call count after dispatching event on other element');
    });

    it('should add, handle, and remove events with basic delegation on window', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];

      var content = target.querySelector('.content');

      vent.on('customEvent', '.content', spy);

      dispatch('customEvent', window);

      expect(spy.callCount).to.equal(0, 'Call count after dispatching event on the window itself');

      dispatch('customEvent', content);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event on target element');
    });

    it('should handle events dispatched on textNodes within the delegated elements', function() {
      var spy = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var p = target.querySelector('p');
      var textNode = p.childNodes[0];

      vent.on('customEvent', '.content', spy);

      dispatch('customEvent', p);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event on target element');

      dispatch('customEvent', textNode);

      expect(spy.callCount).to.equal(2, 'Call count after dispatching event on textNode child of target');
    });

    it('should add, handle, and remove events with basic delegation and namespaces', function() {
      var spy_delegate = sinon.spy();
      var spy_root = sinon.spy();

      // Add a child element to delegate to
      var div = document.createElement('div');
      div.className = 'myClass';
      target.appendChild(div);

      vent.on('customEvent.ns', '.myClass', spy_delegate);
      vent.on('customEvent.ns', spy_root);

      dispatch('customEvent', div);

      expect(spy_delegate.callCount).to.equal(1, 'delegate call count after dispatching event on other element');
      expect(spy_root.callCount).to.equal(1, 'root call count after dispatching event on other element');

      vent.off('.ns', '.myClass');

      spy_delegate.reset();
      spy_root.reset();

      dispatch('customEvent', div);

      expect(spy_delegate.callCount).to.equal(0, 'delegate call count after off(ns, sel) events and dispatching event on target element');
      expect(spy_root.callCount).to.equal(1, 'root call count after off(ns, sel) events and dispatching event on target element');

      vent.off('.ns');

      spy_delegate.reset();
      spy_root.reset();

      dispatch('customEvent', div);

      expect(spy_delegate.callCount).to.equal(0, 'delegate call count after off(ns) and dispatching event on target element');
      expect(spy_root.callCount).to.equal(0, 'root call count after off(ns) and dispatching event on target element');
    });

    function testScopedSelectorPrefix(scopePrefix) {
      return function() {
        target.innerHTML = window.__html__['tests/snippets/Menu.html'];
        var menu = target.querySelector('#menu');

        var vent = new Vent(menu);
        var spy = sinon.spy();

        vent.on('customEvent', scopePrefix+' .menu-title', function(event) {
          expect(event.target.parentNode).to.equal(menu);
          spy();
        });

        var titles = menu.querySelectorAll('.menu-title');

        for (var i = 0; i < titles.length; i++) {
          dispatch('customEvent', titles[i]);
        }

        expect(spy.callCount).to.equal(1, 'spy call count as compared to .menu-titles element count');
      };
    }

    it('should support delegation with scoped selectors with >', testScopedSelectorPrefix('>'));
    it('should support delegation with scoped selectors with >', testScopedSelectorPrefix(':scope >'));
  });

  describe('namespaces', function() {

    it('should add and remove multiple namespaced events', function() {
      var spy_first = sinon.spy();
      var spy_second = sinon.spy();
      var spy_noNS = sinon.spy();

      vent.on('first.ns', spy_first);
      vent.on('second.ns', spy_second);
      vent.on('noNS', spy_noNS); // Make sure it doesn't kill events outside of namespace

      dispatch('first', target);
      dispatch('second', target);
      dispatch('noNS', target);

      expect(spy_first.callCount).to.equal(1, 'first.ns spy call count after dispatching event');
      expect(spy_second.callCount).to.equal(1, 'second.ns spy call count after dispatching event');
      expect(spy_noNS.callCount).to.equal(1, 'noNS spy call count after dispatching event');

      vent.off('.ns');

      spy_first.reset();
      spy_second.reset();
      spy_noNS.reset();

      dispatch('first', target);
      dispatch('second', target);
      dispatch('noNS', target);

      expect(spy_first.callCount).to.equal(0, 'first.ns spy call count after off(ns) and dispatching event');
      expect(spy_second.callCount).to.equal(0, 'second.ns spy count after off(ns) and dispatching event');
      expect(spy_noNS.callCount).to.equal(1, 'noNS spy count after off(ns) and dispatching event');
    });

    it('should support multiple namespaces for a single listener', function() {
      var spy_ns1 = sinon.spy();
      var spy_ns2 = sinon.spy();
      var spy_ns1ns2 = sinon.spy();
      var spy_ns1ns2ns3 = sinon.spy();

      vent.on('customEvent.ns1', spy_ns1);
      vent.on('customEvent.ns2', spy_ns2);
      vent.on('customEvent.ns1.ns2', spy_ns1ns2);
      vent.on('customEvent.ns1.ns2.ns3', spy_ns1ns2ns3);

      dispatch('customEvent', target);

      expect(spy_ns1.callCount).to.equal(1, 'spy_ns1 call count after dispatching event');
      expect(spy_ns2.callCount).to.equal(1, 'spy_ns2 call count after dispatching event');
      expect(spy_ns1ns2.callCount).to.equal(1, 'spy_ns1ns2 call count after dispatching event');
      expect(spy_ns1ns2ns3.callCount).to.equal(1, 'spy_ns1ns2ns3 call count after dispatching event');

      vent.off('.ns2');

      spy_ns1.reset();
      spy_ns2.reset();
      spy_ns1ns2.reset();
      spy_ns1ns2ns3.reset();

      dispatch('customEvent', target);

      expect(spy_ns1.callCount).to.equal(1, 'spy_ns1 call count after removing .ns2 and dispatching event');
      expect(spy_ns2.callCount).to.equal(0, 'spy_ns2 count after removing .ns2 and dispatching event');
      expect(spy_ns1ns2.callCount).to.equal(1, 'spy_ns1ns2 count after removing .ns2 and dispatching event');
      expect(spy_ns1ns2ns3.callCount).to.equal(1, 'spy_ns1ns2ns3 call count after dispatching event');

      vent.off('.ns1.ns2.ns3');

      spy_ns1.reset();
      spy_ns2.reset();
      spy_ns1ns2.reset();
      spy_ns1ns2ns3.reset();

      dispatch('customEvent', target);

      expect(spy_ns1.callCount).to.equal(1, 'spy_ns1 call count after removing .ns1.ns2 and dispatching event');
      expect(spy_ns2.callCount).to.equal(0, 'spy_ns2 count after removing .ns1.ns2 and dispatching event');
      expect(spy_ns1ns2.callCount).to.equal(1, 'spy_ns1ns2 count after removing .ns1.ns2 and dispatching event');
      expect(spy_ns1ns2ns3.callCount).to.equal(0, 'spy_ns1ns2ns3 call count after dispatching event');

      vent.off('.ns1');
      dispatch('customEvent', target);

      spy_ns1.reset();
      spy_ns2.reset();
      spy_ns1ns2.reset();
      spy_ns1ns2ns3.reset();

      expect(spy_ns1.callCount).to.equal(0, 'spy_ns1 call count after removing .ns1.ns2 and dispatching event');
      expect(spy_ns2.callCount).to.equal(0, 'spy_ns2 count after removing .ns1.ns2 and dispatching event');
      expect(spy_ns1ns2.callCount).to.equal(0, 'spy_ns1ns2 count after removing .ns1.ns2 and dispatching event');
      expect(spy_ns1ns2ns3.callCount).to.equal(0, 'spy_ns1ns2ns3 call count after dispatching event');
    });

  });
});
