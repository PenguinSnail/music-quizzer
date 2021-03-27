// eslint-disable-next-line no-unused-vars
import Discord from "discord.js";
import { points } from "./globals.js";
// eslint-disable-next-line no-unused-vars
import Track from "./classes/Track.js";

// ported from https://github.com/hankhank10/demaster
/**
 * Removes remaster and remix text from song titles
 * @param {string} title the title to clean
 * @returns {string} the cleaned up song title
 */
export function sanitizeTitle(title) {
	let offendingText = [];

	for (let y = 1990; y < new Date().getFullYear(); y++) {
		offendingText.push("- " + y + " - Remast");
		offendingText.push("- " + y + " Remast");
		offendingText.push("(" + y + " Remast");
		offendingText.push("(" + y + " - Remast");
	}

	offendingText = offendingText.concat([
		"- Remast",
		"(Remast",
		"- Live ",
		"(Live at",
		"- Mono / Remast",
		"- From ",
		"- Single ",
		"- Studio "
	]);

	offendingText.forEach(part => {
		if (title.includes(part)) {
			title = title.split(part)[0];
		}
	});

	return title.trim();
}

/**
 * Transform text for title and artist comparisons
 * @param {string} text text to transform
 * @returns {string} transformed text
 */
export function transform(text) {
	if (!text) {
		return "";
	} else {
		return text
		// all lower case
			.toLowerCase()
			// special marks
			.normalize("NFD")
			.replace(/[\u0300-\u036F]/g, "")
			// smart quotes
			.replace(/[\u2018\u2019]/g, "")
			.replace(/[\u201C\u201D]/g, "")
			// ampersands to and
			.replace(/[&]/g,"and")
			// ignore parentheses text
			.replace(/ *\([^)]*\) */g, "")
			// punctuation
			.replace(/[.,/#!$%^&?*;:{}=\-_'`~]/g,"")
			// spaces
			//.replace(/\s{2,}/g," ");
			.replace(/\s/g,"");
	}
}

/**
 * Calculate a points modifier based on a songs popularity rating
 * @param {number} popularity the song popularity
 * @returns a modifier to add to the score
 */
export function getPopularityModifier(popularity) {
	return Math.round((50 - popularity) * (points.modifier / 50));
}

/**
 * Convert a scores map to a string for use in discord messages
 * @param {Map<string, number} scores Quiz scores map
 * @param {Discord.Collection<string, Discord.GuildMember>} members Voice channel members
 * @returns {string} scores as a string to send in a discord message
 */
export function scoresToString(scores, members) {
	return members
		.filter(member => !member.user.bot)
		.array()
		.sort((first, second) => (scores.get(first.id) || 0) < (scores.get(second.id) || 0) ? 1 : -1)
		.map((member, index) => {
			let position = `**${index + 1}.** `;
			if (index === 0) {
				position = ":first_place:";
			} else if (index === 1) {
				position = ":second_place:";
			} else if (index === 2) {
				position = ":third_place:";
			}

			return `${position} ${member.user.username} ${scores.get(member.id) || 0} points`;
		})
		.join("\n");
}

/**
 * Check a guess against a track
 * @param {string} guess the text of the guess to check
 * @param {Track} song the track being guessed
 * @returns {string} includes "artist" if the artist is correct and "title" if the title is correct
 */
export function checkGuess(guess, song) {
	let title = false;
	if (transform(guess).includes(transform(song.title))) {
		title = true;
	}

	let artist = false;
	if (transform(guess).includes(transform(song.artist))) {
		artist = true;
	}

	return `${title ? "title" : ""} ${artist ? "artist" : ""}`;
}