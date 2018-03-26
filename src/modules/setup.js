const Redite = require('redite');
const got = require('got');
const {prompt, confirm} = require('./stdinHelper');

async function firstTimeSetup(redisURL) {
    let conn = new Redite({url: redisURL});

    if (await conn.has('NOT_FIRST_SETUP')) return;
    if (process.env.KNIFE_IN_DOCKER === 'true') {
        console.log('Knife is in Docker. Setting values automatically.');
        await conn.NOT_FIRST_SETUP.set(true);
        await conn.settings.prefixes.set([process.env.KNIFE_PREFIX].concat(['<@{{id}}> ', '<@!{{id}}>']));
        await conn.settings.token.set(process.env.KNIFE_DISCORD_TOKEN);
        await conn.settings.owner.set(process.env.OWNER);
        await conn.settings.blacklist.set([]);
        await conn.settings.unloaded.set([]);

        if (process.env.KNIFE_DBOTS_TOKEN) await conn.settings.dbotsToken.set(process.env.KNIFE_DBOTS_TOKEN);
        if (process.env.KNIFE_ERR_CHANNEL) await conn.settings.errorChannel.set(process.env.KNIFE_ERR_CHANNEL);

        return;
    }

    console.log('Welcome to Knife Bot first time setup.');
    console.log('This interactive prompt will help you set up the database so that you can run this bot properly.');
    console.log('Do not spam the Enter key, as you may accidentally miss or wrongly confirm some queries.\n');

    await tokenLoop(conn); // Make sure that the user enters a valid bot token.
    await ownerLoop(conn); // Make sure that the user enters a valid ID.

    let mainPrefix = await prompt('Enter the main prefix for the bot.', {filter: line => line});

    await conn.settings.prefixes.set([mainPrefix].concat(['<@{{id}}> ', '<@!{{id}}>']));

    if (await confirm('Do you have a token for the DBots API?', false)) {
        let token = await prompt('Please enter your authentication token for the DBots API. Make sure this is valid.');

        try {
            await got('https://bots.discord.pw/api', {
                headers: {
                    Authorization: token
                }
            });

            await conn.settings.dbotsToken.set(token);
        } catch(err) {
            if (err.statusCode && err.statusCode === 401) console.log('Invalid token. Skipping...');
            else throw err;
        }
    }

    if (await confirm('Do you have a channel which you can log errors to?', false)) {
        let channel = await prompt('Please enter the ID of the channel to log errors to.');
        let token = await conn.settings.token.get;

        try {
            await got(`https://discordapp.com/api/channels/${channel}`, {
                headers: {
                    Authorization: `Bot ${token}`
                }
            });

            await conn.settings.errorChannel.set(channel);
        } catch(err) {
            if (err.statusCode && err.statusCode === 403) console.log('Invalid or unknown channel. Skipping...');
            else throw err;
        }
    }

    await conn.settings.blacklist.set([]);
    await conn.settings.unloaded.set([]);
    await conn.NOT_FIRST_SETUP.set(true);

    console.log('Knife Bot first time setup is now complete.');
    console.log('The bot will now start up, and you will not see this prompt again unless you mess up the database.');
}

async function tokenLoop(conn) {
    let token = await prompt("Please enter your bot's authentication token.");

    try {
        await got('https://discordapp.com/api/users/@me', {
            headers: {
                Authorization: `Bot ${token}`
            }
        });
    } catch(err) {
        if (err.statusCode && err.statusCode === 401) {
            console.log('Invalid token.');
            return await tokenLoop(conn);
        } else throw err;
    }

    await conn.settings.token.set(token);
}

async function ownerLoop(conn) {
    let token = await conn.settings.token.get;
    let id = await prompt('Please enter your user ID from Discord.', {
        filterMsg: 'Please enter a valid ID.',
        filter: line => !isNaN(line)
    });
    let res;

    try {
        let r = await got(`https://discordapp.com/api/users/${id}`, {
            json: true,
            headers: {
                Authorization: `Bot ${token}`
            }
        });
        res = r.body;
    } catch(err) {
        if (err.statusCode && err.statusCode === 404) {
            console.log('Invalid user.');
            return await ownerLoop(conn);
        } else throw err;
    }

    console.log(`${res.username}#${res.discriminator} (${res.id})`);

    if (!await confirm('Is this you?', true)) return await ownerLoop(conn);
    else await conn.settings.owner.set(id);
}

module.exports = firstTimeSetup;