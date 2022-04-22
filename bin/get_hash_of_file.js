#!/usr/bin/env node

import { exit } from 'process';
import ct from 'create-torrent'


ct.createTorrent(process.argv[2], torrent=> 
    {
        console.log(torrent.infoHash);
});
