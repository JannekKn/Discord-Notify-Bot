require('console-stamp')(console, { 
    format: ':date(dd.mm.yy HH:MM:ss) :label' 
} );
const crypto = require('crypto');
const express = require('express');
const Joi = require('joi');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const xmlparser = require('express-xml-bodyparser');

app.use(xmlparser({
    verify: function (req, res, buf, encoding) {
        req.rawBody = buf.toString();
    }
}));

module.exports = {
    setupCallback
}

var eventEmitter;

function setupCallback(eE) {
    eventEmitter = eE;

    //Just for testing purposes
    payload = '{"feed":{"$":{"xmlns:yt":"http://www.youtube.com/xml/schemas/2015","xmlns":"http://www.w3.org/2005/Atom"},"link":[{"$":{"rel":"hub","href":"https://pubsubhubbub.appspot.com"}},{"$":{"rel":"self","href":"https://www.youtube.com/xml/feeds/videos.xml?channel_id=UCXuqSBlHAE6Xw-yeJA0Tunw"}}],"title":["YouTube video feed"],"updated":["2023-10-18T01:09:06.016728189+00:00"],"entry":[{"id":["yt:video:0EtgwIajVqs"],"yt:videoid":["0EtgwIajVqs"],"yt:channelid":["UCXuqSBlHAE6Xw-yeJA0Tunw"],"title":["Download These Handy Tools NOW! Essential USB Tools"],"link":[{"$":{"rel":"alternate","href":"https://www.youtube.com/watch?v=0EtgwIajVqs"}},{"$":{"rel":"alternate","hreflang":"en","href":"https://www.youtube.com/watch?v=0EtgwIajVqs&vl=en"}},{"$":{"rel":"alternate","hreflang":"es-US","href":"https://www.youtube.com/watch?v=0EtgwIajVqs&vl=es-US"}},{"$":{"rel":"alternate","hreflang":"hi","href":"https://www.youtube.com/watch?v=0EtgwIajVqs&vl=hi"}},{"$":{"rel":"alternate","hreflang":"x-default","href":"https://www.youtube.com/watch?v=0EtgwIajVqs"}}],"author":[{"name":["Linus Tech Tips"],"uri":["https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw"]}],"published":["2023-07-19T17:08:33+00:00"],"updated":["2023-10-18T01:09:06.016728189+00:00"]}]}}';
    //eventEmitter.emit('callbackReceivedYoutube', payload);
}

app.post('/callback/youtube', function (req, res) {
    const payload = JSON.stringify(req.body);



    const schema = Joi.object({
        feed: Joi.object({
            $: Joi.object({
                'xmlns:yt': Joi.string().required(),
                xmlns: Joi.string().required()
            }),
            link: Joi.array().items(
                Joi.object({
                    $: Joi.object({
                        rel: Joi.string().required(),
                        href: Joi.string().uri().required()
                    })
                })
            ),
            title: Joi.array().items(Joi.string()),
            updated: Joi.array().items(Joi.string()),
            entry: Joi.any()
        })
    });

    // Validate
    const { error } = schema.validate(req.body);

    if (error) {
        console.log('Ungültige Daten empfangen:', error.details[0].message);
        res.status(400).send('Bad Request');
    }
    else {
        try {
            const signature = req.headers['x-hub-signature'];

            const hmac = crypto.createHmac('sha1', process.env.YOUTUBE_CALLBACK_SECRET);
            hmac.update(req.rawBody);
            const expectedSignature = 'sha1=' + hmac.digest('hex');

            if (signature !== expectedSignature) {
                console.log('Received invalid content on callback/youtube');
                res.status(403).send('Forbidden');
            }
            else {
                eventEmitter.emit('callbackReceivedYoutube', payload);
                res.status(200).end();
            }
        } catch (error) {
            //This usually happens, when a compleatly weird request gets send
            console.error(error);
            //Lol you can change the code if you want but i thought it was funny
            res.status(418).end();
        }
    }
});

app.get('/callback/youtube', function (req, res) {

    if (req.query['hub.verify_token'] === process.env.YOUTUBE_CALLBACK_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
        console.log("callback challanged, verify token yes");
    } else {
        res.send('Not allowed :( <a href="https://discordalert.desertbushgames.de/">https://discordalert.desertbushgames.de/</a>');
        console.log("callback challanged, verify token NO!");
    }
});

app.listen(process.env.CALLBACK_PORT, function () {
    console.log(`App for callbacks to this server is listening on port ${process.env.CALLBACK_PORT}!`);
});