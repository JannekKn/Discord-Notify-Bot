
const { EmbedBuilder } = require('discord.js');

module.exports = {
    postTwitch,
    postYoutubeLive
};

async function postTwitch(client, matchingUser, streamer) {
    const streamLink = "https://www.twitch.tv/" + matchingUser.user_login

    const embed = new EmbedBuilder()
        .setColor('#6441a5')
        .setTitle(`${matchingUser.user_name} is online!`)
        .setDescription(`**${matchingUser.title}**`)
        .addFields(
            { name: 'Game', value: matchingUser.game_name, inline: true },
            { name: 'Link', value: streamLink, inline: true }
        )
        .setURL(streamLink)
        .setImage(matchingUser.thumbnail_url.replace("{width}", "384").replace("{height}", "216"))
        .setFooter({ text: 'Alert bot by Jannek', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
        .setTimestamp();

    try {
        const channel = await client.channels.fetch(streamer.discord_channel_id);
        if (channel) {
            var stringmessage = '';
            if (streamer.everyone_ping == 1) {
                stringmessage += '@everyone ';
            }
            if (streamer.role_ping != null) {
                stringmessage += `<@&${streamer.role_ping}> `;
            }
            stringmessage += matchingUser.user_name + " is live now! " + streamLink;
            await channel.send({ content: stringmessage, embeds: [embed] });
        } else {
            console.error(`Channel with ID: ${channelID} not found`);
        }
    } catch (error) {
        console.error(error);
    }
}

async function postYoutubeLive(client, matchingUser, streamer) {
    const streamLink = "https://www.youtube.com/watch?v=" + "test"

    const embed = new EmbedBuilder()
        .setColor('#6441a5')
        .setTitle(`${matchingUser.user_name} is online!`)
        .setDescription(`**${matchingUser.title}**`)
        .addFields(
            { name: 'Game', value: matchingUser.game_name, inline: true },
            { name: 'Link', value: streamLink, inline: true }
        )
        .setURL(streamLink)
        .setImage(matchingUser.thumbnail_url.replace("{width}", "384").replace("{height}", "216"))
        .setFooter({ text: 'Alert bot by Jannek', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
        .setTimestamp();

    try {
        const channel = await client.channels.fetch(streamer.discord_channel_id);
        if (channel) {
            var stringmessage = '';
            if (streamer.everyone_ping == 1) {
                stringmessage += '@everyone ';
            }
            if (streamer.role_ping != null) {
                stringmessage += `<@&${streamer.role_ping}> `;
            }
            stringmessage += matchingUser.user_name + " is live now! " + streamLink;
            await channel.send({ content: stringmessage, embeds: [embed] });
        } else {
            console.error(`Channel with ID: ${channelID} not found`);
        }
    } catch (error) {
        console.error(error);
    }
}

