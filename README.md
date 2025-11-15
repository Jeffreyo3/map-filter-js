# Map-Filter-JS

`mapFilter` is a generic JavaScript utililty designed to `filter` and possibly transform data (like `Array.prototype.map()`) in a single iteration.

Its not entirely necessary to use this package, as this can be accomplished using `Array.prototype.reduce()` ([StackOverflow](https://stackoverflow.com/questions/57701306/using-reduce-instead-of-chaining-filter-and-map))
```
array.reduce((total, current) => predicate ? [...total, newObject] : total, []);
```

I find this method to be somewhat difficult to read especially when the predicates or return objects become more complicated.

This package allows the user to take in the `filter` to evaluate the predicate, and the `template` used to create the return objects separately.

---

## Requirements

- **Node.js**: 16+ (ES2020 support)
- **Browsers**: Modern browsers with ES2020 support
- **Environment**: ES Modules (`import`/`export`) support

## Installation

- run: `npm i map-filter-js`
- import: `import mapFilter from "map-filter-js";`

## API

### `mapFilter(array, filter, template)`

**Parameters:**
- `array`: Array to process (any type of elements)
- `filter`: `(element, index?) => boolean` - Determines which elements to include
- `template`: `(element, index?) => any` - Transforms filtered elements

**Returns:** New array with filtered and transformed elements

## Examples

### Basic Usage
```javascript
const array = [1, 3, 5, 7, 9, 11, 13];

const filter = (element, index) => element > 5;

const template = (element, index) => `The number ${element} is greater than 5.`;

const results = mapFilter(array, filter, template);

//////////////// results ////////////////
[
  "The number 7 is greater than 5.",
  "The number 9 is greater than 5.",
  "The number 11 is greater than 5.",
  "The number 13 is greater than 5."
]
```

### With Index Parameter
```javascript
const items = ['apple', 'banana', 'cherry'];

const firstTwo = mapFilter(
  items,
  (item, index) => index < 2,
  (item, index) => `${index}: ${item}`
);
// Result: ['0: apple', '1: banana']
```

### Complex Objects
```javascript
const users = [
  { name: 'Alice', age: 25, active: true },
  { name: 'Bob', age: 17, active: false },
  { name: 'Carol', age: 30, active: true }
];

const activeAdults = mapFilter(
  users,
  user => user.active && user.age >= 18,
  user => user.name.toUpperCase()
);
// Result: ['ALICE', 'CAROL']
```


## TypeScript Support

Full TypeScript support with generic types:

```typescript
function mapFilter<T, U>(
  array: T[], 
  filter: (element: T, index?: number) => boolean,
  template: (element: T, index?: number) => U
): U[]
```


## Performance


### Benchmarks

Run comprehensive production benchmarks locally:
```bash
npm run test:bench
```

This tests the built JavaScript files across multiple scenarios including array size scaling, filter selectivity, sparse arrays, complex objects, and function call overhead.


These benchmarks compare three implementations:

- `array.reduce()` – single-pass, hand-written reducer
- `array.filter().map()` – idiomatic two-pass pipeline
- `mapFilter(arr, filter, map)` – custom single-pass helper from this package

> **Note:** Benchmarks were run in a production build of the JS bundle. Numbers below are total time over 10 runs per scenario; they’re meant for relative comparison, not as absolute guarantees. In several cases, one or more methods show significant variance or outliers due to JIT / GC effects.

---

### Array Size Scaling

_All tests: random numeric array, 10 runs, `iterations` as listed._

**Array Size Scaling – Summary**

| Scenario                       | Method            | Total Time (s) | Notes                                                                 |
| ----------------------------- | ----------------- | -------------- | --------------------------------------------------------------------- |
| Small (100 elems × 1000 iters) | `.reduce()`       | 0.77           | All three are sub-second; dominated by noise/outliers.               |
|                               | `.filter().map()` | 0.77           | Very similar to `.reduce()`.                                         |
|                               | `mapFilter`       | 0.67           | Slightly faster on average; several noisy runs for all methods.      |
| Medium (10k elems × 100 iters) | `.reduce()`       | 3.84           | Within ~1% of `mapFilter`.                                           |
|                               | `.filter().map()` | 17.97          | ~4.8× slower than `mapFilter` (two passes + more callback overhead). |
|                               | `mapFilter`       | **3.79**       | Fastest on average; very low variance.                               |
| Large (1M elems × 10 iters)    | `.reduce()`       | 63.20          | Similar mean to `mapFilter`, but with large variance/outliers.       |
|                               | `.filter().map()` | 203.88         | ~3.4× slower than `mapFilter`.                                       |
|                               | `mapFilter`       | **62.04**      | Fastest on mean; also shows some outliers, but same ballpark as `.reduce()`. |

**Takeaway:** For medium and large arrays, `mapFilter` performs comparably to a fused `.reduce()` and substantially better than `.filter().map()`. For tiny arrays, all three are effectively equivalent in practice.

---

### Filter Selectivity (10k elems × 100 iters)

_How much of the array passes the filter._

**Filter Selectivity – Summary**

| Pass Rate        | Method            | Total Time (s) | Notes                                                                                  |
| ---------------- | ----------------- | -------------- | -------------------------------------------------------------------------------------- |
| 10% pass (high selectivity) | `.reduce()`       | 19.24          | Slowest of the three.                                                                  |
|                  | `.filter().map()` | 17.10          | Faster than `.reduce()`, but with a few slower outlier runs.                          |
|                  | `mapFilter`       | **13.29**      | Fastest; moderate variance but consistently ahead on mean.                             |
| 50% pass         | `.reduce()`       | 27.48          | Highest mean and highest variance (one very slow run).                                |
|                  | `.filter().map()` | 18.50          | Mid-pack; some higher outliers.                                                       |
|                  | `mapFilter`       | **14.31**      | Fastest and very stable (low std dev).                                                |
| 90% pass (low selectivity)  | `.reduce()`       | **20.42**      | Slightly faster than `.filter().map()`.                                               |
|                  | `.filter().map()` | 20.55          | Essentially tied with `.reduce()`.                                                    |
|                  | `mapFilter`       | 28.93          | ~1.3× slower on mean, with noticeable outliers (single run up to ~47s).              |

**Takeaway:** When the filter actually removes a meaningful portion of elements (10–50% pass), `mapFilter` is clearly fastest. When almost everything passes (90% pass), `mapFilter` can be slower than the native patterns.

---

### Sparse Arrays (10k logical elems × 100 iters)

_Holes are `undefined` / missing elements in the array._

**Sparse Arrays – Summary**

| Holes            | Method            | Total Time (s) | Notes                                                                                  |
| ---------------- | ----------------- | -------------- | -------------------------------------------------------------------------------------- |
| 10% holes        | `.reduce()`       | 221.02         | One very slow outlier (~464s); ignoring outlier, similar to others.                   |
|                  | `.filter().map()` | 194.77         | Lowest mean, very tight variance.                                                     |
|                  | `mapFilter`       | 201.54         | Slightly slower than `.filter().map()`, similar to `.reduce()` excluding worst outlier.|
| 50% holes        | `.reduce()`       | **114.48**     | Fastest mean; some slower runs at the high end.                                       |
|                  | `.filter().map()` | 132.09         | Higher mean and very high variance (large outlier).                                   |
|                  | `mapFilter`       | 112.63         | Mean is within ~1–2% of `.reduce()`; small std dev, but `relativePerformance` rounded.|
| 90% holes        | `.reduce()`       | **25.84**      | Slight edge on mean; moderate variance.                                               |
|                  | `.filter().map()` | 25.55          | Essentially tied with `.reduce()`.                                                    |
|                  | `mapFilter`       | 25.70          | Also tied; all three are within measurement noise.                                    |

**Takeaway:** For sparse arrays, all three approaches are in the same performance band. Differences are small and often overshadowed by variance/outliers.

---

### Complex Objects (10k elems × 100 iters)

_Objects with increasing complexity: simple fields → nested structures._

**Complex Objects – Summary**

| Scenario                   | Method            | Total Time (s) | Notes                                                                              |
| -------------------------- | ----------------- | -------------- | ---------------------------------------------------------------------------------- |
| Simple objects             | `.reduce()`       | 222.60         | Highest mean.                                                                      |
|                            | `.filter().map()` | **197.18**     | Lowest mean.                                                                       |
|                            | `mapFilter`       | 200.29         | Very close to `.filter().map()`; slightly slower on mean.                          |
| Complex user objects       | `.reduce()`       | 831.80         | Higher mean than `mapFilter`; one large outlier.                                   |
|                            | `.filter().map()` | 859.86         | Highest mean, with large variance (outlier ~1.5× slower than typical runs).       |
|                            | `mapFilter`       | **794.09**     | Best mean of the three; still some variance, but generally the fastest.           |
| Deep nested objects        | `.reduce()`       | **156.37**     | Slightly fastest on mean, modest variance.                                         |
|                            | `.filter().map()` | 164.72         | About 5% slower than `.reduce()`.                                                  |
|                            | `mapFilter`       | 158.62         | Mean is within ~1–2% of `.reduce()`; one notably slow outlier run (~232s).        |

**Takeaway:** For real-world object processing, all three options are broadly comparable. `mapFilter` is sometimes the fastest (complex/nested objects) and sometimes slightly behind `.filter().map()` (simple objects), but it’s always in the same performance neighborhood.

---

### Function Call Overhead (10k elems × 100 iters)

_Focused on callback cost rather than heavy work per element._

**Function Call Overhead – Summary**

| Test Type                 | Method            | Total Time (s) | Notes                                                                               |
| ------------------------- | ----------------- | -------------- | ----------------------------------------------------------------------------------- |
| Single-parameter callbacks | `.reduce()`       | 22.84          | Slowest mean.                                                                       |
|                           | `.filter().map()` | 18.76          | Mid-pack.                                                                           |
|                           | `mapFilter`       | **15.28**      | Fastest; lower mean and acceptable variance.                                       |
| Dual-parameter callbacks   | `.reduce()`       | **10.18**      | Fastest by a wide margin.                                                          |
|                           | `.filter().map()` | 17.09          | Slower than `.reduce()`, some variance.                                            |
|                           | `mapFilter`       | 24.20          | Slowest and high variance (one very slow outlier run).                             |
| Minimal overhead           | `.reduce()`       | 43.74          | Highest mean and largest variance (very slow outlier ~114s).                       |
|                           | `.filter().map()` | 25.82          | Mid-pack, small variance.                                                          |
|                           | `mapFilter`       | **19.95**      | Fastest and stable.                                                                 |
| Function.length checking   | `.reduce()`       | 19.37          | Slowest mean.                                                                       |
|                           | `.filter().map()` | 18.91          | Slightly faster than `.reduce()`.                                                  |
|                           | `mapFilter`       | **15.09**      | Clearly fastest; lower mean and tight variance.                                    |

**Takeaway:** For simple, single-parameter callbacks (the intended `mapFilter` use case), `mapFilter` consistently has the lowest mean overhead. For dual-parameter callbacks, `reduce` remains the best choice.

---

### Overall Summary

- In many realistic scenarios (medium/large arrays, 10–50% filter pass rate, typical object processing, simple callbacks), `mapFilter` is **as fast as or faster than** a hand-written `.reduce()` and **significantly faster** than `.filter().map()`.
- In edge cases (90% pass rate or dual-parameter callbacks), native patterns can still be faster, and `mapFilter` may show more variance.
- Taken together, the data suggests that `mapFilter` is a **reasonable alternative** to the standard patterns from a performance perspective, while offering a cleaner “filter + map in one pass” API.
