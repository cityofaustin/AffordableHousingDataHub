const fs = require('fs');
//const configPath = fs.readFileSync('./config_path.txt', 'utf8');

//TODO: use env variables
const configPath = process.env.CONFIG_PATH;

module.exports.configPath = configPath;
