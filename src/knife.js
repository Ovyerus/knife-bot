// Modules
const Eris = require('eris');
const config = require(`${__dirname}/config.json`);
const fs = require('fs');
const bot = new Eris(config.token, {
    getAllUsers: true,
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

// Bot vars
bot.config = config;
bot.redHot = '🔥 1⃣0⃣0⃣0⃣ 🌡 🔪'; 
bot.commands = new (require(`${__dirname}/modules/CommandHolder`)).CommandHolder(bot);
bot.db = require('rethinkdbdash')(config.rethinkOptions);
bot.rest = new Eris('Bot ' + config.token, {
    restMode: true
});

bot.settings = new Eris.Collection(Object);

// Generate user blacklist if needed.
if (!fs.existsSync(`${__dirname}/blacklist.json`)) fs.writeFileSync(`${__dirname}/blacklist.json`, '[]');

// Init events and extensions
require(`${__dirname}/modules/extensions`)(bot);
require(`${__dirname}/events`)(bot);

bot.connect();