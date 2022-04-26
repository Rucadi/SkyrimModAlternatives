#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

class Utility {
  constructor () {
    this.constants = {
      trackers_path: path.join(__dirname, '..', 'state', 'trackers')
    }
  }

  rtcConfig = {
    iceServers: [
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:80?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'stun:openrelay.metered.ca:80'
      },
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      {
        urls: 'stun:global.stun.twilio.com:3478?transport=udp'
      }
    ],
    sdpSemantics: 'unified-plan',
    iceCandidatePoolsize: 1
  }

  readLinesOfFile = (file, callback) => {
    const data = fs.readFileSync(file, 'utf8')
    // vector of data with newline separator
    const lines = data.split('\n')
    // iterate over each line
    lines.forEach(line => {
      callback(line)
    })
  }

  // read only the first line of a file synchronously
  readFirstLineOfFile = (file) => {
    const data = fs.readFileSync(file, 'utf8')
    return data
  }

  createTorrentFromHashAndName = (hash, name) => {
    return 'magnet:?xt=urn:btih:' + hash + '&dn=' + name + this.getTrackers(this.constants.trackers_path)
  }

  createTorrentFromHash = (hash) => {
    return 'magnet:?xt=urn:btih:' + hash + this.getTrackers(this.constants.trackers_path)
  }

  getTrackers = (trackerList) => {
    let magnet = ''
    this.readLinesOfFile(trackerList, function (line) {
      magnet = magnet + '&tr=' + encodeURIComponent(line)
    })

    return magnet
  }

  getAnnounceList = () => {
    const list = []
    this.readLinesOfFile(this.constants.trackers_path, function (line) {
      list.push(line)
    })
    return list
  }

  constants = {}
};

export default new Utility()
