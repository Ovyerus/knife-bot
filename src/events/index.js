const fs = require('fs');

module.exports = bot => {
    fs.readdir(`${__dirname}`, (err, files) => {
        files = files.filter(v => v !== 'index.js' && v.endsWith('.js'));

        files.forEach(v => {
            require(`${__dirname}/${v}`)(bot);
            bot.logger.info(`Loaded ${v}`);
        });
    });
};