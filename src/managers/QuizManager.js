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
 */
const startQuiz = (guildId, textChannel, voiceChannel, url, count) => {
    const quiz = new Quiz(textChannel, voiceChannel, url, count);
    quizzes.set(guildId, quiz);
};

/**
 * Stop a quiz in a guild
 * @param {string} guildId guild id
 */
const stopQuiz = (guildId) => {
    const quiz = quizzes.get(guildId);
    if (quiz) {
        
    }
    quizzes.delete(guildId);
};

export default {
    getQuiz,
    startQuiz,
    stopQuiz
};
