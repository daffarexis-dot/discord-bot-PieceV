const { SlashCommandBuilder } = require('discord.js');
const { claimDaily, formatRupiah, getStreakBadge } = require('../utils/economy');

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

		const badge = getStreakBadge(result.streak);
		const prevBadge = getStreakBadge(result.streak - 1);
		const badgeLine = badge ? `${badge.emoji} Badge: **${badge.name}**\n` : '';
		const newBadgeAlert = badge && badge.name !== (prevBadge && prevBadge.name)
			? `\n🏅 **Badge baru terbuka!** Kamu sekarang punya **${badge.emoji} ${badge.name}**!\n`
			: '';

		await interaction.reply(
			`🎁 Kamu klaim daily: **${formatRupiah(result.amount)}**${weekLabel}\n` +
				`🔥 Streak: **${result.streak} hari** berturut-turut\n` +
				badgeLine +
				`💰 Saldo sekarang: **${formatRupiah(result.newBalance)}**\n` +
				newBadgeAlert +
				`\n_Klaim lagi besok (jangan sampai lewat 48 jam) biar streak-nya tidak reset!_`
		);
	},
};
