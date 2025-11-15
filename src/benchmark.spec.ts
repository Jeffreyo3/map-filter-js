import { writeFileSync } from "fs";
import path from "path";
import mapFilter from "./index";

// Reducer-based filter-map implementation for comparison
function reduce<T, U>(
  array: T[],
  filter: (element: T, index?: number) => boolean,
  mapper: (element: T, index?: number) => U
): U[] {
  return array.reduce<U[]>((acc, element, index) => {
    if (filter(element, index)) {
      acc.push(mapper(element, index));
    }
    return acc;
  }, []);
}

// Global results collector
const benchmarkResults: any = {
  timestamp: new Date().toISOString(),
  tests: [],
};

// Benchmark utility function
function benchmark(fn: () => void, iterations: number = 1): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const totalTime = end - start;

  return totalTime;
}

// Function to run benchmarks and collect results (runs each test 5 times and reports averages)
function runBenchmarkSuite(
  testName: string,
  testParams: any,
  benchmarkFns: { name: string; fn: () => void; iterations: number }[]
): void {
  const results: any = {
    testName,
    testParams,
    results: [],
    timestamp: new Date().toISOString(),
  };

  benchmarkFns.forEach(({ name, fn, iterations }) => {
    const RUNS = 10;
    const times: number[] = [];

    for (let run = 0; run < RUNS; run++) {
      const time = benchmark(fn, iterations);
      times.push(time);
    }

    // Calculate statistics
    const totalTime = times.reduce((sum, time) => sum + time, 0) / RUNS;
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const stdDev = Math.sqrt(
      times.reduce((sum, time) => sum + Math.pow(time - totalTime, 2), 0) / RUNS
    );

    results.results.push({
      function: name,
      totalTime: parseFloat(totalTime.toFixed(4)),
      avgTime: parseFloat(avgTime.toFixed(4)),
      iterations,
      runs: RUNS,
      minTime: parseFloat(minTime.toFixed(4)),
      maxTime: parseFloat(maxTime.toFixed(4)),
      stdDev: parseFloat(stdDev.toFixed(4)),
      rawTimes: times.map((t) => parseFloat(t.toFixed(4))),
    });
  });

  // Calculate relative performance based on average total times
  const fastest = Math.min(...results.results.map((r: any) => r.totalTime));
  results.results.forEach((r: any) => {
    r.relativePerformance = parseFloat((r.totalTime / fastest).toFixed(2));
    r.isFastest = r.totalTime === fastest;
  });

  benchmarkResults.tests.push(results);
}

// Function to save results to JSON file
function saveBenchmarkResults(): void {
  const outputPath = path.join(process.cwd(), "benchmark-results.json");
  const jsonOutput = JSON.stringify(benchmarkResults, null, 2);

  try {
    writeFileSync(outputPath, jsonOutput);
  } catch (error) {
    // If we can't write to file, output the full results to console
    // so they're not lost in environments where file writing isn't allowed
    console.log("\n=== BENCHMARK RESULTS ===");
    console.log("(File write failed, outputting results to console)");
    console.log(jsonOutput);
    console.log("=== END BENCHMARK RESULTS ===\n");
  }
}

describe("Performance Benchmarks", () => {
  afterAll(() => {
    saveBenchmarkResults();
  });

  describe("Array Size Scaling", () => {
    const generateNumbers = (size: number): number[] =>
      Array.from({ length: size }, (_, i) => i + 1);

    const isEven = (n: number): boolean => n % 2 === 0;
    const double = (n: number): number => n * 2;

    const sizes = [
      { name: "Small", size: 100, iterations: 1000 },
      { name: "Medium", size: 10000, iterations: 100 },
      { name: "Large", size: 1000000, iterations: 10 },
    ];

    sizes.forEach(({ name, size, iterations }) => {
      it(`should benchmark ${name.toLowerCase()} arrays (${size.toLocaleString()} elements)`, () => {
        const testArray = generateNumbers(size);
        let result1: number[] = [];
        let result2: number[] = [];
        let result3: number[] = [];
        let result4: number[] = [];

        const testName = `Array Size Scaling - ${name} (${size.toLocaleString()} elements)`;
        const testParams = {
          arraySize: size,
          iterations,
        };

        const benchmarkFns = [
          {
            name: "mapFilter",
            fn: () => {
              result1 = mapFilter(testArray, isEven, double);
            },
            iterations,
          },
          {
            name: "mapFilterWithSparseCheck",
            fn: () => {
              result2 = mapFilter(testArray, isEven, double, true);
            },
            iterations,
          },
          {
            name: ".reduce()",
            fn: () => {
              result3 = reduce(testArray, isEven, double);
            },
            iterations,
          },
          {
            name: ".filter().map()",
            fn: () => {
              result4 = testArray.filter(isEven).map(double);
            },
            iterations,
          },
        ];

        runBenchmarkSuite(testName, testParams, benchmarkFns);

        expect(result1).toEqual(result2);
        expect(result1).toEqual(result3);
        expect(result1).toEqual(result4);
      });
    });
  });

  describe("Filter Selectivity", () => {
    const testSize = 10000;
    const iterations = 100;

    const testArray = Array.from({ length: testSize }, (_, i) => i + 1);
    const double = (n: number): number => n * 2;

    const selectivityTests = [
      {
        name: "High Selectivity (10% pass)",
        filter: (n: number): boolean => n % 10 === 0,
        expectedPassRate: 0.1,
      },
      {
        name: "Medium Selectivity (50% pass)",
        filter: (n: number): boolean => n % 2 === 0,
        expectedPassRate: 0.5,
      },
      {
        name: "Low Selectivity (90% pass)",
        filter: (n: number): boolean => n % 10 !== 1,
        expectedPassRate: 0.9,
      },
    ];

    selectivityTests.forEach(({ name, filter, expectedPassRate }) => {
      it(`should benchmark ${name.toLowerCase()}`, () => {
        let result1: number[] = [];
        let result2: number[] = [];
        let result3: number[] = [];
        let result4: number[] = [];

        const testName = `Filter Selectivity - ${name}`;
        const testParams = {
          arraySize: testSize,
          iterations,
          expectedPassRate,
        };

        const benchmarkFns = [
          {
            name: "mapFilter",
            fn: () => {
              result1 = mapFilter(testArray, filter, double);
            },
            iterations,
          },
          {
            name: "mapFilterWithSparseCheck",
            fn: () => {
              result2 = mapFilter(testArray, filter, double, true);
            },
            iterations,
          },
          {
            name: ".reduce()",
            fn: () => {
              result3 = reduce(testArray, filter, double);
            },
            iterations,
          },
          {
            name: ".filter().map()",
            fn: () => {
              result4 = testArray.filter(filter).map(double);
            },
            iterations,
          },
        ];

        runBenchmarkSuite(testName, testParams, benchmarkFns);

        expect(result1).toEqual(result2);
        expect(result1).toEqual(result3);
        expect(result1).toEqual(result4);

        const actualPassRate = result1.length / testSize;
        expect(actualPassRate).toBeCloseTo(expectedPassRate, 2);
      });
    });
  });

  describe("Sparse Arrays", () => {
    const testSize = 10000;
    const iterations = 100;
    const double = (n: number): number => n * 2;
    const isNumber = (n: number): boolean => typeof n === "number" && !isNaN(n);

    // Helper function to create sparse arrays with different hole densities
    const createSparseArray = (size: number, holePercent: number): number[] => {
      const arr = new Array(size);
      const fillCount = Math.floor(size * (1 - holePercent));

      // Fill random positions with numbers
      const positions = Array.from({ length: size }, (_, i) => i);
      // Shuffle positions
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      // Fill first fillCount positions
      for (let i = 0; i < fillCount; i++) {
        arr[positions[i]] = positions[i] + 1;
      }

      return arr;
    };

    const sparseTests = [
      {
        name: "Low Sparsity (10% holes)",
        holePercent: 0.1,
      },
      {
        name: "Medium Sparsity (50% holes)",
        holePercent: 0.5,
      },
      {
        name: "High Sparsity (90% holes)",
        holePercent: 0.9,
      },
    ];

    sparseTests.forEach(({ name, holePercent }) => {
      it(`should benchmark ${name.toLowerCase()}`, () => {
        const sparseArray = createSparseArray(testSize, holePercent);
        const definedElements = sparseArray.filter(
          (x) => x !== undefined
        ).length;

        let result1: number[] = [];
        let result2: number[] = [];
        let result3: number[] = [];
        let result4: number[] = [];

        const testName = `Sparse Arrays - ${name}`;
        const testParams = {
          arraySize: testSize,
          iterations,
          holePercent,
          definedElements,
        };

        const benchmarkFns = [
          {
            name: "mapFilter",
            fn: () => {
              result1 = mapFilter(sparseArray, isNumber, double);
            },
            iterations,
          },
          {
            name: "mapFilterWithSparseCheck",
            fn: () => {
              result2 = mapFilter(sparseArray, isNumber, double, true);
            },
            iterations,
          },
          {
            name: ".reduce()",
            fn: () => {
              result3 = reduce(sparseArray, isNumber, double);
            },
            iterations,
          },
          {
            name: ".filter().map()",
            fn: () => {
              result4 = sparseArray.filter(isNumber).map(double);
            },
            iterations,
          },
        ];

        runBenchmarkSuite(testName, testParams, benchmarkFns);

        expect(result2).toEqual(result3);
        expect(result2).toEqual(result4);

        // Note: result1 might be different if mapFilter doesn't handle holes properly
        if (result1.length !== result3.length) {
          // Record difference in test params for JSON output
          (testParams as any).holeHandlingDifference = {
            mapFilterResults: result1.length,
            mapFilterWithSparseCheckResults: result2.length,
            reduceResults: result3.length,
            nativeResults: result4.length,
          };
        }
      });
    });
  });

  describe("Complex Objects", () => {
    const testSize = 10000;
    const iterations = 100;

    it("should benchmark simple objects", () => {
      const testArray = Array.from({ length: testSize }, (_, i) => ({
        id: i,
        value: i * 2,
      }));
      const filter = (obj: any) => obj.id % 2 === 0;
      const mapper = (obj: any) => ({ ...obj, doubled: obj.value * 2 });

      let result1: any[] = [];
      let result2: any[] = [];
      let result3: any[] = [];
      let result4: any[] = [];

      const testName = "Complex Objects - Simple Objects";
      const testParams = {
        arraySize: testSize,
        iterations,
        objectType: "Simple Objects",
        description: "Simple objects with id/value properties",
      };

      const benchmarkFns = [
        {
          name: "mapFilter",
          fn: () => {
            result1 = mapFilter(testArray, filter, mapper);
          },
          iterations,
        },
        {
          name: "mapFilterWithSparseCheck",
          fn: () => {
            result2 = mapFilter(testArray, filter, mapper, true);
          },
          iterations,
        },
        {
          name: ".reduce()",
          fn: () => {
            result3 = reduce(testArray, filter, mapper);
          },
          iterations,
        },
        {
          name: ".filter().map()",
          fn: () => {
            result4 = testArray.filter(filter).map(mapper);
          },
          iterations,
        },
      ];

      runBenchmarkSuite(testName, testParams, benchmarkFns);

      // Verify results are identical
      expect(result1).toEqual(result2);
      expect(result1).toEqual(result3);
      expect(result1).toEqual(result4);
    });

    it("should benchmark complex user objects", () => {
      interface TestUser {
        id: number;
        name: string;
        email: string;
        age: number;
        active: boolean;
        metadata: {
          lastLogin: string;
          preferences: {
            theme: string;
            notifications: boolean;
          };
        };
      }

      const generateUsers = (size: number): TestUser[] =>
        Array.from({ length: size }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          age: 20 + (i % 60),
          active: i % 3 !== 0,
          metadata: {
            lastLogin: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
            preferences: {
              theme: i % 2 === 0 ? "dark" : "light",
              notifications: i % 4 !== 0,
            },
          },
        }));

      const testArray = generateUsers(testSize);
      const filter = (user: TestUser) => user.active && user.age > 25;
      const mapper = (user: TestUser) => ({
        ...user,
        displayName: `${user.name} (${user.age})`,
        canReceiveEmails:
          user.active && user.metadata.preferences.notifications,
      });

      let result1: any[] = [];
      let result2: any[] = [];
      let result3: any[] = [];
      let result4: any[] = [];

      const testName = "Complex Objects - Complex User Objects";
      const testParams = {
        arraySize: testSize,
        iterations,
        objectType: "Complex User Objects",
        description: "Complex nested objects with multiple properties",
      };

      const benchmarkFns = [
        {
          name: "mapFilter",
          fn: () => {
            result1 = mapFilter(testArray, filter, mapper);
          },
          iterations,
        },
        {
          name: "mapFilterWithSparseCheck",
          fn: () => {
            result2 = mapFilter(testArray, filter, mapper, true);
          },
          iterations,
        },
        {
          name: ".reduce()",
          fn: () => {
            result3 = reduce(testArray, filter, mapper);
          },
          iterations,
        },
        {
          name: ".filter().map()",
          fn: () => {
            result4 = testArray.filter(filter).map(mapper);
          },
          iterations,
        },
      ];

      runBenchmarkSuite(testName, testParams, benchmarkFns);

      expect(result1).toEqual(result2);
      expect(result1).toEqual(result3);
      expect(result1).toEqual(result4);
    });

    it("should benchmark deep nested objects", () => {
      interface DeepNestedObj {
        level1: {
          level2: {
            level3: {
              level4: {
                id: number;
                data: string;
                active: boolean;
              };
            };
          };
        };
      }

      const testArray: DeepNestedObj[] = Array.from(
        { length: testSize },
        (_, i) => ({
          level1: {
            level2: {
              level3: {
                level4: {
                  id: i,
                  data: `item-${i}`,
                  active: i % 3 === 0,
                },
              },
            },
          },
        })
      );

      const filter = (obj: DeepNestedObj) =>
        obj.level1.level2.level3.level4.active;
      const mapper = (obj: DeepNestedObj) => ({
        ...obj,
        flattened: {
          id: obj.level1.level2.level3.level4.id,
          data: obj.level1.level2.level3.level4.data.toUpperCase(),
        },
      });

      let result1: any[] = [];
      let result2: any[] = [];
      let result3: any[] = [];
      let result4: any[] = [];

      const testName = "Complex Objects - Deep Nested Objects";
      const testParams = {
        arraySize: testSize,
        iterations,
        objectType: "Deep Nested Objects",
        description: "Deeply nested objects requiring property traversal",
      };

      const benchmarkFns = [
        {
          name: "mapFilter",
          fn: () => {
            result1 = mapFilter(testArray, filter, mapper);
          },
          iterations,
        },
        {
          name: "mapFilterWithSparseCheck",
          fn: () => {
            result2 = mapFilter(testArray, filter, mapper, true);
          },
          iterations,
        },
        {
          name: ".reduce()",
          fn: () => {
            result3 = reduce(testArray, filter, mapper);
          },
          iterations,
        },
        {
          name: ".filter().map()",
          fn: () => {
            result4 = testArray.filter(filter).map(mapper);
          },
          iterations,
        },
      ];

      runBenchmarkSuite(testName, testParams, benchmarkFns);

      expect(result1).toEqual(result2);
      expect(result1).toEqual(result3);
      expect(result1).toEqual(result4);
    });
  });

  describe("Function Call Overhead", () => {
    const testSize = 10000;
    const iterations = 100;

    it("should benchmark function parameter detection overhead", () => {
      // Create functions with different parameter counts to test mapFilter's function.length checking
      const testArray = Array.from({ length: testSize }, (_, i) => i + 1);

      const singleParamFilter = (n: number) => n % 2 === 0;
      const singleParamMapper = (n: number) => n * 2;

      let result1: number[] = [];
      let result2: number[] = [];
      let result3: number[] = [];
      let result4: number[] = [];

      const testName = "Function Call Overhead - Single Parameter Functions";
      const testParams = {
        arraySize: testSize,
        iterations,
        testType: "Single Parameter Functions",
        description:
          "Functions with single parameters - mapFilter should optimize these",
      };

      const benchmarkFns = [
        {
          name: "mapFilter",
          fn: () => {
            result1 = mapFilter(
              testArray,
              singleParamFilter,
              singleParamMapper
            );
          },
          iterations,
        },
        {
          name: "mapFilterWithSparseCheck",
          fn: () => {
            result2 = mapFilter(
              testArray,
              singleParamFilter,
              singleParamMapper,
              true
            );
          },
          iterations,
        },
        {
          name: ".reduce()",
          fn: () => {
            result3 = reduce(testArray, singleParamFilter, singleParamMapper);
          },
          iterations,
        },
        {
          name: ".filter().map()",
          fn: () => {
            result4 = testArray
              .filter(singleParamFilter)
              .map(singleParamMapper);
          },
          iterations,
        },
      ];

      runBenchmarkSuite(testName, testParams, benchmarkFns);

      expect(result1).toEqual(result2);
      expect(result1).toEqual(result3);
      expect(result1).toEqual(result4);
    });

    it("should benchmark dual parameter function overhead", () => {
      const testArray = Array.from({ length: testSize }, (_, i) => i + 1);

      // Dual parameter functions (mapFilter should use index parameter)
      const dualParamFilter = (n: number, index?: number) =>
        (n + (index || 0)) % 2 === 0;
      const dualParamMapper = (n: number, index?: number) =>
        n * 2 + (index || 0);

      let result1: number[] = [];
      let result2: number[] = [];
      let result3: number[] = [];
      let result4: number[] = [];

      const testName = "Function Call Overhead - Dual Parameter Functions";
      const testParams = {
        arraySize: testSize,
        iterations,
        testType: "Dual Parameter Functions",
        description:
          "Functions with dual parameters - mapFilter should pass index, reduce always passes both",
      };

      const benchmarkFns = [
        {
          name: "mapFilter",
          fn: () => {
            result1 = mapFilter(testArray, dualParamFilter, dualParamMapper);
          },
          iterations,
        },
        {
          name: "mapFilterWithSparseCheck",
          fn: () => {
            result2 = mapFilter(
              testArray,
              dualParamFilter,
              dualParamMapper,
              true
            );
          },
          iterations,
        },
        {
          name: ".reduce()",
          fn: () => {
            result3 = reduce(testArray, dualParamFilter, dualParamMapper);
          },
          iterations,
        },
        {
          name: ".filter().map()",
          fn: () => {
            result4 = testArray.filter(dualParamFilter).map(dualParamMapper);
          },
          iterations,
        },
      ];

      runBenchmarkSuite(testName, testParams, benchmarkFns);

      expect(result1).toEqual(result2);
      expect(result1).toEqual(result3);
      expect(result1).toEqual(result4);
    });

    it("should benchmark minimal function call overhead", () => {
      const testArray = Array.from({ length: testSize }, (_, i) => i + 1);

      // Extremely simple functions to isolate pure call overhead
      const trivialFilter = (n: number) => true;
      const trivialMapper = (n: number) => n;

      let result1: number[] = [];
      let result2: number[] = [];
      let result3: number[] = [];
      let result4: number[] = [];

      const testName = "Function Call Overhead - Minimal Overhead";
      const testParams = {
        arraySize: testSize,
        iterations,
        testType: "Minimal Overhead",
        description:
          "Trivial functions to isolate pure function call and parameter passing overhead",
      };

      const benchmarkFns = [
        {
          name: "mapFilter",
          fn: () => {
            result1 = mapFilter(testArray, trivialFilter, trivialMapper);
          },
          iterations,
        },
        {
          name: "mapFilterWithSparseCheck",
          fn: () => {
            result2 = mapFilter(testArray, trivialFilter, trivialMapper, true);
          },
          iterations,
        },
        {
          name: ".reduce()",
          fn: () => {
            result3 = reduce(testArray, trivialFilter, trivialMapper);
          },
          iterations,
        },
        {
          name: ".filter().map()",
          fn: () => {
            result4 = testArray.filter(trivialFilter).map(trivialMapper);
          },
          iterations,
        },
      ];

      runBenchmarkSuite(testName, testParams, benchmarkFns);

      expect(result1).toEqual(result2);
      expect(result1).toEqual(result3);
      expect(result1).toEqual(result4);
    });

    it("should benchmark function.length checking overhead", () => {
      const testArray = Array.from({ length: testSize }, (_, i) => i + 1);

      // Functions that should trigger different code paths in mapFilter
      const filterWithDifferentLengths = [
        (n: number) => n % 2 === 0,
        (n: number, _?: number) => n % 2 === 0,
      ];

      const mapperWithDifferentLengths = [
        (n: number) => n * 2,
        (n: number, _?: number) => n * 2,
      ];

      let result1: number[] = [];
      let result2: number[] = [];
      let result3: number[] = [];
      let result4: number[] = [];

      const testName = "Function Call Overhead - Function.length Checking";
      const testParams = {
        arraySize: testSize,
        iterations,
        testType: "Function.length Checking",
        description:
          "Mixed function lengths to test mapFilter's function.length optimization overhead",
      };

      const benchmarkFns = [
        {
          name: "mapFilter",
          fn: () => {
            // Alternate between different function lengths to stress the checking
            const filterFn = filterWithDifferentLengths[0];
            const mapperFn = mapperWithDifferentLengths[1];
            result1 = mapFilter(testArray, filterFn, mapperFn);
          },
          iterations,
        },
        {
          name: "mapFilterWithSparseCheck",
          fn: () => {
            const filterFn = filterWithDifferentLengths[0];
            const mapperFn = mapperWithDifferentLengths[1];
            result2 = mapFilter(testArray, filterFn, mapperFn, true);
          },
          iterations,
        },
        {
          name: ".reduce()",
          fn: () => {
            const filterFn = filterWithDifferentLengths[0];
            const mapperFn = mapperWithDifferentLengths[1];
            result3 = reduce(testArray, filterFn, mapperFn);
          },
          iterations,
        },
        {
          name: ".filter().map()",
          fn: () => {
            const filterFn = filterWithDifferentLengths[0];
            const mapperFn = mapperWithDifferentLengths[1];
            result4 = testArray.filter(filterFn).map(mapperFn);
          },
          iterations,
        },
      ];

      runBenchmarkSuite(testName, testParams, benchmarkFns);

      expect(result1).toEqual(result2);
      expect(result1).toEqual(result3);
      expect(result1).toEqual(result4);
    });
  });
});
