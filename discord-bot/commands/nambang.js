const { SlashCommandBuilder } = require('discord.js');
const { runGrind } = require('../utils/grindGames');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('nambang')
		.setDescription('Kerja sampingan: nambang di gua buat dapat Rp (cooldown paling lama, reward paling gede)'),

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
		await runGrind('nambang', guild.id, user.id, responder);
	},
};
