const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");

module.exports = {
  config: {
    name: 'auto',
    version: '0.1.0',
    author: 'ArYAN',
    countDown: 5,
    role: 0,
    shortDescription: 'Auto video download from any URL (YouTube supported)',
    category: 'media',
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("✅ AutoLink is running", event.threadID);
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const message = event.body;

    const linkMatch = message.match(/(https?:\/\/[^\s]+)/);
    if (!linkMatch) return;

    const url = linkMatch[0];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const isYouTube = /(?:youtube\.com|youtu\.be)/.test(url);

    try {
      let videoUrl = null;
      let title = "No Title";

      if (isYouTube) {
        const ytRes = await axios.get(`https://aryan-xyz-ytdl-five.vercel.app/download?url=${encodeURIComponent(url)}`);
        if (!ytRes.data || !ytRes.data.url) {
          return api.sendMessage("❌ Failed to download YouTube video.", threadID, event.messageID);
        }
        videoUrl = ytRes.data.url;
        title = ytRes.data.title || "YouTube Video";
      } else {
        const response = await axios.get(`https://aryan-video-downloader.vercel.app/alldl?url=${encodeURIComponent(url)}`);
        const data = response.data.data || {};
        title = data.title || "No Title";
        videoUrl = data.videoUrl || data.high || data.low || null;
      }

      if (!videoUrl) {
        return;
      }

      const filePath = `video_${Date.now()}.mp4`;

      request(videoUrl).pipe(fs.createWriteStream(filePath)).on("close", () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        api.sendMessage({
          body: `${title}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => fs.unlinkSync(filePath));
      });

    } catch (err) {
      console.error("Download Error:", err);
      api.sendMessage("❌ Failed to download video.", threadID, event.messageID);
    }
  }
};
