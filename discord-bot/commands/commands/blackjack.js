const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBalance, addBalance } = require('../utils/economy');

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

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
	return hand.map((c) => `${c.rank}${c.suit}`).join(' ');
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
				content: `Saldo kamu cuma **${balance}** koin, tidak cukup untuk taruhan **${bet}**.`,
				ephemeral: true,
			});
			return;
		}

		const playerHand = [drawCard(), drawCard()];
		const dealerHand = [drawCard(), drawCard()];

		const buildRow = (disabled = false) =>
			new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Primary).setDisabled(disabled),
				new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
			);

		const renderState = (reveal = false) => {
			const playerTotal = handValue(playerHand);
			const dealerShown = reveal
				? `${formatHand(dealerHand)} (${handValue(dealerHand)})`
				: `${dealerHand[0].rank}${dealerHand[0].suit} ❓`;
			return `🂡 **Blackjack** — taruhan **${bet}** koin\n\nDealer: ${dealerShown}\nKamu: ${formatHand(playerHand)} (${playerTotal})`;
		};

		const message = await interaction.reply({ content: renderState(), components: [buildRow()], fetchReply: true });
		const collector = message.createMessageComponentCollector({ time: 60_000 });

		const finish = async (resultText, delta) => {
			const newBalance = addBalance(guild.id, user.id, delta);
			await interaction.editReply({
				content: `${renderState(true)}\n\n${resultText}\nSaldo sekarang: **${newBalance}**`,
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
				playerHand.push(drawCard());
				const total = handValue(playerHand);
				if (total > 21) {
					await btn.update({ content: renderState(), components: [buildRow(true)] });
					await finish('💥 Bust! Kamu kalah.', -bet);
					return;
				}
				await btn.update({ content: renderState(), components: [buildRow()] });
			} else if (btn.customId === 'bj_stand') {
				while (handValue(dealerHand) < 17) {
					dealerHand.push(drawCard());
				}
				const playerTotal = handValue(playerHand);
				const dealerTotal = handValue(dealerHand);

				await btn.deferUpdate();

				if (dealerTotal > 21 || playerTotal > dealerTotal) {
					await finish('🎉 Kamu menang!', bet);
				} else if (playerTotal === dealerTotal) {
					await finish('🤝 Seri, taruhan dikembalikan.', 0);
				} else {
					await finish('💸 Kamu kalah.', -bet);
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
