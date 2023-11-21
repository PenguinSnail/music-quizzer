import SpotifyWebApi from "spotify-web-api-node";

/** @type {SpotifyWebApi} */
let spotifyClient;

const createClient = (id, secret) => {
    spotifyClient = new SpotifyWebApi({
        clientId: id,
        clientSecret: secret
    });
};

const authorizeClient = () => new Promise((resolve, reject) => {
    spotifyClient.clientCredentialsGrant().then(response => {
        spotifyClient.setAccessToken(response.body.access_token);
        resolve(response.body.expires_in);
    }, e => {
        reject(e);
    });
});

export default {
    createClient,
    authorizeClient,
};
