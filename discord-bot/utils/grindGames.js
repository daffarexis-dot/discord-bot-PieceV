const { addBalance, setCooldown, getCooldownRemaining, formatRupiah } = require('./economy');

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function formatDuration(ms) {
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	if (h > 0) return `${h}j ${m}m`;
	const s = Math.floor((ms % 60000) / 1000);
	return `${m}m ${s}d`;
}

// Konfigurasi tiap game grinding: cooldown, chance gagal, animasi step-by-step, dan tabel hasil.
const GRIND_CONFIGS = {
	berburu: {
		cooldownField: 'lastBerburu',
		cooldownMs: 40 * 60 * 1000, // 40 menit — beda ritme dari work/mancing biar bisa diselang-seling
		failChance: 0.2,
		emoji: '🏹',
		title: 'Berburu',
		steps: [
			'🏹 Masuk ke hutan, nyiapin busur...',
			'🌲 Ngendap-endap nyari jejak hewan...',
			'🎯 Ada gerakan di semak-semak...',
		],
		failText: '🏹 Sayangnya buruannya kabur duluan, kamu pulang dengan tangan kosong. Coba lagi nanti!',
		catches: [
			{ name: 'kelinci hutan', min: 20000, max: 45000 },
			{ name: 'rusa kecil', min: 40000, max: 80000 },
			{ name: 'babi hutan', min: 35000, max: 70000 },
			{ name: 'burung merak liar', min: 50000, max: 90000 },
			{ name: 'harta karun peninggalan suku pedalaman', min: 60000, max: 100000 },
		],
	},
	nambang: {
		cooldownField: 'lastNambang',
		cooldownMs: 60 * 60 * 1000, // 60 menit — paling lama, tapi reward paling gede
		failChance: 0.2,
		emoji: '⛏️',
		title: 'Nambang',
		steps: [
			'⛏️ Turun ke terowongan tambang...',
			'💥 Batu-batu mulai longsor dikit, hati-hati...',
			'✨ Ada kilauan di dinding gua...',
		],
		failText: '⛏️ Terowongannya buntu, kamu gak nemu apa-apa hari ini. Coba lagi nanti!',
		catches: [
			{ name: 'batu bara', min: 30000, max: 60000 },
			{ name: 'bijih besi', min: 35000, max: 65000 },
			{ name: 'perak', min: 55000, max: 95000 },
			{ name: 'emas', min: 80000, max: 130000 },
			{ name: 'berlian kecil', min: 100000, max: 160000 },
		],
	},
};

/**
 * Jalanin satu game grinding lengkap (berburu/nambang) dengan animasi multi-step sebelum hasil muncul.
 * `responder` harus punya send(content, isError=false) dan edit(content), sama kayak yang dipakai slots.
 */
async function runGrind(key, guildId, userId, responder) {
	const config = GRIND_CONFIGS[key];
	if (!config) return;

	const remaining = getCooldownRemaining(guildId, userId, config.cooldownField, config.cooldownMs);
	if (remaining > 0) {
		await responder.send(`Belum siap lagi. Coba lagi dalam ${formatDuration(remaining)}.`, true);
		return;
	}

	await responder.send(`${config.emoji} **${config.title}**\n${config.steps[0]}`);
	for (let i = 1; i < config.steps.length; i++) {
		await sleep(550);
		await responder.edit(`${config.emoji} **${config.title}**\n${config.steps[i]}`);
	}
	await sleep(500);

	setCooldown(guildId, userId, config.cooldownField);

	if (Math.random() < config.failChance) {
		await responder.edit(config.failText);
		return;
	}

	const catchItem = config.catches[Math.floor(Math.random() * config.catches.length)];
	const amount = Math.floor(Math.random() * (catchItem.max - catchItem.min + 1)) + catchItem.min;
	const newBalance = addBalance(guildId, userId, amount);

	await responder.edit(
		`${config.emoji} Kamu dapat **${catchItem.name}**, laku **${formatRupiah(amount)}**!\n` +
			`Saldo sekarang: **${formatRupiah(newBalance)}**`
	);
}

module.exports = { runGrind, GRIND_CONFIGS, formatDuration };
