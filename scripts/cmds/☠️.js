 module.exports = {
 config: {
	 name: "☠️",
	 version: "1.0",
	 author: "AceGun",
	 countDown: 5,
	 role: 0,
	 shortDescription: "no prefix",
	 longDescription: "no prefix",
	 category: "no prefix",
 },

 onStart: async function(){}, 
 onChat: async function({ event, message, getLang }) {
 if (event.body && event.body.toLowerCase() === "☠️") {
 return message.reply({
 body: " 「 🌼🥰༅༎༅আমার༅༎༅ জীবনের༅༎༅ প্রতিটা ༅༎༅গল্পে ༅༎༅আমিই ༅༎༅দোষী༅༎༅😌🌼\n🌻༅༎༅তাই তো༅༎༅ আমি ༅༎༅আনন্দিত༅༎༅ না ༅༎༅হয়েও༅༎༅🌺\n🌻💖༅༎༅বরাবর༅༎༅আমি༅༎༅হাসিখুশি༅༎༅ 🥰🌼\n\n𝗕𝗢𝗧 𝗢𝗪𝗡𝗘𝗥\n𝐙𝐢𝐬𝐚𝐧 𝐀𝐡𝐦𝐞𝐝」",
 attachment: await global.utils.getStreamFromURL("https://i.imgur.com/5lH0U7H.mp4",)
 });
 }
 }
 }
