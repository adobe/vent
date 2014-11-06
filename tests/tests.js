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

  describe('direct events', function() {

    it('should add, handle, and remove events directly on an element', function() {
      var spy = sinon.spy();

      vent.on('customEvent', spy);

      trigger('customEvent', target);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event');

      vent.off('customEvent', spy);

      trigger('customEvent', target);

      expect(spy.callCount).to.equal(1, 'Call count after removing listener and triggering event');
    });

    it('should add, handle, and remove events directly on the window', function() {
      var vent = new Vent(window);

      var spy = sinon.spy();

      vent.on('customEvent', spy);

      trigger('customEvent', window);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event');

      vent.off('customEvent', spy);

      trigger('customEvent', window);

      expect(spy.callCount).to.equal(1, 'Call count after removing listener and triggering event');
    });

  });

  describe('delegation', function() {

    it('should add, handle, and remove events with basic delegation', function() {
      var spy = sinon.spy();

      // Give the root the same selector to see if it fails
      var div = document.createElement('div');
      target.className = div.className = 'myClass';

      var p = document.createElement('p');

      target.appendChild(p);
      target.appendChild(div);

      vent.on('customEvent', '.myClass', spy);

      trigger('customEvent', p);

      expect(spy.callCount).to.equal(0, 'Call count after triggering event on other element');

      trigger('customEvent', target);

      expect(spy.callCount).to.equal(0, 'Call count after triggering event on root element');

      trigger('customEvent', div);

      expect(spy.callCount).to.equal(1, 'Call count after triggering event on target element');
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

      trigger('customEvent', div);

      expect(spy_delegate.callCount).to.equal(1, 'delegate call count after off(ns, sel) events and triggering event on target element');
      expect(spy_root.callCount).to.equal(2, 'root call count after off(ns, sel) events and triggering event on target element');

      vent.off('.ns');

      trigger('customEvent', div);

      expect(spy_delegate.callCount).to.equal(1, 'delegate call count after off(ns) and triggering event on target element');
      expect(spy_root.callCount).to.equal(2, 'root call count after off(ns) and triggering event on target element');
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

      trigger('first', target);
      trigger('second', target);
      trigger('noNS', target);

      expect(spy_first.callCount).to.equal(1, 'first.ns spy call count after off(ns) and triggering event');
      expect(spy_second.callCount).to.equal(1, 'second.ns spy count after off(ns) and triggering event');
      expect(spy_noNS.callCount).to.equal(2, 'noNS spy count after off(ns) and triggering event');
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

      trigger('first', target);
      trigger('second', target);

      expect(spy_first.callCount).to.equal(1, 'first spy call count after removing listener and triggering event');
      expect(spy_second.callCount).to.equal(1, 'second spy count after removing listener and triggering event');
    });

  });
});
