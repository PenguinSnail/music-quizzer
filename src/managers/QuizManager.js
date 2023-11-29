import { TextChannel, VoiceChannel } from "discord.js";
import Quiz from "../classes/Quiz.js";

/**
 * @type {Map<string, Quiz>}
 */
const quizzes = new Map();

/**
 * Get a guilds active quiz
 * @param {string} guildId guild id
 * @returns quiz object
 */
const getQuiz = (guildId) => {
    return quizzes.get(guildId);
}

/**
 * Start a quiz in a guild
 * @param {string} guildId guild id
 * @param {TextChannel} textChannel text channel for guesses
 * @param {VoiceChannel} voiceChannel voice channel for quiz audio
 * @param {string} url spotify url
 * @param {number} count song count
 * @returns {string} starting message string
 */
const startQuiz = async (guildId, textChannel, voiceChannel, url, count) => {
    console.log("Starting quiz in guild " + guildId);
    const quiz = new Quiz(textChannel, voiceChannel, url, count);
    try {
        await quiz.startQuiz();
    } catch {
        throw e;
    }
    quizzes.set(guildId, quiz);
    return quiz.getStartMessage();
};

/**
 * Stop a quiz in a guild
 * @param {string} guildId guild id
 * @returns {string} closing message string
 */
const stopQuiz = async (guildId) => {
    console.log("Stopping quiz in guild " + guildId);
    // if a quiz is running
    const quiz = quizzes.get(guildId);
    if (quiz) {
        try {
            await quiz.stopQuiz();
        } catch (e) {
            throw e;
        }
    }
    quizzes.delete(guildId);
    return quiz.getStopMessage();
};

const skipTrack = async (guildId) => {
    console.log("Stopping quiz in guild " + guildId);
    // if a quiz is running
    const quiz = quizzes.get(guildId);
    if (quiz) {
        const msg = quiz.getTrackMessage();
        if (quiz.currentTrack + 1 < quiz.tracks.length) {
            try {
                quiz.playNextTrack();
            } catch (e) {
                console.error("Error skipping song in guild " + quiz.guildId, e);
                throw new Error("Error skipping song!");
            }
            return msg;
        } else {
            return await stopQuiz(guildId);
        }
    }
};

export default {
    getQuiz,
    startQuiz,
    stopQuiz,
    skipTrack
};
