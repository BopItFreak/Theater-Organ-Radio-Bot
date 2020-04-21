
const axios = require('axios');
module.exports = function () {
this.client.on("message", msg => {
  if (msg.author.bot) return;
  let cmd = msg.content.split(' ')[0].toLowerCase();
  let input = msg.content.substring(cmd.length).trim();
  switch (cmd) {
    case "t!h":
    case "t!help": {
      msg.channel.send({
        "embed": {
          "title": "Commands",
          "color": 12291602,
          "timestamp": Date.now(),
          "footer": {
            "icon_url": msg.author.avatarURL,
            "text": `Requested by ${msg.author.username}`
          },
          "description": `
          **t!help**: Displays this.
          **t!join**: Joins the bot into the voice channel you are currently in.
          **t!leave**: Makes the bot leave the voice channel you are currently in.
          **t!request**: Usage: t!request <id of song>. Requests a song to be played on the radio.
          **t!playing**: Displays information about the current song
          **t!history**: Displays the songs that have already been played
          `
        }
      })
      break;
    }

    case "t!join": {
      if (msg.author.bot) return;
      if (msg.channel.type !== "text") {
        msg.channel.send("no u");
        return;
      }
      let voicechs = [...msg.guild.channels.filter((ch) => ch.type === "voice").values()];
      for (const channel of voicechs) {
        if ([...channel.members.values()].length > 0) {
          for (const member of [...channel.members.values()]) {
            if (member.user.id === msg.author.id) {
              channel.join().then(connection => {
                console.log(`Connected to voice channel. ID: ${channel.id}, Name: ${channel.name}`);
                connection.playStream("http://atosradio.com:8001/stream/2/", {
                  filter: "audioonly",
                  quality: 'highestaudio'
                });
                global.connection = connection;
              }).catch(console.error);

              msg.react("👍");
              return;
            }
          }
        }
      }
      msg.channel.send("Please join a voice channel first.");
      break;
    }
    
    case "t!leave": {
      let voicechs = [...msg.guild.channels.filter((ch) => ch.type === "voice").values()];
      for (const channel of voicechs) {
        if ([...channel.members.values()].length > 0) {
          for (const member of [...channel.members.values()]) {
            if (member.user.id === msg.author.id) {
              if ([...channel.members.values()].find((m) => m.user.id == this.client.user.id)) {
                channel.leave();
                msg.react("👍");
              } else {
                msg.channel.send("I cannot leave the voice channel since I'm not in the voice channel you are in.");
              }
              return;
            }
          }
        }
      }
      msg.channel.send("I cannot leave the voice channel since you're not in it.");
      break;
    }

    case "t!search":
    case "t!s": {
      if (!input) {
        msg.channel.send(`❌ Oop, Usage: t!search <input>`);
        return;
      }
      let searchResults = this.songListData.filter((d) => d.name.toLowerCase().includes(input.toLowerCase()));
      let searchPageChunks = searchResults.chunk(10);
      if (searchResults.length > 0) {
        msg.channel.send(this.makeSearchMessage(msg, 0, searchPageChunks)).then((msg) => {
          msg.searchPageIndex = 0;
          msg.searchPageChunks = searchPageChunks;
          msg.input = input;
          this.lastSearchMessages[msg.channel.id] ? this.lastSearchMessages[msg.channel.id].delete() : {};
          this.lastSearchMessages[msg.channel.id] = msg;
          msg.react("⬅️"); msg.react("➡️"); msg.react("❌");
        })
      } else {
        msg.channel.send("No Results.");
        return;
      }
      break;
    }

    case "t!request": {
      if (parseInt(input)) {
        axios.get(`https://atosradio.org/samweb/web/request.php?songID=${input}`)
          .then(function (response) {
            //console.log(response.data);
            let success = response.data.split(`<h2 class="success">`)[1]?.split("</h2>")[0];
            let error = response.data.split(`<h2 class="error">`)[1]?.split("</h2>")[0];
            if (success) {
              msg.channel.send(`✅ \`\`${success}\`\` ✅`);
            } else if (error) {
              msg.channel.send(`❌ \`\`${error}\`\` ❌`);
            }
          })
          .catch(function (error) {
            msg.channel.send("Oop... \n" + "`" + error.message + "`")
            console.log(error);
          })
      } else {
        msg.channel.send("❌ Oop, Usage: t!request <songID>");
      }
      break;
    }

    case "t!playing": {
      axios.get(`https://atosradio.org/atosradio/songinfo.html`)
        .then(function (response) {
          let a = response.data;
          let songData = {};
          songData.title = a.split(`<dd color="black">`)[1].split("</dd>")[0];
          songData.artist = a.split(`title="Click for more Artist info">`)[1].split("</a></dd>")[0]
          songData.album = a.split(`title="Click for more Album info">`)[1].split("</a></dd>")[0]
          songData.duration = a.split(`<dt>Duration</dt>`)[1].split(`<dd>`)[1].split(`</dd>`)[0]
          songData.info = a.split(`<dt>Information</dt>`)[1].split(`<dd class="broad">`)[1].split(`</dd>`)[0];
          songData.listenersCount = a.split(`<dt>Listeners:</dt><dd> `)[1].split(" </dd>")[0];
          //data.nextSong = a.split("<dt>Coming Up...</dt><dd> ")[1].split("</dd>")[0];
          //let separator = a.split("<dt>Coming Up...</dt><dd> ")[1].split("</dd>")[1]
          //data.nextSongArtistAndAlbum = separator.split(`<dd>`)[1].split("</dd></dl>")[0]
          //console.log(data)
          axios.get(`https://atosradio.org/atosradio/playing.html`)
            .then(function (res) {
              let songListData = require("./data.json"); //bruh moment
              let nextSong = {};
              let nextNextSong = {};
              nextSong.name = res.data.split(`<span class="comingIndex">`)[1].split(`</span>`)[0].split("1 -")[1].trim();
              nextSong.artist = res.data.split(`<span class="comingIndex">`)[1].split(`</span>`)[1].split("</td><td>")[1].split("</td><td>")[0].trim()
              nextSong.album = res.data.split(`<span class="comingIndex">`)[1].split(`</span>`)[1].split("</td><td>")[2].trim().split("</div>")[0].trim()
              nextNextSong.name = res.data.split(`<span class="comingIndex">`)[2].split(`</span>`)[0].split("2 -")[1].trim();
              nextNextSong.artist = res.data.split(`<span class="comingIndex">`)[2].split(`</span>`)[1].split("</td><td>")[1].split("</td><td>")[0].trim()
              nextNextSong.album = res.data.split(`<span class="comingIndex">`)[2].split(`</span>`)[1].split("</td><td>")[2].trim().split("</div>")[0].trim()
              msg.channel.send({
                "embed": {
                  "title": "Currently Playing Track Information",
                  "url": "https://atosradio.org/atosradio/songinfo.html",
                  "color": 12291602,
                  "timestamp": Date.now(),
                  "footer": {
                    "icon_url": msg.author.avatarURL,
                    "text": `Requested by ${msg.author.username}`
                  },
                  "thumbnail": {
                    "url": songListData.find((d) => d.album === songData.album).pictureUrl
                  },
                  "fields": [{
                    "name": "Title",
                    "value": songData.title
                  },
                  {
                    "name": "Artist",
                    "value": songData.artist
                  },
                  {
                    "name": "Album",
                    "value": songData.album ? songData.album : "No Album",
                    "inline": true
                  },
                  {
                    "name": "Duration",
                    "value": songData.duration,
                    "inline": true
                  },
                  {
                    "name": "Information",
                    "value": songData.info ? songData.info : "No Information",
                    "inline": true
                  },
                  {
                    "name": "Listeners Count",
                    "value": songData.listenersCount,
                    "inline": true
                  },
                  {
                    "name": "Coming Up...",
                    "value": `**1.** **Name**: ${nextSong.name}, **Artist**: ${nextSong.artist}, **Album**: ${nextSong.album}
                                **2.** **Name**: ${nextNextSong.name}, **Artist**: ${nextNextSong.artist}, **Album**: ${nextNextSong.album}`,
                    "inline": true
                  }
                  ]
                }
              })
            }).catch(function (error) {
              msg.channel.send("Oop... \n" + "`" + error.message + "`")
              console.log(error);
            })
        })
        .catch(function (error) {
          msg.channel.send("Oop... \n" + "`" + error.message + "`")
          console.log(error);
        })
      break;
    }

    case "t!history": {
      axios.get("http://atosradio.com:8001/played.html?sid=2")
        .then((res) => {
          let desc = res.data.split("<tbody>")[0].split("<b>Current Song</b>")[1].split("</table")[0].replace(/<[^>]*>/g, "bruh").replace(/bruhbruhbruhbruh/g, "\n`").replace(/bruhbruh/g, "` ");
          msg.channel.send({
            embed: {
              "title": "Song History",
              "url": "http://atosradio.com:8001/played.html?sid=2",
              "color": 12291602,
              "timestamp": Date.now(),
              "footer": {
                "icon_url": msg.author.avatarURL,
                "text": `Requested by ${msg.author.username}`
              },
              "description": desc
            }
          }
          )
        })
      break;
    }

  }
})







this.client.on('message', async function (msg) {
  //if (message.author.id !== bot.user.id) return;
  msg.a = msg.content;
  var cmd = msg.a.split(' ')[0].toLowerCase();
  var input = msg.a.substring(cmd.length).trim();
  if (cmd == 't!js') {
    if (msg.author.id == "246799235775725569") {
      if (input.startsWith('```js\n')) {
        input = input.split('```js\n')[1];
      }
      if (input.endsWith('```')) {
        input = input.split('```')[0];
      }
      let trued = false;
      const prettyMs = require('pretty-ms');
      var typeOf = require('typeof');
      //{split:{prepend:unescape("%60%60%60js%0A"),append:unescape("%0A%60%60%60")}}
      //console.log(input)




      try {
        let eaa = await eval(input)
        let tonq = eaa;
        global.disdate = Date.now();
        //console.log(disdate)
        let g = '```js\n' + '-> ' + eaa + '\n```'
        eaa = require("util").inspect(eaa, {
          depth: 0
        }) //.replace(/undefined/g, "unduhfinded")
        eaa = eaa.split(/\r?\n|\r/g).slice(0, 100).join("\n")



        //handle promis parse
        if (tonq instanceof Promise) {
          tonq.then(async function (qwer) {
            trued = true;
            qwer = require("util").inspect(qwer, {
              depth: 0
            }). //replace(/undefined/g, "unduhfinded");
              wer = qwer.split(/\r?\n|\r/g).slice(0, 100).join("\n");
            //console.log(disdate)
            await msg.channel.send('```js\n' + '-> ' + qwer + '\n``````ts\n' + typeOf(tonq) + "```" + "`success`" + ":timer:" + " " + prettyMs(Number.isFinite((Date.now() - global.disdate)) == true ? (Date.now() - global.disdate) : 0), {
              split: {
                prepend: "\x60\x60\x60js\n",
                append: "\n\x60\x60\x60"
              }
            });

          })
        } else {
          if (!trued) {
            //console.log(disdate)
            await msg.channel.send('```js\n' + '-> ' + eaa + '``````ts\n' + typeOf(tonq) + "``` " + "`success`" + ":timer:" + " " + prettyMs(Number.isFinite((Date.now() - global.disdate)) == true ? (Date.now() - global.disdate) : 0), {
              split: {
                prepend: "\x60\x60\x60js\n",
                append: "\n\x60\x60\x60"
              }
            });
          }
        }


      } catch (e) {
        //console.log(global.disdate)
        await msg.channel.send('```diff\n' + '-> ' + require("util").inspect(e) + '\n```' + "`FAIL!!!`" + " " + ":timer:" + " " + prettyMs(Number.isFinite((Date.now() - global.disdate)) == true ? (Date.now() - global.disdate) : 0));
      }
    } else {
      msg.react("⛔");
    }
  }
})
};