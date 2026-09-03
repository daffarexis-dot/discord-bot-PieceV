const { SlashCommandBuilder } = require('discord.js');
const { runGrind } = require('../utils/grindGames');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('berburu')
		.setDescription('Kerja sampingan: berburu di hutan buat dapat Rp (cooldown terpisah dari /work & /mancing)'),

	async execute(interaction) {
		const { guild, user } = interaction;
		const responder = {
			async send(content, isError = false) {
				await interaction.reply(isError ? { content, ephemeral: true } : content);
			},
			async edit(content) {
				await interaction.editReply(content);
			},
		};
		await runGrind('berburu', guild.id, user.id, responder);
	},
};
