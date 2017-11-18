const chalk = require("chalk");
const { inspect } = require("util");
const { times, repeat, pad, padStart, padEnd } = require("lodash");
const stripAnsi = require("strip-ansi");
const { Spinner } = require("clui");

const box = (
  text,
  {
    lineColour = "white",
    textColour = "green",
    padding = 2,
    margin = 2,
    bold = false,
    align = "centre"
  } = {}
) => {
  const textLength = text.length;
  const lines = text.split(/\r?\n/g);
  const lineCount = lines.length + 2;
  const intWidth = Math.max(...lines.map(line => stripAnsi(line).length));
  const twicePadding = padding * 2;
  const width = intWidth + twicePadding;
  const leftMargin = repeat(" ", margin);

  const topLeft = chalk[lineColour]("┌");
  const topRight = chalk[lineColour]("┐");
  const bottomLeft = chalk[lineColour]("└");
  const bottomRight = chalk[lineColour]("┘");
  const top = chalk[lineColour]("─");
  const bottom = top;
  const left = chalk[lineColour]("│");
  const right = left;

  const padAlign =
    align === "centre" ? pad : align === "left" ? padEnd : padStart;

  return [
    `${leftMargin}${topLeft}${repeat(top, width)}${topRight}`,
    ...lines.map(
      line =>
        `${leftMargin}${left}${repeat(" ", padding)}${chalk[textColour](
          padAlign(line, intWidth)
        )}${repeat(" ", padding)}${right}`
    ),
    `${leftMargin}${bottomLeft}${repeat(bottom, width)}${bottomRight}`
  ].join("\n");
};

const command = handler => async argv => {
  try {
    await handler(argv);
    process.exit(0);
  } catch (error) {
    debugError(error);
    process.exit(1);
  }
};

const debug = (object, options = {}) =>
  console.log(
    box(inspect(object, { colors: true, ...options }), {
      textColour: "white",
      lineColour: "blue",
      align: "left"
    })
  );

const debugError = error =>
  console.log(
    box(error.stack, {
      textColour: "white",
      lineColour: "red",
      align: "left"
    })
  );

const task = async (
  task,
  message = "Loading...",
  loadedMessage = message,
  errorMessage = loadedMessage
) => {
  const spinner = new Spinner(chalk.yellow(message));
  spinner.start();
  try {
    const result = await task();
    spinner.stop();
    console.log(chalk.green("✔️", loadedMessage));
    return result;
  } catch (error) {
    spinner.stop();
    console.log(chalk.red("❌", errorMessage));
    throw error;
  }
};

const highlight = (text = "", match = "", highlighter = chalk.bold) => {
  if (!match) return text;
  return text.split(match).join(highlighter(match));
};

module.exports = { box, command, debug, debugError, task, highlight };
