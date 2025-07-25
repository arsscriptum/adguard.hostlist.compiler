const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs/promises');

async function computeChecksumFromUrl(url) {
    const response = await axios.get(url, { responseType: 'text' });
    return crypto.createHash('sha256').update(response.data, 'utf8').digest('hex');
}

async function verifyChecksums(config) {
    for (const source of config.sources) {
        if (!source.checksum) {
            console.warn(`No checksum for source ${source.source}`);
            continue;
        }

        const actualChecksum = await computeChecksumFromUrl(source.source);
        const expected = source.checksum.toLowerCase();
        const actual = actualChecksum.toLowerCase();

        if (actual !== expected) {
            console.error(`Checksum mismatch for ${source.source}`);
            console.error(`Expected: ${expected}`);
            console.error(`Actual:   ${actual}`);
        } else {
            console.log(`Checksum OK for ${source.source}`);
        }
    }
}

// Sample usage:
(async () => {
    const config = require('./filter-configs/config-01.json');
    await verifyChecksums(config);
})();
