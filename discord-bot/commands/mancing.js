const { SlashCommandBuilder } = require('discord.js');
const { addBalance, setCooldown, getCooldownRemaining, formatRupiah } = require('../utils/economy');

const COOLDOWN_MS = 45 * 60 * 1000; // 45 menit — beda ritme dari /work (30 menit) biar bisa diselang-seling
const FAIL_CHANCE = 0.15; // 15% kemungkinan gagal, biar ada resiko

const CATCHES = [
	{ name: 'ikan mas', min: 15000, max: 40000 },
	{ name: 'ikan lele', min: 15000, max: 35000 },
	{ name: 'ikan tuna', min: 30000, max: 60000 },
	{ name: 'gurita', min: 25000, max: 55000 },
	{ name: 'harta karun kecil di dasar sungai', min: 40000, max: 70000 },
];

function formatDuration(ms) {
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	if (h > 0) return `${h}j ${m}m`;
	const s = Math.floor((ms % 60000) / 1000);
	return `${m}m ${s}d`;
}

module.exports = {
	data: new SlashCommandBuilder().setName('mancing').setDescription('Kerja sampingan: mancing buat dapat Rp tambahan (terpisah cooldown dari /work)'),

	async execute(interaction) {
		const { guild, user } = interaction;
		const remaining = getCooldownRemaining(guild.id, user.id, 'lastMancing', COOLDOWN_MS);
		if (remaining > 0) {
			await interaction.reply({
				content: `Pancingannya belum siap lagi. Coba lagi dalam ${formatDuration(remaining)}.`,
				ephemeral: true,
			});
			return;
		}

		if (Math.random() < FAIL_CHANCE) {
			setCooldown(guild.id, user.id, 'lastMancing');
			await interaction.reply('🎣 Sayang sekali, umpannya diambil tapi kamu tidak dapat apa-apa. Coba lagi nanti!');
			return;
		}

		const catchItem = CATCHES[Math.floor(Math.random() * CATCHES.length)];
		const amount = Math.floor(Math.random() * (catchItem.max - catchItem.min + 1)) + catchItem.min;

		setCooldown(guild.id, user.id, 'lastMancing');
		const newBalance = addBalance(guild.id, user.id, amount);
		await interaction.reply(
			`🎣 Kamu mancing dan dapat **${catchItem.name}**, laku **${formatRupiah(amount)}**! Saldo sekarang: **${formatRupiah(newBalance)}**`
		);
	},
};
