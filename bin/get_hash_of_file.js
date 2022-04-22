#!/usr/bin/env node

import createTorrent from "create-torrent";
import parseTorrent from "parse-torrent";

createTorrent(process.argv[2], (err, torrent) => {
  console.log(parseTorrent(torrent).infoHash);
});
