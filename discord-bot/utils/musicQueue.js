const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	entersState,
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// guildId -> { connection, player, queue: [{title, url, requestedBy}], voiceChannelId }
const guildStates = new Map();

function getState(guildId) {
	return guildStates.get(guildId);
}

function createResourceFromUrl(url) {
	// Pakai ffmpeg buat decode URL/file audio apapun jadi PCM mentah,
	// supaya bisa mendukung link langsung (mp3/wav/ogg/dll), bukan cuma satu format.
	const ffmpeg = spawn(ffmpegPath, [
		'-reconnect', '1',
		'-reconnect_streamed', '1',
		'-reconnect_delay_max', '5',
		'-i', url,
		'-f', 's16le',
		'-ar', '48000',
		'-ac', '2',
		'-loglevel', 'error',
		'pipe:1',
	], { stdio: ['ignore', 'pipe', 'pipe'] });

	ffmpeg.stderr.on('data', () => {}); // diamkan log ffmpeg, biar Output bersih

	return createAudioResource(ffmpeg.stdout, { inputType: StreamType.Raw });
}

async function ensureConnection(interaction) {
	const guildId = interaction.guild.id;
	let state = guildStates.get(guildId);

	const voiceChannel = interaction.member.voice.channel;
	if (!voiceChannel) {
		throw new Error('Kamu harus masuk voice channel dulu.');
	}

	if (!state) {
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: guildId,
			adapterCreator: interaction.guild.voiceAdapterCreator,
		});

		await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

		const player = createAudioPlayer();
		connection.subscribe(player);

		state = { connection, player, queue: [], voiceChannelId: voiceChannel.id };
		guildStates.set(guildId, state);

		player.on(AudioPlayerStatus.Idle, () => {
			playNext(guildId);
		});

		player.on('error', (err) => {
			console.error('[MusicPlayer] Error:', err.message);
			playNext(guildId);
		});
	}

	return state;
}

function playNext(guildId) {
	const state = guildStates.get(guildId);
	if (!state) return;

	const next = state.queue.shift();
	if (!next) return; // antrian habis, biarkan player idle

	const resource = createResourceFromUrl(next.url);
	state.player.play(resource);
	state.nowPlaying = next;
}

function addToQueue(interaction, track) {
	return ensureConnection(interaction).then((state) => {
		state.queue.push(track);
		if (state.player.state.status === AudioPlayerStatus.Idle && !state.nowPlaying) {
			playNext(interaction.guild.id);
		}
		return state;
	});
}

function stop(guildId) {
	const state = guildStates.get(guildId);
	if (!state) return false;
	state.queue = [];
	state.player.stop();
	state.connection.destroy();
	guildStates.delete(guildId);
	return true;
}

module.exports = {
	getState,
	ensureConnection,
	addToQueue,
	playNext,
	stop,
	AudioPlayerStatus,
};
