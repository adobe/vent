# Vent
> DOM event delegation that actually works
<img src="http://i.imgur.com/dtee0iY.png" align="right" alt="Vent logo">

Vent is a well-tested event delegation library that supports real DOM events, capture phase listeners, namespaces, and scoped selectors.

## What is event delegation?

*Event delegation* is a pattern that takes advantage of [event propagation](https://github.com/lazd/vent#capture-vs-bubbling) to let you easily handle events originating from specific descendant elements. With event delegation and the power of CSS selectors, you can handle events originating from any number of elements or add event listeners before the elements you want to listen to are even added to the DOM.

Vent implements the event delegation pattern with a simple, powerful, and familiar API.

```js
var vent = new Vent(document.body);

// Call the handler when any element with the sayHi CSS class is clicked
vent.on('click', '.sayHi', function handler() {
  console.log('Hello world!');
});
```

## Why Vent?

There are other event delegation libraries out there, so here's how Vent is different:

* **NS**: Supports event namespaces, i.e. `click.myApp`
* **Scoped**: Supports scoped selectors, i.e. `> .immediateChild`
* **Real DOM**: Dispatches real, bubbling DOM events
* **Capture**: Supports listening to events during the capture phase
* **Tests**: Has comprehensive tests

Name            | NS?                | Scoped?            | Real DOM?         | Capture?          | Tests?
----------------|:-------------------|:------------------:|:-----------------:|:-----------------:|:-------------------:
[Vent]          | :white_check_mark: | :white_check_mark: | :white_check_mark:| :white_check_mark:| :white_check_mark:
[jQuery]        | :white_check_mark: | :white_check_mark: | :x:               | :x:               | :white_check_mark:
[Gator]         | :x:                | :x:                | :white_check_mark:| :x:               | :x:
[ftdomdelegate] | :x:                | :x:                | :white_check_mark:| :white_check_mark:| :white_check_mark:

[Vent]: #vent
[jQuery]: https://github.com/jquery/jquery
[Gator]: https://github.com/ccampbell/gator
[ftdomdelegate]: https://github.com/ftlabs/ftdomdelegate

## API

### new Vent(elementOrSelector) -> vent

Create a new Vent instance with the root element as the provided element or selector.

Events will be listened to for the root element and its current or future children.

#### vent.on(eventName[, selector], handler[, useCapture]) → this

Add an event listener.

##### Parameters

Name         | Type     | Required | Default  | Description
-------------|----------|----------| ---------|------------
`eventName`  | String   | **yes**  | -        | The event name to listen for, including optional namespace(s).
`selector`   | String   | no       | -        | The selector to use for event delegation.
`handler`    | Function | **yes**  | -        | The function that will be called when the event is fired.
`useCapture` | Boolean  | no       | false †  | Only remove listeners with useCapture set to the value passed in.

† For [`focus`](https://developer.mozilla.org/en-US/docs/Web/Events/focus) and [`blur`](https://developer.mozilla.org/en-US/docs/Web/Events/blur) events, `useCapture` will default to `true` unless explcitly specified as these events do not bubble.

#### vent.off(eventName[, selector], handler[, useCapture]) → this

Remove an event listener.

##### Parameters

Name         | Type     | Required | Description
-------------|----------|----------|------------
`eventName`  | String   | no       | Only remove listeners for the provided event name and/or namespace(s).
`selector`   | String   | no       | Only remove listeners that have this selector.
`handler`    | Function | no       | Only remove listeners that have this handler.
`useCapture` | Boolean  | no       | Only remove listeners that are captured.


#### vent.dispatch(eventName[, options]) → CustomEvent

Dispatch a custom event at the root element.

##### Parameters

Name                  | Type     | Required | Default  | Description
----------------------|----------|----------| ---------|------------
`eventName`           | String   | **yes**  | -        | The name of the event to dispatch.
`options`             | Object   | no       | -        | CustomEvent options.
`options.bubbles`     | Boolean  | no       | true     | Whether the event should bubble.
`options.cancelable`  | Boolean  | no       | true     | Whether the event should be cancelable.
`options.detail`      | *        | no       | -        | Data to pass to listeners as `event.detail`.


## Examples

### Create a Vent instance

You can pass anything that implements the `EventTarget` interface:

```js
var vent = new Vent(window);
var vent = new Vent(document.body);
var vent = new Vent(document.documentElement);
```

Including HTML elements:

```js
var div = document.createElement('div');
var vent = new Vent(div);
```

You can also pass a selector:

```js
var vent = new Vent('#myApp');
```


### Adding direct event listeners

Listen to an event directly on the element, including those that bubble from descendant elements:

```js
vent.on('resize', function(event) {
  console.log('Window resized!');
});
```


### Adding delegated event listeners

Listen to an event on child elements that match the provided selector:

```js
vent.on('click', '.reset', function(event) {
  console.log('Should reset!');
});
```

The child element does not have to be in the DOM at the time the listener is added.


### Removing listeners

Remove all listeners added with this Vent instance:

```js
vent.off();
```

Remove all listeners for click events:

```js
vent.off('click');
```

Remove all listeners on the .reset selector:

```js
vent.off(null, '.reset');
```

Remove all listeners that call the provided handler:

```js
vent.off(null, null, handler);
```

Remove all listeners that listen during the capture phase:

```js
vent.off(null, null, null, true);
```

Remove all listeners for click events that call the provided handler:

```js
vent.off('click', null, handler);
```

Remove all listeners that match all criteria:

```js
vent.off('click', '.reset', handler, true);
``````


### Event properties and handler context

Vent sets properties of the event object and context of the handlers as follows:

* `this` - The element that matched for delegation
* `event.matchedTarget` - The element that matched for delegation (same as `this`)
* `event.currentTarget` - The root element of the Vent instance
* `event.target` - The element that originally dispatched the event

Assuming the following HTML structure:

```html
<div id="node0">
  <div id="node1">
    <button id="button0">Click me!</button>
  </div>
</div>
```

If the Vent root was `#node0` and a click event was triggered on `#button0`:

```js
// Create a Vent instance with #node0 as the root
var vent = new Vent('#node0');

// Listen for clicks on #node1 and its descendants
vent.on('click', '#node1', function(event) {
  console.assert(this === document.querySelector('#node1'));
  console.assert(event.matchedTarget === document.querySelector('#node1'));
  console.assert(event.currentTarget === document.querySelector('#node0'));
  console.assert(event.target === document.querySelector('#button0'))
});

// Click the button
document.querySelector('#button0').click();
```

### Using event namespaces

You may provide any number of event namespaces in the event name:

```js
var vent = new Vent(myApp.element);

vent.on('resize.yourApp', '.signout', function(event) {
  console.log('Should sign out!');
});

vent.on('click.myApp', '.signout', function(event) {
  console.log('Should sign out!');
});

vent.on('click.myApp.signup', '.reset', function(event) {
  console.log('Should reset signup form!');
});

vent.on('submit.myApp.signup', '.form', function(event) {
  console.log('Should submit sign up form!');
});
```

You can then remove listeners based soley on their namespace(s):

```js
// Remove event listeners that have the .signup namespace
vent.off('.signup');

// Remove event listeners that have the .myApp namespace
// This includes listeners that have both .myApp and .signUp
vent.off('.myApp');

// Remove event listeners that have both the .yourApp and .myApp namespaces
vent.off('.myApp.yourApp');
```

### Listening to an event just once

Using named functions, you can easily remove listeners the first time they're called:

```js
vent.on('click', '.reset', function handler(event) {
  // Remove the listener
  vent.off('click', '.reset', handler);
  console.log('Should reset!');
});
```

The child element does not have to be in the DOM at the time the listener is added.


### Dispatching CustomEvents

Vent makes it easy to dispatch CustomEvents from the root element of the Vent instance. Unlike `jQuery.trigger()`, events dispatched with `Vent.dispatch()` are *real DOM events* that can be listened to with `Element.addEventListener()`, `jQuery.on()`, or `Vent.on()`.

Dispatch a basic, bubbling custom event:

```js
vent.dispatch('launch');
```

Dispatch a basic, non-bubbling custom event:

```js
vent.dispatch('launch', {
  bubbles: false,
});
```

Dispatch a bubbling custom event with details:

```js
vent.dispatch('launch', {
  detail: {
    startTime: Date.getTime()
  },
});
```


### Capture vs Bubbling

When an event is dispatched, it goes through two phases of *propagation* where it moves among ancestor elements in the DOM, executing handlers along the way.

1. During the *capture phase*, the event "trickles down" from the `window` to the element that dispatched the event, executing event handlers handlers added with `useCapture = true` along the way.

2. Then, during the *bubble phase*, the event "bubbles up" from the element that dispatched the event to the `window`, executing event handlers added with `useCapture = false`.

Assuming the following HTML structure:

```html
<html>
  <body>
    <div id="node0">
      <div id="node1">
      </div>
    </div>
  </body>
</html>
```

An event dispatched from `#node1` will take the following path:

![Event propagation](http://i.imgur.com/Sla5qCg.png)

With Vent, listeners can be configured to be called during the *capture* or *bubble phase*.

To add an event listener in the *bubble phase*:

```js
vent.on('click', '#node1', handler);
```

To add an event listener in the *capture phase*:

```js
vent.on('click', '#node1', handler, true);
```

In most cases, you'll want to add your event listeners in the bubble phase.


### Shortcomings

Because of how event delegation works, events added with Vent don't mix perfectly with events added with `addEventListener`. Here's what to expect.

#### Vent and native events will not fire in the same order as native listeners

Because it simulates the capture and bubbling phases for delegated handlers, delegated handlers don't fire in the same order as they would if they were added directly with `addEventListener`.

1. `#node2` dispatches a `click` event
2. The event begins the *capture phase* and starts trickling down from `window` to `#node2`, calling any handlers added with `addEventListener` along the way
3. The Vent instance's *capture phase* `click` handler is called when the event reaches `#node0`
4. **Vent simulates the** ***capture phase***, trickling down from `#node0` to `#node2`, calling any delegated handlers along the way
5. The event continues to trickle down in the *capture phase* until it reaches `#node2`, calling any handlers added with `addEventListener` along the way
6. The event begins the *bubble phase* and starts bubbling up from `#node2` to `window`, calling any handlers added with `addEventListener` along the way
7. The Vent instance's *bubble phase* `click` handler is called when the event reaches `#node0`
8. **Vent simulates the** ***bubble phase***, bubbling from `#node2` to `#node0`, calling any delegated handlers along the way
9. The event continues to bubble in the *bubble phase* until it reaches `window`, calling any handlers added with `addEventListener` along the way

As such:

* Native handlers in the *capture phase* on elements that are descendants of the Vent instance's root element will fire **after** Vent handlers
* Native handlers in the *bubble phase* on elements that are descendants of the Vent instance's root element will fire **before** Vent handlers

#### Calling `stopPropagation` in a native bubble phase handler will stop ALL Vent handlers

Because Vent's *bubble phase* handlers don't run until the event bubbles to the Vent root, calling `stopPropagation` in a native handler on an element that is a descendant of the Vent root will result in none of the Vent handlers in the *bubble phase* from being called. [jQuery's event delegation behaves the same way](http://jsfiddle.net/lazd/rnqo95b1/).

#### Vent handlers CANNOT `stopPropagation` to native handlers in the bubble phase

Because the event has already bubbled up to the Vent root and native listeners in the *bubble phase* have been called along the way, calling `stopPropagation` within a *bubble phase* Vent handler will not prevent native listeners on elements that a descendants of the Vent root from being called. [jQuery's event delegation behaves the same way](http://jsfiddle.net/lazd/mzpze5gd/).

## Browser support

Vent is officially supported on the following browsers:

Browser               | Version
----------------------|----------
Android               | 2.2+
Chrome                | 1+
Firefox               | 3.6+
Internet Explorer     | 9+
iOS Safari            | 4.1+
Opera                 | 11.5+
Safari                | 5+

Vent uses the following browser technologies:

* [`querySelector`](https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector)
* [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) with a fall-back for [`createEvent`](https://developer.mozilla.org/en-US/docs/Web/API/document.createEvent)
* [`addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener)

Vent may work correctly on other browsers that support these technologies.

## Contributing

Pull requests and issue reports are welcome! Please see the [contribution guidelines](CONTRIBUTING.md) before you get started.

## License

Vent is released under the permissive BSD license.
