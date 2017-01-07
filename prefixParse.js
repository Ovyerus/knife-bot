const fs = require('fs');
const Promise = require('bluebird');

function parse(content, prefixes) {
    return new Promise((resolve, reject) => {
        var oldContent = content;
        
        for (let prfx of prefixes) {
            if (content.startsWith(prfx)) {
                content = content.substring(prfx.length);
                break;
            }
        }

        if (content !== oldContent) {
            resolve(content);
        } else {
            resolve();
        }
    });
}

module.exports = parse;