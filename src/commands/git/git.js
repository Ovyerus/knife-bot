const moment = require('moment');
const cp = require('child_process');
const got = require('got');

exports.loadAsSubcommands = true;
exports.commands = ['pull'];

exports.main = {
    desc: 'Show information about latest pulled commit.',
    async main(bot, ctx) {
        await ctx.channel.sendTyping();

        let res = await got(`https://api.github.com/repos/Ovyerus/knife-bot/commits`, {
            headers: {Accept: 'application/vnd.github.v3+json'}
        });
        let commit = JSON.parse(res.body)[0];
        let commitTime = moment(commit.commit.author.date);

        await ctx.createMessage({embed: {
            color: 0x1CABB3,
            title: 'GitHub Repository',
            url: 'https://github.com/Ovyerus/knife-bot',
            author: {
                name: commit.author.login,
                url: commit.author.html_url,
                icon_url: commit.author.avatar_url
            },
            fields: [
                {name: `\`${commit.sha.slice(0, 6)}\``, value: commit.commit.message}
            ],
            footer: {text: `Commited on ${commitTime.format('dddd Do MMMM Y')} at ${commitTime.format('HH:mm:ss A')}`}
        }});
    }
};

exports.pull = {
    desc: 'Pull the latest changes from GitHub',
    owner: true,
    async main(bot, ctx) {
        await ctx.channel.sendTyping();
        let a = await pull();
        
        await ctx.createMessage(`\`\`\`bash\n${a}\`\`\``);
    }
};

function pull() {
    return new Promise(resolve => {
        cp.exec('git pull origin master', (err, stdout, stderr) => {
            if (err) throw err;
            if (stderr) throw stderr;
            resolve(stdout.toString());
        });
    });
}