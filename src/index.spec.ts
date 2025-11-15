import mapFilter from "./index";

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

describe("mapFilter", () => {
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

  describe("error handling and input validation", () => {
    it("should throw TypeError when first argument is not an array", () => {
      const invalidInputs = [null, undefined, "string", 123, {}, true];

      invalidInputs.forEach((input) => {
        expect(() => {
          mapFilter(
            input as any,
            () => true,
            (x) => x
          );
        }).toThrow(TypeError);
        expect(() => {
          mapFilter(
            input as any,
            () => true,
            (x) => x
          );
        }).toThrow("First argument must be an array");
      });
    });

    it("should accept readonly arrays", () => {
      const readonlyArray: readonly number[] = [1, 2, 3] as const;
      const result = mapFilter(
        readonlyArray,
        (x) => x > 1,
        (x) => x * 2
      );
      expect(result).toEqual([4, 6]);
    });
  });

  describe("sparse array handling", () => {
    it("an array with only holes should return an empty array", () => {
      const sparseArray = [, , ,];

      const result = mapFilter(
        sparseArray,
        () => true,
        (x) => x
      );
      expect(result).toEqual([]);
    });

    it("should skip holes in sparse arrays", () => {
      const sparseArray = [1, , 3, , 5];

      const result = mapFilter(
        sparseArray,
        () => true,
        (x, index) => `${x}-${index}`
      );

      expect(result).toEqual(["1-0", "3-2", "5-4"]);
    });

    it("should handle arrays with holes at the beginning", () => {
      const sparseArray = [, , 3, 4, 5];

      const result = mapFilter(
        sparseArray,
        () => true,
        (x) => x
      );
      expect(result).toEqual([3, 4, 5]);
    });
  });

  describe("edge cases and special values", () => {
    it("should return empty array when no elements pass filter", () => {
      const array = [1, 2, 3, 4, 5];
      const result = mapFilter(
        array,
        () => false,
        (x) => x
      );
      expect(result).toEqual([]);
    });

    it("should handle null and undefined elements", () => {
      const arrayWithNulls = [1, null, 3, undefined, 5];

      const result = mapFilter(
        arrayWithNulls,
        (x) => x != null,
        (x) => x! * 2
      );

      expect(result).toEqual([2, 6, 10]);
    });

    it("should handle NaN values", () => {
      const arrayWithNaN = [1, NaN, 3, NaN, 5];

      const result = mapFilter(
        arrayWithNaN,
        (x) => !Number.isNaN(x),
        (x) => x * 2
      );

      expect(result).toEqual([2, 6, 10]);
    });

    it("should handle zero and negative numbers", () => {
      const numbers = [-2, -1, 0, 1, 2];

      const result = mapFilter(
        numbers,
        (x) => x >= 0,
        (x) => Math.abs(x)
      );

      expect(result).toEqual([0, 1, 2]);
    });
  });

  describe("function behavior and immutability", () => {
    it("should not modify the original array", () => {
      const originalArray = [1, 2, 3, 4, 5];

      mapFilter(
        originalArray,
        () => true,
        (x) => x * 2
      );

      expect(originalArray).toEqual([1, 2, 3, 4, 5]);
    });

    it("should call filter function for each non-hole element exactly once", () => {
      const filterCallCount = jest.fn().mockReturnValue(true);
      const array = [1, , 3, , 5];

      mapFilter(array, filterCallCount, (x) => x);

      expect(filterCallCount).toHaveBeenCalledTimes(3);
      expect(filterCallCount).toHaveBeenCalledWith(1, 0);
      expect(filterCallCount).toHaveBeenCalledWith(3, 2);
      expect(filterCallCount).toHaveBeenCalledWith(5, 4);
    });

    it("should call template function only for elements that pass filter", () => {
      const templateCallCount = jest.fn().mockReturnValue("mapped");
      const array = [1, 2, 3, 4, 5];

      mapFilter(array, (x) => x % 2 === 0, templateCallCount);

      expect(templateCallCount).toHaveBeenCalledTimes(2);
      expect(templateCallCount).toHaveBeenCalledWith(2, 1);
      expect(templateCallCount).toHaveBeenCalledWith(4, 3);
    });

    it("should return a new array instance", () => {
      const originalArray = [1, 2, 3];
      const result = mapFilter(
        originalArray,
        () => true,
        (x) => x
      );

      expect(result).not.toBe(originalArray);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("index parameter usage", () => {
    it("should pass correct indices to both filter and template functions", () => {
      const testArray = ["a", "b", "c", "d"];
      const result = mapFilter(
        testArray,
        (_, index) => index! % 2 === 0,
        (element, index) => `${element}-${index}`
      );
      expect(result).toEqual(["a-0", "c-2"]);
    });

    it("should work when functions don't use index parameter", () => {
      const numbers = [1, 2, 3, 4, 5];
      const result = mapFilter(
        numbers,
        (x) => x > 3,
        (x) => x * 2
      );
      expect(result).toEqual([8, 10]);
    });
  });
});
