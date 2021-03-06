const Discord = require("discord.js");
const axios = require('axios');

class Organ {
  constructor() {
    this.client = new Discord.Client();
    this.songListData = require("./data.json");
    this.init();
    this.lastSearchMessages = [];
    this.connectionTimeouts = [];
  }
  init() {
    this.client.bot = this; //hack
    this.client.login(require("fs").readFileSync("./token.txt", "utf8"));

    this.client.on("ready", () => {
      console.log("Ready")
    })

    this.client.on("messageReactionAdd", (reaction, user) => {
      if ((reaction._emoji.name == "⬅️" || reaction._emoji.name == "➡️" || reaction._emoji.name == "❌") && (user.id !== this.client.user.id)) {
        if (!this.lastSearchMessages[reaction.message.channel.id] || (reaction.message.id !== this.lastSearchMessages[reaction.message.channel.id].id)) return;
        let msg = this.lastSearchMessages[reaction.message.channel.id]
        msg.author = user;
        this.editSearchMessage(msg, reaction._emoji.name, msg.searchPageIndex, msg.searchPageChunks)
      }
    })

    this.client.on("messageReactionRemove", (reaction, user) => {
      if ((reaction._emoji.name == "⬅️" || reaction._emoji.name == "➡️" || reaction._emoji.name == "❌") && (user.id !== this.client.user.id)) {
        if (!this.lastSearchMessages[reaction.message.channel.id] || (reaction.message.id !== this.lastSearchMessages[reaction.message.channel.id].id)) return;
        let msg = this.lastSearchMessages[reaction.message.channel.id]
        msg.author = user;
        this.editSearchMessage(msg, reaction._emoji.name, msg.searchPageIndex, msg.searchPageChunks)
      }
    })

    this.client.on("voiceStateUpdate", (oldMember, newMember) => {
      let voicechs = [...this.client.guilds.get(oldMember.guild.id).channels.filter((ch) => ch.type === "voice").values()];
      for (const channel of voicechs) {
        if ([...channel.members.values()].length > 0) {
          for (const member of [...channel.members.values()]) {
            if (member.user.id === this.client.user.id) { //if bot is in the channel
              this.connectionTimeouts[oldMember.guild.id] = setTimeout(() => {
                if ([...channel.members.values()].length == 1) {//only bot is in the voice channel                
                  channel.leave();        
                  console.log("left channel due to inactivity.")                        
                }
              }, 1000 * 60 * 5) // 5 minutes
              return;
            }
          }
        }
      }
    })
    require("./commands.js").bind(this)();
  }
  async editSearchMessage(msg, type, newPageNum, searchChunks) {
    let userReactions = msg.reactions.filter(reaction => reaction.users.has(msg.author.id));
    switch (type) {
      case "➡️": {
        if (searchChunks[newPageNum + 1]) {     
          for (const reaction of userReactions.values()) {
            if (reaction._emoji.name == "➡️") reaction.remove(msg.author.id).catch((e) => {}); //no errors        
          }
          ++msg.searchPageIndex;
          msg.edit(this.makeSearchMessage(msg, ++newPageNum, searchChunks))
        }
        break;
      }
      case "⬅️": {
        if (searchChunks[newPageNum - 1]) {
          for (const reaction of userReactions.values()) {
            if (reaction._emoji.name == "⬅️") reaction.remove(msg.author.id).catch((e) => {});          
          }
          --msg.searchPageIndex;
          msg.edit(this.makeSearchMessage(msg, --newPageNum, searchChunks))
        }
        break;
      }
      case "❌": {
        msg.delete()
        break;
      }
    }
  }
  makeSearchMessage(msg, newPageNum, searchChunks) {
    let generateSearchTemplate = (id, name) => {
      return `**ID**: ${id}, **Name**: ${name},\n`
    };
    let generateShortSearchTemplate = (length) => {
      return `**Length**: ${length}\n`
    }
    let searchTemplate = "";
    let lengthTemplate = "";
    for (let i = 0; i < (searchChunks[newPageNum].length >= 10 ? 10 : searchChunks[newPageNum].length); i++) {
      let result = searchChunks[newPageNum][i];
      let name = truncate(result.name, 60, "…");
      searchTemplate = searchTemplate.concat(generateSearchTemplate(result.id, name));
      lengthTemplate = lengthTemplate.concat(generateShortSearchTemplate(result.songLength));
    }
    return {
      embed: {
        "title": "Search Results",
        "url": `http://atosradio.org/samweb/web/playlist.php?search=${encodeURIComponent(msg.input)}&limit=10`,
        "color": 12291602,
        "timestamp": new Date().toISOString(),
        "footer": {
          "icon_url": msg.author.avatarURL,
          "text": `Requested by ${msg.author.username}`
        },
        "fields": [
          {
            "name": `Page (${newPageNum + 1}/${searchChunks.length})`,//"󠀀󠀀",
            "value": searchTemplate,
            "inline": true
          },
          {
            "name": "󠀀󠀀",
            "value": lengthTemplate,
            "inline": true
          }
        ]
      }
    }
  }
}
module.exports = Organ;