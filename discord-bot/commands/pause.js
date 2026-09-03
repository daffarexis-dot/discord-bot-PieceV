const { SlashCommandBuilder } = require('discord.js');
const { getState } = require('../utils/musicQueue');

module.exports = {
	data: new SlashCommandBuilder().setName('pause').setDescription('Jeda audio yang sedang diputar'),
	async execute(interaction) {
		const state = getState(interaction.guild.id);
		if (!state || !state.nowPlaying) {
			await interaction.reply({ content: 'Tidak ada yang lagi diputar.', ephemeral: true });
			return;
		}
		state.player.pause();
		await interaction.reply('⏸️ Dijeda.');
	},
};
