#!/usr/bin/env node

import fs from 'fs'
import WebTorrent from 'webtorrent-hybrid'
import path from 'path';
import sqlite3 from 'sqlite3';

const db_name = "SMA.db";
let db;
const currentDatabaseHash = "435a2aa434779fc3db85c81d7d10e4c93c82482e";
const releaseVersiondatabaseMagnetTorrent = "magnet:?xt=urn:btih:"+currentDatabaseHash+"&dn=SMA.db&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com";
const client = new WebTorrent()


const seedDirectory =  process.argv.length > 2? process.argv[2]  : process.cwd();
 //If SMA.db does not exists, then download it from torrent
 if(!fs.existsSync(db_name))
 {
   console.log("Downloading "+db_name+" from torrent");
   client.add(releaseVersiondatabaseMagnetTorrent, function(torrent) {
     torrent.on('done', function(torrent)
     {
       console.log(db_name+" downloaded successfully");
       init();
     })
   });
 }
 else init();



function onSeedBegin(torrent)
{
  db.get("SELECT * FROM mods WHERE torrentHash = ?", torrent.infoHash, (err, row) => {
    if (typeof row === "undefined")
    {
      torrent.destroy(function () {
        console.log('File ' + torrent.name + ' Is not on the mod database but the name matches.');
      });
    }
    else console.log("Seeding: " + torrent.name);
  });   
}


function init () {
  client.seed(db_name,  function(torrent) {console.log("Seeding SMA.db");});//Seed SMA.db
  db = new sqlite3.Database(db_name);

  fs.readdir(seedDirectory, (err, files) => 
  {
      if(err){throw err;}

      files.forEach(file => {
        if(file == db_name) return;
        const filepath = path.join(seedDirectory, file);

        db.get("SELECT * FROM mods WHERE filename = ?", file, (err, row) => {
          if (typeof row !== "undefined" && fs.statSync(filepath).isFile())
          {
            client.seed(filepath, onSeedBegin);
          }
        });   
        
      });
  });

  setInterval(function() {
    process.stdout.clearLine();
    process.stdout.write("DOWN: "+client.downloadSpeed+ " UP: "+ client.uploadSpeed + " Ratio: " + client.ratio+ " \r");
  }, 1000);   //

}
