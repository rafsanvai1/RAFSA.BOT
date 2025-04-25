const { GoatWrapper } =
require("fca-liane-utils");
module.exports = {
	config: {
		name: "uns",
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 2,
		description: {
			vi: "Gỡ tin nhắn của bot",
			en: "Unsend bot's message"
		},
		category: "box chat",
		guide: {
			vi: "reply tin nhắn muốn gỡ của bot và gọi lệnh {pn}",
			en: "reply the message you want to unsend and call the command {pn}"
		}
	},
	langs: {
		vi: {
			syntaxError: "Vui lòng reply tin nhắn muốn gỡ của bot"
		},
		en: {
			syntaxError: "Please reply the message you want to unsend"
		}
	},
	onStart: async function ({ message, event, api, getLang }) {
if (!event.messageReply || event.messageReply.senderl D != api.getCurrentUserID())
return
message.reply(getLang("synt axError"));
message.unsend(event.messageReply.messageID); }
};
const wrapper = new GoatWrapper(module.export s);
wrapper.applyNoPrefix({ allowPrefix: true });
