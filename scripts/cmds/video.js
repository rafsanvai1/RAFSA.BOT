const axios = require("axios");
const fs = require("fs");
const yts = require("yt-search");
const path = require("path");

const cacheDir = path.join(__dirname, "/cache");
const tmp = path.join(__dirname, "/tmp");

module.exports = {
 config: {
 name: "video",
 version: "1.4",
 author: "Team Calyx",
 countDown: 5,
 role: 0,
 description: { en: "Search and download video from YouTube" },
 category: "media",
 guide: { en: "{pn} <search term> / <YouTube video URL>" }
 },

 onStart: async ({ api, args, event }) => {
 if (!args.length) {
 return api.sendMessage("âŒ Please use the format '/video <search term>' or '/video <YouTube video URL>'.", event.threadID, event.messageID);
 }

 const input = args.join(" ");
 const isUrl = input.startsWith("http://") || input.startsWith("https://");

 try {
 if (isUrl) {
 await handleDownloadByUrl(api, event, input);
 return;
 }

 const searchResults = await yts(input);
 const videos = searchResults.videos.slice(0, 6);

 if (videos.length === 0) {
 return api.sendMessage(`â­• No results found for: ${input}`, event.threadID, event.messageID);
 }

 let msg = "";
 videos.forEach((video, index) => {
 msg += `${index + 1}. ${video.title}\nDuration: ${video.timestamp}\nChannel: ${video.author.name}\n\n`;
 });

 api.sendMessage(
 {
 body: msg + "Reply with a number to select.",
 attachment: await Promise.all(videos.map(video => fetchThumbnail(video.thumbnail, path.join(tmp, `thumbnail_${video.videoId}.jpg`))))
 },
 event.threadID,
 (err, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 commandName: "video",
 messageID: info.messageID,
 author: event.senderID,
 videos,
 });
 },
 event.messageID
 );
 } catch (error) {
 console.error(error);
 return api.sendMessage("âŒ Failed to search YouTube.", event.threadID, event.messageID);
 }
 },

 onReply: async ({ event, api, Reply }) => {
 await api.unsendMessage(Reply.messageID);
 api.setMessageReaction("â³", event.messageID, () => {}, true);

 const choice = parseInt(event.body);
 if (isNaN(choice) || choice <= 0 || choice > Reply.videos.length) {
 return api.sendMessage("âŒ Please enter a valid number.", event.threadID, event.messageID);
 }

 const selectedVideo = Reply.videos[choice - 1];
 await handleDownloadByUrl(api, event, selectedVideo.url, selectedVideo);
 }
};

async function handleDownloadByUrl(api, event, videoUrl, selectedVideo = null) {
 try {
 const apiUrl = (await axios.get('https://raw.githubusercontent.com/romeoislamrasel/romeobot/refs/heads/main/api.json')).data.api;
 const res = await axios.get(`${apiUrl}/api/video?url=${encodeURIComponent(videoUrl)}`);
 const downloadUrl = res.data.downloadUrl;

 if (!downloadUrl) {
 return api.sendMessage("âŒ Could not retrieve a video file. Please try again with a different link.", event.threadID, event.messageID);
 }

 const totalSize = await getTotalSize(downloadUrl);
 const id = selectedVideo ? selectedVideo.videoId : Math.random().toString(36).slice(2, 10);
 const title = selectedVideo ? selectedVideo.title : res.data.title || "Unknown";
 const channel = selectedVideo?.author?.name;

 const filePath = path.join(cacheDir, `ytb_video_${id}.mp4`);
 await downloadFileParallel(downloadUrl, filePath, totalSize, 5);

 api.setMessageReaction("âœ…", event.messageID, () => {}, true);

 const messageText = `ðŸ“¥ Video download successful:\nâ€¢ Title: ${title}` + (channel ? `\nâ€¢ Channel: ${channel}` : "");

 await api.sendMessage(
 {
 body: messageText,
 attachment: fs.createReadStream(filePath),
 },
 event.threadID,
 () => fs.unlinkSync(filePath),
 event.messageID
 );
 } catch (e) {
 console.error(e);
 return api.sendMessage("âŒ Failed to download video.", event.threadID, event.messageID);
 }
}

async function fetchThumbnail(url, pathName) {
 try {
 const response = await axios.get(url, { responseType: "stream" });
 response.data.pipe(fs.createWriteStream(pathName));
 return new Promise((resolve) => {
 response.data.on("end", () => resolve(fs.createReadStream(pathName)));
 });
 } catch (error) {
 console.error(error);
 return null;
 }
}

async function getTotalSize(url) {
 const response = await axios.head(url);
 return parseInt(response.headers["content-length"], 10);
}

async function downloadFileParallel(url, filePath, totalSize, numChunks) {
 const chunkSize = Math.ceil(totalSize / numChunks);
 const chunks = [];

 async function downloadChunk(url, start, end, index) {
 try {
 const response = await axios.get(url, {
 headers: { Range: `bytes=${start}-${end}` },
 responseType: "arraybuffer",
 });
 return response.data;
 } catch (error) {
 console.error(`Error downloading chunk ${index + 1}:`, error);
 throw error;
 }
 }

 for (let i = 0; i < numChunks; i++) {
 const start = i * chunkSize;
 const end = Math.min(start + chunkSize - 1, totalSize - 1);
 chunks.push(downloadChunk(url, start, end, i));
 }

 try {
 const buffers = await Promise.all(chunks);
 const fileStream = fs.createWriteStream(filePath);
 for (const buffer of buffers) {
 fileStream.write(Buffer.from(buffer));
 }

 await new Promise((resolve, reject) => {
 fileStream.on("finish", resolve);
 fileStream.on("error", reject);
 fileStream.end();
 });

 } catch (error) {
 console.error("Error downloading or writing the video:", error);
 }
   }
