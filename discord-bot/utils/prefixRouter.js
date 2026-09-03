const {
	getBalance,
	addBalance,
	formatRupiah,
	claimDaily,
	setCooldown,
	getCooldownRemaining,
	getLeaderboard,
	getMessageStreak,
	getStreakBadge,
} = require('./economy');
const { playSlots, MAX_BET: SLOTS_MAX_BET } = require('./slotsEngine');

const PREFIX = (process.env.PREFIX || 'p').toLowerCase();

const WORK_COOLDOWN_MS = 30 * 60 * 1000;
const MANCING_COOLDOWN_MS = 45 * 60 * 1000;
const MANCING_FAIL_CHANCE = 0.15;

const JOBS = ['jadi kurir paket', 'nge-guide turis', 'bantuin tetangga pindahan', 'jualan es teh', 'nge-freelance desain', 'jagain warung'];

const CATCHES = [
	{ name: 'ikan mas', min: 15000, max: 40000 },
	{ name: 'ikan lele', min: 15000, max: 35000 },
	{ name: 'ikan tuna', min: 30000, max: 60000 },
	{ name: 'gurita', min: 25000, max: 55000 },
	{ name: 'harta karun kecil di dasar sungai', min: 40000, max: 70000 },
];

// Semua alias command prefix. Masing-masing feature punya alias pendek (mis. "ps")
// dan alias nama panjang (mis. "pslot") biar gampang diingat siapapun.
const ALIASES = {
	slots: ['ps', 'pslot', 'pslots'],
	balance: ['pb', 'pbal', 'pbalance', 'psaldo'],
	daily: ['pd', 'pdaily'],
	work: ['pw', 'pwork', 'pkerja'],
	mancing: ['pm', 'pmancing'],
	give: ['pg', 'pgive', 'pkasih'],
	leaderboard: ['pl', 'plb', 'pleaderboard', 'ptop'],
	help: ['phelp', 'pmenu'],
};

function resolveCommand(word) {
	for (const [cmd, aliases] of Object.entries(ALIASES)) {
		if (aliases.includes(word)) return cmd;
	}
	return null;
}

function formatDuration(ms) {
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	if (h > 0) return `${h}j ${m}m`;
	const s = Math.floor((ms % 60000) / 1000);
	return `${m}m ${s}d`;
}

// Dukung nulis jumlah singkat: "20k"/"20rb" = Rp20.000, "1.5jt"/"1.5juta" = Rp1.500.000
function parseAmount(str) {
	if (!str) return NaN;
	const s = str.toLowerCase().replace(/\./g, '').replace(/,/g, '.');
	const match = s.match(/^(-?\d+(?:\.\d+)?)(k|rb|jt|juta)?$/);
	if (!match) return NaN;
	let n = parseFloat(match[1]);
	if (match[2] === 'k' || match[2] === 'rb') n *= 1000;
	if (match[2] === 'jt' || match[2] === 'juta') n *= 1000000;
	return Math.floor(n);
}

function firstNonMentionArg(args) {
	return args.find((a) => !/^<@!?\d+>$/.test(a));
}

async function handleMessage(message) {
	if (message.author.bot || !message.guild) return;

	const raw = message.content.trim();
	if (!raw) return;
	const parts = raw.split(/\s+/);
	const word = parts[0].toLowerCase();
	if (!word.startsWith(PREFIX)) return;

	const cmd = resolveCommand(word);
	if (!cmd) return;

	const args = parts.slice(1);
	const { guild, author } = message;

	try {
		switch (cmd) {
			case 'slots': {
				const bet = parseAmount(args[0]);
				if (!bet || bet < 1) {
					await message.reply(
						`Format: \`${word} <jumlah taruhan>\` contoh: \`${word} 20000\` atau \`${word} 20k\` (maks ${formatRupiah(SLOTS_MAX_BET)})`
					);
					return;
				}
				const responder = {
					_msg: null,
					async send(content, isError = false) {
						this._msg = await message.reply(content);
					},
					async edit(content) {
						if (this._msg) await this._msg.edit(content);
					},
				};
				await playSlots(guild.id, author.id, bet, responder);
				break;
			}

			case 'balance': {
				const target = message.mentions.users.first() || author;
				const balance = getBalance(guild.id, target.id);
				const streak = getMessageStreak(guild.id, target.id);
				const badge = getStreakBadge(streak);
				const badgeTag = badge ? ` ${badge.emoji}` : '';
				let reply = `💰 Saldo **${target.username}**${badgeTag}: **${formatRupiah(balance)}**`;
				if (badge) reply += `\n${badge.emoji} Badge: **${badge.name}** (streak ngobrol ${streak} hari)`;
				await message.reply(reply);
				break;
			}

			case 'daily': {
				const result = claimDaily(guild.id, author.id);
				if (result.onCooldown) {
					await message.reply(`Kamu sudah klaim daily. Coba lagi dalam ${formatDuration(result.remaining)}.`);
					return;
				}
				const weekLabel = result.multiplier > 1 ? ` (kelipatan x${result.multiplier})` : '';
				await message.reply(
					`🎁 Kamu klaim daily: **${formatRupiah(result.amount)}**${weekLabel}\n` +
						`🔥 Streak klaim: **${result.streak} hari**\n` +
						`💰 Saldo sekarang: **${formatRupiah(result.newBalance)}**`
				);
				break;
			}

			case 'work': {
				const remaining = getCooldownRemaining(guild.id, author.id, 'lastWork', WORK_COOLDOWN_MS);
				if (remaining > 0) {
					await message.reply(`Capek dulu, istirahat. Coba lagi dalam ${formatDuration(remaining)}.`);
					return;
				}
				const job = JOBS[Math.floor(Math.random() * JOBS.length)];
				const amount = (Math.floor(Math.random() * 41) + 10) * 1000;
				setCooldown(guild.id, author.id, 'lastWork');
				const newBalance = addBalance(guild.id, author.id, amount);
				await message.reply(`💼 Kamu ${job} dan dapat **${formatRupiah(amount)}**! Saldo sekarang: **${formatRupiah(newBalance)}**`);
				break;
			}

			case 'mancing': {
				const remaining = getCooldownRemaining(guild.id, author.id, 'lastMancing', MANCING_COOLDOWN_MS);
				if (remaining > 0) {
					await message.reply(`Pancingannya belum siap lagi. Coba lagi dalam ${formatDuration(remaining)}.`);
					return;
				}
				if (Math.random() < MANCING_FAIL_CHANCE) {
					setCooldown(guild.id, author.id, 'lastMancing');
					await message.reply('🎣 Sayang sekali, umpannya diambil tapi kamu tidak dapat apa-apa. Coba lagi nanti!');
					return;
				}
				const catchItem = CATCHES[Math.floor(Math.random() * CATCHES.length)];
				const amount = Math.floor(Math.random() * (catchItem.max - catchItem.min + 1)) + catchItem.min;
				setCooldown(guild.id, author.id, 'lastMancing');
				const newBalance = addBalance(guild.id, author.id, amount);
				await message.reply(
					`🎣 Kamu mancing dan dapat **${catchItem.name}**, laku **${formatRupiah(amount)}**! Saldo sekarang: **${formatRupiah(newBalance)}**`
				);
				break;
			}

			case 'give': {
				const target = message.mentions.users.first();
				const amount = parseAmount(firstNonMentionArg(args));
				if (!target || !amount || amount < 1) {
					await message.reply(`Format: \`${word} @user <jumlah>\` contoh: \`${word} @Budi 20k\``);
					return;
				}
				if (target.id === author.id) {
					await message.reply('Tidak bisa kasih Rp ke diri sendiri.');
					return;
				}
				if (target.bot) {
					await message.reply('Tidak bisa kasih Rp ke bot.');
					return;
				}
				const balance = getBalance(guild.id, author.id);
				if (amount > balance) {
					await message.reply(`Saldo kamu cuma **${formatRupiah(balance)}**.`);
					return;
				}
				addBalance(guild.id, author.id, -amount);
				const targetNewBalance = addBalance(guild.id, target.id, amount);
				await message.reply(`✅ Kamu kasih **${formatRupiah(amount)}** ke **${target.username}**. Saldo mereka sekarang: **${formatRupiah(targetNewBalance)}**`);
				break;
			}

			case 'leaderboard': {
				const top = getLeaderboard(guild.id, 10);
				if (top.length === 0) {
					await message.reply('Belum ada data ekonomi di server ini.');
					return;
				}
				const lines = await Promise.all(
					top.map(async (entry, i) => {
						const member = await guild.members.fetch(entry.userId).catch(() => null);
						const name = member ? member.user.username : `Unknown (${entry.userId})`;
						const badge = getStreakBadge(getMessageStreak(guild.id, entry.userId));
						const badgeTag = badge ? ` ${badge.emoji}` : '';
						return `${i + 1}. **${name}**${badgeTag} — ${formatRupiah(entry.balance)}`;
					})
				);
				await message.reply(`🏆 **Leaderboard Rp**\n${lines.join('\n')}`);
				break;
			}

			case 'help': {
				await message.reply(
					`**Command cepat (prefix \`${PREFIX}\`)**\n` +
						`\`${ALIASES.slots.join('`/`')}\` <taruhan> — main slot (maks ${formatRupiah(SLOTS_MAX_BET)})\n` +
						`\`${ALIASES.balance.join('`/`')}\` [@user] — cek saldo\n` +
						`\`${ALIASES.daily.join('`/`')}\` — klaim Rp harian\n` +
						`\`${ALIASES.work.join('`/`')}\` — kerja cari Rp\n` +
						`\`${ALIASES.mancing.join('`/`')}\` — mancing cari Rp (kerja sampingan, cooldown terpisah)\n` +
						`\`${ALIASES.give.join('`/`')}\` @user <jumlah> — kasih Rp ke user lain\n` +
						`\`${ALIASES.leaderboard.join('`/`')}\` — top 10 saldo\n\n` +
						`_Jumlah bisa ditulis singkat: \`20k\` = Rp20.000, \`1.5jt\` = Rp1.500.000. Command lain (coinflip, blackjack, upscale, dll) masih pakai slash command \`/\`._`
				);
				break;
			}
		}
	} catch (err) {
		console.error('[PrefixCommand] Error:', err);
		await message.reply('Terjadi error saat menjalankan command ini.').catch(() => {});
	}
}

module.exports = { handleMessage, PREFIX, ALIASES };
