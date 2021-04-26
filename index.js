const Discord = require('discord.js');
const Twit = require('twit');
const Cron = require('cron');
require('dotenv').config();

const dclient = new Discord.Client();
const BOT_TOKEN = process.env.BOT_TOKEN;
const cid = process.env.CHANNEL_ID;
const tck = process.env.TWITTER_CONSUMER_KEY;
const tcs = process.env.TWITTER_CONSUMER_SECRET;
const tat  = process.env.TWITTER_ACCESS_TOKEN;
const tts = process.env.TWITTER_TOKEN_SECRET;
const itp = process.env.IMMEDIATE_TWEET_PASSWORD;

const express = require("express");
const app = express();
const port = process.env.PORT || 3000

const db = require("./models/index");

const T = new Twit({
  consumer_key: tck,
  consumer_secret: tcs,
  access_token: tat,
  access_token_secret: tts,
  timeout_ms: 10*1000,
  strictSSL: true
})

app.get("/", function (req, res) {
  db.data.findAll({}).then((e) => {
    res.send(e);
  });
});

app.get("/tweet", function(req, res) {
  if (req.query.pass == itp) {
    try{
      res.send(tweet());
    }catch(error){
      res.send(error);
      console.log(error);
    }
  }else{
    res.send('password incorrect');
  };
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

new Cron.CronJob({
  cronTime: '0 0 * * * *',
  onTick: function () {
    tweet();
  },
  start: true
});

function tweet(){
  db.data.count({
    where: {isnew: true}
  }).then(e => {
    if (e > 0) {
      db.data.findAll({
        where: {isnew: true}
      }).then(records => {
        var n = Math.floor(Math.random() * records.length);
        records[n].isnew = false;
        records[n].save();
        T.post('statuses/update', {
          status: records[n].content.replace(/<.+?>/g, '')
        });
        console.log(message)
      });
    }else{
      db.data.findAll({}).then(records => {
        var n = Math.floor(Math.random() * records.length);
        T.post('statuses/update', {
          status: records[n].content.replace(/<.+?>/g, '')
        });
        console.log(message)
      });
    }
  });
}

dclient.on('ready', () => console.log(`Logged in as ${dclient.user.tag}!`));

dclient.on('message', msg => {
  if (msg.channel.id == cid) {
    db.data.create({
      url: msg.url,
      content: msg.content,
      isnew: true
    });
  }
});

dclient.on('messageUpdate', (oldMsg, newMsg) => {
  if (newMsg.channel.id == cid) {
    db.data.findOne({
      where: {
        url: oldMsg.url
      }
    }).then(item => {
      item.content = newMsg.content;
      item.save();
    });
  }
});

dclient.on('messageDelete', msg => {
  if (msg.channel.id == cid) {
    db.data.findOne({
      where: {
        url: msg.url
      }
    }).then(item => {
      item.destroy();
    });
  }
});

dclient.login(BOT_TOKEN);