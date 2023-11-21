import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";

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
        await interaction.reply("Skip Command");
    };
};

export default {
    name: name,
    subcommand: subcommand,
    handlerBuilder: handlerBuilder
};
