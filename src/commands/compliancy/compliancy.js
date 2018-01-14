exports.commands = ['compliancy'];

exports.compliancy = {
    desc: '\u200b',
    hidden: true,
    main(bot, ctx) {
        return ctx.createMessage('Commands can still be run even with a few select wrappers or prefixes.\n\n'
        + 'Wrappers are either `[prefix command]` or `{prefix command}` but not both at the same time.\n'
        + 'Prefixes are either `~` or `//` but not both at the same time.\n\n'
        + "I don't know why I implemented this.\n\n"
        + '**Will Work**: [:knife: ping], //:knife: ping\n'
        + "**Won't Work**: [:knife: ping}, [{:knife: ping}], [//:knife: ping]");
    }
};