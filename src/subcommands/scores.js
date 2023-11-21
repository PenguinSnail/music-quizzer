import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";

/**
 * Command name
 */
export const name = "scores";

/**
 * Builds the scores subcommand
 * Pass this function to `addSubcommand()`
 * @param {SlashCommandSubcommandBuilder} subcommand Subcommand builder
 */
export const subcommand = (subcommand) => subcommand
    .setName(name)
    .setDescription("View the music quiz scoreboard");

/**
 * Build the handler function for the scores subcommand
 * @returns command handler
 */
export const handlerBuilder = () => {
    /**
     * Handle a call to the scores subcommand
     * @param {ChatInputCommandInteraction} interaction Command interaction
     */
    return async (interaction) => {
        await interaction.reply("Scores Command");
    };
};

export default {
    name: name,
    subcommand: subcommand,
    handlerBuilder: handlerBuilder
};
