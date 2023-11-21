import { AudioPlayer, VoiceConnection, joinVoiceChannel, createAudioPlayer } from "@discordjs/voice";
import { TextChannel, VoiceChannel } from "discord.js";
import Track from "./Track.js";
import SpotifyManager from "../managers/SpotifyManager.js";

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
    }

    /**
     * Open a voice connection
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
            throw e;
        }
    }

    /**
     * Close a voice connection
     */
    closeVoice() {
        console.log("Leaving voice channel " + this.voiceChannel.id + " in guild " + this.voiceChannel.guild.id);
        try {
            this.audioPlayer.stop();
            this.voiceConnection.destroy();
        } catch (e) {
            console.error("Error closing voice connection in guild " + this.voiceChannel.guild.id, e);
            throw e;
        }
    }

    /**
     * Load tracks from the Spotify API
     */
    loadTracks = async () => {
        try {
            this.tracks = await SpotifyManager.getTracks(this.url, this.count)
        } catch (e) {
            throw e;
        };
    };
}