const { EmbedBuilder } = require('discord.js');
const { ACTIONS } = require('./actionsData');
const { fetchActionGif } = require('./actionApi');

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Jalanin satu command aksi lengkap dengan animasi "nyari gif dulu" sebelum hasil muncul.
 * `responder` harus punya:
 *   - send(content, isError=false) -> kirim pesan pertama
 *   - edit(content) -> edit pesan yang sama buat nampilin hasil akhir
 * `author` & `target` adalah object User dari discord.js (target boleh null kalau belum mention siapa-siapa).
 */
async function runAction(actionKey, author, target, responder) {
	const action = ACTIONS[actionKey];
	if (!action) return;

	if (!target) {
		await responder.send(
			`Mau ${action.emoji} ${action.verb} siapa? Mention orangnya ya, contoh: \`${action.aliases[0]} @user\``,
			true
		);
		return;
	}

	const isSelf = target.id === author.id;
	const mainText = isSelf
		? `**${author.username}** ${action.verb} dirinya sendiri... kenapa gitu? 😂`
		: `**${author.username}** ${action.verb} **${target.username}**! ${action.emoji}`;

	const buildEmbed = (imageUrl, statusText) => {
		const embed = new EmbedBuilder()
			.setColor(action.color)
			.setTitle(`${action.emoji} ${action.label}`)
			.setDescription(statusText);
		if (imageUrl) embed.setImage(imageUrl);
		return embed;
	};

	await responder.send({ embeds: [buildEmbed(null, '🔎 Nyari gif yang pas...')] });
	await sleep(400);

	let gifUrl = null;
	try {
		gifUrl = await fetchActionGif(action.source, action.category);
	} catch (err) {
		console.error(`[Action:${actionKey}] Gagal ambil gif:`, err.message);
	}

	await responder.edit({ embeds: [buildEmbed(gifUrl, mainText)] });
}

module.exports = { runAction };
