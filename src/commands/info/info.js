const prettyBytes = require('pretty-bytes');

exports.commands = ['info'];

exports.info = {
    desc: 'Display information about the bot.',
    permissions: {node: 'general.info'},
    main(bot, ctx) {
        return new Promise((resolve, reject) => {
            let roleColour = ctx.guildBot.roles.sort((a, b) => ctx.guild.roles.get(b).position - ctx.guild.roles.get(a).position)[0];
            roleColour = roleColour ? ctx.guild.roles.get(roleColour).colour : 0;

            ctx.createMessage({embed: {
                title: `${bot.user.username} Info`,
                thumbnail: {url: bot.user.dynamicAvatarURL('png', 1024)},
                color: roleColour,
                fields: [
                    {name: 'Guilds', value: bot.guilds.size, inline: true},
                    {name: 'Users Seen', value: bot.users.size, inline: true},
                    {name: 'Uptime', value: msToTime(bot.uptime), line: true},
                    {name: 'Memory Usage', value: prettyBytes(process.memoryUsage().rss), inline: true}
                ]
            }}).then(resolve).catch(reject);
        });
    }
};

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