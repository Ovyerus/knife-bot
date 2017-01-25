const Promise = require('bluebird');
const moment = require('moment');
const cp = require('child_process');
const fs = require('fs');

exports.cmd = {
    description: 'Git command.',
    func: (knife, msg, args) => {
        return new Promise((resolve, reject) => {
            if (args.length === 0 || args[0] !== 'pull') {
                let commits = cp.execSync('git log');
                let commit = commits.toString('utf8').split('Author: ')[1];
                let hash = commits.toString('utf8').split('Author: ')[0].substring(6).trim();
                let commitTime = Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, ''));
                knife.createMessage(msg.channel.id, {
                    embed: {
                        color: 0x1CABB3,
                        title: 'Latest local commit',
                        description:'[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                        fields: [
                            {name: 'Commit Hash', value: hash},
                            {name: 'Author', value: commit.split('<')[0].trim()},
                            {name: 'Message', value: commit.split('\n\n')[1].trim()}
                        ],
                        footer: {text: `Commited on ${moment(commitTime).format('dddd Do MMMM Y')} at ${moment(commitTime).format('HH:mm:ss A')}`}
                    }
                }).then(() => resolve()).catch(err => {
                    if (err.resp && err.resp.statusCode === 400) {
                        let m = '__**Latest local commit**__\n';
                        m += '**GitHub Repo:** <https://github.com/Ovyerus/knife-bot>\n';
                        m += `**Commit Hash:** ${hash}\n`;
                        m += `**Author:** ${commit.split('<')[0].trim()}\n`;
                        m += `**Message:** ${commit.split('\n\n')[1].trim()}\n`;
                        m += `**Commit Time**: ${moment(commitTime).format('dddd Do MMMM Y')} at ${moment(commitTime).format('HH:mm:ss A')}`;
                        knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                    } else {
                        reject(err);
                    }
                });
            } else if (args[0] === 'pull') {
                if (msg.author.id !== knife.owner) {
                    let commits = cp.execSync('git log');
                    let commit = commits.toString('utf8').split('Author: ')[1];
                    let hash = commits.toString('utf8').split('Author: ')[0].substring(6).trim();
                    let commitTime = Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, ''));
                    knife.createMessage(msg.channel.id, {
                        embed: {
                            color: 0x1CABB3,
                            title: 'Latest local commit',
                            description:'[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                            fields: [
                                {name: 'Commit Hash', value: hash},
                                {name: 'Author', value: commit.split('<')[0].trim()},
                                {name: 'Message', value: commit.split('\n\n')[1].trim()}
                            ],
                            footer: {text: `Commited on ${moment(commitTime).format('dddd Do MMMM Y')} at ${moment(commitTime).format('HH:mm:ss A')}`}
                        }
                    }).then(() => resolve()).catch(err => {
                        if (err.resp && err.resp.statusCode === 400) {
                            let m = '__**Latest local commit**__\n';
                            m += '**GitHub Repo:** <https://github.com/Ovyerus/knife-bot>\n';
                            m += `**Commit Hash:** ${hash}\n`;
                            m += `**Author:** ${commit.split('<')[0].trim()}\n`;
                            m += `**Message:** ${commit.split('\n\n')[1].trim()}\n`;
                            m += `**Commit Time**: ${moment(commitTime).format('dddd Do MMMM Y')} at ${moment(commitTime).format('HH:mm:ss A')}`;
                            knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                        } else {
                            reject(err);
                        }
                    });
                } else {
                    cp.exec('git pull origin master', (err, stdout, stderr) => {
                        if (err) {
                            reject(err);
                        } else {
                            let commits = cp.execSync('git log');
                            let commit = commits.toString('utf8').split('Author: ')[1];
                            let hash = commits.toString('utf8').split('Author: ')[0].substring(6).trim();
                            let commitTime = Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, ''));
                            knife.createMessage(msg.channel.id, {
                                content: 'Pulled latest commit and ready to restart.',
                                embed: {
                                    color: 0x1CABB3,
                                    title: 'Pulled latest commit from GitHub',
                                    description:'[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                                    fields: [
                                        {name: 'Commit Hash', value: hash},
                                        {name: 'Author', value: commit.split('<')[0].trim()},
                                        {name: 'Message', value: commit.split('\n\n')[1].trim()}
                                    ],
                                    footer: {text: `Commited on ${moment(commitTime).format('dddd Do MMMM Y')} at ${moment(commitTime).format('HH:mm:ss A')}`}
                                }
                            }).then(() => resolve()).catch(err => {
                                if (err.resp && err.resp.statusCode) {
                                    let m = '__**Latest local commit**__\n';
                                    m += '**GitHub Repo:** <https://github.com/Ovyerus/knife-bot>\n';
                                    m += `**Commit Hash:** ${hash}\n`;
                                    m += `**Author:** ${commit.split('<')[0].trim()}\n`;
                                    m += `**Message:** ${commit.split('\n\n')[1].trim()}\n`;
                                    m += `**Commit Time**: ${moment(commitTime).format('dddd Do MMMM Y')} at ${moment(commitTime).format('HH:mm:ss A')}`;
                                    knife.createMessage(msg.channel.id, m).then(() => resolve()).catch(reject);
                                } else {
                                    reject(err);
                                }
                            });
                        }
                    });
                }
            }
        });
    }
}