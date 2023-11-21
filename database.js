require('console-stamp')(console, { 
    format: ':date(dd.mm.yy HH:MM:ss) :label' 
} );
const mariadb = require("mariadb");
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    addStreamerToDatabase,
    removeStreamerDatabase,
    updateStartedAtStreamTime,
    fetchAllStreamers,
    fetchAllDiscords,
    fetchGuildStreamers,
    streamerInDatabase,
    addDiscordServer,
    deleteDiscordServer,
    addYoutuberLiveToDatabase,
    addYoutuberVideoToDatabase,
    youtuberLiveInDatabase,
    youtuberVideoInDatabase,
    removeYoutuberLiveDatabase,
    removeYoutuberVideoDatabase,
    fetchGuildYoutubeLive,
    fetchGuildYoutubeVideo,
    fetchAllYoutube,
    getYoutuber,
    updateLatestYoutubeVideo,
    updateLatestYoutubeLive
}

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DP_PASS,
    database: process.env.DP_NAME,
});

//give a database connection from the pool
async function fetchConn() {
    let conn = await pool.getConnection();
    return conn;
}

// Function to add a streamer to the database
async function addStreamerToDatabase(userId, streamerName, serverId, channelId, pingrole, pingeveryone) {
    try {
        let conn = await pool.getConnection();
        const sql = 'INSERT INTO twitch (id, name, discord_server_id, discord_channel_id, started_at, role_ping, everyone_ping) VALUES (?, ?, ?, ?, ?, ?, ?);';
        const result = await conn.query(sql, [userId, streamerName, serverId, channelId, "never", pingrole, pingeveryone]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

// Function to remove a streamer to the database
async function removeStreamerDatabase(userId, serverId) {
    try {
        let conn = await pool.getConnection();
        const sql = 'DELETE FROM twitch WHERE discord_server_id = ? AND id = ?;';
        const result = await conn.query(sql, [serverId, userId]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

//update the stream started time in database
async function updateStartedAtStreamTime(userId, serverId, channelId, time) {
    try {
        let conn = await pool.getConnection();
        const sql = 'UPDATE twitch SET started_at = ? WHERE id = ? AND discord_server_id = ? AND discord_channel_id = ?;';
        const result = await conn.query(sql, [time, userId, serverId, channelId]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

// Function to fetch all streamers from the database
async function fetchAllStreamers() {
    try {
        conn = await fetchConn();
        return await conn.query("SELECT * FROM twitch;");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

// Function to fetch all guilds that the bot is on
async function fetchAllDiscords() {
    try {
        conn = await fetchConn();
        return await conn.query("SELECT * FROM discord;");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

// Checks how many streamers are already in the database on that server
async function streamerInDatabase(userId, guildId) {
    try {
        let conn = await pool.getConnection();
        sql = "SELECT id FROM twitch WHERE discord_server_id = ? AND id = ?;";
        let rows = await conn.query(sql, [guildId, userId]);
        if (conn) conn.end();
        return rows.length;
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

//adds a discord server from the database
async function addDiscordServer(serverId) {
    try {
        let conn = await pool.getConnection();
        const sql = 'INSERT INTO discord (guildId) VALUES (?);';
        const result = await conn.query(sql, [serverId]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

//deletes a discord server from the database, also all entrys that they had
async function deleteDiscordServer(serverId) {
    try {
        let conn = await pool.getConnection();
        const sql = 'DELETE FROM discord WHERE guildId = ?';
        const result = await conn.query(sql, [serverId]);
        const sql2 = 'DELETE FROM twitch WHERE discord_server_id = ?;';
        const result2 = await conn.query(sql, [serverId]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

//Find all streamers from one guild
async function fetchGuildStreamers(serverId, input) {
    try {
        input = "%" + await input.toString() + "%";
        let conn = await pool.getConnection();

        const sql = "SELECT id, name FROM twitch WHERE discord_server_id = ? AND name LIKE ?;"
        const result = await conn.query(sql, [serverId, input]);

        if (conn) conn.end();
        return result;
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

async function addYoutuberLiveToDatabase(userId, youtuber, guildId, channelId, rolePing, everyonePing) {
    try {
        let conn = await pool.getConnection();
        const sql = 'INSERT INTO youtube (id, name, discord_server_id, discord_channel_id, most_recent, live_or_video, role_ping, everyone_ping) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
        var currentDateTime = new Date();
        let now = currentDateTime.toISOString();
        const result = await conn.query(sql, [userId, youtuber, guildId, channelId, now, "live", rolePing, everyonePing]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}
async function addYoutuberVideoToDatabase(userId, youtuber, guildId, channelId, rolePing, everyonePing) {
    try {
        let conn = await pool.getConnection();
        const sql = 'INSERT INTO youtube (id, name, discord_server_id, discord_channel_id, most_recent, live_or_video, role_ping, everyone_ping) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
        var currentDateTime = new Date();
        let now = currentDateTime.toISOString();
        const result = await conn.query(sql, [userId, youtuber, guildId, channelId, now, "video", rolePing, everyonePing]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}
async function youtuberLiveInDatabase(userId, guildId) {
    try {
        let conn = await pool.getConnection();
        sql = "SELECT id FROM youtube WHERE discord_server_id = ? AND id = ? AND live_or_video = 'live';";
        let rows = await conn.query(sql, [guildId, userId]);
        if (conn) conn.end();
        return rows.length;
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}
async function youtuberVideoInDatabase(userId, guildId) {
    try {
        let conn = await pool.getConnection();
        sql = "SELECT id FROM youtube WHERE discord_server_id = ? AND id = ? AND live_or_video = 'video';";
        let rows = await conn.query(sql, [guildId, userId]);
        if (conn) conn.end();
        return rows.length;
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}
async function removeYoutuberLiveDatabase(userId, guildId) {
    try {
        let conn = await pool.getConnection();
        const sql = "DELETE FROM youtube WHERE discord_server_id = ? AND id = ? AND live_or_video = 'live';";
        const result = await conn.query(sql, [guildId, userId]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}
async function removeYoutuberVideoDatabase(userId, guildId) {
    try {
        let conn = await pool.getConnection();
        const sql = "DELETE FROM youtube WHERE discord_server_id = ? AND id = ? AND live_or_video = 'video';";
        const result = await conn.query(sql, [guildId, userId]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}
async function fetchGuildYoutubeLive(guildId, input) {
    try {
        input = "%" + await input.toString() + "%";
        let conn = await pool.getConnection();

        const sql = "SELECT id, name FROM youtube WHERE discord_server_id = ? AND live_or_video = 'live' AND name LIKE ?;"
        const result = await conn.query(sql, [guildId, input]);

        if (conn) conn.end();
        return result;
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}
async function fetchGuildYoutubeVideo(guildId, input) {
    try {
        input = "%" + await input.toString() + "%";
        let conn = await pool.getConnection();

        const sql = "SELECT id, name FROM youtube WHERE discord_server_id = ? AND live_or_video = 'video' AND name LIKE ?;"
        const result = await conn.query(sql, [guildId, input]);

        if (conn) conn.end();
        return result;
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

// Function to fetch all streamers from the database
async function fetchAllYoutube() {
    try {
        conn = await fetchConn();
        return await conn.query("SELECT * FROM youtube;");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

async function getYoutuber(channelId) {
    try {
        conn = await fetchConn();
        const sql = "SELECT * FROM youtube WHERE id = ?;"
        return await conn.query(sql, [channelId]);
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

async function updateLatestYoutubeVideo(userId, serverId, time) {
    try {
        let conn = await pool.getConnection();
        const sql = "UPDATE youtube SET most_recent = ? WHERE id = ? AND discord_server_id = ? AND live_or_video = 'video';";
        const result = await conn.query(sql, [time, userId, serverId]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}

async function updateLatestYoutubeLive(userId, serverId, time) {
    try {
        let conn = await pool.getConnection();
        const sql = "UPDATE youtube SET most_recent = ? WHERE id = ? AND discord_server_id = ? AND live_or_video = 'live';";
        const result = await conn.query(sql, [time, userId, serverId]);
        if (conn) conn.end();
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.end();
    }
}
