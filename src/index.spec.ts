import { mapFilter } from "./index";

type TestObject = {
  name: string;
  value: number;
};

const originalArray: TestObject[] = [
  { name: "item0", value: 50 },
  { name: "item1", value: 150 },
  { name: "item2", value: 10 },
  { name: "item3", value: 111 },
  { name: "item4", value: 222 },
];

const filter = (element: TestObject, index?: number): boolean => {
  return element.value < 100 || index === 4;
};

type TestObjectWithIndex = TestObject & { originalIndex?: number };
const template = (element: TestObject, index?: number): TestObjectWithIndex => {
  return { ...element, originalIndex: index };
};

describe("filterMap", () => {
  it("returns empty Array when given an empty Array", () => {
    expect(mapFilter([], filter, template)).toEqual([]);
  });

  it("filters based on the filter callback", () => {
    let filteredArray = mapFilter(originalArray, filter, template);
    expect(filteredArray.length).toEqual(3);

    const filterOnlyElement = (element: TestObject) => element.value > 100;
    filteredArray = mapFilter(originalArray, filterOnlyElement, template);
    expect(filteredArray.length).toEqual(3);
  });

  describe("maps filtered values based on template callback", () => {
    it("adds the original index to the element", () => {
      const expectedArray: TestObjectWithIndex[] = [
        { name: "item0", value: 50, originalIndex: 0 },
        { name: "item2", value: 10, originalIndex: 2 },
        { name: "item4", value: 222, originalIndex: 4 },
      ];
      const filteredArray: TestObjectWithIndex[] = mapFilter(
        originalArray,
        filter,
        template
      );
      expect(filteredArray).toEqual(expectedArray);
    });
    it("returns an array of the template callback return values", () => {
      const expectedArray: string[] = ["item0", "item2", "item4"];
      const templateOnlyElement = (element: TestObject): string => element.name;
      const filteredArray: string[] = mapFilter(
        originalArray,
        filter,
        templateOnlyElement
      );
      expect(filteredArray).toEqual(expectedArray);
    });
  });
});
