const STATES = {true: '<:check:314349398811475968> Enabled', false: '<:xmark:314349398824058880> Disabled'};

exports.loadAsSubcommands = true;
exports.commands = [
    'enable',
    'disable',
    'trigger',
    'kick',
    'ban'
];

exports.main = {
    desc: 'Manages settings for the anti-diacritic filter.',
    usage: '[enable | disable | trigger <amount> | kick <amount> | ban <amount>]',
    permissions: {author: 'manageGuild'},
    async main(bot, ctx) {
        let embed = {
            title: 'Server Settings - Diacritics',
            description: `Showing current diacritics settings for **${ctx.guild.name}**.`,
            footer: {text: "'Amount to Trigger' is how many diacritics are needed in one message in order to trigger."},
            fields: [
                {
                    name: '`Status`',
                    value: `**${STATES[ctx.settings.diacritics.enabled]}**\n`
                    + 'Key: `enable|disable`',
                    inline: true
                },
                {
                    name: '`Amount to Trigger`',
                    value: `**${ctx.settings.diacritics.trigger}**\n`
                    + 'Key: `trigger <number>`',
                    inline: true
                },
                {
                    name: '`Kick At`',
                    value: `**${ctx.settings.actions.diacritics.kick === 0 ? '0 (disabled)' : ctx.settings.actions.diacritics.kick}** offences.\n`
                    + 'Key `kick <number>`',
                    inline: true
                },
                {
                    name: '`Ban At`',
                    value: `**${ctx.settings.actions.diacritics.ban === 0 ? '0 (disabled)' : ctx.settings.actions.diacritics.ban}** offences.\n`
                    + 'Key `ban <number>`',
                    inline: true
                }
            ]
        };

        await ctx.createMessage({embed});
    }
};

exports.enable = {
    desc: 'Enables the anti-diacritics filter.',
    async main(bot, ctx) {
        if (!ctx.settings.diacritics.enabled) {
            await bot.db[ctx.guild.id].diacritics.enabled.set(true);
            await ctx.createMessage('I will now start cutting through spammy diacritic usage.\nPlease make sure that I have the following permissions: **Ban Members**, **Kick Members** and **Manage Messages**.');
        } else await ctx.createMessage('I am already cutting through spammy diacritics.');
    }
};

exports.disable = {
    desc: 'Disables the anti-diacritics filter.',
    async main(bot, ctx) {
        if (ctx.settings.diacritics.enabled) {
            await bot.db[ctx.guild.id].diacritics.enabled.set(false);
            await ctx.createMessage('I will now stop cutting through spammy diacritics.');
        } else await ctx.createMessage("I wasn't cutting through spammy diacritics to begin with.");
    }
};

exports.trigger = {
    desc: 'Sets the trigger amount for the anti-diacritics filter.',
    usage: '<amount>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]).toFixed(0));

        if (isNaN(num)) return await ctx.createMessage('You can only set the trigger limit to a valid number.');
        else if (!num) return await ctx.createMessage('You cannot set trigger to 0. If you wish to disable spammy diacritics blocking, run `settings diacritics disable`.');

        await bot.db[ctx.guild.id].diacritics.trigger.set(num);
        await ctx.createMessage(`Set trigger limit to **${num}**.`);
    }
};

exports.kick = {
    desc: 'Sets the kick amount for the anti-diacritics filter.',
    usage: '<amount>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]).toFixed(0));

        if (isNaN(num)) return await ctx.createMessage('You can only set the kick limit to a valid number.');
        else if (num >= ctx.settings.actions.diacritics.ban) return await ctx.createMessage('You cannot set the kick limit to, or higher than the ban limit.');

        await bot.db[ctx.guild.id].actions.diacritics.kick.set(num);

        if (!num) await ctx.createMessage('Disabled kicking for diacritics.');
        else await ctx.createMessage(`Set kick limit to **${num}**.`);
    }
};

exports.ban = {
    desc: 'Sets the ban amount for the anti-diacritics filter.',
    usage: '<amount>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]).toFixed(0));

        if (isNaN(num)) return await ctx.createMessage('You can only set the ban limit to a valid number');
        else if (num <= ctx.settings.actions.diacritics.kick) return await ctx.createMessage('You cannot set the ban limit to, or lower than the kick limit.');

        await bot.db[ctx.guild.id].actions.diacritics.ban.set(num);
        await ctx.createMessage(`Set ban limit **${num}**.`);
    }
};