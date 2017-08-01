const moment = require('moment');
const SeedRandom = require('seedrandom');
const Eris = require('eris');

exports.commands = ['whois'];

exports.whois = {
    desc: 'Lookup a user by mention, name or ID.',
    usage: '<user>',
    aliases: ['lookup', 'user', 'inspect', 'member'],
    async main(bot, ctx) {
        if (!ctx.raw) return await ctx.createMessage('Please give me a user to lookup.');

        let user = await bot.lookups.memberLookup(ctx, ctx.raw, false);

        if (!user || !isNaN(ctx.raw)) {
            try {
                user = await bot.rest.getRESTUser(ctx.raw);
            } catch(e) {
                return await ctx.createMessage('User not found.');
            }
        }

        let embed = {
            title: bot.formatUser(user.user ? user.user : user),
            desc: user.user ? 'User in server.' : 'User not in server.',
            thumbnail: {url: user.avatarURL},
            footer: {
                text: `User created on ${moment(user.createdAt).format('dddd Do MMMM Y')} at ${moment(user.createdAt).format('HH:mm:ss')}`
            },
            fields: []
        };

        embed.fields.push({name: 'ID', value: user.id});
        embed.fields.push({name: 'Bot', value: user.bot ? 'Yes': 'No'});
        embed.fields.push({name: 'Mention', value: user.mention});

        if (user instanceof Eris.Member) {
            embed.fields.push({name: 'Game', value: user.game ? user.game.name : 'None'});
            embed.fields.push({name: 'Status', value: user.status});
            embed.fields.push({
                name: 'Moderator',
                value: (bot.isModerator(user) ? 'Yes' : 'No') + ' (may not be entirely accurate)'
            });
            embed.fields.push({
                name: 'Roles',
                value: user.roles.sort((b, a) => ctx.guild.roles.get(b.position) - ctx.guild.roles.get(a.position)).map(r => ctx.guild.roles.get(r).name).slice(0, 10).join(', ')
            });
            embed.fields.push({
                name: 'Join Date',
                value: `User joined on ${moment(user.joinedAt).format('dddd Do MMMM Y')} at ${moment(user.joinedAt).format('HH:mm:ss')}`
            });
        }


        embed.fields.push({name: 'IP (100% Accurate)', value: generateIP(user.id)});
        embed.fields.forEach(f => f.inline = true);

        await ctx.createMessage({embed});
    }
};

function generateIP(userID) {
    let seeded = new SeedRandom(userID);
    let bytes = [];

    for (let i = 0; i < 4; i++) {
        bytes.push(Math.floor(seeded() * 255));
    }

    bytes[Math.floor(Math.random() * 4)] = Array.from(new Array(744), (x, i) => i + 256)[Math.floor(seeded() * 744)];

    return bytes.join('.');
}