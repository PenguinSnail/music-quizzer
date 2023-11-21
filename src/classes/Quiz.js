import { AudioPlayer, VoiceConnection, joinVoiceChannel, createAudioPlayer } from "@discordjs/voice";
import { TextChannel, VoiceChannel } from "discord.js";

/**
 * An individual music quiz round
 */
export default class Quiz {
    /**
    * Create a new Quiz object
    * @param {TextChannel} textChannel text channel for guesses
    * @param {VoiceChannel} voiceChannel voice channel for quiz audio
    * @param {string} url spotify url
    * @param {number} count song count
    */
    constructor(textChannel, voiceChannel, url, count) {
        /** @type {TextChannel} */
        this.textChannel = textChannel;
        /** @type {VoiceChannel} */
        this.voiceChannel = voiceChannel;
        /** @type {string} */
        this.url = url;
        /** @type {number} */
        this.count = count;
        /** @type {AudioPlayer} */
        this.audioPlayer = createAudioPlayer();
        /** @type {VoiceConnection} */
        this.voiceConnection;
    }

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
}