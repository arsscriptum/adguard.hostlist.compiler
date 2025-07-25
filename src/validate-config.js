const fs = require('fs').promises;
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

async function validateConfig(configPath, schemaPath) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

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

// Example usage
const configFile = './filter-configs/config-01.json';
const schemaFile = './schemas/configuration.schema.json';

validateConfig(configFile, schemaFile).catch(console.error);
