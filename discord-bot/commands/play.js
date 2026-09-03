const { SlashCommandBuilder } = require('discord.js');
const { addToQueue } = require('../utils/musicQueue');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Putar audio dari link langsung atau file yang diupload')
		.addStringOption((opt) =>
			opt.setName('url').setDescription('Link langsung ke file audio (mp3/wav/ogg)').setRequired(false)
		)
		.addAttachmentOption((opt) =>
			opt.setName('file').setDescription('Upload file audio langsung').setRequired(false)
		),

	async execute(interaction) {
		const urlOption = interaction.options.getString('url');
		const fileOption = interaction.options.getAttachment('file');

		const source = fileOption ? fileOption.url : urlOption;
		const title = fileOption ? fileOption.name : urlOption;

		if (!source) {
			await interaction.reply({
				content: 'Kasih link audio langsung (`url`) atau upload file (`file`) dulu ya.',
				ephemeral: true,
			});
			return;
		}

		await interaction.deferReply();

		try {
			const state = await addToQueue(interaction, {
				title,
				url: source,
				requestedBy: interaction.user.username,
			});

			const position = state.queue.length + (state.nowPlaying ? 1 : 0);
			await interaction.editReply(
				position <= 1
					? `▶️ Memutar: **${title}**`
					: `➕ Ditambahkan ke antrian (posisi ${position}): **${title}**`
			);
		} catch (err) {
			await interaction.editReply(`Gagal muter audio: ${err.message}`);
		}
	},
};
