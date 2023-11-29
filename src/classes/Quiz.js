import { AudioPlayer, VoiceConnection, joinVoiceChannel, createAudioPlayer, AudioPlayerStatus } from "@discordjs/voice";
import { EmbedBuilder, Message, TextChannel, VoiceChannel } from "discord.js";
import SpotifyManager from "../managers/SpotifyManager.js";
import ScoreManager from "../managers/ScoreManager.js";
import Track from "./Track.js";
import { getPopularityModifier, transform } from "../utils.js";

/**
 * An individual music quiz round
 */
export default class Quiz {
    /**
    * Create a new Quiz object
    * @param {TextChannel} textChannel text channel for guesses
    * @param {VoiceChannel} voiceChannel voice channel for quiz audio
    * @param {string} url spotify url
    * @param {number | undefined} count song count
    */
    constructor(textChannel, voiceChannel, url, count) {
        this.active = false;
        /** @type {TextChannel} */
        this.textChannel = textChannel;
        /** @type {VoiceChannel} */
        this.voiceChannel = voiceChannel;
        /** @type {AudioPlayer} */
        this.audioPlayer = createAudioPlayer();
        /** @type {VoiceConnection} */
        this.voiceConnection;
        /** @type {string} */
        this.url = url;
        /** @type {number} */
        this.count = count;
        /** @type {Track[]} */
        this.tracks;
        /** @type {number} */
        this.currentTrack = 0;
        /** @type {Map<string, number>} */
        this.scores = new Map();
        /** @type {boolean} */
        this.artistGuessed = false;
        /** @type {boolean} */
        this.titleGuessed = false;
    }

    /**
     * Open a voice connection
     * @throws user friendly error message
     */
    openVoice() {
        console.log("Joining voice channel " + this.voiceChannel.id + " in guild " + this.voiceChannel.guild.id);
        try {
            this.voiceConnection = joinVoiceChannel({
                channelId: this.voiceChannel.id,
                guildId: this.voiceChannel.guild.id,
                adapterCreator: this.voiceChannel.guild.voiceAdapterCreator
            });
            this.voiceConnection.subscribe(this.audioPlayer);
        } catch (e) {
            console.error("Error opening voice connection in guild " + this.voiceChannel.guild.id, e);
            throw new Error("Error opening voice channel!");
        }
    }

    /**
     * Close a voice connection
     * @throws user friendly error message
     */
    closeVoice() {
        console.log("Leaving voice channel " + this.voiceChannel.id + " in guild " + this.voiceChannel.guild.id);
        try {
            this.audioPlayer.stop();
            this.voiceConnection.destroy();
        } catch (e) {
            console.error("Error closing voice connection in guild " + this.voiceChannel.guild.id, e);
            throw new Error("Error closing voice channel!");
        }
    }

    /**
     * Load tracks from the Spotify API
     * @throws user friendly error message
     */
    loadTracks = async () => {
        try {
            this.tracks = await SpotifyManager.getTracks(this.url, this.count)
        } catch (e) {
            throw e;
        };
    };

    /**
     * Advances the audio player to the next track
     */
    playNextTrack = () => {
        this.artistGuessed = false;
        this.titleGuessed = false;
        this.currentTrack++;
        const resource = this.tracks[this.currentTrack].getAudioResource();
        this.audioPlayer.play(resource);
    };

    /**
     * Saves scores to the database
     * @throws user friendly error message
     */
    saveScores = async () => {
        this.scores.forEach((v, k) => {
            try {
                ScoreManager.awardPoints(this.textChannel.guildId, k, v);
            } catch (e) {
                throw e;
            }
        });
    }

    /**
     * Get the starting message for this quiz
     * @returns {string} the starting message
     */
    getStartMessage = () => {
        return `**Let's get started**! :headphones: :tada:
            **${this.tracks.length}** songs have been randomly selected.
            You have 30 seconds to guess each song.
            Guess the song and artist by typing in chat. Points are awarded as follows:
            > Artist: **${process.env.ARTIST_PTS} points**
            > Title: **${process.env.TITLE_PTS} points**
            > Popularity modifier: **+/- ${process.env.POP_PTS} points**
            Type \`/${process.env.COMMAND} stop\` to stop the quiz`
            .replace(/  +/g, "")
            .replace(/\t/g, "")
    }

    /**
     * Get the closing message
     * @returns {string} the closing message
     */
    getStopMessage = () => {
    }

    /**
     * get the track message
     * @returns {string} the track message
     */
    getTrackMessage = () => {
        return `
        > **${this.tracks[this.currentTrack].title}** by **${this.tracks[this.currentTrack].artist}** (${this.currentTrack + 1}/${this.tracks.length})
        > Link: || ${this.tracks[this.currentTrack].trackUrl} ||
        **__SCORES__**
        ${[...this.voiceChannel.members
                .filter(member => !member.user.bot && this.scores.has(member.id))
                .sort((a, b) => this.scores.get(a) - this.scores.get(b))]
                .map(([id, member], index) => {
                    let position = `**${index + 1}.**`;
                    if (index === 0) {
                        position = ":first_place:";
                    } else if (index === 1) {
                        position = ":second_place:";
                    } else if (index === 2) {
                        position = ":third_place:";
                    }

                    return `${position} ${member.user.username} ${this.scores.get(member.id)} points`;
                })
                .join("\n")
            }
        `.replace(/  +/g, "").replace(/\t/g, "");
    }

    /**
     * Start the quiz and send the opening message
     * @throws user friendly error message
     */
    startQuiz = async () => {
        this.active = true;
        try {
            await this.loadTracks();
            this.openVoice();
            this.textChannel.client.on('messageCreate', this.messageHandler);
        } catch (e) {
            throw e;
        }
        this.audioPlayer.play(this.tracks[this.currentTrack].getAudioResource());
        this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
            this.textChannel.send(this.getTrackMessage());
            if (this.currentTrack + 1 < this.tracks.length) {
                this.playNextTrack();
            } else {
                try {
                    await this.stopQuiz();
                    this.textChannel.send(this.getStopMessage());
                } catch (e) {
                    console.error("Error stopping quiz", e);
                    this.textChannel.send(e.message);
                }
            }
        });
    }

    /**
     * Stop the quiz and send the closing message
     * @throws user friendly error message
     */
    stopQuiz = async () => {
        this.active = false;
        try {
            await this.saveScores();
            this.closeVoice();
            this.textChannel.client.off('messageCreate', this.messageHandler);
        } catch (e) {
            throw e;
        }
    }

    advanceQuiz = async () => {
        this.textChannel.send(this.getTrackMessage());
        if (this.currentTrack + 1 < this.tracks.length) {
            try {
                this.playNextTrack();
            } catch (e) {
                console.error("Error advancing song in guild " + quiz.guildId, e);
                throw new Error("Error advancing song!");
            }
        } else {
            await this.stopQuiz(guildId);
        }
    }

    /**
     * Handle guess messages
     * @param {Message} message message object
     */
    messageHandler = async (message) => {
        if (message.channel.id !== this.textChannel.id || !this.voiceChannel.members.has(message.member.id) || message.member.user.bot) return;
        let a = false;
        let t = false;
        if (!this.titleGuessed && transform(message.content).includes(transform(this.tracks[this.currentTrack].title))) {
            t = true;
            this.titleGuessed = true;
        }
        if (!this.artistGuessed && transform(message.content).includes(transform(this.tracks[this.currentTrack].artist))) {
            a = true;
            this.artistGuessed = true;
        }
        if (a || t) {
            message.react("☑");
            if (a) {
                this.scores.set(
                    message.member.id,
                    this.scores.get(message.member.id) ?? 0
                    + parseInt(process.env.ARTIST_PTS)
                    + getPopularityModifier(this.tracks[this.currentTrack].popularity)
                );
            }
            if (t) {
                this.scores.set(
                    message.member.id,
                    this.scores.get(message.member.id) ?? 0
                    + parseInt(process.env.TITLE_PTS)
                    + getPopularityModifier(this.tracks[this.currentTrack].popularity)
                );
            }
        } else {
            message.react("❌");
        }

        if (this.titleGuessed && this.artistGuessed) this.advanceQuiz();
    }
}