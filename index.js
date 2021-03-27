import SpotifyApi from "spotify-web-api-node";
import Discord from "discord.js";

import * as path from "path";
import * as fs from "fs";

const leaderboardFilename = "leaderboard.json";

// Clients -----------------------------

const discordClient = new Discord.Client();
const spotifyClient = new SpotifyApi({
	clientId: process.env.SPOTIFY_ID,
	clientSecret: process.env.SPOTIFY_SECRET
});

// Quiz Settings -----------------------

const quizCommand = process.env.PREFIX + "music-quiz";
const leaderboardCommand = process.env.PREFIX + "leaderboard";
const helpCommand = process.env.PREFIX + "help";
const stopCommand = process.env.PREFIX + "stop";
const skipCommand = process.env.PREFIX + "skip";
const artistPoints = 7;
const titlePoints = 5;

// Quiz Variables ----------------------

let active = false;
let scores = {};
/** @type {{link: string, previewUrl: string, title: string, artist: string, popularity: number, duration: number}[]} */
let tracks = [];
let currentTrack = 0;
let skipVotes = 0;

/** @type {Discord.VoiceChannel} */
let voiceChannel = {};
/** @type {Discord.TextChannel} */
let textChannel = {};
/** @type {Discord.VoiceConnection} */
let connection = {};
/** @type {number} */
let timer = null;
/** @type {{link: string, previewUrl: string, title: string, artist: string, popularity: number, duration: number}} */
let song = {};

let titleGuessed = false;
let artistGuessed = false;

// Messages ----------------------------

const helpMessage = new Discord.MessageEmbed().setTitle("Music Quizzer Help");
helpMessage.addFields({
	name: quizCommand + " <url> <count>",
	value: "Play a music quiz from a spotify url"
});
helpMessage.addFields({
	name: stopCommand,
	value: "Stop an active music quiz (quiz must be active)"
});
helpMessage.addFields({
	name: skipCommand,
	value: "Vote to skip the current song (quiz must be active)"
});
helpMessage.addFields({
	name: leaderboardCommand,
	value: "View the music quiz leaderboard"
});

// Tracks ------------------------------

/**
 * Get tracks from a spotify playlist or album URL
 * @param {string} url the spotify URL
 * @returns {Promise<SpotifyApi.TrackObjectFull[]>} a promise that resolves an array of SpotifyApi track objects
 */
function getTracks(url) {
	return new Promise((resolve, reject) => {
		const urlObj = new URL(url);

		if (urlObj.hostname === "open.spotify.com") {
			const pathParts = urlObj.pathname.split("/").filter(part => Boolean(part));

			let tracks = [];
			switch (pathParts[0]) {
			case "playlist":
				spotifyClient.getPlaylist(pathParts[1]).then(response => {
					for (let i = 0; i < response.body.tracks.total; i = i + 100) {
						spotifyClient.getPlaylistTracks(pathParts[1], { offset: i, market: "US" }).then(result => {
							tracks = [
								...tracks,
								...result.body.items.map(t => t.track)
							];
							if (tracks.length === response.body.tracks.total) {
								resolve(tracks);
							}
						});
					}
				});
				break;
			case "album":
				spotifyClient.getAlbum(pathParts[1]).then(response => {
					for (let i = 0; i < response.body.tracks.total; i = i + 100) {
						spotifyClient.getAlbumTracks(pathParts[1], { offset: i, market: "US" }).then(result => {
							tracks = [
								...tracks,
								...result.body.items.map(t => t.track)
							];
							if (tracks.length === response.body.tracks.total) {
								resolve(tracks);
							}
						});
					}
				});
				break;
			default:
				reject("not a playlist or album");
				break;
			}
		} else {
			reject("invalid domain");
		}
	});
}

/**
 * Get a number of random tracks from a spotify playlist or album URL
 * @param {string} url the spotify URL
 * @param {number | null} count the number of tracks to return
 * @returns {object[]} a promise that resolves an array of tracks
 */
function selectTracks(url, count) {
	return new Promise((resolve, reject) => {
		getTracks(url).then(allTracks => {
			const fullTracks = allTracks.filter(t => t.preview_url);
			const missingTracks = allTracks.filter(t => !t.preview_url);

			let missingTrackIdChunks = [];
			for (let i = 0; i < missingTracks.length; i += 25) {
				missingTrackIdChunks.push(missingTracks.slice(i, i+25).map(track => track.id));
			}
			
			Promise.all(
				missingTrackIdChunks
					.map(chunk => spotifyClient.getTracks(chunk))
			).then(responses => {
				const updatedTracks = responses.map(r => r.body.tracks).flat();
				const combinedTracks = fullTracks.concat(updatedTracks);
				resolve(
					combinedTracks
						.filter(t => t.preview_url)
						.sort(() => Math.random() > 0.5 ? 1 : -1)
						.slice(0, count ? count : combinedTracks.length - 1)
				);
			});
		}, reject);
	});
}

// Message Handler ---------------------

discordClient.on("message", message => {
	// ignore bots
	if (message.author.bot) return;

	// help message
	if (message.content.toLowerCase().trim() === helpCommand) {
		message.channel.send(helpMessage);
		return;
	} else if (message.content.toLowerCase().trim() === leaderboardCommand) {
		const board = getLeaderboard();

		if (board === 0) {
			message.channel.send("There isn't a leaderboard yet!");
		} else if (board === 1) {
			message.channel.send("There was an error reading the leaderboard!");
		} else {
			const leaderboard = new Discord.MessageEmbed().setTitle("Music Quizzer Leaderboard");

			message.guild.members.fetch({user: Object.keys(board)}).then(members => {
				members
					.filter(member =>
						Object.keys(board)
							.includes(member.id)
					).map(member => ({
						username: member.user.username,
						points: board[member.id]
					}))
					.sort((a, b) =>
						a.points < b.points ? 1 : -1
					).forEach(entry => {
						leaderboard.addFields({
							name: entry.username,
							value: `${entry.points} points`
						});
					});
				message.channel.send(leaderboard);
			}).catch(e => {
				console.error(e);
				message.channel.send("Unable to get user information from Discord!");
			});
		}
	}

	// music-quiz command
	if (!active && message.content.toLowerCase().trim().startsWith(quizCommand + " ")) {
		// ensure the user is in a voice channel
		if (!(message.member.voice.channel)) {
			message.channel.send("You need be in a voice channel to use this command!");
		} else {
			// split arguments from the message
			const args = message.content.slice((process.env.PREFIX + "music-quiz").length).trim().split(/ +/).filter(a => Boolean(a));
			// check to make sure an argument was given
			if (args.length < 1) {
				message.channel.send("You need to specify a Spotify URL!");
			} else {
				startQuiz(message.channel, message.member.voice.channel, args[0], args[1]);
			}
		}
		return;
	}

	// handle guessing and stopping if active
	if (active && message.channel == textChannel && voiceChannel.members.map(m => m.user.id).includes(message.member.user.id)) {
		if (message.content.toLowerCase().trim() === stopCommand) {
			stopQuiz();
		} else if (message.content.toLowerCase().trim() === skipCommand) {
			skipVotes++;
			if (skipVotes >= Math.round(voiceChannel.members.filter(m => !m.user.bot).size / 2)) {
				nextTrack("Song skipped!");
			} else {
				textChannel.send(`Need ${Math.round(voiceChannel.members.size / 2) - skipVotes} more votes to skip!`);
			}
		} else {
			checkGuess(message);
			if (titleGuessed && artistGuessed) {
				nextTrack("Song guessed!");
			}
		}
	}
});

// Quiz --------------------------------

/**
 * Start the music quiz
 * @param {Discord.TextChannel} tChannel The text channel the quiz is in
 * @param {Discord.VoiceChannel} vChannel The voice channel the quiz is in
 * @param {string} url The spotify URL to quiz from
 * @param {number} trackCount The number of tracks to play
 */
async function startQuiz(tChannel, vChannel, url, trackCount) {
	active = true;
	textChannel = tChannel;
	voiceChannel = vChannel;

	if (trackCount.toLowerCase() === "all") {
		trackCount = null;
	} else {
		trackCount = Number(trackCount) || 10;
	}

	//tracks = trackCount.toLowerCase() === "all" ? null : Number(trackCount) || 10;

	selectTracks(url, trackCount).then(selectedTracks => {
		tracks = selectedTracks
			.map(t => ({
				link: `https://open.spotify.com/track/${t.id}`,
				popularity: t.popularity,
				previewUrl: t.preview_url,
				title: sanitizeTitle(t.name),
				artist: (t.artists[0] || {}).name,
				duration: t.duration_ms
			}));

		textChannel.send(`
			**Let's get started**! :headphones: :tada:
			**${tracks.length}** songs have been randomly selected.
			You have 30 seconds to guess each song.
			Guess the song and artist by typing in chat. Points are awarded as follows:
			> Artist: **${artistPoints} points**
			> Title: **${titlePoints} points**
			> Popularity modifier: **+/- ${getPopularityModifier(0)} points**
			Type \`${stopCommand}\` to stop the quiz

			- GLHF :microphone:
		`.replace(/  +/g, "").replace(/\t/g, ""));

		voiceChannel.join().then(c => {
			connection = c;
			currentTrack = 0;
			playCurrentTrack();
		});
	}, e => {
		stopQuiz();
		if (e === "invalid domain") {
			textChannel.send("The given link isn't a Spotify URL!");
		} else if (e === "not a playlist or album") {
			textChannel.send("The given link isn't a playlist or album!");
		} else {
			textChannel.send("There was an error getting the track listing");
			console.error(e);
		}
	});
}

/**
 * Stop the music quiz
 */
function stopQuiz() {
	connection.disconnect();
	updateLeaderboard();

	active = false;
	scores = {};
	tracks = [];
	currentTrack = 0;
	skipVotes = 0;

	song = {};

	clearTimeout(timer);
	timer = null;

	titleGuessed = false;
	artistGuessed = false;
}

/**
 * Continue to the next track
 * @param {string} message a message to display
 */
function nextTrack(message) {
	clearTimeout(timer);
	textChannel.send(`
		**(${currentTrack + 1}/${tracks.length})** ${message ? message : ""}
		> **${song.title}** by **${song.artist}**
		> Link: || ${song.link} ||
		${song.youtubeUrl ? `> YouTube: || ${song.youtubeUrl} ||` : ""}
		**__SCORES__**
		${getScores()}

	`.replace(/  +/g, "").replace(/\t/g, ""));
	titleGuessed = false;
	artistGuessed = false;
	skipVotes = 0;
	currentTrack++;
	playCurrentTrack();
}

/**
 * Play the current track
 */
function playCurrentTrack() {
	if (currentTrack < tracks.length) {
		song = tracks[currentTrack];
		try {
			connection.play(song.previewUrl);
		} catch (e) {
			textChannel.send("Error playing song! Skipping...");
			nextTrack();
		}
		timer = setTimeout(nextTrack, 29500);
	} else {
		stopQuiz();
	}
}

/**
 * Get the scores for the current quiz as a string
 * @returns scores string
 */
function getScores() {
	return voiceChannel.members
		.filter(member => !member.user.bot)
		.array()
		.sort((first, second) => (scores[first.id] || 0) < (scores[second.id] || 0) ? 1 : -1)
		.map((member, index) => {
			let position = `**${index + 1}.** `;
			if (index === 0) {
				position = ":first_place:";
			} else if (index === 1) {
				position = ":second_place:";
			} else if (index === 2) {
				position = ":third_place:";
			}

			return `${position} ${member.user.username} ${scores[member.id] || 0} points`;
		})
		.join("\n");
}

/**
 * Calculate a points modifier based on a songs popularity rating
 * @param {number} popularity the song popularity
 * @returns a modifier to add to the score
 */
function getPopularityModifier(popularity) {
	return Math.round((50 - popularity) * (3 / 50));
}

/**
 * Check and score a music quiz guess
 * @param {string} message discord message to check
 */
function checkGuess(message) {
	let score = scores[message.author.id] || 0;
	let correct = false;

	function transform(text) {
		if (!text) {
			return "";
		} else {
			return text
				.toLowerCase()
				// special marks
				.normalize("NFD")
				.replace(/[\u0300-\u036F]/g, "")
				// smart quotes
				.replace(/[\u2018\u2019]/g, "")
				.replace(/[\u201C\u201D]/g, "")
				.replace(/[&]/g,"and")
				.replace(/ *\([^)]*\) */g, "")
				.replace(/[.,/#!$%^&?*;:{}=\-_'`~]/g,"")
				.replace(/\s{2,}/g," ");
		}
	}
	
	if (!titleGuessed && transform(message.content).includes(transform(song.title))) {
		score += ( titlePoints + getPopularityModifier(song.popularity));
		titleGuessed = true;
		correct = true;
		message.react("☑");
	}

	if (!artistGuessed && transform(message.content).includes(transform(song.artist))) {
		score += (artistPoints + getPopularityModifier(song.popularity));
		artistGuessed = true;
		correct = true;
		message.react("☑");
	}

	scores[message.author.id] = score;
	if (!correct) message.react("❌");
}

// ported from https://github.com/hankhank10/demaster
/**
 * Removes remaster and remix text from song titles
 * @param {string} title the title to clean
 * @returns the cleaned up song title
 */
function sanitizeTitle(title) {
	let offendingText = [];

	for (let y = 1990; y < new Date().getFullYear(); y++) {
		offendingText.push("- " + y + " - Remast");
		offendingText.push("- " + y + " Remast");
		offendingText.push("(" + y + " Remast");
		offendingText.push("(" + y + " - Remast");
	}

	offendingText = offendingText.concat([
		"- Remast",
		"(Remast",
		"- Live ",
		"(Live at",
		"- Mono / Remast",
		"- From ",
		"- Single ",
		"- Studio "
	]);

	offendingText.forEach(part => {
		if (title.includes(part)) {
			title = title.split(part)[0];
		}
	});

	return title.trim();
}

// Leaderboard -------------------------

function updateLeaderboard() {
	const leaderboardPath = path.resolve(leaderboardFilename);

	if (!fs.existsSync(leaderboardPath)) {
		fs.writeFileSync(leaderboardPath, "{}", { encoding: "utf-8" });
	}

	let leaderboardData;
	try {
		leaderboardData = JSON.parse(fs.readFileSync(leaderboardPath));
	} catch (e) {
		console.error(e);
		leaderboardData = {};
	}

	Object.keys(scores).filter(memberId => scores[memberId] > 0).forEach(memberId => {
		leaderboardData[memberId] = (leaderboardData[memberId] ? leaderboardData[memberId] : 0) + scores[memberId];
	});

	fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboardData, null, 2), { encoding: "utf-8" });
}

function getLeaderboard() {
	const leaderboardPath = path.resolve(leaderboardFilename);

	let contents;
	if (fs.existsSync(leaderboardPath)) {
		contents = fs.readFileSync(leaderboardPath);
	} else {
		return 0;
	}

	let leaderboardData;
	try {
		leaderboardData = JSON.parse(contents);
	} catch (e) {
		console.error(e);
		return 1;
	}

	if (Object.keys(leaderboardData).length < 1) {
		return 0;
	}

	return leaderboardData;
}

// Initialization ----------------------

spotifyClient.clientCredentialsGrant().then(response => {
	spotifyClient.setAccessToken(response.body.access_token);
	
	discordClient.on("ready", () => {
		console.log(`Logged in as ${discordClient.user.tag}!`);
	});
	discordClient.login(process.env.DISCORD_TOKEN);
});
