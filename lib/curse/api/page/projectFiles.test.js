const projectFiles = require("./projectFiles");
const path = require("path");
const fs = require("mz/fs");

describe("project files page API", () => {
  test("exists", () => expect(projectFiles).toBeDefined());
  describe("projectFilesPage", () => {
    test("exists", () => expect(projectFiles.projectFilesPage).toBeDefined());
  });
  describe("fetchProjectFilesPage", () => {
    test("exists", () =>
      expect(projectFiles.fetchProjectFilesPage).toBeDefined());
    test("fetches some HTML", async () => {
      const result = await projectFiles.fetchProjectFilesPage(
        "https://minecraft.curseforge.com/projects/age-of-engineering"
      );
      expect(result).toContain("<!DOCTYPE");
    });
  });
  describe("parseProjectFilesPage", () => {
    test("exists", () =>
      expect(projectFiles.parseProjectFilesPage).toBeDefined());
    const testCases = [
      {
        description: "age of engineering",
        fixture: "projectFilesAgeOfEngineering.html",
        expected(outcome) {
          expect(outcome).toBeDefined();
          expect(outcome.length).toEqual(19);
          outcome.forEach(file => {
            expect(file).toHaveProperty("name");
            expect(file).toHaveProperty("downloadUrl");
            expect(file).toHaveProperty("releaseType");
            expect(file).toHaveProperty("fileSize");
            expect(file).toHaveProperty("uploadedAt");
            expect(file).toHaveProperty("gameVersion");
            expect(file).toHaveProperty("downloadCount");
          });
          const [firstFile] = outcome;
          expect(firstFile).toHaveProperty(
            "name",
            "Age of Engineering-1.1.1c.zip"
          );
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
        const outcome = projectFiles.parseProjectFilesPage(html);
        expected(outcome);
      });
    });
  });
});
