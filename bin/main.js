#!/usr/bin/env node

import fs from 'fs'
import WebTorrent from 'webtorrent-hybrid'
import sqlite3 from 'sqlite3';
import { exit } from 'process';
import fsx from 'fs-extra';
import path from 'path';
import util from './utils.js';
import https from 'https';


const client = new WebTorrent()

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
        client.seed(util.constants.db_path);
        callback(new sqlite3.Database(util.constants.db_path));
    }
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
                client.add(util.createTorrentFromHash(tline), {path: downloadDirectory}, function(torrent) {//we don't use the name because it's not needed
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


function seed(db, seedDirectory)
{
    var log_file = fs.createWriteStream(process.cwd() + "/sma_seed.log", {flags : 'w'});

    function onSeedBegin(torrent)
    {
        db.get("SELECT * FROM mods WHERE TorrentHash = ?", torrent.infoHash, (err, row) => {
            if (typeof row === "undefined")
            {
                torrent.destroy(function () {
                    log_file.write('File ' + torrent.name + ' Is not on the mod database but the name matches.');
                });
            }
            else log_file.write("Seeding: " + torrent.name);
        });   
    }

    fs.readdir(seedDirectory, (err, files) => 
    {
        if(err){throw err;}
  
        files.forEach(file => {

          const filepath = path.join(seedDirectory, file);
          db.get("SELECT * FROM mods WHERE filename = ?", file, (err, row) => 
          {
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
      }, 1000);   //Stats every second
}



function init(db)
{
    let print_help = () => 
    {
        console.log("\x1b[34m%s\x1b[0m", "Skyrim Mod Alternatives CLI");

        console.log("");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Download a modlist:", "sma download <modlist.txt> <downloadDirectory>");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Seed a folder:", "sma seed <directory>");
        console.log("");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Example:", "sma download modlist.txt mod_downloads");
    };
    //check if there is an argument
    if(process.argv.length <=2)
    {
        print_help();
        exit(0);
    }

    //check if argument is seed or download 
    if(process.argv[2] == "download")
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

        seed(db, seed_folder);

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



