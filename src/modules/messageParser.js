const QuoteRegex = /(")(?:(?=(\\?))\2.)*?\1/g;
const TulpaRegex = /^(?:\[(.*)\]|\{(.*)\}|~(.*)|\/\/(.*))$/;

/**
 * Parse a string and return arguments for command runner.
 * 
 * @param {String} str String to parse from
 * @returns {Promise<Object>} Object with three keys: args, cmd, raw
 */
function parseArgs(str) {
    // Type checks
    if (typeof str !== 'string') throw new Error('str is not a string.');

    // Split string and pop command out
    let tmp = str.split(' ');
    let cmd = tmp.splice(0, 1)[0];

    // Match regex for multi word args.
    tmp = tmp.join(' ').match(QuoteRegex);
    let args = str.split(QuoteRegex).filter(v => v !== '' && v !== '"');
    args[0] = args[0].split(' ').slice(1).join(' ');

    // String without command in front
    let raw = str.split(cmd).slice(1).join(cmd).trim();

    if (tmp) {
        // Remove start and end quotes
        tmp = tmp.map(v => v.slice(1, -1));

        // Split regular args
        args.forEach((v, i) => {
            if (!Array.isArray(v)) args[i] = v.split(' '); 
        });

        // Move multi word args into main array
        args.forEach((v, i) => {
            if (raw.split(' ')[i].startsWith('"')) args.splice(i + 1, 0, tmp.shift());
        });

        // Concat rest of multi word args, flatten and filter
        args = args.concat(tmp.filter(v => !~args.indexOf(v)));
        args = [].concat.apply([], args).filter(v => v !== '' && v != null);
    } else {
        // Split on spaces
        args.forEach((v, i) => {
            if (!Array.isArray(v)) args[i] = v.split(' ');
        });

        // Flatten and filter
        args = [].concat.apply([], args).filter(v => v !== '' && v != null);
    }

    return {args, cmd, raw};
}

/**
 * Parse a string and check if it starts with a valid prefixes
 * 
 * @param {String} str String to parse
 * @param {String[]} prefixes Array of prefixes
 * @returns {String?} String potentially with prefixes parsed.
 */
function parsePrefix(str, prefixes) {
    // Type checks
    if (typeof str !== 'string') throw new Error('str is not a string.');
    if (!Array.isArray(prefixes)) throw new Error('prefixes is not an array.');

    // Var for checking if content is altered or not
    let oldStr = str;

    for (let prfx of prefixes) {
        str = str.startsWith(prfx) ? str.slice(prfx.length) : str;
        if (str !== oldStr) break;
    }

    return str;
}

/**
 * Parse a string and remove common tulpa wrappers if possible.
 * 
 * @param {String} str The string to parse
 * @returns {String} Parsed string.
 */
function parseTulpa(str) {
    if (typeof str !== 'string') throw new TypeError('str is not a string.');
    if (!TulpaRegex.test(str)) return str;

    return str.match(TulpaRegex).slice(1).find(v => v != null);
}

module.exports = {parseArgs, parsePrefix, parseTulpa};