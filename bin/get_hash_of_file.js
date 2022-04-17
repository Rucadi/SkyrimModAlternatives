#!/usr/bin/env node

import { exit } from 'process';
import WebTorrent from 'webtorrent-hybrid'
const client = new WebTorrent()
client.seed(process.argv[2], torrent=> 
    {
        console.log(torrent.infoHash);
        exit(0);
    });
