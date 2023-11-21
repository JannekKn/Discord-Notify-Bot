//get twitch token on start
//update commands on every server on every start
//seperate twitch/tiktok and stuff
//only admins adding stuff
//picture in twitch footer
//put all variables in config file
//Delete not wanted console logs
//add wanted console logs fe when streamer goes live
//handle no internet with axios
const EventEmitter = require('events');
const eE = new EventEmitter();

async function startup() {
    
    const discord = require('./discord.js');
    discordClient = await discord.setupDiscord();
    
    const twitch = require('./twitch.js');
    await twitch.setupTwitch(discordClient);

    //const youtube = require('./youtube.js');
    //await youtube.setupYoutube(discordClient, eE);

    //const callback = require('./callback.js');
    //callback.setupCallback(eE);

    //const tiktok = require('./tiktok.js');
    //await tiktok.setupTiktok(discordClient);
}

startup()


