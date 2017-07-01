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

module.exports = {AwaitTimeout, ValueError};