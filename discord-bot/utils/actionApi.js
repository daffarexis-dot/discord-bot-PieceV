const fetch = require('node-fetch');

async function fetchNekosBest(category) {
	const res = await fetch(`https://nekos.best/api/v2/${category}`);
	if (!res.ok) throw new Error(`nekos.best balas status ${res.status}`);
	const json = await res.json();
	const result = json && json.results && json.results[0];
	if (!result || !result.url) throw new Error('nekos.best tidak balikin hasil');
	return result.url;
}

async function fetchWaifuPics(category) {
	const res = await fetch(`https://api.waifu.pics/sfw/${category}`);
	if (!res.ok) throw new Error(`waifu.pics balas status ${res.status}`);
	const json = await res.json();
	if (!json || !json.url) throw new Error('waifu.pics tidak balikin hasil');
	return json.url;
}

// Ambil 1 URL GIF/gambar buat sebuah aksi (hug, kiss, dll). `source` nentuin API mana yang dipanggil.
async function fetchActionGif(source, category) {
	if (source === 'waifu') return fetchWaifuPics(category);
	return fetchNekosBest(category);
}

module.exports = { fetchActionGif };
