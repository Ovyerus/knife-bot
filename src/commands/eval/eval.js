// Helper variables for eval.
/* eslint-disable no-unused-vars */
const Eris = require('eris');
const util = require('util');
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const got = require('got');
const IncomingMessage = require('http').IncomingMessage;
const PassThrough = require('stream').PassThrough;
/* eslint-enable */

const FAIL_COL = 0xF44336;
const SUCCESS_COL = 0x8BC34A;
let TOKEN_REGEX;

exports.init = bot => {
    TOKEN_REGEX = new RegExp(`(Bot ?)?${bot.token}`, 'gi');
};

exports.commands = [
    'eval'
];

exports.eval = {
    desc: 'Evaluate code in Discord.',
    fullDesc: 'Used to evaluate JavaScript code in Discord. Mostly for debug purposes.',
    owner: true,
    usage: '<code>',
    async main(bot, ctx) {
        if (ctx.raw.length === 0) return await ctx.createMessage('Please give arguments to evaluate.');

        let {args, cmd, raw, cleanRaw, settings, guildBot, channel, guild} = ctx; // eslint-disable-line

        try {
            let returned = eval(ctx.raw);
            let str = util.inspect(returned, {depth: 1}).replace(TOKEN_REGEX, '(token)');

            let embed = {
                title: 'Evaluation Results',
                color: SUCCESS_COL,
                fields: [
                    {name: 'Input', value: generateCodeblock(ctx.raw)},
                    {name: 'Output', value: generateCodeblock(str)}
                ]
            };

            if (returned && returned.then) embed.fields[1].value = generateCodeblock('[object Promise]');
            if (str.length > 1000) {
                let key = await bot.hastePost(str);
                let url = `https://hastebin.com/${key}.js`;
                embed.fields[1].value = `Output is too long to display nicely.\nOutput has been uploaded [here](${url})`;
            }

            await sendEval(bot, ctx, embed, returned);
        } catch(err) {
            bot.logger.error(err.stack || err);

            let embed = {
                title: 'Evaluation Results',
                color: FAIL_COL,
                fields: [
                    {name: 'Input', value: generateCodeblock(ctx.raw)},
                    {name: 'Error', value: generateCodeblock(err)}
                ]
            };

            await ctx.createMessage({embed});
        }
    }
};

function generateCodeblock(text) {
    return `\`\`\`js\n${text}\n\`\`\``;
}

async function sendEval(bot, ctx, embed, returned) {
    let m = await ctx.createMessage({embed});
    let str;

    if (returned && returned.then) returned = await returned;
    else return;

    if ((returned instanceof IncomingMessage || returned instanceof PassThrough) && returned.requestUrl) {
        str = returned.headers['content-type'].split(';')[0] === 'application/json' ? util.inspect(JSON.parse(returned.body), {depth: 1}) : returned.body;
    } else str = util.inspect(returned, {depth: 1});

    str = str.replace(TOKEN_REGEX, '(token)');

    try {
        if (str.length >= 1000) {
            let key = await bot.hastePost(str);
            let url = `https://hastebin.com/${key}.js`;

            await m.edit({embed: {
                title: 'Evaluation Results',
                color: SUCCESS_COL,
                fields: [
                    {name: 'Input', value: generateCodeblock(ctx.raw)},
                    {name: 'Output', value: `Output is too long to display nicely.\nOutput has been uploaded [here](${url})`}
                ]
            }});
        } else {
            return await m.edit({embed: {
                title: 'Evaluation Results',
                color: SUCCESS_COL,
                fields: [
                    {name: 'Input', value: generateCodeblock(ctx.raw)},
                    {name: 'Output', value: generateCodeblock(str)}
                ]
            }});
        }
    } catch(err) {
        if (err.req && err.req._headers.host === 'discordapp.com' && err.resp && err.resp.statusCode !== 404) {
            throw err;
        } else {
            bot.logger.error(err.stack || err);
            await m.edit({embed: {
                title: 'Evaluation Results',
                color: FAIL_COL,
                fields: [
                    {name: 'Input', value: generateCodeblock(ctx.raw)},
                    {name: 'Error', value: generateCodeblock(err)}
                ]
            }});
        }
    }
}