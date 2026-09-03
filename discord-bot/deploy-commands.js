require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
	const command = require(path.join(commandsPath, file));
	commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(`Mendaftarkan ${commands.length} slash command...`);
		await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
		console.log('Berhasil! Command muncul di server dalam beberapa menit (bisa sampai 1 jam untuk pertama kali).');
	} catch (err) {
		console.error(err);
	}
})();
