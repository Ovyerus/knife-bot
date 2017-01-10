const Promise = require('bluebird');

exports.cmd = {
    description: 'Invite me to your server.',
    func: (knife, msg) => {
        return new Promise((resolve, reject) => {
            knife.createMessage(msg.channel.id, `https://discordapp.com/oauth2/authorize?client_id=${knife.user.id}&scope=bot&permissions=388167`).then(() => resolve()).catch(reject);
        });
    }
}