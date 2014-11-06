describe('Vent', function() {
  var target;
  var vent;

  /**
    Trigger an event
  */
  function trigger(eventName, element, options) {
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

  describe('event removal', function() {
    it('should fire other listeners when event of the same type is removed', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      vent.on('event_1', spy_1);
      vent.on('event_1', spy_2);

      trigger('event_1', target);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after triggering event');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after triggering event');

      vent.off('event_1', spy_1);

      spy_1.reset();
      spy_2.reset();

      trigger('event_1', target);

      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after removing listener');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after removing listener');
    });

    it('should add and call listeners readded after all events of the same type are removed', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_3 = sinon.spy();
      vent.on('event_1', spy_1);
      vent.on('event_1', spy_2);

      trigger('event_1', target);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after triggering event');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after triggering event');

      vent.off('event_1', spy_1);
      vent.off('event_1', spy_2);

      spy_1.reset();
      spy_2.reset();

      trigger('event_1', target);

      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after removing listener');
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after removing listener');

      vent.on('event_1', spy_3)
      trigger('event_1', target);

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

      trigger('event_1', target);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after triggering event');

      trigger('event_1', content);
      expect(spy_1_delegate.callCount).to.equal(1, 'spy_1_delegate call count after triggering event on delegate');
      expect(spy_1.callCount).to.equal(2, 'spy_1 call count after triggering event on delegate');

      trigger('event_2', target);
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after triggering event');

      vent.off();

      spy_1.reset();
      spy_1_delegate.reset();
      spy_2.reset();

      trigger('event_1', target);
      trigger('event_1', content);
      trigger('event_2', target);

      trigger('event_1', target);
      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after off()');

      trigger('event_1', content);
      expect(spy_1_delegate.callCount).to.equal(0, 'spy_1_delegate call count after off()');

      trigger('event_2', target);
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after off()');
    });

    it('should remove all events of a specific type when off(type) is called', function() {
      var spy_1 = sinon.spy();
      var spy_2 = sinon.spy();
      var spy_other = sinon.spy();

      vent.on('event_main', spy_1);
      vent.on('event_main', spy_2);
      vent.on('event_other', spy_other);

      trigger('event_main', target);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after triggering event');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after triggering event');

      trigger('event_other', target);
      expect(spy_other.callCount).to.equal(1, 'spy_other call count after triggering event');

      vent.off('event_main');

      spy_1.reset();
      spy_2.reset();
      spy_other.reset();

      trigger('event_main', target);
      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after off(event_main)');
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after off(event_main)');

      trigger('event_other', target);
      expect(spy_other.callCount).to.equal(1, 'spy_other call count after off(event_main) after triggering event');
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

      trigger('event_main', content);
      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after triggering event');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after triggering event');
      expect(spy_direct.callCount).to.equal(1, 'spy_direct call count after triggering event');

      vent.off('event_main', '.content');

      spy_1.reset();
      spy_2.reset();
      spy_direct.reset();

      trigger('event_main', content);
      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after off(event_main)');
      expect(spy_2.callCount).to.equal(0, 'spy_2 call count after off(event_main)');
      expect(spy_direct.callCount).to.equal(1, 'spy_direct call count after off(event_main) after triggering event');
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

      trigger('event_main', content);
      expect(spy_1.callCount).to.equal(2, 'spy_1 call count after triggering event');
      expect(spy_2.callCount).to.equal(2, 'spy_2 call count after triggering event');
      expect(spy_delegate.callCount).to.equal(2, 'spy_delegate call count after triggering event');

      vent.off('event_main', '.content', spy_delegate);

      spy_1.reset();
      spy_2.reset();
      spy_delegate.reset();

      trigger('event_main', content);
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

      trigger('event_main', content);
      expect(spy_1.callCount).to.equal(4, 'spy_1 call count after triggering event');
      expect(spy_2.callCount).to.equal(2, 'spy_2 call count after triggering event');

      vent.off(null, null, spy_1);

      spy_1.reset();
      spy_2.reset();

      trigger('event_main', content);
      expect(spy_1.callCount).to.equal(0, 'spy_1 call count after off(event_main, .content, spy_1)');
      expect(spy_2.callCount).to.equal(2, 'spy_2 call count after off(event_main, .content, spy_1)');
    });

    it.skip('should remove all events of a specific type, on a specific selector, with a specific handler, with a specific useCapture when off(type, selector, handler, capture) is called', function() {

    });

  });

  describe('direct events', function() {

    it('should add, handle, and remove events directly on an element', function() {
      var spy = sinon.spy();

      vent.on('customEvent', spy);

      trigger('customEvent', target);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event');

      vent.off('customEvent', spy);

      spy.reset();

      trigger('customEvent', target);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and triggering event');
    });

    it('should add, handle, and remove events directly on the window', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      trigger('customEvent', window);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event');

      vent.off('customEvent', spy);

      spy.reset();

      trigger('customEvent', window);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and triggering event');
    });

    it('should handle events that bubble to window from document', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      trigger('customEvent', document);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event');

      vent.off('customEvent', spy);

      spy.reset();

      trigger('customEvent', document);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and triggering event');
    });

    it('should handle events that bubble to window from document.documentElement', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      trigger('customEvent', document.documentElement);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event');

      vent.off('customEvent', spy);

      spy.reset();

      trigger('customEvent', document.documentElement);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and triggering event');
    });

    it('should handle events that bubble to window from document.body', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      trigger('customEvent', document.body);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event');

      vent.off('customEvent', spy);

      spy.reset();

      trigger('customEvent', document.body);

      expect(spy.callCount).to.equal(0, 'Call count after removing listener and triggering event');
    });

  });

  describe('state changes', function() {
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

      trigger('customEvent', target);

      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after triggering event on target element');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after triggering event on target element');
      expect(spy_3.callCount).to.equal(1, 'spy_3 call count after triggering event on target element');
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

      trigger('customEvent', target);

      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after triggering event on target element');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after triggering event on target element');
      expect(spy_3.callCount).to.equal(1, 'spy_3 call count after triggering event on target element');
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

      trigger('customEvent', target);

      expect(spy_1.callCount).to.equal(1, 'spy_1 call count after triggering event on target element');
      expect(spy_2.callCount).to.equal(1, 'spy_2 call count after triggering event on target element');
      expect(spy_3.callCount).to.equal(1, 'spy_3 call count after triggering event on target element');
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

      trigger('customEvent', section);

      expect(spy.callCount).to.equal(0, 'Call count after triggering event on other element');

      trigger('customEvent', target);

      expect(spy.callCount).to.equal(0, 'Call count after triggering event on root element');

      trigger('customEvent', content);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event on target element');
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

      trigger('customEvent', section);

      expect(spy.callCount).to.equal(0, 'Call count after triggering event on other element');

      trigger('customEvent', window);

      expect(spy.callCount).to.equal(0, 'Call count after triggering event on the window itself');

      trigger('customEvent', content);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event on target element');
    });

    it('should handle events triggered on textNodes within the delegated elements', function() {
      var spy = sinon.spy();

      target.innerHTML = window.__html__['tests/snippets/Section with paragraphs.html'];
      var p = target.querySelector('p');
      var textNode = p.childNodes[0];

      vent.on('customEvent', '.content', spy);

      trigger('customEvent', p);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event on target element');

      trigger('customEvent', textNode);

      expect(spy.callCount).to.equal(2, 'Call count after triggering event on textNode child of target');
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

      trigger('customEvent', div);

      expect(spy_delegate.callCount).to.equal(1, 'delegate call count after triggering event on other element');
      expect(spy_root.callCount).to.equal(1, 'root call count after triggering event on other element');

      vent.off('.ns', '.myClass');

      spy_delegate.reset();
      spy_root.reset();

      trigger('customEvent', div);

      expect(spy_delegate.callCount).to.equal(0, 'delegate call count after off(ns, sel) events and triggering event on target element');
      expect(spy_root.callCount).to.equal(1, 'root call count after off(ns, sel) events and triggering event on target element');

      vent.off('.ns');

      spy_delegate.reset();
      spy_root.reset();

      trigger('customEvent', div);

      expect(spy_delegate.callCount).to.equal(0, 'delegate call count after off(ns) and triggering event on target element');
      expect(spy_root.callCount).to.equal(0, 'root call count after off(ns) and triggering event on target element');
    });

    it.skip('should add, handle, and remove events with rooted delegation', function() {
    });

  });

  describe('namespaces', function() {

    it('should add and remove multiple namespaced events', function() {
      var spy_first = sinon.spy();
      var spy_second = sinon.spy();
      var spy_noNS = sinon.spy();

      vent.on('first.ns', spy_first);
      vent.on('second.ns', spy_second);
      vent.on('noNS', spy_noNS); // Make sure it doesn't kill events outside of namespace

      trigger('first', target);
      trigger('second', target);
      trigger('noNS', target);

      expect(spy_first.callCount).to.equal(1, 'first.ns spy call count after triggering event');
      expect(spy_second.callCount).to.equal(1, 'second.ns spy call count after triggering event');
      expect(spy_noNS.callCount).to.equal(1, 'noNS spy call count after triggering event');

      vent.off('.ns');

      spy_first.reset();
      spy_second.reset();
      spy_noNS.reset();

      trigger('first', target);
      trigger('second', target);
      trigger('noNS', target);

      expect(spy_first.callCount).to.equal(0, 'first.ns spy call count after off(ns) and triggering event');
      expect(spy_second.callCount).to.equal(0, 'second.ns spy count after off(ns) and triggering event');
      expect(spy_noNS.callCount).to.equal(1, 'noNS spy count after off(ns) and triggering event');
    });

    it('should support multiple namespaces for a single listener', function() {
      var spy_first = sinon.spy();
      var spy_second = sinon.spy();

      vent.on('first.ns1.ns2', spy_first);
      vent.on('second.ns2', spy_second);

      trigger('first', target);
      trigger('second', target);

      expect(spy_first.callCount).to.equal(1, 'first spy call count after triggering event');
      expect(spy_second.callCount).to.equal(1, 'second spy call count after triggering event');

      vent.off('.ns2');

      spy_first.reset();
      spy_second.reset();

      trigger('first', target);
      trigger('second', target);

      expect(spy_first.callCount).to.equal(0, 'first spy call count after removing listener and triggering event');
      expect(spy_second.callCount).to.equal(0, 'second spy count after removing listener and triggering event');
    });

  });
});
