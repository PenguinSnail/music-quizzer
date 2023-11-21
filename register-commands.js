import { REST, Routes } from "discord.js";
import "dotenv/config";

import { command } from "./src/command.js";

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

if (!process.env.DISCORD_GUILD_ID) {
    const confirm = prompt("DISCORD_GUILD_ID is not set!\nThis will publish commands globally!\nAre you sure you wish to continue? [y/N]");
    if (confirm.toLowerCase() !== "y" || confirm.toLowerCase() !== "yes") {
        console.log("Exiting...");
        process.exit(1);
    }
}

// deploy commands
try {
    console.log(`Started refreshing application (/) command.`);
    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, process.env.DISCORD_GUILD_ID ?? undefined),
        { body: [command.toJSON()] },
    );

    console.log(`Successfully reloaded application (/) command.`);
} catch (error) {
    console.error(error);
}
