const fetch = require("node-fetch");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports = {
  config: {
    name: "song",
    aliases: ["music", "song"],
    version: "0.0.2",
    author: "ArYAN",
    countDown: 5,
    role: 0,
    shortDescription: "sing tomake chai",
    longDescription: "sing janne kyun tanveer evan",
    category: "MUSIC",
    guide: "/music dj lappa lappa"
  },

  onStart: async function ({ api, event, args }) {
    const songName = args.join(" ");
    const type = "audio";

    if (!songName) {
      return api.sendMessage(
        "🚫 Please provide a song name (e.g. `sing Shape of You`).",
        event.threadID
      );
    }

    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    try {
      const searchResults = await ytSearch(songName);
      if (!searchResults?.videos?.length) throw new Error("No results found.");

      const top = searchResults.videos[0];
      const apiUrl = `https://noobs-xyz-aryan.vercel.app/youtube?id=${top.videoId}&type=${type}&apikey=itzaryan`;

      const downloadRes = await axios.get(apiUrl);
      if (!downloadRes.data?.downloadUrl) throw new Error("No downloadUrl received.");

      const dlUrl = downloadRes.data.downloadUrl;
      const res = await fetch(dlUrl);
      if (!res.ok) throw new Error(`Download failed (status: ${res.status}).`);

      const fileBuffer = await res.buffer();
      const fileExt = type === "audio" ? "mp3" : "mp4";
      const fileName = `${top.title}.${fileExt}`.replace(/[\\/:"*?<>|]+/g, "");
      const filePath = path.join(__dirname, fileName);
      fs.writeFileSync(filePath, fileBuffer);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await api.sendMessage(
        {
          attachment: fs.createReadStream(filePath),
          body: `🎵 MUSIC\n━━━━━━━━━━━━━━━\n\n${top.title}`
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
