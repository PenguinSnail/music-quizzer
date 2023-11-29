import { REST, Routes } from "discord.js";
import "dotenv/config";

import { command } from "./src/command.js";

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

if (!process.env.DISCORD_GUILD_ID) {
    console.warn("DISCORD_GUILD_ID is not set!\nPublishing commands globally!");
}

// deploy commands
try {
    console.log(`Started refreshing application (/) command.`);
    // The put method is used to fully refresh all commands in the guild with the current set
    if (process.env.DISCORD_GUILD_ID) {
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, process.env.DISCORD_GUILD_ID),
            { body: [command.toJSON()] },
        );
    } else {
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
            { body: [command.toJSON()] },
        );
    }

    console.log(`Successfully reloaded application (/) command.`);
} catch (error) {
    console.error(error);
}
