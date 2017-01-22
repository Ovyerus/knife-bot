const Promise = require('bluebird');

exports.cmd = {
    description: 'Invite me to your server.',
    func: (knife, msg) => {
        return new Promise((resolve, reject) => {
            knife.createMessage(msg.channel.id, `**OAuth Invite URL:** https://discordapp.com/oauth2/authorize?client_id=${knife.user.id}&scope=bot&permissions=38816\n**Support Server Invite:** https://discord.gg/hD8xZMG`).then(() => resolve()).catch(reject);
        });
    }
}