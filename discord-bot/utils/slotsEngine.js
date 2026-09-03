const { EmbedBuilder } = require('discord.js');
const { getBalance, addBalance, formatRupiah } = require('./economy');

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const PAYOUT = { '7️⃣': 20, '💎': 10, '🔔': 6, '🍇': 4, '🍋': 3, '🍒': 2 };
const MAX_BET = 100000; // Rp 100.000 — batas maksimal taruhan slots

const COLOR_SPIN = 0x5865f2;
const COLOR_LOSE = 0xed4245;
const COLOR_WIN = 0xfee75c;
const COLOR_JACKPOT = 0xf47b02;

function randomSymbol() {
	return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

// Reel row dirender lebih besar & jelas, dengan penanda kunci (🔒) di reel yang sudah berhenti.
function reelRow(reels, locked) {
	return reels.map((s, i) => (locked[i] ? `**[ ${s} ]**` : `[ ${s} ]`)).join('   ');
}

function buildEmbed({ reels, locked, statusText, color, footer }) {
	const embed = new EmbedBuilder()
		.setColor(color)
		.setTitle('🎰 Slot Machine')
		.setDescription(`${reelRow(reels, locked)}\n\n${statusText}`);
	if (footer) embed.setFooter({ text: footer });
	return embed;
}

// Interval antar-tick yang makin lambat (deceleration) — ngasih kesan reel kehabisan momentum, kayak mesin beneran.
function decelerationTicks(count, startMs, endMs) {
	const ticks = [];
	for (let i = 0; i < count; i++) {
		const t = count === 1 ? 1 : i / (count - 1);
		const eased = 1 - Math.pow(1 - t, 2); // ease-out
		ticks.push(Math.round(startMs + (endMs - startMs) * eased));
	}
	return ticks;
}

/**
 * Menjalankan satu permainan slots lengkap dengan animasi reel berhenti satu-satu,
 * melambat secara bertahap (deceleration) biar berasa kayak mesin slot beneran,
 * plus jeda dramatis sebelum reel terakhir & sebelum hasil ditampilkan.
 * `responder` harus punya:
 *   - send(content, isError=false) -> kirim pesan pertama (isError: pesan gagal/ephemeral, selalu string)
 *   - edit(content) -> edit pesan yang sama buat lanjutan animasi & hasil akhir
 */
async function playSlots(guildId, userId, bet, responder) {
	const balance = getBalance(guildId, userId);

	if (!bet || bet < 1) {
		await responder.send('Jumlah taruhan tidak valid.', true);
		return;
	}
	if (bet > MAX_BET) {
		await responder.send(`Maksimal taruhan slots adalah **${formatRupiah(MAX_BET)}**.`, true);
		return;
	}
	if (bet > balance) {
		await responder.send(`Saldo kamu cuma **${formatRupiah(balance)}**, tidak cukup untuk taruhan **${formatRupiah(bet)}**.`, true);
		return;
	}

	const finalReels = [randomSymbol(), randomSymbol(), randomSymbol()];
	const reels = [randomSymbol(), randomSymbol(), randomSymbol()];
	const locked = [false, false, false];

	await responder.send({
		embeds: [buildEmbed({ reels, locked, statusText: '🎲 Berputar...', color: COLOR_SPIN, footer: `Taruhan ${formatRupiah(bet)}` })],
	});

	// ===== FASE 1: semua reel berputar cepat bareng-bareng =====
	const fastTicks = decelerationTicks(6, 90, 140);
	for (const delay of fastTicks) {
		await sleep(delay);
		reels[0] = randomSymbol();
		reels[1] = randomSymbol();
		reels[2] = randomSymbol();
		await responder.edit({
			embeds: [buildEmbed({ reels, locked, statusText: '🎲 Berputar...', color: COLOR_SPIN, footer: `Taruhan ${formatRupiah(bet)}` })],
		});
	}

	// ===== FASE 2: reel berhenti satu-satu, tiap reel melambat sebelum kunci =====
	const stopLabels = ['Reel kiri', 'Reel tengah', 'Reel kanan'];
	for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
		const slowTicks = decelerationTicks(4, 120, 320);
		for (const delay of slowTicks) {
			await sleep(delay);
			for (let i = reelIndex; i < 3; i++) reels[i] = randomSymbol();
			await responder.edit({
				embeds: [
					buildEmbed({
						reels,
						locked,
						statusText: `🎲 ${stopLabels[reelIndex]} melambat...`,
						color: COLOR_SPIN,
						footer: `Taruhan ${formatRupiah(bet)}`,
					}),
				],
			});
		}

		reels[reelIndex] = finalReels[reelIndex];
		locked[reelIndex] = true;

		// Jeda dramatis lebih lama di reel terakhir buat efek suspense.
		const suspensePause = reelIndex === 2 ? 700 : 350;
		await responder.edit({
			embeds: [
				buildEmbed({
					reels,
					locked,
					statusText: `🛑 ${stopLabels[reelIndex]} berhenti!`,
					color: COLOR_SPIN,
					footer: `Taruhan ${formatRupiah(bet)}`,
				}),
			],
		});
		await sleep(suspensePause);
	}

	// ===== HASIL AKHIR (jeda sejenak dulu sebelum payout ditampilkan) =====
	await responder.edit({
		embeds: [buildEmbed({ reels, locked, statusText: '✨ ...', color: COLOR_SPIN, footer: `Taruhan ${formatRupiah(bet)}` })],
	});
	await sleep(500);

	let winnings;
	let resultText;
	let color;

	if (reels[0] === reels[1] && reels[1] === reels[2]) {
		winnings = bet * PAYOUT[reels[0]];
		resultText = `🎉 **JACKPOT!** 3 simbol sama! Menang **${formatRupiah(winnings)}**!`;
		color = COLOR_JACKPOT;
	} else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
		winnings = Math.floor(bet * 1.5);
		resultText = `✨ 2 simbol sama! Menang **${formatRupiah(winnings)}**!`;
		color = COLOR_WIN;
	} else {
		winnings = -bet;
		resultText = `💸 Tidak ada yang cocok. Kalah **${formatRupiah(bet)}**.`;
		color = COLOR_LOSE;
	}

	const newBalance = addBalance(guildId, userId, winnings);
	await responder.edit({
		embeds: [
			buildEmbed({
				reels,
				locked,
				statusText: `${resultText}\nSaldo sekarang: **${formatRupiah(newBalance)}**`,
				color,
			}),
		],
	});
}

module.exports = { playSlots, MAX_BET, SYMBOLS, PAYOUT };
