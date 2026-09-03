const { SlashCommandBuilder } = require('discord.js');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const fetch = require('node-fetch');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const { upscaleImage } = require('../utils/replicate');

// ================= BATASAN (penting untuk mencegah proses kebablasan) =================
const MAX_DURATION_SEC = 6; // video di atas ini ditolak
const EXTRACT_FPS = 8; // makin rendah = makin cepat prosesnya, tapi hasil kurang mulus
const MAX_CONCURRENT_UPSCALE = 3; // jumlah frame yang diproses bersamaan ke Replicate
// ========================================================================================

function run(cmd, args) {
	return new Promise((resolve, reject) => {
		execFile(cmd, args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
			if (err) reject(new Error(stderr || err.message));
			else resolve(stdout);
		});
	});
}

async function getDuration(filePath) {
	const out = await run(ffprobePath, [
		'-v', 'error',
		'-show_entries', 'format=duration',
		'-of', 'default=noprint_wrappers=1:nokey=1',
		filePath,
	]);
	return parseFloat(out.trim());
}

async function downloadFile(url, dest) {
	const res = await fetch(url);
	if (!res.ok) throw new Error('Gagal mengunduh video attachment.');
	const buffer = await res.buffer();
	fs.writeFileSync(dest, buffer);
}

function extractFrames(inputPath, framesDir) {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn(ffmpegPath, [
			'-i', inputPath,
			'-vf', `fps=${EXTRACT_FPS}`,
			path.join(framesDir, 'frame-%04d.png'),
		]);
		ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error('Gagal extract frame video.'))));
	});
}

function extractAudio(inputPath, audioPath) {
	return new Promise((resolve) => {
		const ffmpeg = spawn(ffmpegPath, ['-i', inputPath, '-vn', '-acodec', 'copy', audioPath]);
		ffmpeg.on('close', () => resolve()); // kalau video tanpa audio, biarkan gagal diam-diam
	});
}

function reassembleVideo(framesDir, audioPath, outputPath) {
	return new Promise((resolve, reject) => {
		const hasAudio = fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0;
		const args = [
			'-framerate', String(EXTRACT_FPS),
			'-i', path.join(framesDir, 'frame-%04d.png'),
		];
		if (hasAudio) args.push('-i', audioPath);
		args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p');
		if (hasAudio) args.push('-c:a', 'aac', '-shortest');
		args.push(outputPath);

		const ffmpeg = spawn(ffmpegPath, args);
		ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error('Gagal menyusun ulang video.'))));
	});
}

async function upscaleFramesInDir(framesDir) {
	const files = fs.readdirSync(framesDir).filter((f) => f.endsWith('.png')).sort();

	let i = 0;
	async function worker() {
		while (i < files.length) {
			const idx = i++;
			const filePath = path.join(framesDir, files[idx]);
			const base64 = fs.readFileSync(filePath).toString('base64');
			const dataUri = `data:image/png;base64,${base64}`;

			const resultUrl = await upscaleImage(dataUri);
			const resultRes = await fetch(resultUrl);
			const resultBuffer = await resultRes.buffer();
			fs.writeFileSync(filePath, resultBuffer);
		}
	}

	const workers = Array.from({ length: MAX_CONCURRENT_UPSCALE }, () => worker());
	await Promise.all(workers);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('upscale-video')
		.setDescription(`Perbesar & pertajam video pendek (maks ${MAX_DURATION_SEC} detik) - proses lambat!`)
		.addAttachmentOption((opt) =>
			opt.setName('video').setDescription('Video pendek yang mau di-upscale').setRequired(true)
		),

	async execute(interaction) {
		const video = interaction.options.getAttachment('video');
		if (!video.contentType || !video.contentType.startsWith('video/')) {
			await interaction.reply({ content: 'File yang diupload harus berupa video.', ephemeral: true });
			return;
		}

		await interaction.deferReply();
		await interaction.editReply('⏳ Memproses video, ini bisa makan waktu beberapa menit (per-frame lewat AI)...');

		const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upscale-'));
		const inputPath = path.join(workDir, 'input.mp4');
		const framesDir = path.join(workDir, 'frames');
		const audioPath = path.join(workDir, 'audio.aac');
		const outputPath = path.join(workDir, 'output.mp4');
		fs.mkdirSync(framesDir);

		try {
			await downloadFile(video.url, inputPath);

			const duration = await getDuration(inputPath);
			if (duration > MAX_DURATION_SEC) {
				await interaction.editReply(
					`Video terlalu panjang (${duration.toFixed(1)}s). Maksimal ${MAX_DURATION_SEC} detik untuk fitur ini — upscale video per-frame itu berat, jadi sengaja dibatasi.`
				);
				return;
			}

			await extractFrames(inputPath, framesDir);
			await extractAudio(inputPath, audioPath);
			await upscaleFramesInDir(framesDir);
			await reassembleVideo(framesDir, audioPath, outputPath);

			const stat = fs.statSync(outputPath);
			if (stat.size > 8 * 1024 * 1024) {
				await interaction.editReply(
					'Video hasil upscale kelebihan ukuran untuk dikirim di Discord (>8MB). Coba video yang lebih pendek/resolusi lebih kecil.'
				);
				return;
			}

			await interaction.editReply({ content: '✨ Video selesai di-upscale:', files: [outputPath] });
		} catch (err) {
			await interaction.editReply(`Gagal upscale video: ${err.message}`);
		} finally {
			fs.rmSync(workDir, { recursive: true, force: true });
		}
	},
};
