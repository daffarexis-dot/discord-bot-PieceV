const { getBalance, addBalance, formatRupiah } = require('./economy');

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const PAYOUT = { '7️⃣': 20, '💎': 10, '🔔': 6, '🍇': 4, '🍋': 3, '🍒': 2 };
const MAX_BET = 100000; // Rp 100.000 — batas maksimal taruhan slots

function randomSymbol() {
	return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function frame(reels, statusText) {
	return `🎰 [ ${reels.join(' | ')} ]\n${statusText}`;
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Menjalankan satu permainan slots lengkap dengan animasi reel berhenti satu-satu.
 * `responder` harus punya:
 *   - send(content, isError=false) -> kirim pesan pertama (isError: pesan gagal/ephemeral)
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

	// ===== ANIMASI SPIN =====
	// Discord tidak bisa render GIF dinamis, jadi animasinya dibuat dengan
	// edit pesan berkali-kali. Reel-nya berhenti satu-satu (kiri → tengah → kanan)
	// biar kelihatan bergerak kayak mesin slot beneran.
	const finalReels = [randomSymbol(), randomSymbol(), randomSymbol()];
	const reels = [randomSymbol(), randomSymbol(), randomSymbol()];

	await responder.send(frame(reels, '🎲 Berputar...'));

	const FAST_TICKS = 8;
	const TICK_MS = 180;

	for (let tick = 0; tick < FAST_TICKS; tick++) {
		await sleep(TICK_MS);
		reels[0] = randomSymbol();
		reels[1] = randomSymbol();
		reels[2] = randomSymbol();
		await responder.edit(frame(reels, '🎲 Berputar' + '.'.repeat((tick % 3) + 1)));
	}

	reels[0] = finalReels[0];
	await sleep(TICK_MS + 100);
	reels[1] = randomSymbol();
	reels[2] = randomSymbol();
	await responder.edit(frame(reels, '🛑 Reel 1 berhenti...'));

	reels[1] = finalReels[1];
	await sleep(TICK_MS + 150);
	reels[2] = randomSymbol();
	await responder.edit(frame(reels, '🛑 Reel 2 berhenti...'));

	reels[2] = finalReels[2];
	await sleep(TICK_MS + 200);

	// ===== HASIL AKHIR =====
	let winnings;
	let resultText;

	if (reels[0] === reels[1] && reels[1] === reels[2]) {
		winnings = bet * PAYOUT[reels[0]];
		resultText = `🎉 JACKPOT 3 simbol sama! Menang **${formatRupiah(winnings)}**!`;
	} else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
		winnings = Math.floor(bet * 1.5);
		resultText = `✨ 2 simbol sama! Menang **${formatRupiah(winnings)}**!`;
	} else {
		winnings = -bet;
		resultText = `💸 Tidak ada yang cocok. Kalah **${formatRupiah(bet)}**.`;
	}

	const newBalance = addBalance(guildId, userId, winnings);
	await responder.edit(`${frame(reels, resultText)}\nSaldo sekarang: **${formatRupiah(newBalance)}**`);
}

module.exports = { playSlots, MAX_BET, SYMBOLS, PAYOUT };
