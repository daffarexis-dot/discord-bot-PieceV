const { SlashCommandBuilder } = require('discord.js');
const { getState, playNext } = require('../utils/musicQueue');

module.exports = {
	data: new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu yang sedang diputar'),
	async execute(interaction) {
		const state = getState(interaction.guild.id);
		if (!state || !state.nowPlaying) {
			await interaction.reply({ content: 'Tidak ada yang lagi diputar.', ephemeral: true });
			return;
		}
		state.player.stop(); // memicu event Idle -> lanjut ke lagu berikutnya otomatis
		await interaction.reply('⏭️ Lagu di-skip.');
	},
};
