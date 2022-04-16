#!/usr/bin/env node

import fs from 'fs'
import WebTorrent from 'webtorrent-hybrid'
import sqlite3 from 'sqlite3';
import { exit } from 'process';
import readline from 'readline'
import fsx from 'fs-extra';


const db_name = "SMA.db";
const log_name = "SMA.log";
let db;

function createTorrentFromHashAndName(hash, name)
{
    return "magnet:?xt=urn:btih:"+hash+"&dn="+name+"&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com";
}

function createTorrentFromHash(hash)
{
    return "magnet:?xt=urn:btih:"+hash+"&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com";
}


const releaseVersiondatabaseMagnetTorrent = createTorrentFromHashAndName("435a2aa434779fc3db85c81d7d10e4c93c82482e", db_name);
var log_file = fs.createWriteStream(process.cwd() + log_name, {flags : 'w'});

const client = new WebTorrent();
var trackedFiles = new SharedArrayBuffer(2);
trackedFiles[0] = 0;//downloading
trackedFiles[1] = 0;//downloaded


if(process.argv.length <=2) 
{
    console.log("node download.js <modlist.txt> <downloadDirectory>?");
    exit();
}

const modlist =  process.argv.length > 2? process.argv[2]  : "";
const downloadDirectory =  process.argv.length > 3? process.argv[3]  : process.cwd()+"/downloads";

if(!fs.statSync(modlist).isFile())
{
    console.log("modlist.txt is not a file");
    exit(); 
}

if(fsx.ensureDirSync(downloadDirectory))
{
    console.log(downloadDirectory + "is not a directory or already exists");
    exit();
}

 //If SMA.db does not exists, then download it from torrent
 if(!fs.existsSync(db_name))
 {
   console.log("Downloading "+db_name+"+ from torrent");
   client.add(releaseVersiondatabaseMagnetTorrent, function(torrent) {
     torrent.on('done', function(torrent)
     {
       console.log(db_name+" downloaded successfully");
       init();
     })
   });
 }
 else init();



 function init () {
    client.seed(db_name,  function(torrent) {console.log("Seeding "+db_name);});//Seed SMA.db
    db = new sqlite3.Database(db_name);
    var r1 = readline.createInterface({
        input: fs.createReadStream(modlist),
        output: process.stdout,
        terminal: false
    });
    r1.on('line', function(line) {
        if(line.includes('#')) return;
        let tline = line.trim();
        db.get("SELECT * FROM mods WHERE torrentHash = ?", tline, (err, row) => {
            if (typeof row === "undefined")
            {
                console.log('Hash ' + tline + ' Is not on the mod database.');
            }
            else
            {
                console.log("Begin downloading " + row.name);
                client.add(createTorrentFromHash(tline), {path: downloadDirectory}, function(torrent) {//we don't use the name because it's not needed
                    trackedFiles[0]++;
                    torrent.on('done', function(torrent)
                    {
                        trackedFiles[0]--;
                        trackedFiles[1]++;
                        log_file.write("["+row.torrentHash+"]"+row.name + " downloaded successfully\n");
                    })                    
                })
            }
          });
    });

    
    setInterval(function() {
        process.stdout.clearLine();
        process.stdout.write("DOWN: "+client.downloadSpeed+ " UP: "+ client.uploadSpeed + " Downloaded: "+ trackedFiles[1] + " Remaining: "+ trackedFiles[0] +" Progress: "+client.progress+"\r");
    }, 1000);   //
    
  }
  