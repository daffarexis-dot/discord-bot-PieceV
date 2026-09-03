const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getBalance, addBalance, formatRupiah } = require('../utils/economy');

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const COLOR_PLAY = 0x2b2d31;
const COLOR_WIN = 0x57f287;
const COLOR_LOSE = 0xed4245;
const COLOR_PUSH = 0xfee75c;

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function drawCard() {
	const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
	const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
	return { rank, suit };
}

function cardValue(card) {
	if (card.rank === 'A') return 11;
	if (['J', 'Q', 'K'].includes(card.rank)) return 10;
	return parseInt(card.rank, 10);
}

function handValue(hand) {
	let total = hand.reduce((sum, c) => sum + cardValue(c), 0);
	let aces = hand.filter((c) => c.rank === 'A').length;
	while (total > 21 && aces > 0) {
		total -= 10;
		aces--;
	}
	return total;
}

function formatHand(hand) {
	return hand.map((c) => `\`${c.rank}${c.suit}\``).join(' ');
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription('Main Blackjack lawan bot')
		.addIntegerOption((opt) => opt.setName('bet').setDescription('Jumlah taruhan').setRequired(true).setMinValue(1)),

	async execute(interaction) {
		const bet = interaction.options.getInteger('bet');
		const { guild, user } = interaction;

		const balance = getBalance(guild.id, user.id);
		if (bet > balance) {
			await interaction.reply({
				content: `Saldo kamu cuma **${formatRupiah(balance)}**, tidak cukup untuk taruhan **${formatRupiah(bet)}**.`,
				ephemeral: true,
			});
			return;
		}

		const playerHand = [];
		const dealerHand = [];

		const buildRow = (disabled = false) =>
			new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary).setDisabled(disabled),
				new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
			);

		const renderEmbed = (reveal = false, statusText = null, color = COLOR_PLAY) => {
			const playerTotal = handValue(playerHand);
			const dealerShown =
				reveal || dealerHand.length !== 2
					? `${formatHand(dealerHand)} (${handValue(dealerHand)})`
					: `${formatHand([dealerHand[0]])} 🎴`;
			const embed = new EmbedBuilder()
				.setColor(color)
				.setTitle('🂡 Blackjack')
				.setDescription(
					`Dealer: ${dealerShown}\nKamu: ${playerHand.length ? `${formatHand(playerHand)} (${playerTotal})` : '...'}` +
						(statusText ? `\n\n${statusText}` : '')
				)
				.setFooter({ text: `Taruhan ${formatRupiah(bet)}` });
			return embed;
		};

		// ===== Bagikan kartu satu-satu (dealer - player - dealer - player) biar berasa kayak beneran dibagiin =====
		const message = await interaction.reply({
			embeds: [renderEmbed(false, '🃏 Membagikan kartu...')],
			components: [buildRow(true)],
			fetchReply: true,
		});

		const dealSequence = [
			() => dealerHand.push(drawCard()),
			() => playerHand.push(drawCard()),
			() => dealerHand.push(drawCard()),
			() => playerHand.push(drawCard()),
		];
		for (const dealStep of dealSequence) {
			await sleep(400);
			dealStep();
			await interaction.editReply({ embeds: [renderEmbed(false, '🃏 Membagikan kartu...')], components: [buildRow(true)] });
		}
		await sleep(300);
		await interaction.editReply({ embeds: [renderEmbed()], components: [buildRow()] });

		const collector = message.createMessageComponentCollector({ time: 60_000 });

		const finish = async (resultText, delta, color) => {
			const newBalance = addBalance(guild.id, user.id, delta);
			// Dealer flip kartu tersembunyinya dengan jeda sendiri sebelum hasil ditampilkan, biar dramatis.
			await interaction.editReply({ embeds: [renderEmbed(true, '🎴 Dealer membuka kartu...')], components: [buildRow(true)] });
			await sleep(650);
			await interaction.editReply({
				embeds: [renderEmbed(true, `${resultText}\nSaldo sekarang: **${formatRupiah(newBalance)}**`, color)],
				components: [buildRow(true)],
			});
			collector.stop();
		};

		collector.on('collect', async (btn) => {
			if (btn.user.id !== user.id) {
				await btn.reply({ content: 'Ini bukan permainan kamu.', ephemeral: true });
				return;
			}

			if (btn.customId === 'bj_hit') {
				await btn.update({ embeds: [renderEmbed(false, '🃏 Kamu ambil kartu...')], components: [buildRow(true)] });
				await sleep(450);
				playerHand.push(drawCard());
				const total = handValue(playerHand);
				if (total > 21) {
					await interaction.editReply({ embeds: [renderEmbed()], components: [buildRow(true)] });
					await finish('💥 Bust! Kamu kalah.', -bet, COLOR_LOSE);
					return;
				}
				await interaction.editReply({ embeds: [renderEmbed()], components: [buildRow()] });
			} else if (btn.customId === 'bj_stand') {
				await btn.update({ embeds: [renderEmbed(true, '🎴 Dealer mengambil giliran...')], components: [buildRow(true)] });

				while (handValue(dealerHand) < 17) {
					await sleep(550);
					dealerHand.push(drawCard());
					await interaction.editReply({ embeds: [renderEmbed(true, '🎴 Dealer mengambil kartu...')], components: [buildRow(true)] });
				}
				await sleep(400);

				const playerTotal = handValue(playerHand);
				const dealerTotal = handValue(dealerHand);

				if (dealerTotal > 21 || playerTotal > dealerTotal) {
					await finish('🎉 Kamu menang!', bet, COLOR_WIN);
				} else if (playerTotal === dealerTotal) {
					await finish('🤝 Seri, taruhan dikembalikan.', 0, COLOR_PUSH);
				} else {
					await finish('💸 Kamu kalah.', -bet, COLOR_LOSE);
				}
			}
		});

		collector.on('end', async (_collected, reason) => {
			if (reason === 'time') {
				await interaction.editReply({ components: [buildRow(true)] }).catch(() => {});
			}
		});
	},
};
