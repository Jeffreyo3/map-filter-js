# Filter Map

Filter Map is a generic JavaScript utililty designed to `filter` and possibly transform data (like `Array.prototype.map`) in a single iteration.

---

### Installation

- run: `npm i @jeffreyo3/filter-map`
- import:
  - JavaScript: `import filterMap from "@jeffreyo3/filter-map";`
  - NodeJS: `const filterMap = require("@jeffreyo3/filter-map")`

---

### Getting Started

`filterMap` has 3 required parameters

- array -- An Array of any size to be iterated through

- predicate -- A callback that takes in an element (and optionally the index) to filter whether the element should be included in the new Array

- template -- A callback that takes in an element (and optionally the index) and returns the desired shape of the filtered elements.

Ex:

```
const array = [1, 3, 5, 7, 9, 11, 13]

const predicate = (element, index) => element > 5

const template = (element, index) => `The number ${element} is greater than 5.`

const results = filterMap(array, predicate, template)

//////////////////// results ////////////////////
[
  "The number 7 is greater than 5.",
  "The number 9 is greater than 5.",
  "The number 11 is greater than 5.",
  "The number 13 is greater than 5."
]
```
