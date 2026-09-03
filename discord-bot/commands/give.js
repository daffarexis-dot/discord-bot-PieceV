const { SlashCommandBuilder } = require('discord.js');
const { getBalance, addBalance, formatRupiah } = require('../utils/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('give')
		.setDescription('Kasih Rp ke user lain')
		.addUserOption((opt) => opt.setName('user').setDescription('Mau kasih ke siapa').setRequired(true))
		.addIntegerOption((opt) => opt.setName('jumlah').setDescription('Jumlah Rp').setRequired(true).setMinValue(1)),

	async execute(interaction) {
		const target = interaction.options.getUser('user');
		const amount = interaction.options.getInteger('jumlah');
		const { guild, user } = interaction;

		if (target.id === user.id) {
			await interaction.reply({ content: 'Tidak bisa kasih Rp ke diri sendiri.', ephemeral: true });
			return;
		}
		if (target.bot) {
			await interaction.reply({ content: 'Tidak bisa kasih Rp ke bot.', ephemeral: true });
			return;
		}

		const balance = getBalance(guild.id, user.id);
		if (amount > balance) {
			await interaction.reply({ content: `Saldo kamu cuma **${formatRupiah(balance)}**.`, ephemeral: true });
			return;
		}

		addBalance(guild.id, user.id, -amount);
		const targetNewBalance = addBalance(guild.id, target.id, amount);

		await interaction.reply(`✅ Kamu kasih **${formatRupiah(amount)}** ke **${target.username}**. Saldo mereka sekarang: **${formatRupiah(targetNewBalance)}**`);
	},
};
