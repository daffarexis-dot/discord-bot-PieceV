const { SlashCommandBuilder } = require('discord.js');
const { playSlots, MAX_BET } = require('../utils/slotsEngine');
const { formatRupiah } = require('../utils/economy');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription(`Main slot machine (maks taruhan ${formatRupiah(MAX_BET)})`)
		.addIntegerOption((opt) =>
			opt.setName('bet').setDescription('Jumlah taruhan (Rp)').setRequired(true).setMinValue(1).setMaxValue(MAX_BET)
		),

	async execute(interaction) {
		const bet = interaction.options.getInteger('bet');
		const { guild, user } = interaction;

		const responder = {
			async send(content, isError = false) {
				await interaction.reply(isError ? { content, ephemeral: true } : content);
			},
			async edit(content) {
				await interaction.editReply(content);
			},
		};

		await playSlots(guild.id, user.id, bet, responder);
	},
};
