require('console-stamp')(console, {
    format: ':date(dd.mm.yy HH:MM:ss) :label'
});
const axios = require('axios');
const db = require('./database.js');
const post = require('./discordPosts.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    setupTwitch,
    addTwitch,
    removeTwitch,
    autoCompleteUsersTwitch
};


var twitchAccessToken;
var discordClient = "";

async function setupTwitch(client) {
    discordClient = client;
    twitchAccessToken = await getTwitchToken(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET);

    console.log('Twitch finished setting up');

    setInterval(checkTwitchStatus, process.env.TWITCH_CHECK_DELAY_MS);
    checkTwitchStatus();
}

async function getTwitchToken(clientId, clientSecret) {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await axios.post('https://id.twitch.tv/oauth2/token', params);
    const access_token = response.data.access_token;

    console.log('Got a Twitch Access Token');
    return (access_token);
};

// Function to periodically check Twitch streamers status, when they get live it sends a notification in discord
async function checkTwitchStatus() {
    const allStreamers = await db.fetchAllStreamers();

    const maxEntriesPerList = 100; //maximum in one twitch request
    const prefix = 'user_id=';
    const uniqueUserIds = [];
    const idLists = [];

    for (const streamer of allStreamers) {
        if (!uniqueUserIds.includes(streamer.id)) {
            uniqueUserIds.push(streamer.id);

            if (idLists.length === 0 || idLists[idLists.length - 1].split('&').length >= maxEntriesPerList) {
                // Start a new list
                idLists.push(`${prefix}${streamer.id}`);
            } else {
                // Add the ID to the current list
                idLists[idLists.length - 1] += `&${prefix}${streamer.id}`;
            }
        }
    }

    //Twitch requests with 100 ids each, puts all responses back in one list
    var allResponses = [];

    for (const oneList of idLists) {
        try {
            var response = await axios.get(`https://api.twitch.tv/helix/streams?${oneList}`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${twitchAccessToken}`,
                },
            });

            if (response.data.data.length > 0) {
                allResponses = allResponses.concat(response.data.data);
            }
        } catch (error) {
            console.error('An ERROR while requesting Twitch data:', error);
        }
    }

    for (const streamer of allStreamers) {
        // Find a matching user object in response by user_id
        const matchingUser = allResponses.find(user => user.user_id == String(streamer.id));

        // Check if a matching user is found and the started_at is not the same, so afterwards can post+
        if (matchingUser && matchingUser.started_at !== streamer.started_at) {

            post.postTwitch(discordClient, matchingUser, streamer);

            //update started at time
            await db.updateStartedAtStreamTime(streamer.id, streamer.discord_server_id, streamer.discord_channel_id, matchingUser.started_at);
        }
    }

}

// Gets the twitch user id from twitch api
async function getTwitchUser(username) {
    try {
        const response = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${twitchAccessToken}`
            }
        });

        if (response.status === 200 && response.data.data.length > 0) {
            return response.data.data[0];
        } else {
            console.error('couldnt find a user');
            return null;
        }
    } catch (error) {
        console.error('error getting user-ID from twitch:', error);
        return null;
    }
}

async function addTwitch(guildId, streamer, channel, everyonePing, rolePing) {
    try {
        let twitchUser = await getTwitchUser(streamer)
        if (twitchUser) {
            isInDatabase = await db.streamerInDatabase(twitchUser.id, guildId)

            if (isInDatabase == 0) {
                await db.addStreamerToDatabase(twitchUser.id, streamer, guildId, channel.id, rolePing, everyonePing);

                return (`Added ${streamer} (${twitchUser.id}) on Twitch to be tracked in ${channel.toString()}`);
            } else {
                return (`You are already tracking ${streamer} on this Discord`);
            }

        } else {
            return (`Could not find ${streamer}, maybe you misspelled the name?`);
        }

    } catch (error) {
        console.error('Error adding streamer:', error);
        return ('An error occurred while adding the streamer.');
    }
}

async function removeTwitch(guildId, id) {
    try {
        isInDatabase = await db.streamerInDatabase(id, guildId)

        if (isInDatabase != 0) {
            await db.removeStreamerDatabase(id, guildId);

            return (`Removed streamer with id (${id}) from your tracking`);
        } else {
            return (`I cant find this streamer on your discord guild`);
        }

    } catch (error) {
        console.error('Error removing streamer:', error);
        return ('An error occurred while removing the streamer.');
    }
}

async function autoCompleteUsersTwitch(guildId, value) {
    const users = await db.fetchGuildStreamers(guildId, value)

    //Put all users into Array
    let userArray = [];

    for (let item of users) {
        userArray.push({ id: item.id.toString(), name: item.name });
    }

    //REMEMBER If there are more than 25 options, discord does not display them anymore
    if (userArray.length <= 25) {
        return userArray.map(choice => ({ name: choice.name + " (" + choice.id + ")", value: choice.id }));
    } else {
        userArray = await userArray.copyOfRange(array, 0, 24);
        return userArray.map(choice => ({ name: choice.name + " (" + choice.id + ")", value: choice.id }));
    }
}