const { SlashCommandBuilder } = require('discord.js');
const { getBalance, addBalance } = require('../utils/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('Tebak koin: heads atau tails, menang x2')
		.addIntegerOption((opt) => opt.setName('bet').setDescription('Jumlah taruhan').setRequired(true).setMinValue(1))
		.addStringOption((opt) =>
			opt
				.setName('pilihan')
				.setDescription('Heads atau Tails')
				.setRequired(true)
				.addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })
		),

	async execute(interaction) {
		const bet = interaction.options.getInteger('bet');
		const choice = interaction.options.getString('pilihan');
		const { guild, user } = interaction;

		const balance = getBalance(guild.id, user.id);
		if (bet > balance) {
			await interaction.reply({
				content: `Saldo kamu cuma **${balance}** koin, tidak cukup untuk taruhan **${bet}**.`,
				ephemeral: true,
			});
			return;
		}

		const result = Math.random() < 0.5 ? 'heads' : 'tails';
		const win = result === choice;
		const newBalance = addBalance(guild.id, user.id, win ? bet : -bet);

		const resultLabel = result === 'heads' ? '🪙 Heads' : '🪙 Tails';
		await interaction.reply(
			`${resultLabel}\n${win ? `🎉 Kamu menang! +**${bet}** koin` : `💸 Kamu kalah. -**${bet}** koin`}\nSaldo sekarang: **${newBalance}**`
		);
	},
};
