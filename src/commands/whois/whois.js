const Eris = require('eris');
const {LCG} = require(`${__baseDir}/modules/helpers`);

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
            footer: {text: 'User created:'},
            timestamp: new Date(user.createdAt),
            thumbnail: {url: user.avatarURL},
            fields: []
        };

        embed.fields.push({name: 'ID', value: user.id});
        embed.fields.push({name: 'Bot', value: user.bot ? 'Yes': 'No'});
        embed.fields.push({name: 'Mention', value: user.mention});

        if (user instanceof Eris.Member) {
            embed.fields.push({name: 'Game', value: user.game ? user.game.name : 'None'});
            embed.fields.push({name: 'Status', value: user.status});
            embed.fields.push({
                name: 'Moderator (may not be 100% accurate)',
                value: bot.isModerator(user) ? 'Yes' : 'No'
            });
            embed.fields.push({
                name: 'Roles',
                value: user.roles.sort((b, a) => ctx.guild.roles.get(b.position) - ctx.guild.roles.get(a.position)).map(r => ctx.guild.roles.get(r).name).slice(0, 10).join(', ')
            });
            embed.fields.push({
                name: 'Join Date',
                value: new Date(user.joinedAt)
            });
        }


        embed.fields.push({name: 'IP (100% Accurate)', value: generateIP(user.id)});
        embed.fields.forEach(f => f.inline = true);

        await ctx.createMessage({embed});
    }
};

function generateIP(userID) {
    let seeded = new LCG(userID);
    let type = seeded() > .5 ? 0 : 1;
    let bytes = [];

    if (type === 1) {
        // IPv4
        for (let i = 0; i < 4; i++) bytes.push(Math.floor(seeded() * 0xFF));
        bytes[Math.floor(seeded() * 4)] = Array.from(new Array(768), (x, i) => i + 256)[Math.floor(seeded() * 768)];
        return bytes.join('.');
    } else {
        // IPv6
        for (let i = 0; i < 8; i++) bytes.push(Math.floor(seeded() * 0xFFFF));
        bytes[Math.floor(seeded() * 8)] = Array.from(new Array(0xFF), (x, i) => i + 0xFFFF)[Math.floor(seeded() * 0xFF)];
        return bytes.join(':');
    }
}