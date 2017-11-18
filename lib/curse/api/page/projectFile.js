const config = require("config");
const HTMLParser = require("fast-html-parser");
const parseDate = require("date-fns/parse");
const { unescape } = require("lodash");
const { fetchHtmlPage } = require("./utils");

const projectFilePage = async (projectID, fileID) => {
  let html;
  try {
    html = await fetchProjectFilePage(projectID, fileID);
  } catch (error) {
    console.warn(error.stack);
    throw new Error(
      `Unable to fetch project file page for ${projectID}/${fileID}`
    );
  }
  return parseProjectFilePage(html);
};

const fetchProjectFilePage = async (projectID, fileID) => {
  const url = `${config.url.curse}/projects/${projectID}/files/${fileID}`;
  return (await fetchHtmlPage(url)).trim();
};

const parseProjectFilePage = pageHtml => {
  const [pageBody] = pageHtml
    .replace(/\r?\n/g, "")
    .match(/<body[^>]*>(.+)<\/body>/);
  const root = HTMLParser.parse(pageBody);
  const pageContent = root.querySelector("#content");
  const mainContent = pageContent.querySelector(".details-panel");

  const detailsHeader = mainContent.querySelector(".details-header");
  if (!detailsHeader) {
    throw new Error("Could not find details header on project file page");
  }
  const releasePhase = detailsHeader.querySelector(
    ".project-file-release-type .tip"
  );
  if (!releasePhase) {
    throw new Error("Could not find release phase icon on project file page");
  }
  const releaseType = releasePhase.attributes.title;
  const nameElement = detailsHeader.querySelector("h3");
  if (!nameElement) {
    throw new Error("Could not find name element on project file page");
  }
  const name = nameElement.rawText.trim();
  const downloadLink = detailsHeader.querySelector(
    ".project-file-download-button-large a"
  );
  if (!downloadLink) {
    throw new Error("Could not find download link on project file page");
  }
  const downloadUrl = downloadLink.attributes.href;

  const detailsList = mainContent.querySelector(".details-info");
  if (!detailsList) {
    throw new Error("Could not find details list on project file page");
  }
  const [
    filenameEl,
    authorEl,
    uploadedAtEl,
    filesizeEl,
    downloadCountEl,
    fileHashEl
  ] = detailsList.querySelectorAll("ul li .info-data");
  const filename = filenameEl.rawText;
  const author = authorEl.querySelectorAll(".user-tag a")[1].rawText;
  const uploadedAt = parseDate(
    parseInt(
      uploadedAtEl.querySelector("abbr").attributes["data-epoch"] * 1000,
      10
    )
  );
  const fileSize = Math.floor(
    parseFloat(filesizeEl.rawText.trim().split(/\s+/)[0], 10) * 1024 * 1024
  );
  const downloadCount = parseInt(
    downloadCountEl.rawText.trim().replace(/[^\d]+/g, ""),
    10
  );
  const fileHash = fileHashEl.querySelector(".md5").rawText;

  const additionalFilesTable = mainContent.querySelector(
    ".project-file-list .project-file-listing"
  );
  const additionalFiles = additionalFilesTable
    ? additionalFilesTable.querySelectorAll("tbody tr").map(row => {
        const releasePhase = row.querySelector(
          ".project-file-release-type .release-phase"
        );
        const releaseType = releasePhase ? releasePhase.attributes.title : null;
        const nameLink = row.querySelector(".project-file-name .twitch-link");
        const name = nameLink.rawText;
        const isServerPack = !!name.match(/Server Files$/i);
        const detailsUrl = nameLink.attributes.href;
        const downloadUrl = row.querySelector(
          ".project-file-name .project-file-download-button .button"
        ).attributes.href;
        const fileSize = Math.floor(
          parseFloat(
            row
              .querySelector(".project-file-size")
              .rawText.trim()
              .split(/\s+/)[0],
            10
          ) *
            1024 *
            1024
        );
        const uploadedAt = parseDate(
          row.querySelector(".project-file-date-uploaded abbr").attributes[
            "data-epoch"
          ] * 1000
        );

        const gameVersion = row.querySelector(
          ".project-file-game-version .version-label"
        ).rawText;
        const downloadCount = parseInt(
          row
            .querySelector(".project-file-downloads")
            .rawText.trim()
            .replace(/[^\d]+/g, ""),
          10
        );

        return {
          releaseType,
          name,
          detailsUrl,
          downloadUrl,
          isServerPack,
          fileSize,
          uploadedAt,
          gameVersion,
          downloadCount
        };
      })
    : [];

  return {
    name,
    releaseType,
    downloadUrl,
    filename,
    author,
    uploadedAt,
    fileSize,
    downloadCount,
    fileHash,
    additionalFiles
  };
};

module.exports = {
  fetchProjectFilePage,
  parseProjectFilePage,
  projectFilePage
};
