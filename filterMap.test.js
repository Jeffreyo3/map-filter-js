const { expect, it } = require("@jest/globals");
const filterMap = require("./filterMap");

const originalArray = [
  { name: "item0", value: 50 },
  { name: "item1", value: 150 },
  { name: "item2", value: 10 },
  { name: "item3", value: 111 },
  { name: "item4", value: 222 },
];

const predicate = (element, index) => {
  return element.value < 100 || index === 4;
};

const template = (element, index) => {
  return { ...element, originalIndex: index };
};

describe("filterMap", () => {
  it("throws when not given an Array", () => {
    expect(() => filterMap({}, predicate, template)).toThrow(
      "arg expected to be an Array, but got Object"
    );
  });

  it("returns empty Array when given an empty Array", () => {
    expect(filterMap([], predicate, template)).toEqual([]);
  });

  it("throws when given an invalid predicate callback", () => {
    expect(() => filterMap(originalArray, () => true, template)).toThrow(
      "Anonymous func can only have 1 or 2 args, but found 0"
    );

    const invalidPredicate = (element, index, any) => true;

    expect(() => filterMap(originalArray, invalidPredicate, template)).toThrow(
      "invalidPredicate func can only have 1 or 2 args, but found 3"
    );
  });

  it("throws when given an invalid template callback", () => {
    expect(() =>
      filterMap(originalArray, predicate, () => new Object())
    ).toThrow("Anonymous func can only have 1 or 2 args, but found 0");

    const invalidTemplate = (element, index, any) => new Object();

    expect(() => filterMap(originalArray, predicate, invalidTemplate)).toThrow(
      "invalidTemplate func can only have 1 or 2 args, but found 3"
    );
  });

  it("filters based on the predicate callback", () => {
    let filteredArray = filterMap(originalArray, predicate, template);
    expect(filteredArray.length).toEqual(3);

    const predicateOnlyElement = (element) => element.value > 100;
    filteredArray = filterMap(originalArray, predicateOnlyElement, template);
    expect(filteredArray.length).toEqual(3);
  });

  it("maps filtered values based on template callback", () => {
    let expectedArray = [
      { name: "item0", value: 50, originalIndex: 0 },
      { name: "item2", value: 10, originalIndex: 2 },
      { name: "item4", value: 222, originalIndex: 4 },
    ];
    let filteredArray = filterMap(originalArray, predicate, template);
    expect(filteredArray).toEqual(expectedArray);

    expectedArray = ["item0", "item2", "item4"];
    const templateOnlyElement = (element) => element.name;
    filteredArray = filterMap(originalArray, predicate, templateOnlyElement);
    expect(filteredArray).toEqual(expectedArray);
  });
});
