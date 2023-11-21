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
        if (QuizManager.guildHasQuiz(interaction.guildId)) {
            await interaction.reply("A quiz is already active in this server!");
            return;
        }
        if (!interaction.member.voice.channel) {
            await interaction.reply("You need to be in a voice channel to start a music quiz!");
            return;
        }
        try {
            await interaction.reply("Starting Quiz...");
            QuizManager.startQuiz(
                interaction.guildId,
                interaction.channel,
                interaction.member.voice.channel,
                interaction.options.getString("url"),
                interaction.options.getInteger("count")
            );
        } catch (e) {
            console.error("Error starting quiz in guild " + interaction.guildId, e);
            await interaction.reply("There was an error starting the quiz!");
        }
    };
};

export default {
    name: name,
    subcommand: subcommand,
    handlerBuilder: handlerBuilder
};
