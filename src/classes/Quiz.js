import { AudioPlayer, VoiceConnection, joinVoiceChannel, createAudioPlayer, AudioPlayerStatus } from "@discordjs/voice";
import { TextChannel, VoiceChannel } from "discord.js";
import Track from "./Track.js";
import SpotifyManager from "../managers/SpotifyManager.js";
import ScoreManager from "../managers/ScoreManager.js";

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
                ScoreManager.awardPoints(interaction.guildId, k, v);
            } catch (e) {
                throw e;
            }
        });
    }

    /**
     * Send the starting message
     */
    startMessage = () => {

    }

    /**
     * Send the closing message
     */
    stopMessage = () => {

    }

    /**
     * Send the track message
     */
    trackMessage = () => {

    }

    /**
     * Start the quiz and send the opening message
     * @throws user friendly error message
     */
    startQuiz = async () => {
        try {
            await this.loadTracks();
            this.openVoice();
        } catch (e) {
            throw e;
        }
        this.startMessage();
        console.log(this.tracks[this.currentTrack])
        this.audioPlayer.play(this.tracks[this.currentTrack].getAudioResource());
        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            if (this.currentTrack < this.tracks.length) {
                this.trackMessage();
                this.playNextTrack();
            } else {
                this.stopQuiz();
            }
        });
    }

    /**
     * Stop the quiz and send the closing message
     * @throws user friendly error message
     */
    stopQuiz = async () => {
        try {
            this.saveScores();
        } catch (e) {
            throw e;
        }
        this.closeVoice();
        this.stopMessage();
    }
}