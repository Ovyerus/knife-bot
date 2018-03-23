exports.commands = ['info'];

exports.info = {
    desc: 'Display information about the bot.',
    aliases: ['stats'],
    allowDM: true,
    async main(bot, ctx) {
        let roleColour = ctx.guildBot.roles.sort((a, b) => ctx.guild.roles.get(b).position - ctx.guild.roles.get(a).position)[0];
        roleColour = roleColour ? ctx.guild.roles.get(roleColour).colour : 0;

        await ctx.createMessage({embed: {
            title: `${bot.user.username} Info`,
            thumbnail: {url: bot.user.avatarURL},
            color: roleColour,
            fields: [
                {name: 'Guilds', value: bot.guilds.size, inline: true},
                {name: 'Users Seen', value: bot.users.size, inline: true},
                {name: 'Uptime', value: msToTime(bot.uptime), inline: true},
                {name: 'Memory Usage', value: genBytes(process.memoryUsage().rss), inline: true}
            ],
            footer: {text: `Running Knife Bot version ${bot.version}.`}
        }});
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

function genBytes(amt) {
    let endings = ['B', 'KB', 'MB', 'GB', 'TB'];

    for (let i in endings) {
        if (amt / 1000 < 1 || endings[i] === endings.slice(-1)[0]) return amt.toFixed(2) + ` ${endings[i]}`;
        else amt /= 1000;
    }
}