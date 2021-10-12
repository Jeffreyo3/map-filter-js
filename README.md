# Map-Filter-JS

`mapFilter` is a generic JavaScript utililty designed to `filter` and possibly transform data (like `Array.prototype.map()`) in a single iteration.

Its not entirely necessary to use this package, as this can be accomplished using `Array.prototype.reduce()` ([StackOverflow](https://stackoverflow.com/questions/57701306/using-reduce-instead-of-chaining-filter-and-map))
```
array.reduce((total, current) => predicate ? [...total, newObject] : total, []);
```

I find this method to be somewhat difficult to read especially when the predicates or return objects become more complicated.

This package allows the user to take in the `filter` to evaluate the predicate, and the `template` used to create the return objects separately.

---

### Installation

- run: `npm i map-filter-js`
- import:
  - JavaScript: `import mapFilter from "map-filter-js";`
  - NodeJS: `const mapFilter = require("map-filter-js")`

---

### Getting Started

`mapFilter` has 3 required parameters

- array -- An Array of any size to be iterated through

- filter -- A callback that takes in an element (and optionally the index) to filter whether the element should be included in the new Array

- template -- A callback that takes in an element (and optionally the index) and returns the desired shape of the filtered elements.

Ex:

```
const array = [1, 3, 5, 7, 9, 11, 13]

const filter = (element, index) => element > 5

const template = (element, index) => `The number ${element} is greater than 5.`

const results = mapFilter(array, filter, template)

//////////////// results ////////////////
[
  "The number 7 is greater than 5.",
  "The number 9 is greater than 5.",
  "The number 11 is greater than 5.",
  "The number 13 is greater than 5."
]
```
