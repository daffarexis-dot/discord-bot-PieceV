const { SlashCommandBuilder } = require('discord.js');
const { getBalance } = require('../utils/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Cek saldo koin kamu (atau orang lain)')
		.addUserOption((opt) => opt.setName('user').setDescription('Cek saldo user lain').setRequired(false)),

	async execute(interaction) {
		const target = interaction.options.getUser('user') || interaction.user;
		const balance = getBalance(interaction.guild.id, target.id);
		await interaction.reply(`💰 Saldo **${target.username}**: **${balance}** koin`);
	},
};
