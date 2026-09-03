const { SlashCommandBuilder } = require('discord.js');
const { claimDaily, formatRupiah } = require('../utils/economy');

function formatDuration(ms) {
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	return `${h}j ${m}m`;
}

module.exports = {
	data: new SlashCommandBuilder().setName('daily').setDescription('Klaim Rp harian (naik kelipatan tiap 7 hari streak)'),

	async execute(interaction) {
		const { guild, user } = interaction;
		const result = claimDaily(guild.id, user.id);

		if (result.onCooldown) {
			await interaction.reply({
				content: `Kamu sudah klaim daily. Coba lagi dalam ${formatDuration(result.remaining)}.`,
				ephemeral: true,
			});
			return;
		}

		const weekLabel = result.multiplier > 1 ? ` (kelipatan x${result.multiplier} — streak minggu ke-${Math.floor((result.streak - 1) / 7) + 1})` : '';

		await interaction.reply(
			`🎁 Kamu klaim daily: **${formatRupiah(result.amount)}**${weekLabel}\n` +
				`🔥 Streak: **${result.streak} hari** berturut-turut\n` +
				`💰 Saldo sekarang: **${formatRupiah(result.newBalance)}**\n\n` +
				`_Klaim lagi besok (jangan sampai lewat 48 jam) biar streak-nya tidak reset!_`
		);
	},
};
