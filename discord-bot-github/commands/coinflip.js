const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance, addBalance, formatRupiah } = require('../utils/economy');

const COLOR_SPIN = 0x5865f2;
const COLOR_WIN = 0x57f287;
const COLOR_LOSE = 0xed4245;

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function buildEmbed(face, statusText, color, footer) {
	const embed = new EmbedBuilder().setColor(color).setTitle('🪙 Coinflip').setDescription(`# ${face}\n\n${statusText}`);
	if (footer) embed.setFooter({ text: footer });
	return embed;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('Tebak koin: heads atau tails, menang x2')
		.addIntegerOption((opt) => opt.setName('bet').setDescription('Jumlah taruhan (Rp)').setRequired(true).setMinValue(1))
		.addStringOption((opt) =>
			opt
				.setName('pilihan')
				.setDescription('Heads atau Tails')
				.setRequired(true)
				.addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })
		),

	async execute(interaction) {
		const bet = interaction.options.getInteger('bet');
		const choice = interaction.options.getString('pilihan');
		const { guild, user } = interaction;

		const balance = getBalance(guild.id, user.id);
		if (bet > balance) {
			await interaction.reply({
				content: `Saldo kamu cuma **${formatRupiah(balance)}**, tidak cukup untuk taruhan **${formatRupiah(bet)}**.`,
				ephemeral: true,
			});
			return;
		}

		const footer = `Taruhan ${formatRupiah(bet)} — pilihan: ${choice === 'heads' ? 'Heads' : 'Tails'}`;

		await interaction.reply({ embeds: [buildEmbed('🪙', 'Koin dilempar ke udara...', COLOR_SPIN, footer)] });

		// Animasi koin berputar di udara, melambat sebelum mendarat.
		const spinFaces = ['🌀', '🪙', '🌀', '🪙', '🌀', '🪙'];
		const delays = [150, 170, 210, 260, 320, 400];
		for (let i = 0; i < spinFaces.length; i++) {
			await sleep(delays[i]);
			await interaction.editReply({ embeds: [buildEmbed(spinFaces[i], 'Koin masih berputar...', COLOR_SPIN, footer)] });
		}

		await sleep(350);

		const result = Math.random() < 0.5 ? 'heads' : 'tails';
		const win = result === choice;
		const resultFace = result === 'heads' ? '🪙 Heads' : '🪙 Tails';

		// Jeda sejenak begitu koin mendarat sebelum payout ditampilkan, biar ada momen "menahan napas".
		await interaction.editReply({ embeds: [buildEmbed(resultFace, '🤏 Mendarat...', COLOR_SPIN, footer)] });
		await sleep(500);

		const newBalance = addBalance(guild.id, user.id, win ? bet : -bet);
		const resultText = win ? `🎉 Kamu menang! +**${formatRupiah(bet)}**` : `💸 Kamu kalah. -**${formatRupiah(bet)}**`;

		await interaction.editReply({
			embeds: [
				buildEmbed(resultFace, `${resultText}\nSaldo sekarang: **${formatRupiah(newBalance)}**`, win ? COLOR_WIN : COLOR_LOSE, footer),
			],
		});
	},
};
