import "dotenv/config";
import { Client as DiscordClient, Events, GatewayIntentBits } from "discord.js";
import SpotifyManager from "./src/managers/SpotifyManager.js";
import ScoreManager from "./src/managers/ScoreManager.js";
import { createHandler } from "./src/command.js";

if (!process.env.DISCORD_TOKEN || !process.env.SPOTIFY_ID || !process.env.SPOTIFY_SECRET) {
    if (!process.env.DISCORD_TOKEN) console.error("`DISCORD_TOKEN` not set!");
    if (!process.env.SPOTIFY_ID) console.error("`SPOTIFY_ID` not set!");
    if (!process.env.SPOTIFY_SECRET) console.error("`SPOTIFY_SECRET` not set!");
    process.exit(1);
}

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

// create handlers for music quiz slash commands
createHandler(discordClient);

discordClient.on(Events.MessageCreate, message => {
    // ignore bots
    if (message.author.bot) return;
});

discordClient.on("ready", () => {
    console.log(`Logged in as ${discordClient.user.tag}`);
});

const refreshSpotify = () => {
    SpotifyManager.authorizeClient()
        .then(t => {
            console.log("Spotify API credentials set (expires in " + t / 60 + " minutes)");
        })
        .catch(e => {
            console.error("Error connecting to Spotify!", e);
            process.exit(1);
        });
}

// Login -------------------------------

SpotifyManager.createClient(process.env.SPOTIFY_ID, process.env.SPOTIFY_SECRET);
setInterval(refreshSpotify, 1000 * 60 * 55);
refreshSpotify();

discordClient.login(process.env.DISCORD_TOKEN).catch(e => {
    console.error("Error connecting to Discord!", e);
    process.exit(1);
});
