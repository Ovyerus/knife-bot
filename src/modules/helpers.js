const got = require('got');

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

/**
 * Custom error class used in KnifeBot#awaitMessage to designate a timeout.
*/
class AwaitTimeout extends Error {
    constructor(message) {
        super(message);
        this.name = 'AwaitTimeout';
        this.stack = new Error().stack;
    }
}

/**
 * Custom error class used to designate an unwanted value for an argument.
*/
class ValueError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValueError';
        this.stack = new Error().stack;
    }
}

/**
 * Formats a given date object into a UTC time string.
 * 
 * @param {Date} [date] Date to format.
 * @returns {String} Formatted date string.
 */
function formatUTC(date=new Date()) {
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()} UTC`;
}

/**
 * Lehmer LCG random number generator.
 * 
 * @param {Number} [seed] Seed to start the generator off with.
 * @returns {Function} Function to generate next number on the generator.
 */
function LCG(seed) {
    let lcg = a => a * 48271 % 2147483647;
    seed = seed ? lcg(seed) : lcg(Math.random());
    return () => (seed = lcg(seed)) / 2147483648;
}

/**
 * Gets possible redirects for a given URL.
 * 
 * @param {String} url URL to get redirects for.
 * @returns {String[]} Redirects for the given URL. May be empty.
 */
async function getLinkRedirects(url) {
    if (typeof url !== 'string') throw new TypeError('url is not a string.');

    let res = await got(`http://www.getlinkinfo.com/info?link=${encodeURIComponent(url)}`);
    let body = res.body.replace(/\r|\n/g, '');

    if (/id="statusMessage"/.test(body)) throw new Error('Bad URL');
    if (/class="error-details"/.test(body)) throw new Error(body.match(/<dd class="error-details">(.*?)<\/dd>/)[1]);
    if (/<dd class="redirections-list">.*?\(none\).*?<\/dd>/.test(body)) return [];

    let redirects = body.match(/<dd class="redirections-list">.*?<ol>(.*?)<\/ol>.*?<\/dd>/);

    return redirects ? redirects[1].match(/<li>(.*?)<\/li>/g).map(v => v.match(/<a href="(.*?)".*?>.*?<\/a>/)[1]) : [];
}

const URLRegex = /(?:(?:https?:)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?/gi;

const inviteRegex = /(?:https?:\/\/)?(?:discord\.gg|discordapp\.com\/invite)\/\s*?((?:[A-Za-z0-9]|-)+)/i;

module.exports = {AwaitTimeout, ValueError, formatUTC, LCG, inviteRegex, URLRegex, getLinkRedirects};