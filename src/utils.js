import { Collection, GuildMember } from "discord.js";

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
        "- Studio ",
        "- Edit ",
        "- Radio ",
        "- Main "
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
            .replace(/[&]/g, "and")
            // ignore parentheses text
            .replace(/ *\([^)]*\) */g, "")
            // punctuation
            .replace(/[.,/#!$%^&?*;:{}=\-_'`~]/g, "")
            // spaces
            //.replace(/\s{2,}/g," ");
            .replace(/\s/g, "");
    }
}

/**
 * Calculate a points modifier based on a songs popularity rating
 * @param {number} popularity the song popularity
 * @returns a modifier to add to the score
 */
export function getPopularityModifier(popularity) {
    return Math.round((50 - popularity) * (process.env.POP_PTS / 50));
}

