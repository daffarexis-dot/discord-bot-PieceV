// Daftar Discord ID yang boleh pakai command khusus owner (misalnya /addmoney).
// Default sudah diisi ID kamu, tapi bisa ditambah/diubah lewat env var OWNER_IDS
// kalau mau kasih akses ke ID lain juga (pisahkan pakai koma).
const OWNER_IDS = (process.env.OWNER_IDS || '726779204116676648')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);

function isOwner(userId) {
	return OWNER_IDS.includes(String(userId));
}

module.exports = { OWNER_IDS, isOwner };
