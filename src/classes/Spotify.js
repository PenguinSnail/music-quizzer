import SpotifyApi from "spotify-web-api-node";

class Spotify {
	/**
	 * @param {string} id Spotify API ID
	 * @param {string} secret Spotify API secret
	 */
	constructor(id, secret) {
		this.client = new SpotifyApi({
			clientId: id,
			clientSecret: secret
		});

		// reauthorize every hour
		this.reauthorize = setInterval(this.authorize, 1000 * 60 * 60);
		// initial authorization
		this.authorize();
	}

	authorize() {
		return new Promise((resolve, reject) => {
			this.client.clientCredentialsGrant().then(response => {
				this.client.setAccessToken(response.body.access_token);
				resolve();
			}, e => {
				console.error("Error getting Spotify API credentials!", e);
				reject(e);
			});
		});
	}

	/**
	 * Get tracks from a spotify playlist or album URL
	 * @param {string} url the spotify URL
	 * @returns {Promise<SpotifyApi.TrackObjectFull[]>} a promise that resolves an array of SpotifyApi track objects
	 */
	getLinkTracks(url) {
		return new Promise((resolve, reject) => {
			const urlObj = new URL(url);

			if (urlObj.hostname === "open.spotify.com") {
				const pathParts = urlObj.pathname.split("/").filter(part => Boolean(part));

				let tracks = [];
				switch (pathParts[0]) {
				case "playlist":
					this.client.getPlaylist(pathParts[1]).then(response => {
						for (let i = 0; i < response.body.tracks.total; i = i + 100) {
							this.client.getPlaylistTracks(pathParts[1], { offset: i, market: "US" }).then(result => {
								tracks = [
									...tracks,
									...result.body.items.map(t => t.track)
								];
								if (tracks.length === response.body.tracks.total) {
									resolve(tracks);
								}
							});
						}
					});
					break;
				case "album":
					this.client.getAlbum(pathParts[1]).then(response => {
						for (let i = 0; i < response.body.tracks.total; i = i + 100) {
							this.client.getAlbumTracks(pathParts[1], { offset: i, market: "US" }).then(result => {
								tracks = [
									...tracks,
									...result.body.items.map(t => t.track)
								];
								if (tracks.length === response.body.tracks.total) {
									resolve(tracks);
								}
							});
						}
					});
					break;
				default:
					reject("not a playlist or album");
					break;
				}
			} else {
				reject("invalid domain");
			}
		});
	}

	/**
	 * Get a number of random tracks from a spotify playlist or album URL
	 * @param {string} url the spotify URL
	 * @param {number | null} count the number of tracks to return
	 * @returns {object[]} a promise that resolves an array of tracks
	 */
	selectTracks(url, count) {
		return new Promise((resolve, reject) => {
			this.getLinkTracks(url).then(allTracks => {
				const fullTracks = allTracks.filter(t => t).filter(t => t.preview_url);
				const missingTracks = allTracks.filter(t => t).filter(t => !t.preview_url);

				// attempt a refresh of tracks without preview urls
				let missingTrackIdChunks = [];
				for (let i = 0; i < missingTracks.length; i += 25) {
					missingTrackIdChunks.push(missingTracks.slice(i, i+25).map(track => track.id));
				}
				Promise.all(
					missingTrackIdChunks
						.map(chunk => this.client.getTracks(chunk))
				).then(responses => {
					const updatedTracks = responses.map(r => r.body.tracks).flat();
					const combinedTracks = fullTracks.concat(updatedTracks);
					resolve(
						combinedTracks
							.filter(t => t.preview_url)
							.sort(() => Math.random() > 0.5 ? 1 : -1)
							.slice(0, count ? count : combinedTracks.length - 1)
					);
				});
			}, reject);
		});
	}
}

export default Spotify;