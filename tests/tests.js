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
    document.body.appendChild(target);
    vent = new Vent(target);
  });

  afterEach(function() {
    if (target.parentNode === document.body) {
      document.body.removeChild(target);
    }
    vent.destroy();
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

      vent.on('event_1', spy_3)
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

  describe('useCapture', function() {
    it('should fire useCapture listeners during the capture phase', function() {
      var vent = new Vent(document);
      var bubbleSpy = sinon.spy();
      var captureSpy = sinon.spy();
      var bubblePhase;
      var capturePhase;

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var content = target.querySelector('.content');

      vent.on('customEvent', '.content', function(event) {
        bubblePhase = event.eventPhase;
        bubbleSpy();
      }, false);

      vent.on('customEvent', '.content', function(event) {
        capturePhase = event.eventPhase;
        captureSpy();
      }, true);

      dispatch('customEvent', content);

      expect(capturePhase).to.equal(1, 'Phase for capture listener');
      expect(bubblePhase).to.equal(3, 'Phase for bubble listener');
      expect(captureSpy.calledBefore(bubbleSpy)).to.equal(true, 'captureSpy called before bubbleSpy');

      expect(captureSpy.callCount).to.equal(1, 'captureSpy call count after event dispatched');
      expect(bubbleSpy.callCount).to.equal(1, 'bubbleSpy call count after event dispatched');

      vent.off();

      dispatch('customEvent', content);

      captureSpy.reset();
      bubbleSpy.reset();

      expect(captureSpy.callCount).to.equal(0, 'captureSpy call count after off()');
      expect(bubbleSpy.callCount).to.equal(0, 'bubbleSpy call count after off()');
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
      window.addEventListener('customEvent', spy_window);

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
      target.className = 'content'

      var section = target.querySelector('.section');
      var content = target.querySelector('.content');

      vent.on('customEvent', '.content', spy);

      dispatch('customEvent', section);

      expect(spy.callCount).to.equal(0, 'Call count after dispatching event on other element');

      dispatch('customEvent', target);

      expect(spy.callCount).to.equal(0, 'Call count after dispatching event on root element');

      dispatch('customEvent', content);

      expect(spy.callCount).to.equal(1, 'Call count after dispatching event on target element');
    });

    it('should add, handle, and remove events with basic delegation on window', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      // Give the root the same selector to see if it fails
      target.className = 'content'

      var section = target.querySelector('.section');
      var content = target.querySelector('.content');

      vent.on('customEvent', '.content', spy);

      dispatch('customEvent', section);

      expect(spy.callCount).to.equal(0, 'Call count after dispatching event on other element');

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
        target.innerHTML = window.__html__['tests/snippets/Nested lists.html'];
        var outer = target.querySelector('.outer');

        var vent = new Vent(outer);
        var spy = sinon.spy();

        vent.on('customEvent', scopePrefix+' li', function(event) {
          expect(event.target.parentNode).to.equal(outer);
          spy();
        });

        var lis = outer.querySelectorAll('li');

        for (var i = 0; i < lis.length; i++) {
          dispatch('customEvent', lis[i]);
        }

        expect(spy.callCount).to.equal(outer.children.length, 'spy call count as compared to lis element length');
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
