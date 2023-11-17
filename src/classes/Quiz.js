// eslint-disable-next-line no-unused-vars
import Discord from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource } from "@discordjs/voice";
// eslint-disable-next-line no-unused-vars
import Leaderboard from "./Leaderboard.js";

import { commands, points } from "../globals.js";
import { checkGuess, getPopularityModifier, scoresToString } from "../utils.js";
// eslint-disable-next-line no-unused-vars
import Track from "./Track.js";

class Quiz {
	/**
	 * @param {Discord.Client} client Discord API client
	 * @param {Leaderboard} leaderboard Leaderboard manager
	 * @param {Discord.Guild} guild Discord guild
	 */
	constructor(client, leaderboard, guild) {
		this.client = client;
		this.leaderboard = leaderboard;
		this.guild = guild;
		this.active = false;

		this.textChannel;
		this.voiceChannel;
		this.connection;
		this.player;
		this.timer;

		/** @type {Map<string, number} */
		this.scores = new Map();
		this.skipVotes = 0;
		/** @type {Track[]} */
		this.tracks = [];
		this.track = 0;

		this.artistGuessed = false;
		this.titleGuessed = false;

		// bind some methods to the class `this`
		this.messageHandler = this.messageHandler.bind(this);
		this.nextTrack = this.nextTrack.bind(this);
	}

	/**
	 * Handle discord messages
	 * @param {Discord.Message} message discord message
	 */
	messageHandler(message) {
		// ignore bots
		if (message.author.bot) return;

		if (this.active && message.channel == this.textChannel && this.voiceChannel.members.has(message.member.id)) {
			if (message.content.toLowerCase().trim() === commands.stopCommand) {
				this.endQuiz();
			} else if (message.content.toLowerCase().trim() === commands.skipCommand) {
				this.skipVotes++;
				if (this.skipVotes >= Math.round(this.voiceChannel.members.filter(m => !m.user.bot).size / 2)) {
					this.nextTrack("Song skipped!");
				} else {
					const neededVotes = Math.round(this.voiceChannel.members.size / 2) - this.skipVotes;
					this.textChannel.send(`Need ${neededVotes} more ${neededVotes > 1 ? "votes" : "vote"} to skip!`);
				}
			} else {
				const guessValid = checkGuess(message.content, this.tracks[this.track]);
				let correct = false;

				if (!this.artistGuessed && guessValid.includes("artist")) {
					this.artistGuessed = true;
					correct = true;

					this.scores.set(
						message.member.id,
						(
							this.scores.has(message.member.id)
								? this.scores.get(message.member.id)
								: 0
						)
						+ points.artist
						+ getPopularityModifier(this.tracks[this.track].popularity)
					);
				}

				if (!this.titleGuessed && guessValid.includes("title")) {
					this.titleGuessed = true;
					correct = true;

					this.scores.set(
						message.member.id,
						(
							this.scores.has(message.member.id)
								? this.scores.get(message.member.id)
								: 0
						)
						+ points.title
						+ getPopularityModifier(this.tracks[this.track].popularity)
					);
				}

				if (correct) {
					message.react("☑");
				} else {
					message.react("❌");
				}

				if (this.titleGuessed && this.artistGuessed) {
					this.nextTrack("Song guessed!");
				}
			}
		}
	}

	/**
	 * Start the music quiz
	 * @param {Discord.TextChannel} textChannel the text channel the quiz is in
	 * @param {Discord.VoiceChannel} voiceChannel the voice channel the quiz is in
	 * @param {Track[]} tracks the tracks to quiz
	 */
	startQuiz(textChannel, voiceChannel, tracks) {
		this.client.on(Discord.Events.MessageCreate, this.messageHandler);
		this.active = true;

		this.textChannel = textChannel;
		this.voiceChannel = voiceChannel;

		this.scores.clear();
		this.tracks = tracks;
		this.track = 0;

		this.artistGuessed = false;
		this.titleGuessed = false;

		try {
			this.connection = joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId: voiceChannel.guild.id,
				adapterCreator: voiceChannel.guild.voiceAdapterCreator
			});
			this.player = createAudioPlayer();
			this.connection.subscribe(this.player);
		} catch (e) {
			console.error("Error connecting to voice channel!", e);
			textChannel.send("Unable to connect to the voice channel!");
			this.endQuiz();
		}

		textChannel.send(`
				**Let's get started**! :headphones: :tada:
				**${this.tracks.length}** songs have been randomly selected.
				You have 30 seconds to guess each song.
				Guess the song and artist by typing in chat. Points are awarded as follows:
				> Artist: **${points.artist} points**
				> Title: **${points.title} points**
				> Popularity modifier: **+/- ${points.modifier} points**
				Type \`${commands.stopCommand}\` to stop the quiz

				- GLHF :microphone:
			`.replace(/  +/g, "").replace(/\t/g, ""));

		this.playCurrentTrack();



	}

	/**
	 * End the music quiz
	 */
	endQuiz() {
		if (this.player) this.player.stop();
		if (this.connection) this.connection.destroy();
		this.client.off("message", this.messageHandler);
		this.active = false;

		this.leaderboard.addToGuildBoard(this.guild, this.scores);
		this.scores.clear();

		this.skipVotes = 0;
		this.tracks = [];
		this.track = 0;

		this.artistGuessed = false;
		this.titleGuessed = false;

		clearTimeout(this.timer);
	}

	/**
	 * Play the current track
	 */
	playCurrentTrack() {
		if (this.track < this.tracks.length) {
			try {
				if (!this.tracks[this.track].previewUrl) throw new Error();
				this.player.play(createAudioResource(this.tracks[this.track].previewUrl));
			} catch (e) {
				this.textChannel.send("Error playing song! Skipping...");
				this.nextTrack();
			}
			this.timer = setTimeout(this.nextTrack, 29500);
		} else {
			this.endQuiz();
		}
	}

	/**
	 * Continue to the next track
	 * @param {string} message a message to display
	 */
	nextTrack(message) {
		this.player.stop();
		clearTimeout(this.timer);
		if (this.track < this.tracks.length) {
			const song = this.tracks[this.track];
			this.textChannel.send(`
			**(${this.track + 1}/${this.tracks.length})** ${message ? message : ""}
			> **${song.title}** by **${song.artist}**
			> Link: || ${song.trackUrl} ||
			**__SCORES__**
			${scoresToString(this.scores, this.voiceChannel.members)}
		
		`.replace(/  +/g, "").replace(/\t/g, ""));

			this.titleGuessed = false;
			this.artistGuessed = false;
			this.skipVotes = 0;

			this.track++;
			this.playCurrentTrack();
		} else {
			this.endQuiz();
		}
	}


}

export default Quiz;