const Application = require("./lib/app");
const Server      = require("./lib/server");
const sdk         = require("./lib/sdk");
const config      = require("./config");

const app    = new Application(null, config);
const server = new Server(config, app);

sdk.checkNodeVersion();

server.start();

sdk.registerBot(require('./openai-assistant.js'));
