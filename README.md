# Vent
> DOM event delegation that actually works

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
`useCapture` | Boolean  | no       | false    | Only remove listeners with useCapture set to the value passed in.


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

Listen to an event directly on the element, including those that bubble:

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

![Event propagation](http://i.imgur.com/pfPK2NK.png)

With Vent, listeners can be configured to be called during the *capture* or *bubbling phase*.

To add an event listener in the *capture phase*:

```js
vent.on('click', '#node1', handler, true);
```

To add an event listener in the *bubbling phase*:

```js
vent.on('click', '#node1', handler, false);
```

In most cases, you'll want to add your event listeners in the bubbling phase.


### Shortcomings

Because of how event delegation works, events added with Vent don't mix perfectly with events added with `addEventListener`. Here's what to expect.

#### Vent and native events will not fire in the expected order

Vent listens to DOM events in the capture phase, then simulates the capture and bubbling phases for its listeners. Because it simulates the capture and bubbling phases when it catches the event, native listeners on elements that descendants of the Vent instance's root element will fire **after** Vent listeners have fired.

1. `#node2` dispatches a `click` event
2. The event starts the *capture phase* and starts trickling down from the Window to `#node2`
3. The Vent instance's `click` handler is called when the event reaches `#node0`
4. Vent simulates the capture phase and trickles down until it reaches `#node2`, calling any delegated handlers along the way
5. Vent simulates the bubble phase and bubbles back up until it reaches `#node0`, calling any delegated handlers along the way
6. The event continues to trickle down in the *capture phase* until it reaches `#node2`, calling any handlers added with `addEventListener` along the way
7. The event bubbles back up in the *bubble phase* until it reaches the Window, calling any handlers added with `addEventListener` along the way

![Event order](http://i.imgur.com/rQfWo6O.png)

#### Native listeners CANNOT `stopPropagation` to Vent listeners

Because Vent's listeners run before those added natively with `addEventListener`, calling `stopPropagation` in a native event handler on an descendant of Vent's root element will have no effect -- Vent has already simulated capture / bubbling and called all of its handlers before the native event handler was called.

#### Vent listeners CAN `stopPropagation` to native listeners

While Vent is simulating the bubble and capture phases, it checks if any handler along the way called `stopPropagation`. If it does, Vent will add a native DOM listener to the delegated element that stops propagation at the correct time during the actual capture and bubbling phases of the event.


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
* [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) with a fallback for [`createEvent`](https://developer.mozilla.org/en-US/docs/Web/API/document.createEvent)
* [`addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener)

Vent may work correctly on other browsers that support these technologies.

## Contributing

Pull requests are welcome! Please see the [contribution guidelines](CONTRIBUTING.md) before you get started.

## License

Vent is released under the permissive BSD license.
