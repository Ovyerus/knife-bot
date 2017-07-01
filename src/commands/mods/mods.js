const StatusesToIndex = {online: 0, idle: 1, dnd: 2, offline: 3};

exports.commands = ['mods'];

exports.mods = {
    desc: 'Display all mods, with current statuses.',
    async main(bot, ctx) {
        let statuses = {online: [], idle: [], dnd: [], offline: []};
        let mods = ctx.guild.members.filter(m => bot.isModerator(m) && !m.bot);

        mods.forEach(m => {
            statuses[m.status].push(bot.formatUser(m).replace(/^(.*)#(\d{4})$/, '**$1**#$2'));
        });

        let embed = {
            title: '__Moderators__',
            fields: [
                {
                    name: '<:online:313956277808005120> Online',
                    value: ''
                },
                {
                    name: '<:away:313956277220802560> Away/Idle',
                    value: ''
                },
                {
                    name: '<:dnd:313956276893646850> Do Not Disturb',
                    value: ''
                },
                {
                    name: '<:offline:313956277237710868> <:invisible:313956277107556352> Offline/Invisible',
                    value: ''
                }
            ]
        };

        for (let status in statuses) {
            for (let i in statuses[status]) {
                if (Number(i) % 2 === 1) embed.fields[StatusesToIndex[status]].value += statuses[status][i] + '\n';
                else embed.fields[StatusesToIndex[status]].value += statuses[status][i] + ', ';
            }

            embed.fields[StatusesToIndex[status]].value = embed.fields[StatusesToIndex[status]].value.replace(/, $/gu, '');

            if (!embed.fields[StatusesToIndex[status]].value) delete embed.fields[StatusesToIndex[status]];
        }

        // If I don't do this, Discord's API breaks :/
        embed.fields = embed.fields.filter(f => f);

        await ctx.createMessage({embed});
    }
};