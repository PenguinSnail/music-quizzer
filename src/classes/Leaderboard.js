import * as path from "path";
import * as fs from "fs";

// import just for types
// eslint-disable-next-line no-unused-vars
import { Guild } from "discord.js";

const leaderboardPath = path.resolve("leaderboard.json");

class Leaderboard {
	/**
	 * Read data from the leaderboard file
	 * @returns {({} | undefined)} leaderboard data object or undefined on errors
	 */
	readLeaderboard() {
		if (fs.existsSync(leaderboardPath)) {
			let contents;
			try {
				contents = fs.readFileSync(leaderboardPath);
			} catch (e) {
				console.error("Error reading from the leaderboard file!", e);
				return;
			}

			let data;
			try {
				data = JSON.parse(contents);
			} catch (e) {
				console.error("Error parsing the leaderboard file!", e);
				return;
			}

			return data;
		} else {
			console.warn("Leaderboard file doesn't exist! Writing an empty object.");
			this.writeLeaderboard({});

			return {};
		}
	}

	/**
	 * Write data as JSON to the leaderboard file
	 * @param {any} data the data to write
	 */
	writeLeaderboard(data) {
		try {
			fs.writeFileSync(leaderboardPath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
		} catch (e) {
			console.error("Error writing to the leaderboard file!", e);
		}
	}

	/**
	 * Add scores to a guilds leaderboard
	 * @param {Guild} guild the guild to update the leaderboard of
	 * @param {Map<string, number>} scores a map of scores from a round to add to the leaderboard
	 */
	addToGuildBoard(guild, scores) {
		let data = this.readLeaderboard();
		if (!data) {
			console.error("There was an error reading the leaderboard!");
			return;
		}

		if (!data[guild.id]) {
			data[guild.id] = {};
		}

		for (const entry of scores.entries()) {
			if (entry[1] > 0) {
				if (data[guild.id][entry[0]]) {
					data[guild.id][entry[0]] += entry[1];
				} else {
					data[guild.id][entry[0]] = entry[1];
				}
			}
		}

		this.writeLeaderboard(data);
	}

	/**
	 * Get the leaderboard of a guild
	 * @param {Guild} guild the guild to get the leaderboard of
	 * @returns {(Map<string, number> | undefined)} leaderboard data map or undefined on errors
	 */
	getGuildBoard(guild) {
		let data = this.readLeaderboard();
		if (!data) {
			console.error("There was an error reading the leaderboard!");
			return;
		}

		/** @type {Map<string, number>} */
		const dataMap = new Map();

		if (data[guild.id]) {
			Object.keys(data[guild.id]).forEach(key => {
				dataMap.set(key, data[guild.id][key]);
			});
		}

		return dataMap;
	}
}

export default Leaderboard;