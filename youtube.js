require('console-stamp')(console, { 
    format: ':date(dd.mm.yy HH:MM:ss) :label' 
} );
const { google } = require('googleapis');
const axios = require('axios');
const cheerio = require('cheerio');
const request = require('request');
const db = require('./database.js');

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    setupYoutube,
    addYoutube,
    removeYoutube,
    autoCompleteUsersYoutube
}

let discordClient;
let youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

async function setupYoutube(dcCleint, eE) {
    discordClient = dcCleint;

    eE.on('callbackReceivedYoutube', function(data) {
        callbackHandler(data);
    });
    

    console.log('Youtube finished setting up');

    
    setInterval(subscribeAllChannels, process.env.YOUTUBE_RESUBSCRIBE_DELAY);
    setTimeout(() => {
        subscribeAllChannels();
    }, 5000);
    
}

/*

    post für videos

    post für livestreams

    always re-subscribe

*/

//we can tecnically send this often, subscribing to an already subscribed topic does not harm... i think
async function subscribeAllChannels() {
    let allYoutubers = await db.fetchAllYoutube();

    const uniqueUserIds = [];

    for (const youtuber of allYoutubers) {
        if (!uniqueUserIds.includes(youtuber.id)) {
            uniqueUserIds.push(youtuber.id);
        }
    }

    for (const youtuberId of uniqueUserIds) {
        subscribeToChannel(youtuberId);
    }
}

async function callbackHandler(data) {
    let jsonObj = JSON.parse(data)
    
    const entry = jsonObj['feed']['entry'][0];
    const videoId = entry["yt:videoid"][0];
    const channelId = entry["yt:channelid"][0];
    const videoTitle = entry["title"][0];
    const ChannelName = entry["author"][0]["name"][0];
    const publishedTime = new Date(entry["published"][0]);

    //Here i have to see if i can see a difference between a video and a livestream, or if livestreams even exist
    //Check, if this is new or just some random stuff
    let youtuber = await db.getYoutuber(channelId);
    let curNewestTime = new Date(youtuber.most_recent);

    //When this, then this is more recent, then the one saved in the database
    if(publishedTime > curNewestTime) {
        console.log
    }
}


async function subscribeToChannel(channelId) {
    const form = {
        'hub.callback': process.env.YOUTUBE_CALLBACK_URL,
        'hub.mode': 'subscribe',
        'hub.topic': `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
        'hub.verify': 'async',
        'hub.verify_token': process.env.YOUTUBE_CALLBACK_VERIFY_TOKEN,
        'hub.secret': process.env.YOUTUBE_CALLBACK_SECRET
    };

    await request.post('https://pubsubhubbub.appspot.com/', { form: form }, function (err, response, body) {
        if (err) {
            console.error(err);
        }
    });
}

async function unsubscribeFromChannel(channelId) {
    const form = {
        'hub.callback': process.env.YOUTUBE_CALLBACK_URL,
        'hub.mode': 'unsubscribe',
        'hub.topic': `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
        'hub.verify': 'async',
        'hub.verify_token': process.env.YOUTUBE_CALLBACK_VERIFY_TOKEN,
        'hub.secret': process.env.YOUTUBE_CALLBACK_SECRET
    };

    await request.post('https://pubsubhubbub.appspot.com/', { form: form }, function (err, response, body) {
        if (err) {
            console.error(err);
        }
    });
}
//unsubscribeFromChannel("UCXuqSBlHAE6Xw-yeJA0Tunw")
//subscribeToChannel("UC_IepEKJXoJjqztFRGLxICg")


//Decided not to do it like this, because the Youtube API daily rate limit would only allow like 100 requests a day
/*async function checkYoutubeVideoStatus() {
    //const allYoutubers = await db.fetchAllYoutubers();
    //for (const channelId of allYoutubers) {
        const response = await youtube.search.list({
            channelId: "testiD",
            maxResults: 1,
            order: 'date', // Order by date
            type: 'video', // Only retrieve videos
            part: 'snippet'
          });
          console.log(response.data)
          
          if (response.data.items.length > 0) {
            console.log(response.data.items[0]);
            return null;
            //post.postTwitch(discordClient, matchingUser, streamer);
          } else {
            return null;
          }
    //}
}*/

async function getYoutubeUser(inputUrl) {
    return new Promise(async (resolve, reject) => {
        let result = null;
        let errorMessage = null;

        if (inputUrl.includes('https://www.youtube.com/channel/') || inputUrl.includes('https://www.youtube.com/c/') || inputUrl.includes('https://www.youtube.com/@')) {
            var response;
            try {
                response = await axios.get(inputUrl);
            } catch (error) {
                //This also happens on an non existent username
                errorMessage = "I cannot find this user, did you copy the correct url? It should have a format like this: <https://www.youtube.com/@JannekKn>";
                resolve({ userId: result, errorMessage });
                return;
            }

            // Load the HTML with Cheerio
            const $ = cheerio.load(response.data);

            const url = $('link[itemprop="url"]').attr('href');

            if (!url) {
                // If there is no link tag i assume this is no valid user, idk what cause this to happen, maybe youtube capcha??
                errorMessage = "Error, please reach out to Jannek for help"
                resolve({ userId: result, errorMessage });
                return;
            }

            const parts = url.split('https://www.youtube.com/channel/');
            
            result = parts[1];
            resolve({ userId: result, errorMessage });
        } else {
            errorMessage = "The URL you provided is not a valid Youtube URL, try to copy it from the channel on your PC";
            resolve({ userId: result, errorMessage });
        }
    });
}


async function addYoutube(guildId, youtuber, channel, everyonePing, rolePing, livestream) {

    //const { userId, errorMessage } = await getYoutubeUser(youtuber);
    try {
        let { userId, errorMessage } = await getYoutubeUser(youtuber);
        if (errorMessage) {
            console.error(errorMessage);
            return (errorMessage);
        } else {
            await subscribeToChannel(userId);
        if (livestream == true) {
            await db.addYoutuberLiveToDatabase(userId, youtuber, guildId, channel.id, rolePing, everyonePing);
            return (`Added <${youtuber}> (${userId}) on Youtube(Livestream) to be tracked in ${channel.toString()}`);
            
        }
        else if (livestream == false) {
            await db.addYoutuberVideoToDatabase(userId, youtuber, guildId, channel.id, rolePing, everyonePing);
            return (`Added <${youtuber}> (${userId}) on Youtube(Videos) to be tracked in ${channel.toString()}`);
        }
        else {
            return ("ERROR, please get in contact with Jannek");
        }
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function removeYoutube(guildId, id, livestream) {
    try {
        unsubscribeFromChannel(id);
        if (livestream == true) {
            isInDatabase = await db.youtuberLiveInDatabase(id, guildId);
            if (isInDatabase != 0) {
                await db.removeYoutuberLiveDatabase(id, guildId);
                return (`Removed Youtuber (Livestreams) with id (${id}) from your tracking`);
            } else {
                return (`I cant find this Youtuber (Livestreams) on your discord guild`);
            }
        }
        else if (livestream == false) {
            isInDatabase = await db.youtuberVideoInDatabase(id, guildId);
            if (isInDatabase != 0) {
                await db.removeYoutuberVideoDatabase(id, guildId);
                return (`Removed Youtuber (Videos) with id (${id}) from your tracking`);
            } else {
                return (`I cant find this Youtuber (Videos) on your discord guild`);
            }
        }
        else {
            return ('An error occurred while removing the youtuber live/video.');
        }

    } catch (error) {
        console.error('Error removing streamer:', error);
        return ('An error occurred while removing the youtuber.');
    }
}

async function autoCompleteUsersYoutube(guildId, value, livestream) {
    if (livestream == true) {
        const users = await db.fetchGuildYoutubeLive(guildId, value)
    }
    else if (livestream == false) {
        const users = await db.fetchGuildYoutubeVideo(guildId, value)
    }

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