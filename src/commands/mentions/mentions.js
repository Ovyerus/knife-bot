const STATES = {true: '<:check:314349398811475968> Enabled', false: '<:xmark:314349398824058880> Disabled'};

exports.loadAsSubcommands = true;
exports.commands = [
    'enable',
    'disable',
    'trigger',
    'timelimit',
    'kick',
    'ban'
];

exports.main = {
    desc: 'Edit anti-mass mention settings.',
    usage: '[enable | disable | trigger <number> | timelimit <number> | kick <number> | ban <number>]',
    permissions: {author: 'manageGuild'},
    async main(bot, ctx) {
        let embed = {
            title: 'Server Settings - Mentions',
            description: `Showing current mass-mention settings for **${ctx.guild.name}**.`,
            footer: {
                text: "'Amount to Trigger' is how many mentions in one message or done fast enough is needed for the bot to be triggered."
                + "'Time Limit' is the time (in seconds) until mentions no longer count towards the 'Amount to Trigger'"
            },
            fields: [
                {
                    name: '`Status`',
                    value: `**${STATES[ctx.settings.mentions.enabled]}**\n`
                    + 'Key: `enable|disable`',
                    inline: true
                },
                {
                    name: '`Amount to Trigger`',
                    value: `**${ctx.settings.mentions.trigger}**\n`
                    + 'Key: `trigger <number>`',
                    inline: true
                },
                {
                    name: '`Time Limit`',
                    value: `**${ctx.settings.mentions.timelimit / 1000 || 5} seconds**\n`
                    + 'Key `timelimit <number>`',
                    inline: true
                },
                {
                    name: '`Kick At`',
                    value: `**${ctx.settings.actions.mentions.kick === 0 ? '0 (disabled)' : ctx.settings.actions.mentions.kick}** offences.\n`
                    + 'Key `kick <number>`',
                    inline: true
                },
                {
                    name: '`Ban At`',
                    value: `**${ctx.settings.actions.mentions.ban === 0 ? '0 (disabled)' : ctx.settings.actions.mentions.ban}** offences.\n`
                    + 'Key `ban <number>`',
                    inline: true
                }
            ]
        };

        await ctx.createMessage({embed});
    }
};

exports.enable = {
    desc: 'Enables the anti-mass mention filter.',
    async main(bot, ctx) {
        if (!ctx.settings.mentions.enabled) {
            await bot.db[ctx.guild.id].mentions.enabled.set(true);
            await ctx.createMessage('I will now start cutting through mass mentions.\nPlease make sure that I have the following permissions: **Ban Members**, **Kick Members** and **Manage Messages**.');
        } else await ctx.createMessage('I am already cutting through mass mentions.');
    }
};

exports.disable = {
    desc: 'Disables the anti-mass mention filter.',
    async main(bot, ctx) {
        if (ctx.settings.mentions.enabled) {
            await bot.db[ctx.guild.id].mentions.enabled.set(false);
            await ctx.createMessage('I will now stop cutting through mass mentions.');
        } else await ctx.createMessage("I wasn't cutting through mass mentions to begin with.");
    }
};

exports.trigger = {
    desc: 'Sets the minimum amount of mentions that triggers the filter.',
    usage: '<number>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]).toFixed(0));

        if (isNaN(num)) return await ctx.createMessage('You can only set the trigger amount to a valid number.');
        else if (!num) return await ctx.createMessage('You cannot set the trigger amount to `0`. If you wish to disable the mass mention filter, run `mentions disable`.');

        await bot.db[ctx.guild.id].mentions.trigger.set(num);
        await ctx.createMessage(`Set trigger limit to **${num}**.`);
    }
};

exports.timelimit = {
    desc: 'Sets the time limit in which spam mentions are counted.',
    usage: '<time>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]));

        if (isNaN(num)) return await ctx.createMessage('You can only set the time limit to a valid number.');
        else if (num === 0) return await ctx.createMessage('You cannot set the the time limit to 0 seconds.');

        await bot.db[ctx.guild.id].mentions.timelimit.set(num * 1000);
        await ctx.createMessage(`Set time limit to **${num}** seconds.`);
    }
};

exports.kick = {
    desc: 'Sets the kick limit for mass mentions.',
    usage: '<number>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]).toFixed(0));

        if (isNaN(num)) return await ctx.createMessage('You can only set the kick limit to a valid number.');
        else if (num >= ctx.settings.actions.mentions.ban) return await ctx.createMessage('You cannot set the kick limit to, or higher than the ban limit.');

        await bot.db[ctx.guild.id].actions.mentions.kick.set(num);

        if (num === 0) await ctx.createMessage('Disabled kicking for mentions.');
        else await ctx.createMessage(`Set kick limit to **${num}**.`);
    }
};

exports.ban = {
    desc: 'Sets the ban limit for mass mentions.',
    usage: '<number>',
    async main(bot, ctx) {
        let num = Number(Math.abs(ctx.args[0]).toFixed(0));

        if (isNaN(num)) return await ctx.createMessage('You can only set the ban limit to a valid number.');
        else if (num <= ctx.settings.actions.mentions.kick) return await ctx.createMessage('You cannot set the ban limit to, or lower than the kick limit.');
        else if (!num) return await ctx.createMessage('You cannot disable banning for mentions.');
        
        await bot.db[ctx.guild.id].actions.mentions.ban.set(num);
        await ctx.createMessage(`Set ban limit to **${num}**.`);
    }
};