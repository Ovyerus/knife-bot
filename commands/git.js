const Promise = require('bluebird');
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
                        footer: {text: 'Commit Date'},
                        timestamp: new Date(Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, '')))
                    }
                }).then(() => resolve()).catch(reject);
            } else if (args[0] === 'pull') {
                if (msg.author.id !== knife.owner) {
                    let commits = cp.execSync('git log');
                    let commit = commits.toString('utf8').split('Author: ')[1];
                    let hash = commits.toString('utf8').split('Author: ')[0].substring(6).trim();
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
                            footer: {text: 'Commit Date'},
                            timestamp: new Date(Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, '')))
                        }
                    }).then(() => resolve()).catch(reject);
                } else {
                    cp.exec('git pull origin master', (err, stdout, stderr) => {
                        if (err) {
                            reject(err);
                        } else {
                            let commits = cp.execSync('git log');
                            let commit = commits.toString('utf8').split('Author: ')[1];
                            let hash = commits.toString('utf8').split('Author: ')[0].substring(6).trim();
                            knife.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0x1CABB3,
                                    title: 'Pulled latest commit from GitHub',
                                    description:'[GitHub Repo](https://github.com/Ovyerus/knife-bot)',
                                    fields: [
                                        {name: 'Commit Hash', value: hash},
                                        {name: 'Author', value: commit.split('<')[0].trim()},
                                        {name: 'Message', value: commit.split('\n\n')[1].trim()}
                                    ],
                                    footer: {text: 'Commit Date'},
                                    timestamp: new Date(Date.parse(commit.split('\n\n')[0].split('\n')[1].replace(/Date:\s+/, '')))
                                }
                            }).then(() => resolve()).catch(reject);
                        }
                    });
                }
            }
        });
    }
}