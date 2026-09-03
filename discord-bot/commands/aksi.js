const { SlashCommandBuilder } = require('discord.js');
const { ACTIONS } = require('../utils/actionsData');
const { runAction } = require('../utils/actionRunner');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('aksi')
		.setDescription('Lakuin aksi/roleplay ke user lain (hug, lick, kill, punch, dll)')
		.addStringOption((opt) => {
			opt.setName('tipe').setDescription('Mau aksi apa').setRequired(true);
			for (const [key, action] of Object.entries(ACTIONS)) {
				opt.addChoices({ name: `${action.emoji} ${action.label}`, value: key });
			}
			return opt;
		})
		.addUserOption((opt) => opt.setName('user').setDescription('Target aksinya').setRequired(true)),

	async execute(interaction) {
		const actionKey = interaction.options.getString('tipe');
		const target = interaction.options.getUser('user');
		const { user } = interaction;

		const responder = {
			async send(content, isError = false) {
				await interaction.reply(isError ? { content, ephemeral: true } : content);
			},
			async edit(content) {
				await interaction.editReply(content);
			},
		};

		await runAction(actionKey, user, target, responder);
	},
};
