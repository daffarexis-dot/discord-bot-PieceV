const fs = require('fs');
const path = require('path');

// Bisa dioverride lewat env var ECONOMY_DATA_PATH kalau kamu pasang Railway Volume
// supaya data TIDAK hilang tiap redeploy (lihat catatan di README).
const DATA_FILE = process.env.ECONOMY_DATA_PATH || path.join(__dirname, '..', 'economy-data.json');
const STARTING_BALANCE = 100;

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
		data[k] = { balance: STARTING_BALANCE, lastDaily: 0, lastWork: 0 };
		save();
	}
	return data[k];
}

function getBalance(guildId, userId) {
	return getUser(guildId, userId).balance;
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
	getBalance,
	addBalance,
	setCooldown,
	getCooldownRemaining,
	getLeaderboard,
};
