const fetch = require("node-fetch");
const HttpError = require("http-errors");

const fetchHtmlPage = async url => {
  const result = await fetch(url);
  if (!result.ok) {
    throw new HttpError(
      result.status,
      `On URL: ${url}\n\n${result.statusText}`
    );
  }
  return await result.text();
};

module.exports = { fetchHtmlPage };
