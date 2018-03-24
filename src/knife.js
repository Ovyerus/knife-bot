// Modules
const Eris = require('eris');
const KnifeBot = require(`${__dirname}/modules/KnifeBot`);
const setup = require(`${__dirname}/modules/setup`);
var config;

try {
    config = require(`${__dirname}/config.json`);
} catch(_) {
    config = {};
}

// Easy access to this directory for when `./` doesn't work
global.__baseDir = __dirname;

// Promise library stuff
global.Promise = require('bluebird');
Promise.config({
    warnings: {wForgottenPromise: false},
    longStackTraces: false
});

Eris.Collection.prototype.asyncForEach = async function(func) {
    for (let item of this) await func(item[1], item[0], this);
    return this;
};

(async () => {
    if (!config.redisURL) config.redisURL = 'redis://127.0.0.1/0' || process.env.REDIS_URL;
    if (!config.token) process.env.DISCORDAPP_TOKEN;

    await setup(config.redisURL);

    const bot = await KnifeBot.setup(config.redisURL, {
        getAllUsers: true,
        defaultImageFormat: 'png',
        defaultImageSize: 512,
        latencyThreshold: 15000,
        disableEvents: {
            TYPING_START: true
        }
    });

    require(`${__dirname}/events`)(bot);
    await bot.connect();
})().catch(err => {
    console.error(err);
    process.exit(1);
});