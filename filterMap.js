/**
 * Returns the elements of an array in the shape specified in the callback function that meet the condition specified in the predicate callback function.
 * @param {Array} array An array of elements to be filterMapped
 * @param {(element: any, index?: number) => any} predicate A function that accepts up to two arguments. The filter method calls
 * the predicate function one time for each element in the array.
 * @param {(element: any, index?: number) => any} template A function that accepts up to two arguments. The map method calls the
 * template function one time for each element in the array that has a truthy `predicate`.
 */
function filterMap(array, predicate, template) {
  // Check Types
  checkArray(array);
  checkFunction(predicate);
  checkFunction(template);

  // Base Case
  if (array.length === 0) {
    return [];
  }

  // Check Args
  checkCallbackArgsLength(predicate);
  checkCallbackArgsLength(template);

  const newArray = [];
  const runningPredicate = (element, index) => {
    if (predicate.length === 1) {
      return predicate(element);
    } else {
      return predicate(element, index);
    }
  };

  const runningCallbackfn = (element, index) => {
    if (template.length === 1) {
      return template(element);
    } else {
      return template(element, index);
    }
  };

  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    if (runningPredicate(element, index)) {
      newArray.push(runningCallbackfn(element, index));
    }
  }

  return newArray;
}

const checkArgument = (predicate, errorMessage) => {
  if (predicate === false) {
    throw new Error(errorMessage);
  }
};

const checkArray = (array) => {
  checkArgument(
    Array.isArray(array),
    `arg expected to be an Array, but got ${array.constructor.name}`
  );
};

const checkFunction = (func) => {
  checkArgument(
    func instanceof Function,
    `${
      func.name ? func.name : "Anonymous"
    } arg expected to be a Function, but got ${func.constructor.name}`
  );
};

const checkCallbackArgsLength = (func) => {
  checkArgument(
    func.length === 1 || func.length === 2,
    `${
      func.name ? func.name : "Anonymous"
    } func can only have 1 or 2 args, but found ${func.length}`
  );
};

module.exports = filterMap;
