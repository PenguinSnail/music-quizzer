import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import ScoreManager from "../managers/ScoreManager.js";

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
        let embed;
        try {
            embed = new EmbedBuilder().setTitle("Music Quiz Scoreboard");
            const board = ScoreManager.getBoard(interaction.guild.id);
            const boardMembers = Array.from(board.keys());
            if (boardMembers.length < 1) {
                embed.setDescription("There are no saved scores! Try playing a music quiz!");
            } else {
                const scores = Array.from(board);
                scores.sort((a, b) => a[1] - b[1]);
                for (const s of scores) {
                    const member = await interaction.guild.members.fetch({ id: s[0] });
                    embed.addFields({ name: member.user.displayName, value: s[1] + " points" });
                }
            }
        } catch (e) {
            console.error("error creating scoreboard in guild " + interaction.guild.id, e);
            await interaction.reply("Error getting scores!");
            return;
        }
        await interaction.reply({ embeds: [embed] });
    };
};

export default {
    name: name,
    subcommand: subcommand,
    handlerBuilder: handlerBuilder
};
