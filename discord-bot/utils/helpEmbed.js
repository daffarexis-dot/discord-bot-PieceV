const { EmbedBuilder } = require('discord.js');
const { ACTIONS } = require('./actionsData');

function buildHelpEmbed({ prefix, aliases, slotsMaxBet, formatRupiah, isOwnerUser }) {
	const actionLines = Object.values(ACTIONS)
		.map((a) => `\`${a.aliases[0]}\` @user — ${a.emoji} ${a.label}`)
		.join('\n');

	const embed = new EmbedBuilder()
		.setColor(0x5865f2)
		.setTitle('📖 Daftar Command')
		.setDescription(
			`Prefix command cepat: \`${prefix}\`. Jumlah Rp boleh ditulis singkat: \`20k\` = Rp20.000, \`1.5jt\` = Rp1.500.000.`
		)
		.addFields(
			{
				name: '💰 Ekonomi',
				value:
					`\`${aliases.balance.join('`/`')}\` [@user] — cek saldo\n` +
					`\`${aliases.daily.join('`/`')}\` — klaim Rp harian (streak makin gede tiap 7 hari)\n` +
					`\`${aliases.give.join('`/`')}\` @user <jumlah> — kasih Rp ke user lain\n` +
					`\`${aliases.leaderboard.join('`/`')}\` — top 10 saldo`,
			},
			{
				name: '⛏️ Grinding (kerja cari Rp)',
				value:
					`\`${aliases.work.join('`/`')}\` — kerja santai (cooldown 30m)\n` +
					`\`${aliases.mancing.join('`/`')}\` — mancing di sungai (cooldown 45m)\n` +
					`\`${aliases.berburu.join('`/`')}\` — berburu di hutan (cooldown 40m)\n` +
					`\`${aliases.nambang.join('`/`')}\` — nambang di gua (cooldown 60m, reward paling gede)`,
			},
			{
				name: '🎰 Game Judi',
				value:
					`\`${aliases.slots.join('`/`')}\` <taruhan> — slot machine (maks ${formatRupiah(slotsMaxBet)})\n` +
					`\`/coinflip\` — tebak koin, menang x2\n` +
					`\`/blackjack\` — blackjack lawan bot (tombol Hit/Stand)`,
			},
			{
				name: '🤗 Aksi / Roleplay',
				value: actionLines,
			},
			{
				name: '🎵 Musik & Lainnya (slash command)',
				value:
					'`/play` `/queue` `/skip` `/pause` `/resume` `/stop` — musik\n' +
					'`/upscale` `/upscalevideo` — AI upscaler foto/video',
			}
		)
		.setFooter({ text: `Ketik ${prefix}help atau /help kapan aja buat liat daftar ini lagi.` });

	if (isOwnerUser) {
		embed.addFields({
			name: '👑 Owner',
			value: `\`${aliases.addmoney.join('`/`')}\` [@user] <jumlah> — tambah/kurangi saldo user (boleh minus buat kurangi)`,
		});
	}

	return embed;
}

module.exports = { buildHelpEmbed };
