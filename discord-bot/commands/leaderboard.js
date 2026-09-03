const { SlashCommandBuilder } = require('discord.js');
const { getLeaderboard, getStreak, getStreakBadge, formatRupiah } = require('../utils/economy');

module.exports = {
	data: new SlashCommandBuilder().setName('leaderboard').setDescription('Lihat 10 saldo Rp terbanyak di server ini'),

	async execute(interaction) {
		const top = getLeaderboard(interaction.guild.id, 10);
		if (top.length === 0) {
			await interaction.reply('Belum ada data ekonomi di server ini.');
			return;
		}

		const lines = await Promise.all(
			top.map(async (entry, i) => {
				const member = await interaction.guild.members.fetch(entry.userId).catch(() => null);
				const name = member ? member.user.username : `Unknown (${entry.userId})`;
				const badge = getStreakBadge(getStreak(interaction.guild.id, entry.userId));
				const badgeTag = badge ? ` ${badge.emoji}` : '';
				return `${i + 1}. **${name}**${badgeTag} — ${formatRupiah(entry.balance)}`;
			})
		);

		await interaction.reply(`🏆 **Leaderboard Rp**\n${lines.join('\n')}\n\n_Badge: 🔥3+ hari ⚡7+ 🌟14+ 👑30+ 💎60+ streak harian_`);
	},
};
