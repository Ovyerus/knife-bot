const Promise = require('bluebird');

exports.cmd = {
    description:'Turns the blowtorches off.',
    owner: true,
    func: (knife, msg) => {
        return new Promise((resolve, reject) => {
            if (msg.author.id !== knife.owner) {
                resolve('fagit');
            } else {
                knife.createMessage(msg.channel.id, 'Turning off the blowtorches...').then(() => {
                    console.log('ayy lmao cya world');
                    process.exit();
                });
            }
        });
    }
}