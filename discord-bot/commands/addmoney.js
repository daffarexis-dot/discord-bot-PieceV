const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addBalance, formatRupiah } = require('../utils/economy');
const { isOwner } = require('../utils/owner');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addmoney')
		.setDescription('[Khusus Owner] Tambah atau kurangi saldo Rp seorang user')
		.addUserOption((opt) => opt.setName('user').setDescription('User target').setRequired(true))
		.addIntegerOption((opt) =>
			opt.setName('jumlah').setDescription('Jumlah Rp (isi minus buat kurangi, mis. -50000)').setRequired(true)
		),

	async execute(interaction) {
		if (!isOwner(interaction.user.id)) {
			await interaction.reply({ content: '🚫 Command ini khusus owner bot.', ephemeral: true });
			return;
		}

		const target = interaction.options.getUser('user');
		const amount = interaction.options.getInteger('jumlah');
		const { guild } = interaction;

		const newBalance = addBalance(guild.id, target.id, amount);
		const isAdd = amount >= 0;

		const embed = new EmbedBuilder()
			.setColor(isAdd ? 0x57f287 : 0xed4245)
			.setTitle('👑 Owner Add Money')
			.setDescription(
				`${isAdd ? '➕ Menambahkan' : '➖ Mengurangi'} **${formatRupiah(Math.abs(amount))}** ${
					isAdd ? 'ke' : 'dari'
				} saldo **${target.username}**.\n` + `💰 Saldo sekarang: **${formatRupiah(newBalance)}**`
			);

		await interaction.reply({ embeds: [embed] });
	},
};
