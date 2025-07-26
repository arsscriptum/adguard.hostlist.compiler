const fs = require('fs').promises;
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const path = require('path');

const SCHEMA_PATH = './schemas';
const SCHEMA_FILE = 'configuration.schema.json';

async function validateConfig(configPath) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const schemaPath = path.resolve(__dirname, SCHEMA_PATH, SCHEMA_FILE);

    const [configStr, schemaStr] = await Promise.all([
        fs.readFile(configPath, 'utf8'),
        fs.readFile(schemaPath, 'utf8'),
    ]);

    const config = JSON.parse(configStr);
    const schema = JSON.parse(schemaStr);

    const validate = ajv.compile(schema);
    const valid = validate(config);

    if (!valid) {
        console.error('Validation failed:');
        console.error(validate.errors);
        process.exit(1);
    } else {
        console.log('Validation passed.');
    }

    return config;
}


module.exports = {
    validateConfig,
};
