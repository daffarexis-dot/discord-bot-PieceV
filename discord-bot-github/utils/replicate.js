const fetch = require('node-fetch');

// inputImage bisa berupa URL publik (https://...) ATAU data URI (data:image/png;base64,...)
async function upscaleImage(inputImage) {
	const token = process.env.REPLICATE_API_TOKEN;
	const modelVersion = process.env.REPLICATE_UPSCALE_MODEL_VERSION;

	if (!token || !modelVersion) {
		throw new Error('REPLICATE_API_TOKEN / REPLICATE_UPSCALE_MODEL_VERSION belum diisi di file .env');
	}

	const startRes = await fetch('https://api.replicate.com/v1/predictions', {
		method: 'POST',
		headers: {
			Authorization: `Token ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			version: modelVersion,
			input: { image: inputImage },
		}),
	});
	const startData = await startRes.json();
	if (!startRes.ok) {
		throw new Error(startData.detail || 'Gagal memulai proses upscale di Replicate.');
	}

	let prediction = startData;
	const pollUrl = prediction.urls.get;
	const maxWaitMs = 90_000;
	const startTime = Date.now();

	while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
		if (Date.now() - startTime > maxWaitMs) {
			throw new Error('Proses upscale terlalu lama (timeout).');
		}
		await new Promise((r) => setTimeout(r, 2000));
		const pollRes = await fetch(pollUrl, { headers: { Authorization: `Token ${token}` } });
		prediction = await pollRes.json();
	}

	if (prediction.status !== 'succeeded') {
		throw new Error('Proses upscale gagal: ' + (prediction.error || 'unknown error'));
	}

	return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
}

module.exports = { upscaleImage };
