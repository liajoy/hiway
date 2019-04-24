#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2))
const hiway = require('.')

hiway(argv._[0], argv.out)
