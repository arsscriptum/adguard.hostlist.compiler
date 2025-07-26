const consola = require('consola');
const fs = require('fs').promises;
const utils = require('./utils');
const { transform } = require('./transformations/transform');

/**
 * Compiles an individual source if the checksum has changed.
 *
 * @param {Object} source - source configuration.
 * @param {Object} config - full config (to persist checksum updates)
 * @returns {Promise<Array<string>>}
 */
async function compileSource(source, config) {
    consola.info(`Checking source: ${source.source}`);

    const str = await utils.download(source.source);
    const checksum = utils.computeChecksum(str);

    if (source.checksum && source.checksum.toLowerCase() === checksum.toLowerCase()) {
        consola.info(`Skipping ${source.source} (checksum unchanged)`);
        return []; // No processing
    }

    // Update checksum
    source.checksum = checksum;

    // Save updated config if path is tracked
    //if (config._configPath) {
    //    try {
    //        await fs.writeFile(config._configPath, JSON.stringify(config, null, 4));
    //        consola.success(`Updated checksum in config file: ${config._configPath}`);
    //    } catch (err) {
    //        consola.warn(`Could not update config file: ${err.message}`);
    //    }
    //}

    // Process the file
    let rules = str.split(/\r?\n/);
    consola.info(`Original rule count: ${rules.length}`);

    rules = await transform(rules, source, source.transformations);

    consola.info(`Rule count after transformations: ${rules.length}`);
    return rules;
}

module.exports = compileSource;
