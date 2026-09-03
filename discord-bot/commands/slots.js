const { SlashCommandBuilder } = require('discord.js');
const { getBalance, addBalance, formatRupiah } = require('../utils/economy');

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const PAYOUT = { '7️⃣': 20, '💎': 10, '🔔': 6, '🍇': 4, '🍋': 3, '🍒': 2 };

function spin() {
	return [0, 0, 0].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

function frame(reels, statusText) {
	return `🎰 [ ${reels.join(' | ')} ]\n${statusText}`;
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
		// edit pesan berkali-kali menampilkan reel acak, baru berhenti di hasil akhir.
		await interaction.reply(frame(spin(), '🎲 Berputar...'));
		const spinFrames = 5;
		for (let i = 0; i < spinFrames; i++) {
			await new Promise((r) => setTimeout(r, 450));
			await interaction.editReply(frame(spin(), '🎲 Berputar' + '.'.repeat((i % 3) + 1)));
		}
		await new Promise((r) => setTimeout(r, 450));

		// ===== HASIL AKHIR =====
		const reels = spin();
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
