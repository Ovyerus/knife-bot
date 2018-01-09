exports.loadAsSubcommands = true;
exports.commands = [
    'invites',
    'mentions',
    'diacritics'
];

exports.main = {
    desc: 'Handles warning messages for filter triggers.',
    usage: '[invites <message> | mentions <message> | diacritics <message>]',
    aliases: ['messages'],
    async main(bot, ctx) {
        let embed = {
            title: 'Server Settings - Messages',
            description: `Showing current messages for **${ctx.guild.name}**\nNote: any occurances of \`{{mention}}\` will be replaced with an @mention of the user.`,
            footer: {text: "Run 'settings messages <type> <message>' to change the message for the particular type."},
            fields: [
                {
                    name: 'Invites',
                    value: ctx.settings.messages.invites
                },
                {
                    name: 'Mentions',
                    value: ctx.settings.messages.mentions
                },
                {
                    name: 'Diacritics',
                    value: ctx.settings.messages.diacritics
                }
            ]
        };

        await ctx.createMessage({embed});
    }
};

exports.invites = {
    desc: 'Sets the warning message for the anti-invite filter.',
    usage: '<message>',
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a message to set as the warning for anti-invites.');

        await bot.db[ctx.guild.id].messages.invites.set(ctx.raw);
        await ctx.createMessage('Sucessfully edited the warning message for the anti-invites filter.\nSending test message...');
        await ctx.createMessage(ctx.raw.replace(/{{mention}}/g, ctx.author.mention));
    }
};

exports.mentions = {
    desc: 'Sets the warning message for the anti-mass mentions filter.',
    usage: '<message>',
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a message to set as the warning for anti-mass mentions.');

        await bot.db[ctx.guild.id].messages.mentions.set(ctx.raw);
        await ctx.createMessage('Sucessfully edited the warning message for the anti-mass mentions filter.\nSending test message...');
        await ctx.createMessage(ctx.raw.replace(/{{mention}}/g, ctx.author.mention));
    }
};

exports.diacritics = {
    desc: 'Sets the warning message for the anti-diacritics filter.',
    usage: '<message>',
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a message to set as the warning for anti-diacritics.');

        await bot.db[ctx.guild.id].messages.diacritics.set(ctx.raw);
        await ctx.createMessage('Sucessfully edited the warning message for the anti-diacritics filter.\nSending test message...');
        await ctx.createMessage(ctx.raw.replace(/{{mention}}/g, ctx.author.mention));
    }
};