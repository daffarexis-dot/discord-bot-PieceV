require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { bumpMessageStreak } = require('./utils/economy');
const { handleMessage: handlePrefixCommand } = require('./utils/prefixRouter');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent, // wajib buat baca isi pesan (command prefix "p...")
	],
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

// Streak badge: cukup kirim pesan apa aja di server (channel manapun) tiap hari
// buat naikin streak. Tidak perlu command khusus.
client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	if (!message.guild) return; // abaikan DM

	try {
		const result = bumpMessageStreak(message.guild.id, message.author.id);
		if (result && result.badgeChanged) {
			await message.channel.send(
				`🏅 Selamat **${message.author.username}**! Streak ngobrol kamu udah **${result.streak} hari** berturut-turut — dapat badge baru: **${result.badge.emoji} ${result.badge.name}**!`
			);
		}
	} catch (err) {
		console.error('[MessageStreak] Error:', err);
	}

	// Command cepat pakai prefix, mis. "pslot 20000" atau "ps 20k"
	await handlePrefixCommand(message);
});

client.login(process.env.DISCORD_TOKEN);
