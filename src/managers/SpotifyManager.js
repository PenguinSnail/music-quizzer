import SpotifyWebApi from "spotify-web-api-node";
import Track from "../classes/Track.js";

/** @type {SpotifyWebApi} */
let spotifyClient;

/**
 * Create the Spotify API client
 * @param {string} id Spotify API ID
 * @param {string} secret Spotify API Secret
 */
const createClient = (id, secret) => {
    spotifyClient = new SpotifyWebApi({
        clientId: id,
        clientSecret: secret
    });
};

/**
 * Authorize a connection to the Spotify API
 * @returns {Promise<number>} resolves the number of seconds until the credentials expire
 */
const authorizeClient = () => new Promise((resolve, reject) => {
    spotifyClient.clientCredentialsGrant().then(response => {
        spotifyClient.setAccessToken(response.body.access_token);
        resolve(response.body.expires_in);
    }, e => {
        reject(e);
    });
});

/**
 * Get an array of Track objects from a spotify url
 * @param {string} url spotify playlist or album url
 * @param {number | undefined} count the number of tracks to get
 * @returns {Promise<Track[]>}
 * @throws user friendly error message
 */
const getTracks = async (url, count) => {
    /** @type {Track[]} */
    let tracks = [];
    /** @type {URL} */
    let urlObj;
    try {
        urlObj = new URL(url);
    } catch (e) {
        throw new Error("Not a valid URL!");
    }
    if (urlObj.hostname !== "open.spotify.com") {
        throw new Error("Not a Spotify URL!");
    }
    const pathParts = urlObj.pathname.split("/").filter(part => Boolean(part));

    if (pathParts[0] === "playlist") {
        // get playlist info
        let response;
        try {
            response = await spotifyClient.getPlaylist(pathParts[1]);
        } catch (e) {
            console.error("Error retrieving info about playlist " + pathParts[1], "(" + e.name + ": " + e.message + ")");
            throw new Error("Error getting playlist info!");
        }
        // loop over each 100-track page
        for (let i = 0; i < response.body.tracks.total; i = i + 100) {
            // get individual tracks
            let result;
            try {
                result = await spotifyClient.getPlaylistTracks(pathParts[1], { offset: i, market: "US" })
            } catch (e) {
                console.error("Error getting tracks for playlist " + pathParts[1], "(" + e.name + ": " + e.message + ")");
                throw new Error("Error getting playlist tracks!");
            }
            // append as Track objects
            tracks = [
                ...tracks,
                ...result.body.items.map(t => new Track(t.track))
            ];
        }
    } else if (pathParts[0] === "album") {
        // get album info
        let response;
        try {
            response = await spotifyClient.getAlbum(pathParts[1]);
        } catch (e) {
            console.error("Error retrieving info about album " + pathParts[1], "(" + e.name + ": " + e.message + ")");
            throw new Error("Error getting album info!");
        }
        // loop over each 100-track page
        for (let i = 0; i < response.body.tracks.total; i = i + 100) {
            // get individual tracks
            let result;
            try {
                result = await spotifyClient.getAlbumTracks(pathParts[1], { offset: i, market: "US" })
            } catch (e) {
                console.error("Error getting tracks for album " + pathParts[1], "(" + e.name + ": " + e.message + ")");
                throw new Error("Error getting album tracks!");
            }
            // append as Track objects
            tracks = [
                ...tracks,
                ...result.body.items.map(t => new Track(t.track))
            ];
        }
    } else {
        throw new Error("Not a valid playlist or album!");
    }

    const randomizedTracks = tracks
        .filter(t => t.previewUrl)
        .sort(() => Math.random() > 0.5 ? 1 : -1)
        .slice(0, count ?? tracks.length - 1)
    return randomizedTracks;
};

export default {
    createClient,
    authorizeClient,
    getTracks
};
