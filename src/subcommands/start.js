import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction
} from "discord.js";
import QuizManager from "../managers/QuizManager.js";

/**
 * Command name
 */
export const name = "start";

/**
 * Builds the start subcommand
 * Pass this function to `addSubcommand()`
 * @param {SlashCommandSubcommandBuilder} subcommand Subcommand builder
 */
export const subcommand = (subcommand) => subcommand
    .setName(name)
    .setDescription("Start a music quiz")
    .addStringOption((option) => option
        .setName("url")
        .setDescription("Spotify playlist or album URL")
        .setRequired(true)
    )
    .addIntegerOption((option) => option
        .setName("count")
        .setDescription("The number of songs to include in the quiz (defaults to all songs if omitted)")
        .setMinValue(1)
        .setRequired(false)
    );

/**
 * Build the handler function for the start subcommand
 * @returns command handler
 */
export const handlerBuilder = () => {
    /**
     * Handle a call to the start subcommand
     * @param {ChatInputCommandInteraction} interaction Command interaction
     */
    return async (interaction) => {
        await interaction.deferReply();
        if (QuizManager.getQuiz(interaction.guildId)) {
            await interaction.editReply({ content: "A quiz is already active in this server!", ephemeral: true });
            return;
        }
        if (!interaction.member.voice.channel) {
            await interaction.editReply({ content: "You need to be in a voice channel to start a music quiz!", ephemeral: true });
            return;
        }
        try {
            await QuizManager.startQuiz(
                interaction.guildId,
                interaction.channel,
                interaction.member.voice.channel,
                interaction.options.getString("url"),
                interaction.options.getInteger("count")
            );
            await interaction.editReply({ content: "Starting the quiz..." });
        } catch (e) {
            console.error("Error starting quiz in guild " + interaction.guildId, "(" + e.name + ": " + e.message + ")");
            await interaction.editReply({ content: e.message, ephemeral: true });
        }
    };
};

export default {
    name: name,
    subcommand: subcommand,
    handlerBuilder: handlerBuilder
};
