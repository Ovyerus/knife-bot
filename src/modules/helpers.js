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

class AwaitTimeout extends Error {
    constructor(message) {
        super(message);
        this.name = 'AwaitTimeout';
        this.stack = new Error().stack;
    }
}

class ValueError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValueError';
        this.stack = new Error().stack;
    }
}

function formatUTC(date=new Date()) {
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()} UTC`;
}

module.exports = {AwaitTimeout, ValueError, formatUTC};