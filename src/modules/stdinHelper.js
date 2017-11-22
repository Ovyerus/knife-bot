const {stdin, stdout} = process;
let prompting = false;

/**
 * Helper function to easily prompt input from stdin.
 * 
 * @param {String} message Message to print before enabling input.
 * @param {Object} [options] Optional options.
 * @param {Function} [options.filter] Filter to run against the line, repeating if it doesn't match.
 * @param {String} [options.filterMsg="Invalid input."] Message to display if the filter doesn't match. 
 * @param {Boolean} [options.newLine=false] Whether to have a `> ` on the next line.
 * @returns {Promise<String>} Input from stdin.
 */
function prompt(message, options={}) {
    return new Promise(resolve => {
        let filter = options.filter ? options.filter : () => true;
        let filterMsg = options.filterMsg || 'Invalid input.';
        let newLine = options.newLine != null ? !!options.newLine : true;

        if (typeof message !== 'string') throw new TypeError('message is not a string.');
        if (typeof filter !== 'function') throw new TypeError('filter is not a function.');
        if (prompting) throw new Error('A prompt is already in progress.');

        prompting = true;

        if (newLine) stdout.write(`${message}\n> `);
        else stdout.write(`${message} `);

        stdin.resume();
        stdin.setEncoding('utf8');

        stdin.once('data', data => {
            let line = data.split(/\r?\n/g)[0];
            prompting = false;

            stdin.pause();
            console.log();

            if (filter(line)) resolve(line);
            else {
                console.log(filterMsg);
                resolve(prompt(message, options));
            }
        });
    });
}

/**
 * Waits for a single character from stdin.
 * 
 * @param {String} message Message to print before enabling input.
 * @param {Function} [filter] Filter to run against the character, repeating if it doesn't match.
 * @returns {Promise<String>} Captured character.
 */
function promptChar(message, filter=() => true) {
    return new Promise(resolve => {
        if (typeof message !== 'string') throw new TypeError('message is not a string.');
        if (prompting) throw new Error('A prompt is already in progress.');

        prompting = true;

        console.log(message);
        stdin.resume();
        stdin.setEncoding('utf8');
        stdin.setRawMode(true);

        stdin.once('data', key => {
            prompting = false;
            
            stdin.setRawMode(false);
            stdin.pause();
            console.log();

            if (filter(key)) resolve(key);
            else resolve(promptChar(message, filter));
        });
    });
}

/**
 * Easy method to check if a user wishes to confirm an action, with a yes or no answer requirement.
 * 
 * @param {String} message Message to print before enabling input.
 * @param {Boolean} [defaultValue] What the value of a blank line should be.
 * @returns {Promise<Boolean>} Whether the user has confirmed or not.
 */
function confirm(message, defaultValue) {
    return new Promise(resolve => {
        let opts = {filter: line => /^(y(es)?|no?)?$/i.test(line), newLine: false};

        if (![true, false].includes(defaultValue)) resolve(prompt(`${message} [y/n]`, opts));
        else if (!defaultValue) resolve(prompt(`${message} [y/N]`, opts));
        else resolve(prompt(`${message} [Y/n]`, opts));
    }).then(res => {
        if (!res && [true, false].includes(defaultValue)) return defaultValue;
        else return /^y(es)?$/i.test(res);
    });
}

module.exports = {prompt, promptChar, confirm};