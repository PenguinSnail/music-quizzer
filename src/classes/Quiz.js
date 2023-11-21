export default class Quiz {
    /**
    * Create a new Quiz object
    * @param {TextChannel} textChannel text channel for guesses
    * @param {VoiceChannel} voiceChannel voice channel for quiz audio
    * @param {string} url spotify url
    * @param {number} count song count
    */
    constructor(textChannel, voiceChannel, url, count) {
        this.textChannel = textChannel;
        this.voiceChannel = voiceChannel;
        this.url = url;
        this.count = count;
    }
}