require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
	const command = require(path.join(commandsPath, file));
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log(`Bot online sebagai ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (err) {
		console.error(err);
		const errReply = { content: 'Terjadi error saat menjalankan command ini.', ephemeral: true };
		if (interaction.deferred || interaction.replied) {
			await interaction.editReply(errReply);
		} else {
			await interaction.reply(errReply);
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
