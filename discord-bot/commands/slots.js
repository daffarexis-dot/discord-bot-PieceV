const { SlashCommandBuilder } = require('discord.js');
const { getBalance, addBalance, formatRupiah } = require('../utils/economy');

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const PAYOUT = { '7️⃣': 20, '💎': 10, '🔔': 6, '🍇': 4, '🍋': 3, '🍒': 2 };

function randomSymbol() {
	return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function spin() {
	return [0, 0, 0].map(randomSymbol);
}

function frame(reels, statusText) {
	return `🎰 [ ${reels.join(' | ')} ]\n${statusText}`;
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('Main slot machine')
		.addIntegerOption((opt) => opt.setName('bet').setDescription('Jumlah taruhan (Rp)').setRequired(true).setMinValue(1)),

	async execute(interaction) {
		const bet = interaction.options.getInteger('bet');
		const { guild, user } = interaction;

		const balance = getBalance(guild.id, user.id);
		if (bet > balance) {
			await interaction.reply({
				content: `Saldo kamu cuma **${formatRupiah(balance)}**, tidak cukup untuk taruhan **${formatRupiah(bet)}**.`,
				ephemeral: true,
			});
			return;
		}

		// ===== ANIMASI SPIN =====
		// Discord tidak bisa render GIF dinamis, jadi animasinya dibuat dengan
		// edit pesan berkali-kali. Supaya kelihatan lebih "bergerak" kayak mesin
		// slot beneran, reel-nya berhenti satu-satu (kiri → tengah → kanan)
		// dengan kecepatan spin yang cepat di awal.
		const finalReels = spin();
		const reels = [randomSymbol(), randomSymbol(), randomSymbol()];

		await interaction.reply(frame(reels, '🎲 Berputar...'));

		const FAST_TICKS = 8;
		const TICK_MS = 180;

		for (let tick = 0; tick < FAST_TICKS; tick++) {
			await sleep(TICK_MS);
			reels[0] = randomSymbol();
			reels[1] = randomSymbol();
			reels[2] = randomSymbol();
			await interaction.editReply(frame(reels, '🎲 Berputar' + '.'.repeat((tick % 3) + 1)));
		}

		// Reel 1 berhenti
		reels[0] = finalReels[0];
		await sleep(TICK_MS + 100);
		reels[1] = randomSymbol();
		reels[2] = randomSymbol();
		await interaction.editReply(frame(reels, '🛑 Reel 1 berhenti...'));

		// Reel 2 berhenti
		reels[1] = finalReels[1];
		await sleep(TICK_MS + 150);
		reels[2] = randomSymbol();
		await interaction.editReply(frame(reels, '🛑 Reel 2 berhenti...'));

		// Reel 3 berhenti (hasil akhir)
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

		const newBalance = addBalance(guild.id, user.id, winnings);
		await interaction.editReply(`${frame(reels, resultText)}\nSaldo sekarang: **${formatRupiah(newBalance)}**`);
	},
};
