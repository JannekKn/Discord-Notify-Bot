require('console-stamp')(console, { 
  format: ':date(dd.mm.yy HH:MM:ss) :label' 
} );

module.exports = {
  setupTiktok
};

async function setupTiktok(client) {
  discordClient = client;
  /*twitchAccessToken = await getTwitchToken(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET);

  setInterval(checkTwitchStatus, process.env.TWITCH_CHECK_DELAY_MS);
  checkTwitchStatus();*/

  console.log('Tiktok finished setting up');
}

const axios = require('axios');
const cheerio = require('cheerio');

async function getLatestTikTokVideo(user) {
    const url = `https://www.tiktok.com/@${user}`;
    const response = await axios.get(url);
    
    const $ = cheerio.load(response.data);
    console.log($)
    const script = $('#__NEXT_DATA__');
    if (script.length > 0) {
        const data = JSON.parse(script[0].children[0].data);
        const videos = data.props.pageProps.items;
        if (videos && videos.length > 0) {
            const latestVideo = videos[0];
            const videoUrl = `https://www.tiktok.com/@${user}/video/${latestVideo.id}`;
            return videoUrl;
        }
    }
    return null;
}

// Replace 'username' with the TikTok username
getLatestTikTokVideo('grangerval').then(console.log).catch(console.error);
