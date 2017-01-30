const fs = require('fs');
const Promise = require('bluebird');

function parse(content, prefixes) {
    return new Promise((resolve, reject) => {
        var oldContent = content;
        
        for (let prfx of prefixes) {
            if (typeof prfx === 'string') {
                content = content.startsWith(prfx) ? content.substring(prfx.length) : content;
                if (content !== oldContent) break;
            } else if (prfx instanceof RegExp) {
                let tmp = prfx.toString().replace(/^\//, '').replace(/\/$/, '');
                tmp = tmp.startsWith('^') ? tmp : '^' + tmp;
                tmp = new RegExp(tmp);
                content = tmp.test(content) ? content.replace(tmp, '') : content;
                if (content !== oldContent) break;
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