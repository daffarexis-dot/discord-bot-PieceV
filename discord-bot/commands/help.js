const { SlashCommandBuilder } = require('discord.js');
const { buildHelpEmbed } = require('../utils/helpEmbed');
const { formatRupiah } = require('../utils/economy');
const { MAX_BET: SLOTS_MAX_BET } = require('../utils/slotsEngine');
const { isOwner } = require('../utils/owner');

module.exports = {
	data: new SlashCommandBuilder().setName('help').setDescription('Lihat semua command yang tersedia'),

	async execute(interaction) {
		// Import di sini (bukan di top-level) buat jaga-jaga circular require sama utils/prefixRouter.js
		const { ALIASES, PREFIX } = require('../utils/prefixRouter');

		const embed = buildHelpEmbed({
			prefix: PREFIX,
			aliases: ALIASES,
			slotsMaxBet: SLOTS_MAX_BET,
			formatRupiah,
			isOwnerUser: isOwner(interaction.user.id),
		});

		await interaction.reply({ embeds: [embed] });
	},
};
