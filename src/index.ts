/**
 * Returns the elements of an array in the shape specified in the template callback function
 * for those elements that meet the condition specified in the filter callback function.
 *
 * This performs filtering and mapping in a single pass and skips array holes (like native map/filter)
 *
 * @param {Array} array An array of elements to be filterMapped (cannot be a sparse array).
 * @param {(element: any, index?: number) => any} filter A function that accepts up to two arguments. The mapFilter method calls
 * the filter function one time for each element in the array.
 * @param {(element: any, index?: number) => any} template A function that accepts up to two arguments. The mapFilter method calls the
 * template function one time for each element in the array that has a truthy predicate from the `filter`.
 * @param {boolean} handleSparse set to true if your array contains holes. Default: false (optimized for dense arrays)
 */
function mapFilter<T, U>(
  array: ReadonlyArray<T>,
  filter: (element: T, index?: number) => boolean,
  template: (element: T, index?: number) => U,
  handleSparse: boolean = false
): U[] {
  if (!Array.isArray(array)) {
    throw new TypeError("First argument must be an array");
  }

  const newArray: U[] = [];
  for (let i = 0; i < array.length; i++) {
    if (handleSparse && !(i in array)) continue;
    const element = array[i] as T;
    if (filter(element, i)) {
      newArray.push(template(element, i));
    }
  }

  return newArray;
}

export default mapFilter;
