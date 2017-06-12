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

const FailCol = 0xF44336;
const SuccessCol = 0x8BC34A;
const ReplaceRegex = {};

exports.init = bot => {
    ReplaceRegex.token = new RegExp(`${bot.token}`, 'gi');
    Object.keys(bot.config).filter(key => /(key|token)/i.test(key)).forEach(key => {
        ReplaceRegex[key] = new RegExp(bot.config[key], 'gi');
    });
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
        if (ctx.raw.length === 0) {
            return await ctx.createMessage('Please give arguments to evaluate.');
        } else {
            let {args, cmd, raw, cleanRaw, settings, guildBot, channel, guild} = ctx; // eslint-disable-line
            try {
                let returned = eval(ctx.raw);
                let str = util.inspect(returned, {depth: 1});
                str = str.replace(ReplaceRegex.token, '(token)');

                let embed = {
                    title: 'Evaluation Results',
                    color: SuccessCol,
                    fields: [
                        {name: 'Input', value: generateCodeblock(ctx.raw)},
                        {name: 'Output', value: generateCodeblock(str)}
                    ]
                };

                if (returned instanceof Promise) embed.fields[1].value = generateCodeblock('[object Promise]');

                if (str.length < 1000) {
                    await sendEval(bot, ctx, embed, returned);
                } else {
                    let key = await bot.hastePost(str);
                    let url = `https://hastebin.com/${key}.js`;
                    embed.fields[1].value = `Output is too long to display nicely.\nOutput has been uploaded [here](${url})`;

                    await sendEval(bot, ctx, embed, returned);
                }
            } catch(err) {
                logger.error(err.stack || err);

                let embed = {
                    title: 'Evaluation Results',
                    color: FailCol,
                    fields: [
                        {name: 'Input', value: generateCodeblock(ctx.raw)},
                        {name: 'Error', value: generateCodeblock(err)}
                    ]
                };

                await ctx.createMessage({embed});
            }
        }
    }
};

function generateCodeblock(text) {
    return `\`\`\`js\n${text}\n\`\`\``;
}

async function sendEval(bot, ctx, embed, returned) {
    let m = await ctx.createMessage({embed});

    if (returned instanceof Promise) {
        returned = await returned;
    } else {
        return;
    }

    let strN;

    if ((returned instanceof IncomingMessage || returned instanceof PassThrough) && returned.requestUrl) {
        strN = returned.headers['content-type'].split(';')[0] === 'application/json' ? util.inspect(JSON.parse(returned.body), {depth: 1}) : returned.body;
    } else {
        strN = util.inspect(returned, {depth: 1})
    }

    strN = strN.replace(ReplaceRegex.token, '(token)');

    try {
        if (strN.length >= 1000) {
            let key = await bot.hastePost(strN);
            let url = `https://hastebin.com/${key}.js`;

            await m.edit({embed: {
                title: 'Evaluation Results',
                color: SuccessCol,
                fields: [
                    {name: 'Input', value: generateCodeblock(ctx.raw)},
                    {name: 'Output', value: `Output is too long to display nicely.\nOutput has been uploaded [here](${url})`}
                ]
            }});
        } else {
            await m.edit({embed: {
                title: 'Evaluation Results',
                color: SuccessCol,
                fields: [
                    {name: 'Input', value: generateCodeblock(ctx.raw)},
                    {name: 'Output', value: generateCodeblock(strN)}
                ]
            }});

            return;
        }
    } catch(err) {
        if (err.req && err.req._headers.host === 'discordapp.com' && err.resp && err.resp.statusCode !== 404) {
            throw err;
        } else {
            logger.error(err.stack || err);
            await m.edit({embed: {
                title: 'Evaluation Results',
                color: FailCol,
                fields: [
                    {name: 'Input', value: generateCodeblock(ctx.raw)},
                    {name: 'Error', value: generateCodeblock(err)}
                ]
            }});
        }
    }
}