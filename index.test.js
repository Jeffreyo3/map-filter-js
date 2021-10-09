const mapFilter = require("./index");

const originalArray = [
  { name: "item0", value: 50 },
  { name: "item1", value: 150 },
  { name: "item2", value: 10 },
  { name: "item3", value: 111 },
  { name: "item4", value: 222 },
];

const filter = (element, index) => {
  return element.value < 100 || index === 4;
};

const template = (element, index) => {
  return { ...element, originalIndex: index };
};

describe("filterMap", () => {
  it("throws when not given an Array", () => {
    expect(() => mapFilter({}, filter, template)).toThrow(
      "arg expected to be an Array, but got Object"
    );
  });

  it("returns empty Array when given an empty Array", () => {
    expect(mapFilter([], filter, template)).toEqual([]);
  });

  it("throws when given an invalid filter callback", () => {
    expect(() => mapFilter(originalArray, () => true, template)).toThrow(
      "Anonymous func can only have 1 or 2 args, but found 0"
    );

    const invalidFilter = (element, index, any) => true;

    expect(() => mapFilter(originalArray, invalidFilter, template)).toThrow(
      "invalidFilter func can only have 1 or 2 args, but found 3"
    );
  });

  it("throws when given an invalid template callback", () => {
    expect(() =>
      mapFilter(originalArray, filter, () => new Object())
    ).toThrow("Anonymous func can only have 1 or 2 args, but found 0");

    const invalidTemplate = (element, index, any) => new Object();

    expect(() => mapFilter(originalArray, filter, invalidTemplate)).toThrow(
      "invalidTemplate func can only have 1 or 2 args, but found 3"
    );
  });

  it("filters based on the filter callback", () => {
    let filteredArray = mapFilter(originalArray, filter, template);
    expect(filteredArray.length).toEqual(3);

    const filterOnlyElement = (element) => element.value > 100;
    filteredArray = mapFilter(originalArray, filterOnlyElement, template);
    expect(filteredArray.length).toEqual(3);
  });

  it("maps filtered values based on template callback", () => {
    let expectedArray = [
      { name: "item0", value: 50, originalIndex: 0 },
      { name: "item2", value: 10, originalIndex: 2 },
      { name: "item4", value: 222, originalIndex: 4 },
    ];
    let filteredArray = mapFilter(originalArray, filter, template);
    expect(filteredArray).toEqual(expectedArray);

    expectedArray = ["item0", "item2", "item4"];
    const templateOnlyElement = (element) => element.name;
    filteredArray = mapFilter(originalArray, filter, templateOnlyElement);
    expect(filteredArray).toEqual(expectedArray);
  });
});
