const { SlashCommandBuilder } = require('discord.js');
const { getState } = require('../utils/musicQueue');

module.exports = {
	data: new SlashCommandBuilder().setName('resume').setDescription('Lanjutkan audio yang dijeda'),
	async execute(interaction) {
		const state = getState(interaction.guild.id);
		if (!state) {
			await interaction.reply({ content: 'Tidak ada sesi musik aktif.', ephemeral: true });
			return;
		}
		state.player.unpause();
		await interaction.reply('▶️ Dilanjutkan.');
	},
};
