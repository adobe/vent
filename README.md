# vent
> DOM event delegation that actually works

## API

### Vent(elementOrSelector) -> vent

Create a new Vent instance with the root element as the provided element or selector.

Events will be listened to for the root element and its current or future children.

#### vent.on(eventName[, selector], handler[, useCapture]) → this

Add an event listener.

##### Parameters

Name         | Type     | Optional | Default  | Description
-------------|----------|----------| ---------|------------
`eventName`  | String   | no       | -        | The event name to listen for, including optional namespace(s).
`selector`   | String   | **yes**  | -        | The selector to use for event delegation.
`handler`    | Function | no       | -        | The function that will be called when the event is triggered.
`useCapture` | Boolean  | **yes**  | false    | Only remove listeners with useCapture set to the value passed in.


#### vent.off(eventName[, selector], handler[, useCapture]) → this

Remove an event listener.

##### Parameters

Name         | Type     | Optional | Description
-------------|----------|----------|------------
`eventName`  | String   | **yes**  | Only remove listeners for the provided event name and/or namespace(s).
`selector`   | String   | **yes**  | Only remove listeners that have this selector.
`handler`    | Function | **yes**  | Only remove listeners that have this handler.
`useCapture` | Boolean  | **yes**  | Only remove listeners that are captured.


#### vent.trigger(eventName[, options]) → CustomEvent

Trigger a custom event.

##### Parameters

Name                  | Type     | Optional | Default  | Description
----------------------|----------|----------| ---------|------------
`eventName`           | String   | no       | -        | The name of the event to trigger.
`options.bubbles`     | Boolean  | **yes**  | true     | Whether the event should bubble.
`options.cancelable`  | Boolean  | **yes**  | true     | Whether the event should be cancelable.
`options.detail`      | *        | **yes**  | -        | Data to pass to listeners as `event.detail`


## Examples

### Create a Vent instance

You can pass any Element:

```js
var vent = new Vent(window);
```

Or a selector:

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

Remove all listeners capture:

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

// Remove event listeners that have either the .yourApp or .myApp namespace
vent.off('.myApp.yourApp');
```

### CustomEvents

Vent makes it easy to trigger CustomEvents from the root element of the Vent instance. Unlike `jQuery.trigger()`, events triggered with `Vent.trigger()` are *real DOM events* that can be listened to with `Element.addEventListener`, `jQuery.on()`, or `Vent.on()`.

Trigger a basic, bubbling custom event:

```js
vent.trigger('launch');
```

Trigger a basic, non-bubbling custom event:

```js
vent.trigger('launch', {
  bubbles: false,
});
```

Trigger a bubbling custom event with details:

```js
vent.trigger('launch', {
  detail: {
    startTime: Date.getTime()
  },
});
```


### Capture vs Bubbling

During the *capture phase* the event "trickles down" from the `window` to the element that dispatched the event, then, during the *bubble phase*, the event "bubbles up" from the element that dispatched the event to the `window`.

```
                  1st     ^
                 | C |   / \
-----------------| A |--| B |-----------------
| parent         | P |  | U |                |
|                | T |  | U |                |
|   -------------| U |--| B |-----------     |
|   | child      | R |  | B |          |     |
|   |            | E |  | L |          |     |
|   |             \ /   | E |          |     |
|   |              v     2nd           |     |
|   ------------------------------------     |
|                                            |
----------------------------------------------
```

Listeners can be configured to be called during the *capture* or *bubbling phase*.

Call the listener in the *capture phase*:

```js
vent.on('click', '.selector', handler, true);
```

Call the listener in the *bubbling phase*:

```js
vent.on('click', '.selector', handler, false);
```


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

### 1. File an issue

An issue must exist before you start working on a fix or a feature.

First, [search the issues](https://github.com/lazd/vent/issues) to see if one has already been filed for what you're about to work on.

If not, [file an issue](https://github.com/lazd/vent/issues/new) with the following information.

For bugs:

* The problem
* A simple code sample that reproduces the issue
* What browsers you have and have not observed the issue on
* Any workarounds you have found

For features:

* The feature
* Why
* Code samples showing the proposed API
* Notes on any impact you forsee the feature having

### 2. Fork the repo

[Fork Vent](https://github.com/lazd/vent/fork) to your Github account and clone it to your local machine.

Be sure to add an upstream remote:

```
git remote add upstream git@github.com:lazd/vent.git
```

### 3. Create a branch

Create a branch from the lastest master named `issue/#`, where # is the issue number you're going to work on:

```
git checkout master
git pull upstream master
git checkout -b issue/10
```

### 4. Write some code

Install dependencies and start developing:

```
npm install
npm run watch
```

Tests will run each time you save a file.

### 5. Make some commits

Your commit message should contain the issue number it closes or fixes:

For bugs:

```
Copy the array of listeners before executing them, fixes #1
```

For features:

```
Support root-relative delegation, closes #2
```

### 6. Do the atomic squash

Include one commit for each relevant portion involved in your contribution.

If you've created many very small commits, such as "Fix typo,"" please squash them to reduce history pollution.

### 7. Push and send a pull request

Push your branch to your fork:

```
git push -u origin issue/10
```

Then, [send a pull request](https://github.com/lazd/vent/compare) against the `master` branch of lazd/vent.


## License

Vent is released under the permissive BSD license.
