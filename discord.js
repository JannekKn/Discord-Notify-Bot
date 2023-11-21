require('console-stamp')(console, { 
    format: ':date(dd.mm.yy HH:MM:ss) :label' 
} );
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('./database.js');
const twitch = require('./twitch.js');
const youtube = require('./youtube.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    setupDiscord
};

// Defined the discord commands
const commands = [

    new SlashCommandBuilder()
        .setName('twitch')
        .setDescription('manage your Twitch alerts')

        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a Twitch streamer to be tracked')
                .addStringOption(option =>
                    option.setName('streamer')
                        .setDescription('Twitch streamer name')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Discord channel to send notifications to')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('everyone-ping')
                        .setDescription('hould the bot ping @everyone?')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role-ping')
                        .setDescription('What role should get pinged')
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a Twitch streamer that is tracked')
                .addStringOption(option =>
                    option.setName('streamer')
                        .setDescription('streamer that should get deleted')
                        .setAutocomplete(true)
                        .setRequired(true))),

    new SlashCommandBuilder()
        .setName('youtube-live')
        .setDescription('manage your Youtube Live alerts')

        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a Youtube streamer to be tracked')
                .addStringOption(option =>
                    option.setName('youtuber')
                        .setDescription('Youtuber streamer name')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Discord channel to send notifications to')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('everyone-ping')
                        .setDescription('hould the bot ping @everyone?')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role-ping')
                        .setDescription('What role should get pinged')
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a Youtube streamer that is tracked')
                .addStringOption(option =>
                    option.setName('youtuber')
                        .setDescription('youtuber that should get deleted')
                        .setAutocomplete(true)
                        .setRequired(true))),

    new SlashCommandBuilder()
        .setName('youtube-video')
        .setDescription('manage your Youtube Video alerts')

        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a Youtube Creator to be tracked')
                .addStringOption(option =>
                    option.setName('youtuber')
                        .setDescription('Youtuber Creator name')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Discord channel to send notifications to')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('everyone-ping')
                        .setDescription('hould the bot ping @everyone?')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role-ping')
                        .setDescription('What role should get pinged')
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a Youtube Creator that is tracked')
                .addStringOption(option =>
                    option.setName('youtuber')
                        .setDescription('youtuber that should get deleted')
                        .setAutocomplete(true)
                        .setRequired(true))),


].map(command => command.toJSON());


// the discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ],
});

async function setupDiscord() {
    await client.login(process.env.DISCORD_TOKEN);

    return new Promise((resolve, reject) => {
        client.once('ready', () => {
            console.log(`Logged in as ${client.user.tag}`);

            updateDiscordCommands()

            setDiscordStatus("new stuff")

            console.log('Discord finished setting up');

            resolve(client);
        });
    });
}



//Client joined guild
client.on("guildCreate", async (guild) => {
    console.log("Left guild: " + guild.name + " (" + guild.id + ")");
    db.addDiscordServer(guild.id)
});

//Client left guild
client.on("guildDelete", async (guild) => {
    console.log("Joined guild: " + guild.name + " (" + guild.id + ")");
    db.deleteDiscordServer(guild.id)
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {

        const { commandName } = interaction;

        if (commandName === 'twitch') {

            if (interaction.options.getSubcommand() === 'add') {
                const streamer = interaction.options.getString('streamer');
                const channel = interaction.options.getChannel('channel');
                const everyonePing = interaction.options.getBoolean('everyone-ping');
                var rolePing = interaction.options.getRole('role-ping');
                if (rolePing != null) { rolePing = rolePing.id }

                await interaction.reply(await twitch.addTwitch(interaction.guild.id, streamer, channel, everyonePing, rolePing));
            }

            if (interaction.options.getSubcommand() === 'remove') {
                const streamer = interaction.options.getString('streamer');

                await interaction.reply(await twitch.removeTwitch(interaction.guild.id, streamer));
            }
        }
        else if (commandName === 'youtube-video') {

            if (interaction.options.getSubcommand() === 'add') {
                const youtuber = interaction.options.getString('youtuber');
                const channel = interaction.options.getChannel('channel');
                const everyonePing = interaction.options.getBoolean('everyone-ping');
                var rolePing = interaction.options.getRole('role-ping');
                if (rolePing != null) { rolePing = rolePing.id }

                await interaction.reply(await youtube.addYoutube(interaction.guild.id, youtuber, channel, everyonePing, rolePing, false));
            }

            if (interaction.options.getSubcommand() === 'remove') {
                const youtuber = interaction.options.getString('youtuber');

                await interaction.reply(await twitch.removeTwitch(interaction.guild.id, youtuber));
            }
        }
        else if (commandName === 'youtube-live') {

            if (interaction.options.getSubcommand() === 'add') {
                const youtuber = interaction.options.getString('youtuber');
                const channel = interaction.options.getChannel('channel');
                const everyonePing = interaction.options.getBoolean('everyone-ping');
                var rolePing = interaction.options.getRole('role-ping');
                if (rolePing != null) { rolePing = rolePing.id }

                await interaction.reply(await youtube.addYoutube(interaction.guild.id, youtuber, channel, everyonePing, rolePing, true));
            }

            if (interaction.options.getSubcommand() === 'remove') {
                const youtuber = interaction.options.getString('youtuber');

                await interaction.reply(await twitch.removeTwitch(interaction.guild.id, youtuber));
            }
        }
    } else if (interaction.isAutocomplete()) {
        const command = interaction.commandName;

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            if (command == "twitch") {
                await interaction.respond(await twitch.autoCompleteUsersTwitch(interaction.guild.id, interaction.options.getFocused()))
            }
            else if (command == "youtube-video") {
                await interaction.respond(await youtube.autoCompleteUsersYoutube(interaction.guild.id, interaction.options.getFocused(), false))
            }
            else if (command == "youtube-live") {
                await interaction.respond(await youtube.autoCompleteUsersYoutube(interaction.guild.id, interaction.options.getFocused(), true))
            }
        } catch (error) {
            console.log(error);
        }
    }
    else {
        return;
    }
});

async function setDiscordStatus(text) {
    client.user.setActivity(text, { type: ActivityType.Streaming, url: process.env.DISCORD_BOT_TWITCH_LINK });
}

// Set up the REST API, taht updates the slash commands on discord
async function updateDiscordCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');
            let allGuilds = await db.fetchAllDiscords();
            for (const guild of allGuilds) {

                await rest.put(
                    Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, guild.guildId),
                    { body: commands },
                );
                console.log(`Updated commands for ${guild.guildId}`);
            }

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();
}