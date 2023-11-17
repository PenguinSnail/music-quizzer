import Discord from "discord.js";

import Quiz from "./src/classes/Quiz.js";
import Spotify from "./src/classes/Spotify.js";
import Leaderboard from "./src/classes/Leaderboard.js";

import { commands } from "./src/globals.js";
import Track from "./src/classes/Track.js";

// Clients -----------------------------

const spotifyClient = new Spotify();
const discordClient = new Discord.Client({intents: [
	Discord.GatewayIntentBits.Guilds,
	Discord.GatewayIntentBits.GuildMessages,
	Discord.GatewayIntentBits.MessageContent,
	Discord.GatewayIntentBits.GuildMembers,
	Discord.GatewayIntentBits.GuildVoiceStates,
	Discord.GatewayIntentBits.GuildMessageReactions
] });
const leaderboard = new Leaderboard();

// Quizzes -----------------------------

/** @type {Map<string, Quiz>} */
const quizzes = new Map();

// Messages ----------------------------

const helpMessage = new Discord.EmbedBuilder().setTitle("Music Quizzer Help");
helpMessage.addFields({
	name: commands.quizCommand + " <url> <count>",
	value: "Play a music quiz from a spotify url"
}, {
	name: commands.stopCommand,
	value: "Stop an active music quiz (quiz must be active)"
}, {
	name: commands.skipCommand,
	value: "Vote to skip the current song (quiz must be active)"
}, {
	name: commands.leaderboardCommand,
	value: "View the music quiz leaderboard"
});

// Message Handler ---------------------

discordClient.on(Discord.Events.MessageCreate, message => {
	// ignore bots
	if (message.author.bot) return;

	// help message
	if (message.content.toLowerCase().trim() === commands.helpCommand) {
		message.channel.send({ embeds: [ helpMessage ] });
		return;
	}
	
	// leaderboard
	if (message.content.toLowerCase().trim() === commands.leaderboardCommand) {
		const board = leaderboard.getGuildBoard(message.guild);

		if (!board) {
			message.channel.send("There was an error reading the leaderboard!");
			return;
		}

		if (board.size < 1) {
			message.channel.send("There aren't any leaderboard entries yet!");
			return;
		}

		const boardMessage = new Discord.EmbedBuilder().setTitle("Music Quizzer Leaderboard");

		message.guild.members.fetch({ user: [...board.keys()] }).then(members => {
			members.map(member => ({
				username: member.user.username,
				points: board.get(member.id)
			})).sort((a, b) =>
				a.points < b.points ? 1 : -1
			).forEach(entry => {
				boardMessage.addFields({
					name: entry.username,
					value: `${entry.points} ${entry.points > 1 ? "points" : "point"}`
				});
			});

			message.channel.send({ embeds: [ boardMessage ] });
		}).catch(e => {
			console.error(e);
			message.channel.send("Unable to get user information from Discord!");
		});
		
		return;
	}

	// music-quiz command
	if (
		(!quizzes.has(message.guild.id) || !quizzes.get(message.guild.id).active)
		&& message.content.toLowerCase().trim().startsWith(commands.quizCommand + " ")
	) {
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
				if (!quizzes.has(message.guild.id)) {
					quizzes.set(message.guild.id, new Quiz(discordClient, leaderboard, message.guild));
				}

				spotifyClient
					// if second argument is "all" pass null, else pass the number value of the argument or 10
					.selectTracks(args[0], args[1] ? (args[1].toLowerCase() === "all" ? null : Number(args[1])) : 10)
					.then(selectedTracks => {
						const tracks = selectedTracks.map(t => new Track(t));
						quizzes.get(message.guild.id).startQuiz(message.channel, message.member.voice.channel, tracks);
					}).catch(e => {
						if (e === "invalid domain") {
							message.channel.send("The given link isn't a Spotify URL!");
						} else if (e === "not a playlist or album") {
							message.channel.send("The given link isn't a playlist or album!");
						} else {
							message.channel.send("There was an error getting the track listing");
							console.error(e);
						}
					});
			}
		}
		return;
	}
});

spotifyClient.authorize(process.env.SPOTIFY_ID, process.env.SPOTIFY_SECRET).then(() => {
	discordClient.on("ready", () => {
		console.log(`Logged in as ${discordClient.user.tag}!`);
	});
	discordClient.login(process.env.DISCORD_TOKEN);
});
