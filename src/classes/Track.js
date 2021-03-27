import { sanitizeTitle } from "../utils.js";

class Track {
	/**
	 * @param {SpotifyApi.TrackObjectFull} spotifyTrack the Spotify API track object
	 */
	constructor(spotifyTrack) {
		this.title = sanitizeTitle(spotifyTrack.name);
		this.artist = (spotifyTrack.artists[0] || {}).name;
		this.popularity = spotifyTrack.popularity;
		this.duration = spotifyTrack.duration_ms;
		this.trackUrl = `https://open.spotify.com/track/${spotifyTrack.id}`;
		this.previewUrl = spotifyTrack.preview_url;
	}
}

export default Track;