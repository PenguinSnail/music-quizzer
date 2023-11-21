import { Client, SlashCommandBuilder, Events, ChatInputCommandInteraction } from "discord.js";

import StartSubcommand from "./subcommands/start.js";
import StopSubcommand from "./subcommands/stop.js";
import SkipSubcommand from "./subcommands/skip.js";
import ScoresSubcommand from "./subcommands/scores.js";

export const command = new SlashCommandBuilder()
    .setName("mq")
    .setDescription("Music Quiz")
    .addSubcommand(StartSubcommand.subcommand)
    .addSubcommand(StopSubcommand.subcommand)
    .addSubcommand(SkipSubcommand.subcommand)
    .addSubcommand(ScoresSubcommand.subcommand);

/**
 * Create the music quiz command handler
 * @param {Client} client Discord client
 */
export const createHandler = (client) => {
    const startHandler = StartSubcommand.handlerBuilder();
    const stopHandler = StopSubcommand.handlerBuilder();
    const skipHandler = SkipSubcommand.handlerBuilder();
    const scoresHandler = ScoresSubcommand.handlerBuilder();

    client.on(Events.InteractionCreate,
        /**
         * @param {ChatInputCommandInteraction} interaction
         */
        async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            if (interaction.commandName !== "mq") return;
            const c = interaction.options.getSubcommand();
            if (c === StartSubcommand.name) {
                await startHandler(interaction);
            } else if (c === StopSubcommand.name) {
                await stopHandler(interaction);
            } else if (c === SkipSubcommand.name) {
                await skipHandler(interaction);
            } else if (c === ScoresSubcommand.name) {
                await scoresHandler(interaction);
            } else {
                await interaction.reply('No valid command provided!');
            }
        }
    );
}
