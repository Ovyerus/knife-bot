const Promise = require('bluebird');

exports.cmd = {
    description: 'Ping!',
    func(knife, msg) {
        return new Promise((resolve, reject) => {
            knife.createMessage(msg.channel.id, 'IT BURNS').then(m => {
                knife.editMessage(m.channel.id, m.id, `Cut through the message in \`${m.timestamp - msg.timestamp}ms\``).then(() => resolve ()).catch(reject);
            }).catch(reject);
        });
    }
}