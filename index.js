import "dotenv/config";
import { Client as DiscordClient, Events, GatewayIntentBits } from "discord.js";
import { createHandler } from "./src/command.js";

// Clients -----------------------------

const discordClient = new DiscordClient({
    intents: [
        GatewayIntentBits.Guilds,                // access guild info
        GatewayIntentBits.GuildMembers,          // access users
        GatewayIntentBits.GuildMessages,         // access messages
        GatewayIntentBits.MessageContent,        // access messages
        GatewayIntentBits.GuildMessageReactions, // react to messages
        GatewayIntentBits.GuildVoiceStates,      // access voice
    ]
});

// Handlers ----------------------------

discordClient.on(Events.MessageCreate, message => {
    // ignore bots
    if (message.author.bot) return;
});

createHandler(discordClient);

// Login -------------------------------

discordClient.on("ready", () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
});
discordClient.login(process.env.DISCORD_TOKEN);
