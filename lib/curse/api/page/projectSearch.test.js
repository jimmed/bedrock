const projectSearch = require("./projectSearch");
const path = require("path");
const fs = require("mz/fs");

describe("project search page API", () => {
  test("exists", () => expect(projectSearch).toBeDefined());
  describe("projectSearchPage", () => {
    test("exists", () => expect(projectSearch.projectSearchPage).toBeDefined());
  });
  describe("fetchProjectSearchPage", () => {
    test("exists", () =>
      expect(projectSearch.fetchProjectSearchPage).toBeDefined());
    test("fetches some HTML", async () => {
      const result = await projectSearch.fetchProjectSearchPage(
        "age of engineering"
      );
      expect(result).toContain("<!DOCTYPE");
    });
  });
  describe("parseProjectSearchPage", () => {
    test("exists", () =>
      expect(projectSearch.parseProjectSearchPage).toBeDefined());
    const testCases = [
      {
        description: "precise search",
        fixture: "projectSearchResultsPrecise.html",
        expected(outcome) {
          expect(outcome).toBeDefined();
          expect(outcome.resultCount).toEqual(1);
          expect(outcome.results[0]).toBeDefined();
          expect(outcome.results.length).toEqual(1);
          const [firstResult] = outcome.results;
          expect(firstResult).toHaveProperty("image");
          expect(firstResult).toHaveProperty("name", "Age of Engineering");
          expect(firstResult).toHaveProperty("description");
          expect(firstResult).toHaveProperty("projectUrl");
          expect(firstResult).toHaveProperty("owner", "davqvist");
          expect(firstResult).toHaveProperty("lastUpdated");
          expect(firstResult.lastUpdated).toBeInstanceOf(Date);
        }
      },
      {
        description: "loose search first page",
        fixture: "projectSearchResultsLooseFirst.html",
        expected(outcome) {
          expect(outcome).toBeDefined();
          expect(outcome.resultCount).toEqual(93);
          expect(outcome.results[0]).toBeDefined();
          expect(outcome.results.length).toEqual(25);
          const [firstResult] = outcome.results;
          expect(firstResult).toHaveProperty("image");
          expect(firstResult).toHaveProperty(
            "name",
            "Space Expedition to EPIC 204"
          );
          expect(firstResult).toHaveProperty("description");
          expect(firstResult).toHaveProperty("projectUrl");
          expect(firstResult).toHaveProperty("owner", "danaphanous");
          expect(firstResult).toHaveProperty("lastUpdated");
          expect(firstResult.lastUpdated).toBeInstanceOf(Date);
        }
      }
    ];

    const fixtures = {};
    beforeAll(async () => {
      await Promise.all(
        testCases.map(async ({ fixture }) => {
          if (!fixtures[fixture]) {
            fixtures[fixture] = await fs.readFile(
              path.join(__dirname, "fixtures", fixture),
              "utf8"
            );
          }
        })
      );
    });

    testCases.forEach(({ description, fixture, expected }) => {
      test(description, () => {
        const html = fixtures[fixture];
        expect(html).toBeDefined();
        const outcome = projectSearch.parseProjectSearchPage(html);
        expected(outcome);
      });
    });
  });
});
