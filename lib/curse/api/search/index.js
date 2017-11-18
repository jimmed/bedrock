const { range } = require("lodash");
const { projectSearchPage } = require("../page/projectSearch");

const searchModpacks = async (packName, maxResults = 10) => {
  const { results, resultCount } = await projectSearchPage(packName);

  if (results.length >= maxResults || resultCount <= results.length) {
    return results.slice(0, maxResults);
  }

  const resultsNeeded = Math.min(maxResults, resultCount);
  const totalPages = Math.ceil(resultsNeeded / results.length);
  const remainingPages = await Promise.all(
    range(2, totalPages).map(
      async page => await projectSearchPage(packName, page)
    )
  );

  return results
    .concat(...remainingPages.map(({ results }) => results))
    .slice(0, maxResults);
};

module.exports = {
  searchModpacks
};
