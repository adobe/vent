# vent
> DOM event delegation that actually works

## Contributing

You contributions are welcome! Please follow the guidelines below

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

### 4. Write some consistent, maintainable, and tested code

Install dependencies and start developing:

```
npm install
npm run watch
```

The test suite will run automatically each time you save a file.

Be sure to match the existing coding style as well as comment all that clever code you wrote as a result of a stoke of pure genius. Others may not understand your beautiful, elegant solution.

Include tests for everything you change, and test edge cases!

* If you fix a bug, include a test that proves you fixed it.
* If you added a feature, include a test that makes sure the feature works.

### 5. Make atomic commits that reference the issue

It's helpful if you make individual commits for atomic pieces of your contribution. This helps write a living history of the repository in the form of commit messages, and makes it much easier ot understand why specific changes were made.

For instance, if you're working on a bug that affects two parts of the project, it may useful to have two commits for each part. Didn't make atomic commits? Don't sweat it, your contribution is still welcome!

Your commit message should contain the issue number it closes or fixes.

If the commit is only part of the solution:

```
Start with a blank prototype for the event map, related to #10
```

For commits that fix bugs:

```
Copy the array of listeners before executing them, fixes #10
```

For commits that implement features:

```
Support root-relative delegation, closes #10
```

### 6. Squash out the nonsense

Don't include commits with messages like `Fix typo, oops!`, please squash them into previous commits to reduce history pollution.

### 7. Push and send a pull request

Push your branch to your fork:

```
git push -u origin issue/10
```

Then, [send a pull request](https://github.com/lazd/vent/compare) against the `master` branch of lazd/vent.
