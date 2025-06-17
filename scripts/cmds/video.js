const fetch = require("node-fetch");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports = {
  config: {
    name: "video",
    aliases: [],
    version: "1.4.3",
    author: "ROBIUL",
    countDown: 5,
    role: 0,
    shortDescription: "Download YouTube video or audio by name or URL",
    longDescription: "Use '/video [name]' to search or '/video -v [YouTube URL]' for video download or '/video -a [YouTube URL]' for audio download.",
    category: "MUSIC",
    guide: "/video leja re\n/video -v https://youtu.be/abc123\n/video -a https://youtu.be/abc123"
  },

  onStart: async function ({ api, event, args }) {
    const apiKey = "itzaryan";
    let type = "video";
    let videoId, topResult;

    const processingMessage = await api.sendMessage("📥 Fetching your media...", event.threadID, null, event.messageID);

    try {
      const mode = args[0];
      const inputArg = args[1];

      if ((mode === "-v" || mode === "-a") && inputArg) {
        type = mode === "-a" ? "audio" : "video";

        let urlObj;
        try {
          urlObj = new URL(inputArg);
        } catch (err) {
          throw new Error("Invalid YouTube URL.");
        }

        if (urlObj.hostname === "youtu.be") {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes("youtube.com")) {
          const urlParams = new URLSearchParams(urlObj.search);
          videoId = urlParams.get("v");
        }

        if (!videoId) throw new Error("Could not extract video ID.");

        const searchResults = await ytSearch(videoId);
        if (!searchResults || !searchResults.videos.length) {
          throw new Error("Couldn't fetch video details.");
        }

        topResult = searchResults.videos[0];

      } else {
        const query = args.join(" ");
        if (!query) throw new Error("Please enter a video name or URL.");

        const searchResults = await ytSearch(query);
        if (!searchResults || !searchResults.videos.length) {
          throw new Error("No results found.");
        }

        topResult = searchResults.videos[0];
        videoId = topResult.videoId;
      }

      const timestamp = topResult.timestamp;
      const parts = timestamp.split(":").map(Number);
      const durationSeconds = parts.length === 3
        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
        : parts[0] * 60 + parts[1];

      if (durationSeconds > 600) {
        throw new Error(`This video is too long (${timestamp}). Only videos under 10 minutes are supported.`);
      }

      const apiUrl = `https://noobs-xyz-aryan.vercel.app/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;
      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      let downloadResponse;
      try {
        downloadResponse = await axios.get(apiUrl, { timeout: 30000 }); // 30-second timeout
      } catch (error) {
        if (error.response && error.response.status === 504) {
          throw new Error("Server timeout. Please try again later. The download server is currently overloaded.");
        } else if (error.code === 'ECONNABORTED') {
          throw new Error("The request took too long and was aborted. Please try again.");
        } else {
          throw new Error(`API Error: ${error.message}`);
        }
      }

      const downloadUrl = downloadResponse.data.downloadUrl;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download failed with status: ${response.status}`);
      }

      const ext = type === "audio" ? "mp3" : "mp4";
      const safeTitle = topResult.title.replace(/[\\/:*?"<>|]/g, "").substring(0, 50);
      const filename = `${safeTitle}.${ext}`;
      const downloadPath = path.join(__dirname, filename);
      const buffer = await response.buffer();

      fs.writeFileSync(downloadPath, buffer);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await api.sendMessage({
        attachment: fs.createReadStream(downloadPath),
        body:
          `${type === "audio" ? "🎵 AUDIO INFO" : "🎬 VIDEO INFO"}\n` +
          `━━━━━━━━━━━━━━━\n` +
          `📌 Title: ${topResult.title}\n` +
          `🎞 Duration: ${topResult.timestamp}\n` +
          `📺 Channel: ${topResult.author.name}\n` +
          `👁 Views: ${topResult.views.toLocaleString()}\n` +
          `📅 Uploaded: ${topResult.ago}`
      }, event.threadID, () => {
        fs.unlinkSync(downloadPath);
        api.unsendMessage(processingMessage.messageID);
      }, event.messageID);

    } catch (err) {
      console.error("Error:", err.message);
      const message = `❌ Failed: ${err.message}`;
      api.sendMessage(message, event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
