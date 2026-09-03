const { SlashCommandBuilder } = require('discord.js');
const { upscaleImage } = require('../utils/replicate');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('upscale')
		.setDescription('Perbesar & pertajam kualitas foto (AI upscale)')
		.addAttachmentOption((opt) =>
			opt.setName('image').setDescription('Foto yang mau di-upscale').setRequired(true)
		),

	async execute(interaction) {
		const image = interaction.options.getAttachment('image');

		if (!image.contentType || !image.contentType.startsWith('image/')) {
			await interaction.reply({ content: 'File yang diupload harus berupa gambar.', ephemeral: true });
			return;
		}

		await interaction.deferReply();

		try {
			const resultUrl = await upscaleImage(image.url);
			await interaction.editReply({
				content: '✨ Selesai di-upscale:',
				files: [resultUrl],
			});
		} catch (err) {
			await interaction.editReply(`Gagal upscale: ${err.message}`);
		}
	},
};
