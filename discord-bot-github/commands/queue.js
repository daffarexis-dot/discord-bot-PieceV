const { SlashCommandBuilder } = require('discord.js');
const { getState } = require('../utils/musicQueue');

module.exports = {
	data: new SlashCommandBuilder().setName('queue').setDescription('Lihat antrian lagu saat ini'),
	async execute(interaction) {
		const state = getState(interaction.guild.id);
		if (!state || (!state.nowPlaying && state.queue.length === 0)) {
			await interaction.reply({ content: 'Antrian kosong.', ephemeral: true });
			return;
		}

		let msg = '';
		if (state.nowPlaying) msg += `▶️ Sedang diputar: **${state.nowPlaying.title}**\n\n`;
		if (state.queue.length > 0) {
			msg += state.queue.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
		} else {
			msg += '_(antrian berikutnya kosong)_';
		}

		await interaction.reply(msg);
	},
};
