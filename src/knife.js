// Modules
const Eris = require('eris');
const fs = require('fs');
const KnifeBot = require(`${__dirname}/modules/KnifeBot`);
const config = require(`${__dirname}/config.json`);

// Generate user blacklist if needed.
if (!fs.existsSync(`${__dirname}/blacklist.json`)) fs.writeFileSync(`${__dirname}/blacklist.json`, '[]');

const bot = new KnifeBot(config, {
    getAllUsers: true,
    defaultImageFormat: 'png',
    defaultImageSize: 512,
    disableEvents: {
        TYPING_START: true,
        VOICE_STATE_UPDATE: true
    }
});

// Globals;
global.logger = require(`${__dirname}/modules/logger`);
global.Promise = require('bluebird');
global.__baseDir = __dirname;

Promise.config({
    warnings: {wForgottenPromise: false},
    longStackTraces: false
});

Eris.Collection.prototype.asyncForEach = async function(func) {
    for (let item of this) await func(item[1], item[0], this);
    return this;
};

// Init events
require(`${__dirname}/events`)(bot);

bot.connect();