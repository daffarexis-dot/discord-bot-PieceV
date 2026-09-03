const { SlashCommandBuilder } = require('discord.js');
const { addBalance, setCooldown, getCooldownRemaining } = require('../utils/economy');

const COOLDOWN_MS = 30 * 60 * 1000; // 30 menit

const JOBS = [
	'jadi kurir paket',
	'nge-guide turis',
	'bantuin tetangga pindahan',
	'jualan es teh',
	'nge-freelance desain',
	'jagain warung',
];

function formatDuration(ms) {
	const m = Math.floor(ms / 60000);
	const s = Math.floor((ms % 60000) / 1000);
	return `${m}m ${s}d`;
}

module.exports = {
	data: new SlashCommandBuilder().setName('work').setDescription('Kerja buat dapat koin'),

	async execute(interaction) {
		const { guild, user } = interaction;
		const remaining = getCooldownRemaining(guild.id, user.id, 'lastWork', COOLDOWN_MS);
		if (remaining > 0) {
			await interaction.reply({
				content: `Capek dulu, istirahat. Coba lagi dalam ${formatDuration(remaining)}.`,
				ephemeral: true,
			});
			return;
		}
		const job = JOBS[Math.floor(Math.random() * JOBS.length)];
		const amount = Math.floor(Math.random() * 101) + 50; // 50-150
		setCooldown(guild.id, user.id, 'lastWork');
		const newBalance = addBalance(guild.id, user.id, amount);
		await interaction.reply(`💼 Kamu ${job} dan dapat **${amount}** koin! Saldo sekarang: **${newBalance}**`);
	},
};
