import fs from 'fs';

const scorefile = "./scores.json";

/** @type {Map<string, Map<string, number>>} */
const scoreboards = new Map();

/**
 * reset a guilds board to a blank state
 * @param {string} guild guild id
 */
const resetBoard = (guild) => {
    scoreboards.set(guild, new Map());
}

/**
 * get a guilds scoreboard
 * @param {string} guild guild id
 * @returns {Map<string, number>}
 */
const getBoard = (guild) => {
    if (!scoreboards.get(guild)) resetBoard(guild);
    return scoreboards.get(guild);
}

/**
 * award points to a member in a guild
 * @param {string} guild guild id
 * @param {string} member member id
 * @param {number} points points to add
 * @returns {number} new points total
 */
const awardPoints = (guild, member, points) => {
    const board = getBoard(guild);
    const currentPoints = board.get(member) ?? 0;
    board.set(member, currentPoints + points);
    return currentPoints + points;
}

const loadBoards = () => {
    if (fs.existsSync(scorefile)) {
        let data;
        try {
            const contents = fs.readFileSync(scorefile);
            data = JSON.parse(contents);
        } catch (e) {
            console.error("Error reading score file!", e);
            return;
        }
        try {
            for (const guild of Object.keys(data)) {
                const scores = new Map();
                for (const member of data[guild]) {
                    scores.set(member, data[guild][member]);
                }
                scoreboards.set(guild, scores);
            }
        } catch (e) {
            console.error("Error setting scoreboards!", e);
            return;
        }
    } else {
        console.warn("No score file found!");
    }
}

const dumpBoards = () => {
    let dumpObj = {};
    for (const board of scoreboards) {
        let scores = {};
        for (const score of board[1]) {
            scores[score[0]] = score[1];
        }
        dumpObj[board[0]] = scores;
    }
    try {
        fs.writeFileSync(scorefile, JSON.stringify(dumpObj));
    } catch (e) {
        console.error("Error dumping scoreboards to disk!", e);
        return;
    }
}

export default {
    resetBoard,
    getBoard,
    awardPoints,
    loadBoards,
    dumpBoards
}