const Promise = require('bluebird');
const prettyBytes = require('pretty-bytes');

function msToTime(ms) {
    var time = ms / 1000;
    var seconds = time % 60;
    time /= 60;
    var minutes = time % 60;
    time /= 60;
    var hours = time % 24;
    time /= 24;
    var days = time;

    seconds = Math.floor(seconds);
    minutes = Math.floor(minutes);
    hours = Math.floor(hours);
    days = Math.floor(days);

    seconds.toString().length === 1 ? seconds = '0' + seconds.toString() : seconds = seconds.toString();
    minutes.toString().length === 1 ? minutes = '0' + minutes.toString() : minutes = minutes.toString();
    hours.toString().length === 1 ? hours = '0' + hours.toString() : hours = hours.toString();

    return `${days} days, ${hours}:${minutes}:${seconds}`;
}

exports.cmd = {
    description: 'Display information about the bot.',
    func: (knife, msg) => {
        return new Promise((resolve, reject) => {
            var guildBot = msg.channel.guild.members.get(knife.user.id);
            var roleColour = guildBot.roles.sort((a, b) => {
                return guildBot.guild.roles.get(b).position - guildBot.guild.roles.get(a).position;
            })[0];
            roleColour = roleColour ? msg.channel.guild.roles.get(roleColour).color : 0;
            knife.createMessage(msg.channel.id, {embed: {
                title: `${knife.user.username} Info`,
                thumbnail: {url: knife.user.avatarURL.replace('https://cdn.discordapp.com', 'https://images.discordapp.net') + '?size=256'},
                color: roleColour,
                fields: [
                    {name: 'Guilds', value: knife.guilds.size, inline: true},
                    {name: 'Users Seen', value: knife.users.size, inline: true},
                    {name: 'Uptime', value: msToTime(knife.uptime), inline: true},
                    {name: 'Memory Usage', value: prettyBytes(process.memoryUsage().rss), inline: true},
                ]
            }}).then(() => resolve()).catch(err => {
                if (err.resp && err.resp.statusCode === 400) {
                    var m = `**${knife.user.username} Info**\n`;
                    m += `**Guilds:** ${knife.guilds.size}\n`;
                    m += `**Users Seen:** ${knife.users.size}\n`;
                    m += `**Uptime:** ${msToTime(knife.uptime)}\n`;
                    m += `**Memory Usage:** ${prettyBytes(process.memoryUsage().rss)}`;
                    knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                } else {
                    reject(err);
                }
            });
        });
    }
}