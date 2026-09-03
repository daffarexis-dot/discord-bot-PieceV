const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addBalance, formatRupiah } = require('../utils/economy');

// Owner bot: isi OWNER_IDS di .env (boleh lebih dari satu, pisah pakai koma).
// Admin server: siapapun yang punya izin Administrator di server itu otomatis boleh pakai.
function isAuthorized(interaction) {
	const ownerIds = (process.env.OWNER_IDS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	if (ownerIds.includes(interaction.user.id)) return true;
	if (interaction.member && interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
	return false;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addmoney')
		.setDescription('[Admin/Owner] Kasih (atau kurangi) saldo Rp user secara gratis')
		.addUserOption((opt) => opt.setName('user').setDescription('User yang mau ditambah/kurangi saldonya').setRequired(true))
		.addIntegerOption((opt) =>
			opt.setName('jumlah').setDescription('Jumlah Rp (boleh minus buat kurangi saldo)').setRequired(true)
		),

	async execute(interaction) {
		if (!isAuthorized(interaction)) {
			await interaction.reply({ content: '⛔ Cuma admin server atau owner bot yang bisa pakai command ini.', ephemeral: true });
			return;
		}

		const target = interaction.options.getUser('user');
		const amount = interaction.options.getInteger('jumlah');

		if (target.bot) {
			await interaction.reply({ content: 'Tidak bisa kasih Rp ke bot.', ephemeral: true });
			return;
		}
		if (amount === 0) {
			await interaction.reply({ content: 'Jumlahnya jangan 0 dong.', ephemeral: true });
			return;
		}

		const newBalance = addBalance(interaction.guild.id, target.id, amount);
		const verb = amount > 0 ? 'Nambah' : 'Ngurangin';

		await interaction.reply(
			`🛠️ ${verb} saldo **${target.username}** sebesar **${formatRupiah(Math.abs(amount))}**. Saldo mereka sekarang: **${formatRupiah(newBalance)}**`
		);
	},
};
