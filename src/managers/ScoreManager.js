import sqlite3 from 'sqlite3';
const scorefile = "./scores.sqlite";
const db = new sqlite3.Database(
    scorefile,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX,
    (err) => {
        if (err !== null) {
            console.error("Error opening scores database file " + scorefile + "!", err);
            process.exit(1);
        }
        console.log("Opened scores database file at " + scorefile);
    }
);

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS scores (guild TEXT, member TEXT, points INT, PRIMARY KEY (guild, member))", (err) => {
        if (err !== null) {
            console.error("Error creating scores table!", err);
            process.exit(1);
        }
    });
});

/**
 * get a guilds scoreboard
 * @param {string} guild guild id
 * @returns {Promise<{
 * guild: string,
 * member: string,
 * points: number
 * }[]>}
 */
const getBoard = (guild) => new Promise((resolve, reject) => {
    db.all("SELECT * FROM scores WHERE guild=?", guild, (err, rows) => {
        if (err !== null) {
            console.error("Error getting scoreboard for guild " + guild + "!", err);
            reject(new Error("Error getting scoreboard!"));
        }
        resolve(rows);
    });
});

/**
 * award points to a member in a guild
 * @param {string} guild guild id
 * @param {string} member member id
 * @param {number} points points to add
 */
const awardPoints = (guild, member, points) => new Promise((resolve, reject) => {
    db.run(
        "INSERT INTO scores (guild, member, points) VALUES (?, ?, ?) ON CONFLICT(guild, member) DO UPDATE SET points=points+?",
        guild, member, points, points,
        (err) => {
            if (err !== null) {
                console.error("Error awarding points to user " + member + " in guild " + guild + "!", err);
                reject("Error awarding points!");
                return;
            }
            resolve();
        });
});

export default {
    getBoard,
    awardPoints
}
