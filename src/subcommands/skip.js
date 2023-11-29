import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import QuizManager from "../managers/QuizManager.js";

/**
 * Command name
 */
export const name = "skip";

/**
 * Builds the skip subcommand
 * Pass this function to `addSubcommand()`
 * @param {SlashCommandSubcommandBuilder} subcommand Subcommand builder
 */
export const subcommand = (subcommand) => subcommand
    .setName(name)
    .setDescription("Skip a song during a music quiz");

/**
 * Build the handler function for the skip subcommand
 * @returns command handler
 */
export const handlerBuilder = () => {
    /**
     * Handle a call to the skip subcommand
     * @param {ChatInputCommandInteraction} interaction Command interaction
     */
    return async (interaction) => {
        await interaction.deferReply();
        const quiz = QuizManager.getQuiz(interaction.guildId);
        if (!quiz) {
            await interaction.editReply({ content: "There is no active quiz in this server!" });
            return;
        }
        if (interaction.member.voice.channel !== quiz.voiceChannel) {
            await interaction.editReply({ content: "You need to be in the voice channel to stop a music quiz!" });
            return;
        }
        await interaction.editReply({ content: "Skipping the song..." });
        try {
            const msg = await QuizManager.skipTrack(interaction.guildId);
            await interaction.editReply({ content: msg });
        } catch (e) {
            console.error("Error skipping song in guild " + interaction.guildId, e);
            await interaction.editReply({ content: e.message, ephemeral: true });
        }
    };
};

export default {
    name: name,
    subcommand: subcommand,
    handlerBuilder: handlerBuilder
};
