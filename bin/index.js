const mqtt = require("mqtt");
const Lodash = require('lodash');
const client = mqtt.connect("mqtt://sonos.local");
const rootTopic = 'shairport-sync/f1';

const known_play_metadata_types = {
  title: 'text of song title',
  artist: 'text of artist name',
  album: 'text of album name',
  genre: 'genre',
  songalbum: 'songalbum',
  cover: 'cover',
  volume: 'The volume is sent as a string -- "airplay_volume,volume,lowest_volume,highest_volume", where "volume", "lowest_volume" and "highest_volume" are given in dB.',
  track_id: 'track_id',
  active_remote_id: 'Active Remote ID',
  client_ip: 'IP address of the connected client',
  client_device_id: 'Client advertised Device ID',
  client_mac_address: 'Client advertised MAC address',
  client_model: 'Client advertised model ("iPhone14,2")',
  client_name: 'Client advertised name ("Joes iPhone")',
  dacp_id: 'DACP ID',
  server_ip: 'IP address of shairport-sync that the client is connected to',
  active_start: 'fired when a new active airplay session begins',
  active_end: 'fired after a configured timeout period after the stream ends (unless a new stream begins)',
  play_start: 'fired at the begining of every song',
  play_end: 'fired at the end of every song',
  play_flush: 'fired when song is skipped or on positional change',
  play_resume: 'fired when song play resumes from pause',
  service_name: 'service_name: f1',
  output_frame_rate: 'output_frame_rate: 44100',
  output_format: 'output_format: S32',
}

const known_ssnc_types = {
  PICT: 'the payload is a picture, either a JPEG or a PNG. Check the first few bytes to see which.',
  acre: 'Active Remote',
  cdid: 'Client advertised Device ID',
  clip: 'the payload is the IP address of the client, i.e. the sender of audio. Can be an IPv4 or an IPv6 address.',
  cmac: 'Client advertised MAC address',
  cmod: 'Client advertised model ("iPhone14,2")',
  daid: 'DACP ID',
  dapo: 'DACP Port',
  mdst: 'a sequence of metadata is about to start. The RTP timestamp associated with the metadata sequence is included as data, if available.',
  mden: 'a sequence of metadata has ended. The RTP timestamp associated with the metadata sequence is included as data, if available.',
  pcst: 'a picture is about to be sent. The RTP timestamp associated with it is included as data, if available.',
  pcen: 'a picture has been sent. The RTP timestamp associated with it is included as data, if available.',
  pbeg: 'play stream begin. No arguments',
  pend: 'play stream end. No arguments',
  pfls: 'play stream flush. No arguments',
  prsm: 'play stream resume. No arguments',
  prgr: 'progress -- this is metadata from AirPlay consisting of RTP timestamps for the start of the current play sequence, the current play point and the end of the play sequence.',
  pvol: `play volume. The volume is sent as a string 
    -- "airplay_volume,volume,lowest_volume,highest_volume", where "volume", 
    "lowest_volume" and "highest_volume" are given in dB. The "airplay_volume" 
    is what's sent by the source (e.g. iTunes) to the player, and is from 0.00 
    down to -30.00, with -144.00 meaning "mute". This is linear on the volume 
    control slider of iTunes or iOS AirPlay. If the volume setting is being 
    ignored by Shairport Sync itself, the volume, lowest_volume and highest_volume values are zero.`,
  snam: `=client_name, a device e.g. "Joe's iPhone" has started a play session. Specifically, 
    it's the "X-Apple-Client-Name" string for AP1, or direct from the configuration Plist for AP2.`,
  snua: `a "user agent" e.g. "iTunes/12..." has started a play session. Specifically, it's the "User-Agent" string.`,
  stal: 'this is an error message meaning that reception of a large piece of metadata, usually a large picture, has stalled; bad things may happen.',
  svip: ' the payload is the IP address of the server, i.e. shairport-sync. Can be an IPv4 or an IPv6 address.',
  ofps: '=output_frame_rate: 44100',
  svoa: '=service_name: f1',
  ofmt: '=output_formant: S32',
}

const known_core_types = {
  asal: 'album',
  asar: 'artist',
  ascp: 'composer',
  asgn: 'genre',
  astm: 'song time',
  caps: 'play status (stopped, paused, playing)',
  minm: 'title',
  mper: 'track persistent id',
}

const known_remote_commands = [
  "command",
  "beginff",
  "beginrew",
  "mutetoggle",
  "nextitem",
  "previtem",
  "pause",
  "playpause",
  "play",
  "stop",
  "playresume",
  "shuffle_songs",
  "volumedown",
  "volumeup",
]



client.on("connect", () => {
  Lodash.each(Lodash.keys(known_play_metadata_types), (topic) => {
    client.subscribe(`${rootTopic}/${topic}`, (err) => {
      if (!err) {
        // client.publish("presence", "Hello mqtt");
      }
    });
  });
  Lodash.each(Lodash.keys(known_core_types), (topic) => {
    client.subscribe(`${rootTopic}/core/${topic}`, (err) => {
      if (!err) {
        // client.publish("presence", "Hello mqtt");
      }
    });
  });
  Lodash.each(Lodash.keys(known_ssnc_types), (topic) => {
    client.subscribe(`${rootTopic}/ssnc/${topic}`, (err) => {
      if (!err) {
        // client.publish("presence", "Hello mqtt");
      }
    });
  });
});

client.on("message", (topic, message) => {
  // message is Buffer
  console.log(topic, message.toString());
  // client.end();
});