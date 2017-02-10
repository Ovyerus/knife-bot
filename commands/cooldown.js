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
                    return knife.awaitMessage(msg.channel.id, msg.author.id);
                }).then(m => {
                    if (/^y(es)?$/i.test(m.content)) {
                        return knife.createMessage(m.channel.id, 'Turning off the blowtorches...');
                    } else if (/^no?$/i.test(m.content)) {
                        return knife.createMessage(m.channel.id, 'Keeping the blowtorches running.');
                    } else {
                        return knife.createMessage(m.channel.id, 'That is not a valid option.')
                    }
                }).then(m => {
                    if (m.content === 'Turning off the blowtorches...') {
                        knife.db.getPoolMaster().drain();
                        knife.logger.info('Restarting/Exiting process...');
                        process.exit();
                    } else {
                        resolve()
                    }
                }).catch(reject);
            }
        });
    }
}