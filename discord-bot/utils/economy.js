const fs = require('fs');
const path = require('path');

// Bisa dioverride lewat env var ECONOMY_DATA_PATH kalau kamu pasang Railway Volume
// supaya data TIDAK hilang tiap redeploy (lihat catatan di README).
const DATA_FILE = process.env.ECONOMY_DATA_PATH || path.join(__dirname, '..', 'economy-data.json');
const STARTING_BALANCE = 0;
const DAILY_BASE_AMOUNT = 100000; // Rp 100.000
const DAILY_COOLDOWN_MS = 20 * 60 * 60 * 1000; // boleh klaim lagi setelah 20 jam
const STREAK_GRACE_MS = 48 * 60 * 60 * 1000; // lewat 48 jam dari klaim terakhir = streak reset ke awal
const MSG_STREAK_MIN_GAP_MS = 12 * 60 * 60 * 1000; // minimal jeda biar 1 hari cuma dihitung 1x nambah streak

function formatRupiah(amount) {
	const sign = amount < 0 ? '-' : '';
	return `${sign}Rp${Math.abs(amount).toLocaleString('id-ID')}`;
}

// Tier badge berdasarkan panjang daily streak (urut dari tertinggi ke terendah)
const STREAK_BADGES = [
	{ min: 60, emoji: '💎', name: 'Streak Dewa' },
	{ min: 30, emoji: '👑', name: 'Streak Legend' },
	{ min: 14, emoji: '🌟', name: 'Streak Master' },
	{ min: 7, emoji: '⚡', name: 'Streak Tangguh' },
	{ min: 3, emoji: '🔥', name: 'Streak Awal' },
];

function getStreakBadge(streak) {
	return STREAK_BADGES.find((b) => streak >= b.min) || null;
}

let data = {};
try {
	if (fs.existsSync(DATA_FILE)) {
		data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
	}
} catch (err) {
	console.error('[Economy] Gagal load data, mulai dari kosong:', err.message);
	data = {};
}

function save() {
	try {
		fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
	} catch (err) {
		console.error('[Economy] Gagal simpan data:', err.message);
	}
}

function key(guildId, userId) {
	return `${guildId}:${userId}`;
}

function getUser(guildId, userId) {
	const k = key(guildId, userId);
	if (!data[k]) {
		data[k] = { balance: STARTING_BALANCE, lastDaily: 0, lastWork: 0, dailyStreak: 0, messageStreak: 0, lastMessageStreakAt: 0 };
		save();
	}
	// Jaga-jaga untuk data lama (dibuat sebelum fitur message streak ada)
	if (user_messageStreakFieldsMissing(data[k])) {
		data[k].messageStreak = data[k].messageStreak || 0;
		data[k].lastMessageStreakAt = data[k].lastMessageStreakAt || 0;
	}
	return data[k];
}

function user_messageStreakFieldsMissing(user) {
	return typeof user.messageStreak === 'undefined' || typeof user.lastMessageStreakAt === 'undefined';
}

function claimDaily(guildId, userId) {
	const user = getUser(guildId, userId);
	const now = Date.now();
	const sinceLast = now - (user.lastDaily || 0);

	if (user.lastDaily && sinceLast < DAILY_COOLDOWN_MS) {
		return { onCooldown: true, remaining: DAILY_COOLDOWN_MS - sinceLast };
	}

	// masih dalam masa "grace" (klaim rutin harian) -> streak lanjut. Kalau kelewat lama, streak reset.
	if (user.lastDaily && sinceLast <= STREAK_GRACE_MS) {
		user.dailyStreak = (user.dailyStreak || 0) + 1;
	} else {
		user.dailyStreak = 1;
	}

	const weeksCompleted = Math.floor((user.dailyStreak - 1) / 7); // tiap genap 7 hari streak, kelipatan naik
	const multiplier = Math.pow(2, weeksCompleted);
	const amount = DAILY_BASE_AMOUNT * multiplier;

	user.balance += amount;
	user.lastDaily = now;
	save();

	return { onCooldown: false, amount, streak: user.dailyStreak, multiplier, newBalance: user.balance };
}

function getBalance(guildId, userId) {
	return getUser(guildId, userId).balance;
}

function getStreak(guildId, userId) {
	return getUser(guildId, userId).dailyStreak || 0;
}

function getMessageStreak(guildId, userId) {
	return getUser(guildId, userId).messageStreak || 0;
}

// Dipanggil tiap ada pesan baru dari user di server manapun (lihat index.js).
// Streak badge naik otomatis kalau user aktif kirim pesan tiap hari.
// - Pesan lain di hari yang sama (< 12 jam sejak hitungan terakhir) -> tidak ngaruh, cuma return null.
// - Kalau jeda 12–48 jam sejak hitungan terakhir -> streak +1 (hari berikutnya, tepat waktu).
// - Kalau jeda > 48 jam -> streak reset ke 1 (kelamaan absen ngobrol).
function bumpMessageStreak(guildId, userId) {
	const user = getUser(guildId, userId);
	const now = Date.now();
	const sinceLast = now - (user.lastMessageStreakAt || 0);

	if (user.lastMessageStreakAt && sinceLast < MSG_STREAK_MIN_GAP_MS) {
		return null; // sudah dihitung hari ini, jangan dobel
	}

	const prevStreak = user.messageStreak || 0;
	const prevBadge = getStreakBadge(prevStreak);

	if (user.lastMessageStreakAt && sinceLast <= STREAK_GRACE_MS) {
		user.messageStreak = prevStreak + 1;
	} else {
		user.messageStreak = 1;
	}
	user.lastMessageStreakAt = now;
	save();

	const newBadge = getStreakBadge(user.messageStreak);
	const badgeChanged = !!newBadge && (!prevBadge || newBadge.name !== prevBadge.name);

	return { streak: user.messageStreak, badge: newBadge, badgeChanged };
}

function addBalance(guildId, userId, amount) {
	const user = getUser(guildId, userId);
	user.balance += amount;
	if (user.balance < 0) user.balance = 0;
	save();
	return user.balance;
}

function setCooldown(guildId, userId, field) {
	const user = getUser(guildId, userId);
	user[field] = Date.now();
	save();
}

function getCooldownRemaining(guildId, userId, field, cooldownMs) {
	const user = getUser(guildId, userId);
	const elapsed = Date.now() - (user[field] || 0);
	return Math.max(0, cooldownMs - elapsed);
}

function getLeaderboard(guildId, limit = 10) {
	return Object.entries(data)
		.filter(([k]) => k.startsWith(guildId + ':'))
		.map(([k, v]) => ({ userId: k.split(':')[1], balance: v.balance }))
		.sort((a, b) => b.balance - a.balance)
		.slice(0, limit);
}

module.exports = {
	STARTING_BALANCE,
	formatRupiah,
	getBalance,
	addBalance,
	setCooldown,
	getCooldownRemaining,
	getLeaderboard,
	claimDaily,
	getStreak,
	getStreakBadge,
	getMessageStreak,
	bumpMessageStreak,
};
