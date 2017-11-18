#!/usr/bin/env node
const yargs = require("yargs");
const config = require("config");
const driftwood = require("driftwood");

const { argv } = yargs
  .command(require("./instances"))
  .command(require("./install"));

// driftwood.disable()
