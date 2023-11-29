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
            const board = await ScoreManager.getBoard(interaction.guild.id);
            if (board.length < 1) {
                embed.setDescription("There are no saved scores! Try playing a music quiz!");
            } else {
                board.sort((a, b) => a.points - b.points);
                for (const score of board) {
                    const member = await interaction.guild.members.fetch({ user: score.member });
                    embed.addFields({ name: member.user.displayName, value: score.points + " points" });
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
