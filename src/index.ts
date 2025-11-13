/**
 * Returns the elements of an array in the shape specified in the template callback function
 * for those elements that meet the condition specified in the filter callback function.
 *
 * This performs filtering and mapping in a single pass and skips array holes (like native map/filter)
 *
 * @param {Array} array An array of elements to be filterMapped
 * @param {(element: any, index?: number) => any} filter A function that accepts up to two arguments. The mapFilter method calls
 * the filter function one time for each element in the array.
 * @param {(element: any, index?: number) => any} template A function that accepts up to two arguments. The mapFilter method calls the
 * template function one time for each element in the array that has a truthy predicate from the `filter`.
 */
function mapFilter<T, U>(
  array: ReadonlyArray<T>,
  filter: (element: T, index?: number) => boolean,
  template: (element: T, index?: number) => U
): U[] {
  if (!Array.isArray(array)) {
    throw new TypeError("First argument must be an array");
  }

  // Base Case
  if (array.length === 0) {
    return [];
  }

  const newArray: U[] = [];
  for (let i = 0; i < array.length; i++) {
    // Skip holes in the array (e.g., [, , 1, , 2])
    if (!(i in array)) continue;

    const element = array[i] as T;
    if (filter(element, i)) {
      newArray.push(template(element, i));
    }
  }

  return newArray;
}

export default mapFilter;
