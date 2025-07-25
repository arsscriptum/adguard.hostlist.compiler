const _ = require('lodash');
const consola = require('consola');
const config = require('./configuration');
const compileSource = require('./compile-source');
const { transform } = require('./transformations/transform');
const packageJson = require('../package.json');
const path = require('path');
const os = require('os');

function splitOutputLines(lines, maxSizeBytes, baseName) {
    const result = [];
    let currentPart = [];
    let currentSize = 0;
    let partIndex = 1;

    const encoded = (s) => Buffer.byteLength(s + os.EOL);

    for (const line of lines) {
        const lineSize = encoded(line);
        if (currentSize + lineSize > maxSizeBytes && currentPart.length > 0) {
            result.push({
                name: `${baseName}_part${partIndex}.txt`,
                lines: currentPart,
            });
            partIndex++;
            currentPart = [];
            currentSize = 0;
        }
        currentPart.push(line);
        currentSize += lineSize;
    }

    if (currentPart.length > 0) {
        result.push({
            name: `${baseName}_part${partIndex}.txt`,
            lines: currentPart,
        });
    }

    return result;
}


/**
 * Prepares list header
 *
 * @param {*} configuration - compilation configuration.
See the repo README for the details on it.
 * @returns {Array<string>} header lines
 */
function prepareHeader(configuration) {
    const lines = [
        '!',
        `! Title: ${configuration.name}`,
    ];

    if (!_.isEmpty(configuration.description)) {
        lines.push(`! Description: ${configuration.description}`);
    }
    if (!_.isEmpty(configuration.version)) {
        lines.push(`! Version: ${configuration.version}`);
    }
    if (!_.isEmpty(configuration.homepage)) {
        lines.push(`! Homepage: ${configuration.homepage}`);
    }
    if (!_.isEmpty(configuration.license)) {
        lines.push(`! License: ${configuration.license}`);
    }

    lines.push(`! Last modified: ${(new Date()).toISOString()}`);
    lines.push('!');

    // Compiler info
    lines.push(`! Compiled by ${packageJson.name} v${packageJson.version}`);
    lines.push('!');
    return lines;
}

/**
 * @typedef {import('./compile-source').ListSource} ListSource
 */

/**
 * Prepares source header lines
 *
 * @param {ListSource} source - source metadata
 * @returns {Array<String>} source header lines
 */
function prepareSourceHeader(source) {
    const lines = [
        '!',
    ];

    if (!_.isEmpty(source.name)) {
        lines.push(`! Source name: ${source.name}`);
    }
    lines.push(`! Source: ${source.source}`);
    lines.push('!');
    return lines;
}

/**
 * Compiles a filter list using the specified configuration.
 *
 * @param {*} configuration - compilation configuration.
See the repo README for the details on it.
 * @returns {Promise<Array<string>>} the array of rules.
 */
async function compile(configuration) {
    consola.info('Starting the compiler');
    const ret = config.validateConfiguration(configuration);
    /*if (!ret.valid) {
        consola.info(ret.errorsText);
        throw new Error('Failed to validate configuration');
    }*/

    consola.info(`Configuration: ${JSON.stringify(configuration, 0, 4)}`);

    // This will be the final list of rules
    let finalList = [];

    // Now go through sources
    // eslint-disable-next-line no-restricted-syntax
    for (const source of configuration.sources) {
        // eslint-disable-next-line no-await-in-loop
        const sourceRules = await compileSource(source,configuration);
        const sourceHeader = prepareSourceHeader(source);

        finalList = finalList.concat(sourceHeader);
        finalList = finalList.concat(sourceRules);
    }

    // Now let's apply the final transformations to the list
    // Use empty list by default for transformations here
    const transformations = configuration.transformations || [];
    finalList = await transform(finalList, configuration, transformations);

    // Now prepend the list header and we're good to go
    const header = prepareHeader(configuration);
    consola.info(`Final length of the list is ${header.length + finalList.length}`);
    const outputLines = header.concat(finalList);
    const maxsize = parseInt(configuration.maxsize || '0', 10);

    // No limit if undefined, 0, or < 1024
    if (!maxsize || maxsize < 1024) {
        return outputLines;
    }

   const totalSize = Buffer.byteLength(outputLines.join(os.EOL));

   if (totalSize <= maxsize) {
       return outputLines;
   }

   // Needs splitting
   const baseName = configuration.outputBaseName;
   const allParts = splitOutputLines(outputLines, maxsize, baseName);

   return allParts.map((part) => {
       const size = Buffer.byteLength(part.lines.join(os.EOL));
       const customHeader = [
           '!',
           `! File: ${part.name}`,
           `! Actual size: ${size} bytes`,
           `! Max size allowed: ${maxsize} bytes`,
           '!',
       ];
       return {
           name: part.name,
           content: customHeader.concat(part.lines).join(os.EOL),
       };
   });
}

module.exports = compile;
