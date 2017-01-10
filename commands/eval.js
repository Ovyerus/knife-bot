const Promise = require('bluebird');
const fs = require('fs');
const cp = require('child_process');
const util = require('util');
const path = require('path');

exports.cmd = {
    description: '👀',
    usage: '<👀>',
    owner: true,
    func: (knife, msg, args) => {
        return new Promise((resolve, reject) => {
            if (msg.author.id !== knife.owner) {
                resolve('fagit');
            } else {
                var evalArgs = args.join(' ');

                try {
                    var returned = eval(evalArgs);
                    var str = util.inspect(returned, {depth: 1});
                    str = str.replace(new RegExp(knife.token, 'gi'), '<TOKEN>');

                    if (str.length > 1900) {
                        str = str.substr(0, 1897);
                        str = str + '...';
                    }

                    var sentMessage = '```js\n';
                    sentMessage += `Input: ${evalArgs}\n\n`;
                    sentMessage += `Output: ${str}\n`;
                    sentMessage += '```';

                    knife.createMessage(msg.channel.id, sentMessage).then(() => resolve()).catch(reject);
                } catch(err) {
                    var errMessage = '```js\n';
                    errMessage += `Input: ${evalArgs}\n\n`;
                    errMessage += `${err}\n`;
                    errMessage += '```';

                    knife.createMessage(msg.channel.id, errMessage).then(() => resolve()).catch(reject);
                }
            }
        });
    }
}