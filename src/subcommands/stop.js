import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import QuizManager from "../managers/QuizManager.js";

/**
 * Command name
 */
export const name = "stop";

/**
 * Builds the stop subcommand
 * Pass this function to `addSubcommand()`
 * @param {SlashCommandSubcommandBuilder} subcommand Subcommand builder
 */
export const subcommand = (subcommand) => subcommand
    .setName(name)
    .setDescription("Stop a music quiz");

/**
 * Build the handler function for the stop subcommand
 * @returns command handler
 */
export const handlerBuilder = () => {
    /**
     * Handle a call to the stop subcommand
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
        await interaction.editReply({ content: "Stopping quiz..." });
        try {
            const msg = await QuizManager.stopQuiz(interaction.guildId);
            await interaction.editReply({ content: msg });
        } catch (e) {
            console.error("Error stopping quiz in guild " + interaction.guildId, e);
            await interaction.editReply({ content: e.message, ephemeral: true });
        }
    };
};

export default {
    name: name,
    subcommand: subcommand,
    handlerBuilder: handlerBuilder
};
