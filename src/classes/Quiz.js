import { AudioPlayer, VoiceConnection, joinVoiceChannel, createAudioPlayer, AudioPlayerStatus } from "@discordjs/voice";
import { EmbedBuilder, TextChannel, VoiceChannel } from "discord.js";
import SpotifyManager from "../managers/SpotifyManager.js";
import ScoreManager from "../managers/ScoreManager.js";
import Track from "./Track.js";

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
        ${this.voiceChannel.members
                .filter(member => !member.user.bot && this.scores.has(member.user.id))
                .sort((a, b) => this.scores.get(a) - this.scores.get(b))
                .map((member, index) => {
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

    getTrackEmbed = () => {
        const embed = new EmbedBuilder()
            .setTitle(this.tracks[this.currentTrack].title)
            .setAuthor({ name: this.tracks[this.currentTrack].artist })
            .setDescription(`Song ${this.currentTrack + 1} of ${this.tracks.length}`)
            .setURL(this.tracks[this.currentTrack].trackUrl);
        for (
            const [member, index] of this.voiceChannel.members
                .filter(member => !member.user.bot && this.scores.has(member.user.id))
                .sort((a, b) => this.scores.get(a) - this.scores.get(b))
                .entries()
        ) {
            let position = `**${index + 1}.**`;
            if (index === 0) {
                position = ":first_place:";
            } else if (index === 1) {
                position = ":second_place:";
            } else if (index === 2) {
                position = ":third_place:";
            }
            embed.addFields({
                name: `${position} ${member.user.username}`,
                value: `${this.scores.get(member.id)} points`
            });
        }
        return { embeds: [embed] };
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
        try {
            await this.saveScores();
            this.closeVoice();
        } catch (e) {
            throw e;
        }
    }
}