# knife-bot
[![Official Server](https://discordapp.com/api/guilds/341839225693536257/embed.png)](https://discord.gg/45FCZ8u)
[![Code Climate](https://codeclimate.com/github/Ovyerus/knife-bot/badges/gpa.svg)](https://codeclimate.com/github/Ovyerus/knife-bot) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Simple, open-source moderation bot for Discord.

## Features
- Configurable auto-moderation of mass mentions and server invites.
- Robust purge commands.
- Memes.

## Requirements
At least [Node.JS](https://nodejs.org/) v7.0.0 is required for the bot to run as it makes use of the async/await feature which is not in v6.X.X.  
[Redis](https://redis.io/) is also required in order to function, so that the bot can store settings.

If Redis is installed on the local machine, the above requirements are all you need, and you can run `knife.js` and the first time setup will walk you through.  
If Redis is *not* installed on the local machine, then you will need a `config.json` in the same directory as `knife.js` with the following structure
```json
{
    "redisURL": "redis://[:password@]host[:port][/db-number][?option=value]"
}
```
after which, you can run `knife.js` as above and follow the instructions.