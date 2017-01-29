const Promise = require('bluebird');

exports.cmd = {
    description: 'Display information about the bot.',
    func: (knife, msg) => {
        return new Promise((resolve, reject) => {
            knife.createMessage(msg.channel.id, {embed: {
                title: `${knife.user.username} Info`,
                description: `Currently on **${knife.guilds.size}** guilds.`
            }}).then(() => resolve()).catch(err => {
                if (err.resp && err.resp.statusCode === 400) {

                } else {
                    reject(err);
                }
            });
        });
    }
}