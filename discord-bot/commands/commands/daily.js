const { SlashCommandBuilder } = require('discord.js');
const { addBalance, setCooldown, getCooldownRemaining } = require('../utils/economy');

const COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 jam

function formatDuration(ms) {
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	return `${h}j ${m}m`;
}

module.exports = {
	data: new SlashCommandBuilder().setName('daily').setDescription('Klaim koin harian'),

	async execute(interaction) {
		const { guild, user } = interaction;
		const remaining = getCooldownRemaining(guild.id, user.id, 'lastDaily', COOLDOWN_MS);
		if (remaining > 0) {
			await interaction.reply({
				content: `Kamu sudah klaim daily. Coba lagi dalam ${formatDuration(remaining)}.`,
				ephemeral: true,
			});
			return;
		}
		const amount = Math.floor(Math.random() * 201) + 100; // 100-300
		setCooldown(guild.id, user.id, 'lastDaily');
		const newBalance = addBalance(guild.id, user.id, amount);
		await interaction.reply(`🎁 Kamu dapat **${amount}** koin! Saldo sekarang: **${newBalance}**`);
	},
};
