const { SlashCommandBuilder } = require('discord.js');
const { stop } = require('../utils/musicQueue');

module.exports = {
	data: new SlashCommandBuilder().setName('stop').setDescription('Berhenti total, kosongkan antrian, keluar dari voice'),
	async execute(interaction) {
		const ok = stop(interaction.guild.id);
		await interaction.reply(ok ? '⏹️ Berhenti & keluar voice channel.' : 'Tidak ada sesi musik aktif.');
	},
};
