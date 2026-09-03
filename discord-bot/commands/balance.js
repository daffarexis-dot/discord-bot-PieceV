const { SlashCommandBuilder } = require('discord.js');
const { getBalance, getStreak, getStreakBadge, formatRupiah } = require('../utils/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Cek saldo Rp kamu (atau orang lain)')
		.addUserOption((opt) => opt.setName('user').setDescription('Cek saldo user lain').setRequired(false)),

	async execute(interaction) {
		const target = interaction.options.getUser('user') || interaction.user;
		const balance = getBalance(interaction.guild.id, target.id);
		const streak = getStreak(interaction.guild.id, target.id);
		const badge = getStreakBadge(streak);
		const badgeTag = badge ? ` ${badge.emoji}` : '';

		let reply = `💰 Saldo **${target.username}**${badgeTag}: **${formatRupiah(balance)}**`;
		if (badge) {
			reply += `\n${badge.emoji} Badge: **${badge.name}** (streak ${streak} hari)`;
		}
		await interaction.reply(reply);
	},
};
