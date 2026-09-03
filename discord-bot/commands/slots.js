const { SlashCommandBuilder } = require('discord.js');
const { getBalance, addBalance } = require('../utils/economy');

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const PAYOUT = { '7️⃣': 20, '💎': 10, '🔔': 6, '🍇': 4, '🍋': 3, '🍒': 2 };

function spin() {
	return [0, 0, 0].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('Main slot machine')
		.addIntegerOption((opt) => opt.setName('bet').setDescription('Jumlah taruhan').setRequired(true).setMinValue(1)),

	async execute(interaction) {
		const bet = interaction.options.getInteger('bet');
		const { guild, user } = interaction;

		const balance = getBalance(guild.id, user.id);
		if (bet > balance) {
			await interaction.reply({
				content: `Saldo kamu cuma **${balance}** koin, tidak cukup untuk taruhan **${bet}**.`,
				ephemeral: true,
			});
			return;
		}

		const reels = spin();
		let winnings;
		let resultText;

		if (reels[0] === reels[1] && reels[1] === reels[2]) {
			winnings = bet * PAYOUT[reels[0]];
			resultText = `🎉 JACKPOT 3 simbol sama! Menang **${winnings}** koin!`;
		} else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
			winnings = Math.floor(bet * 1.5);
			resultText = `✨ 2 simbol sama! Menang **${winnings}** koin!`;
		} else {
			winnings = -bet;
			resultText = `💸 Tidak ada yang cocok. Kalah **${bet}** koin.`;
		}

		const newBalance = addBalance(guild.id, user.id, winnings);
		await interaction.reply(`🎰 [ ${reels.join(' | ')} ]\n${resultText}\nSaldo sekarang: **${newBalance}**`);
	},
};
