const Promise = require('bluebird');

exports.cmd = {
    description: 'Clean up and shutdown the bot.',
    owner: true,
    func(knife, msg) {
        return new Promise((resolve, reject) => {
            if (msg.author.id !== knife.owner) {
                resolve('o');
            } else {
                knife.createMessage(msg.channel.id, 'Are you sure you want to shutdown [y/n]?').then(() => {
                    knife.awaitMessage(msg.channel.id, msg.author.id).then(m => {
                        if (/^y(es)?$/i.test(m.content)) {
                            knife.createMessage(m.channel.id, 'Turning off the blowtorches...').then(() => {
                                knife.db.getPoolMaster().drain();
                                knife.logger.info('Restarting/Exiting process...');
                                process.exit();
                            }).catch(reject);
                        } else if (/^no?$/i.test(m.content)) {
                            knife.createMessage(m.channel.id, 'Keeping the blowtorches running.').then(() => resolve()).catch(reject);
                        } else {
                            knife.createMessage(m.channel.id, 'That is not a valid option.').then(() => resolve()).catch(reject);
                        }
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(reject);
            }
        });
    }
}