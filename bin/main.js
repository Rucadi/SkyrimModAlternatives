#!/usr/bin/env node

import fs from 'fs'
import WebTorrent from 'webtorrent'
import sqlite3 from 'sqlite3';
import { exit } from 'process';
import fsx from 'fs-extra';
import path from 'path';
import util from './utils.js';
import https from 'https';
import wrtc from 'wrtc'
import ct from 'create-torrent'
import SimplePeer from 'simple-peer';
import createTorrent from "create-torrent";
import parseTorrent from "parse-torrent";

const rtcConfig = {
    iceServers: [
        {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:80?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "stun:openrelay.metered.ca:80",
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

  

const client = new WebTorrent(
    {
        webSeeds: true,
        tracker: {
            rtcConfig: {
                ...SimplePeer.config,
                ...rtcConfig
            }
        }
    }
)

 //If SMA.db does not exists, then download it from torrent
function ensureDatabase(callback)
{
    if(!fs.existsSync(util.constants.db_path))
    {
        if(!fs.existsSync(util.constants.database_from_torrent_path))
        {
            fsx.ensureDirSync(path.dirname(util.constants.db_path));
            https.get(util.constants.database_from_github_url,(res) => {
                const path = util.constants.db_path; 
                const filePath = fs.createWriteStream(path);
                res.pipe(filePath);
                filePath.on('finish',() => {
                    filePath.close();
                    callback(new sqlite3.Database(util.constants.db_path));
                })
            })
        }
        else 
        {
            console.log("Downloading "+util.constants.db_name+" from torrent");
            client.add(util.createTorrentFromHash(util.constants.db_hash), {path: path.dirname(util.constants.db_path)}, function(torrent) {
                torrent.on('done', function(torrent)
                {
                    console.log(util.constants.db_name+" downloaded successfully");
                    callback(new sqlite3.Database(util.constants.db_path));
                })
            });
        }
    }
    else 
    {   
        client.seed(util.constants.db_path, {announce: util.getAnnounceList()});
        callback(new sqlite3.Database(util.constants.db_path));
    }
}


function downloadSingle(db, hash, downloadDirectory, force)
{
    if(force)
    {
        console.log("downloading ", hash);
        client.add(util.createTorrentFromHash(hash), {path: downloadDirectory, announce: util.getAnnounceList()}, function(torrent) {
            torrent.on('done', function(torrent)
            {
                console.log("Downloaded!!!");
                exit(0);
            })
        });
    }
    else
    db.get("SELECT * FROM mods WHERE TorrentHash = ?", hash, (err, row) => {
        if(typeof row == "undefined") 
        {
            console.log("Hash "+hash+" is not on the mod database");
            exit();
        }
        else{
            console.log("Trying to download: "+row.Name);
            client.add(util.createTorrentFromHash(hash), {path: downloadDirectory, announce: util.getAnnounceList()}, function(torrent) {
                torrent.on('done', function(torrent)
                {
                    console.log(row.Name + " downloaded successfully");
                    exit(0);
                })
            });
        }
        });
}

function download(db, modlist, downloadDirectory)
{
    var log_file = fs.createWriteStream(process.cwd() + "/sma_download.log", {flags : 'w'});

    var trackedFiles = new SharedArrayBuffer(2);
    trackedFiles[0] = 0;//downloading
    trackedFiles[1] = 0;//downloaded

    fsx.ensureDirSync(downloadDirectory);

    if(!fs.statSync(modlist).isFile())
    {
        console.log("modlist.txt is not a file");
        exit(); 
    }

    util.readLinesOfFile(modlist, function(line) {
        if(line.includes('#')) return;
        let tline = line.trim();
        if(tline.length == 0) return;
        db.get("SELECT * FROM mods WHERE TorrentHash = ?", tline, (err, row) => {
            if (typeof row === "undefined")
                log_file.write('Hash ' + tline + ' Is not on the mod database.\n');
            else
            {
                trackedFiles[0]++;
                client.add(util.createTorrentFromHash(tline), {path: downloadDirectory, announce: util.getAnnounceList()}, function(torrent) {//we don't use the name because it's not needed
                    log_file.write("["+row.TorrentHash+"]"+row.Name + " Downloading...\n");
                    torrent.on('done', function(torrent)
                    {
                        trackedFiles[0]--;
                        trackedFiles[1]++;
                        log_file.write("["+row.TorrentHash+"]"+row.Name + " downloaded successfully\n");
                    })                    
                })
            }
          });
    });


    setInterval(function() {
        process.stdout.clearLine();
        process.stdout.write("DOWN: "+client.downloadSpeed+ " UP: "+ client.uploadSpeed + " Downloaded: "+ trackedFiles[1] + " Remaining: "+ trackedFiles[0] +" Progress: "+client.progress+"\r");
    }, 1000); 
}


function seed(db, seedDirectory, force)
{
    var log_file = fs.createWriteStream(process.cwd() + "/sma_seed.log", {flags : 'w'});
    fs.readdir(seedDirectory, (err, files) => 
    {
        if (err) { throw err; }
        files.forEach(file => {
            console.log(file)
            createTorrent(path.join(seedDirectory,file), (err, torrent) => {
                if (force)
                {                               
                    log_file.write("Seeding: " + torrent.name);
                    client.seed(torrent, { announce: util.getAnnounceList() });
                }
                else {
                    db.get("SELECT * FROM mods WHERE TorrentHash = ?", torrent.infoHash, (err, row) => {
                        if (typeof row === "undefined") {
                            log_file.write('File ' + torrent.name + ' ' + torrent.infoHash + ' Is not on the mod database.');
                        }
                        else {
                            log_file.write("Seeding: " + torrent.name);
                            client.seed(torrent, { announce: util.getAnnounceList() });
                        }
                    });
                }
            });
        });
    });

    setInterval(function() {
        process.stdout.clearLine();
        process.stdout.write("DOWN: "+client.downloadSpeed+ " UP: "+ client.uploadSpeed + " Ratio: " + client.ratio+ " \r");
      }, 1000);   //Stats every second
}


const getDirectories = (source, callback) =>
  fs.readdir(source, { withFileTypes: true }, (err, files) => {
    if (err) {
      callback(err)
    } else {
      callback(
        files
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
      )
    }
  })

function seedFolders(db, seedDirectory, force)
{
    var log_file = fs.createWriteStream(process.cwd() + "/sma_seed.log", {flags : 'w'});
    getDirectories(seedDirectory, (directory) => {
        for(let a of directory)
        {
            client.seed(path.join(seedDirectory, a).toString() , { announce: util.getAnnounceList() }, (torrent) => {
                console.log("seeding: " + torrent.name+ " "+torrent.infoHash);
            });
        }


    });

    setInterval(function() {
        process.stdout.clearLine();
        process.stdout.write("DOWN: "+client.downloadSpeed+ " UP: "+ client.uploadSpeed + " Ratio: " + client.ratio+ " \r");
      }, 1000);   //Stats every second
}

function init(db)
{
    let print_help = () => 
    {
        console.log("\x1b[34m%s\x1b[0m", "Skyrim Mod Alternatives CLI");

        console.log("");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Download a mod:", "sma get <modhash>");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Download a modlist:", "sma list <modlist.txt> <downloadDirectory>");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Seed a folder:", "sma seed <directory>");
        console.log("");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Example:", "sma list modlist.txt mod_downloads");
    };
    //check if there is an argument
    if(process.argv.length <=2)
    {
        print_help();
        exit(0);
    }

    //check if argument is seed or download 
    if(process.argv[2] == "list")
    {
        if(process.argv.length <= 3)
        {
            console.log(process.argv.length); //missing modlist.txt
            print_help();
            exit();
        }

        let modlist = process.argv[3];
        let downloadDirectory = process.argv.length > 4? process.argv[4]  : process.cwd()+"/downloads";
        download(db, modlist, downloadDirectory);
    }
    else if(process.argv[2] == "seed")
    {
        
        if(process.argv.length <= 3)
        {
            print_help();
            exit();
        }
        let seed_folder = process.argv[3];
        let force = process.argv.length > 4? true  : false;
        seed(db, seed_folder,force);
    }
    else if(process.argv[2]== "fseed")
    {
        if(process.argv.length <= 3)
        {
            print_help();
            exit();
        }
        let seed_folder = process.argv[3];
        let force = process.argv.length > 4? true  : false;
        seedFolders(db, seed_folder, force);
    }
    else if(process.argv[2] == "get")
    {
        
        if(process.argv.length <= 3)
        {
            print_help();
            exit();
        }
        let hash = process.argv[3];
        let force = process.argv.length > 4? true  : false;

        downloadSingle(db, hash, ".", force);
    }
    else
    {
        print_help();
        exit();
    }
}

ensureDatabase((db)=>{
    init(db);    
});



