const { searchModpacks } = require("./");

// TODO: Mock fetch function

let argSets = {
  precise: { packName: "age of engineering", resultCount: 1 },
  loose: { packName: "age", resultCount: 75, maxResults: 100 },
  maxResults: { packName: "age", resultCount: 5, maxResults: 5 }
};

describe("modpack search function", () => {
  test("exists", () => expect(searchModpacks).toBeDefined());
  Object.entries(argSets).forEach(
    ([name, { packName, resultCount, maxResults }]) => {
      test(`with ${name} search query`, async () => {
        const results = await searchModpacks(packName, maxResults);
        expect(results).toBeDefined();
        expect(results.length).toEqual(resultCount);
        results.forEach(result => {
          expect(result).toBeDefined();
          expect(result).toHaveProperty("name");
        });
      });
    }
  );
});
