// vewy impporpant
const Promise = require('bluebird');

exports.cmd = {
    description: 'Purge 1 - 100 messages',
	usage: "<1 - 100>",
    func: (knife, msg) => {
        return new Promise((resolve, reject) => {
			if (!msg.member.permission.has('manageMessages')) {
				knife.createMessage(msg.channel.id, "Change Message pls Ovyerus").then(() => resolve()).catch(reject);
			} else {
				if (!msg.channel.guild.members.get(knife.user.id).permission.has('manageMessages')) {
					knife.createMessage(msg.channel.id, "Change Message pls Ovyerus").then(() => resolve()).catch(reject);
				} else {
            		if (isNaN(args)) {
                		knife.createMessage(msg.channel.id, "Please use a number between **1**-**100**`!");
            		} else {
                		if (argument > 100) {
                    		knife.createMessage(msg.channel.id, "Please use a number between **1**-**100**`!");
                		} else if (argument < 1) {
                    		knife.createMessage(msg.channel.id, "Please use a number between **1**-**100**`!");
                		} else {
                    		knife.purgeChannel(msg.channel.id, args).then((num) => {
                        		knife.createMessage(msg.channel.id, `Purged ${num} mesages!`);
                    		})
                		}
            		}
        		}
        	}
        });
    }
}
