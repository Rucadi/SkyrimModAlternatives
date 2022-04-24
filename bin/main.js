#!/usr/bin/env node

import fs from 'fs'
import WebTorrent from 'webtorrent'
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

var repo = {
    mods: [],
    authors:[],
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




function downloadSingle(hash, downloadDirectory)
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

function download(modlist, downloadDirectory)
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

    function onTorrenAdded(torrent)
    {
        log_file.write("["+row.TorrentHash+"]"+row.Name + " Downloading...\n");

        torrent.on('done', function(torrent){
            trackedFiles[0]--;
            trackedFiles[1]++;
            log_file.write("["+row.TorrentHash+"]"+row.Name + " downloaded successfully\n");
        });                    

    }

    util.readLinesOfFile(modlist, function(line) {
        if(line.includes('#')) return;
        let tline = line.trim();
        if(tline.length == 0) return;
        trackedFiles[0]++;
        client.add(util.createTorrentFromHash(tline), {path: downloadDirectory, announce: util.getAnnounceList()}, onTorrenAdded);
    });


    setInterval(function() {
        process.stdout.clearLine();
        process.stdout.write("DOWN: "+client.downloadSpeed+ " UP: "+ client.uploadSpeed + " Downloaded: "+ trackedFiles[1] + " Remaining: "+ trackedFiles[0] +" Progress: "+client.progress+"\r");
    }, 1000); 
}


function seed(seedDirectory)
{
    var log_file = fs.createWriteStream(process.cwd() + "/sma_seed.log", {flags : 'w'});
    fs.readdir(seedDirectory, (err, files) => 
    {
        if (err) { throw err; }
        files.forEach(file => {
            console.log(file)
            createTorrent(path.join(seedDirectory,file), (err, torrent) => {
            log_file.write("Seeding: " + torrent.name);
            client.seed(torrent, { announce: util.getAnnounceList() });
            });
        });
    });

    setInterval(function() {
        process.stdout.clearLine();
        process.stdout.write("DOWN: "+client.downloadSpeed+ " UP: "+ client.uploadSpeed + " Ratio: " + client.ratio+ " \r");
      }, 1000);   //Stats every second
}



const getDirectories = (source, callback) =>
      callback(
        fs.readdirSync(source, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
      )
  

function seedFolders(seedDirectory)
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


function seedRepository(databaseDirectory)
{
    getDirectories(databaseDirectory, (list) => {
        for(let author of list)
        {
            const authorModFolder = path.join(databaseDirectory, author, 'mods')
            const authorProfileFolder = path.join(databaseDirectory, author, 'profile')

            client.seed(authorProfileFolder.toString(), { announce: util.getAnnounceList() }, (torrent) => {
                console.log("Seeding author profile: "+ author+" "+torrent.infoHash);
            });

            getDirectories(authorModFolder, (list) => {
                for(let mod of list)
                {
                    client.seed(path.join(authorModFolder, mod).toString() , { announce: util.getAnnounceList() }, (torrent) => {
                        console.log("Author: "+ author+ ": seeding mod: "+ torrent.name+ " "+torrent.infoHash);
                    });
                }
            });
        }
    });
}



async function createDatabaseFromRepository(databaseDirectory, outputFile="database.json")
{
    getDirectories(databaseDirectory, (list) => {
        for(let author of list)
        {
            const authorModFolder = path.join(databaseDirectory, author, 'mods')
            const authorProfileFolder = path.join(databaseDirectory, author, 'profile')


            createTorrent(authorProfileFolder.toString(), (err, torrent) => {
                let author_i = {
                    name: author,
                    hash: parseTorrent(torrent).infoHash
                }
                repo.authors.push(author_i);
            });

            getDirectories(authorModFolder, (list) => {
                for(let modFolderName of list)
                {
                    const modFolder = path.join(authorModFolder, modFolderName);
                    createTorrent(modFolder.toString(), (err, torrent) => 
                    {
                            var mod = JSON.parse(fs.readFileSync(path.join(modFolder, 'mod.json')));
                            let i_mod = {
                                Name: mod.name,
                                Description: mod.description,
                                Type: mod.type,
                                SkyrimVersion: mod.versions.map(v => v.gameVersion),
                                Hash: parseTorrent(torrent).infoHash,
                                NSFW: mod.NSFW,
                                Author: author,
                                Permission: mod.permission
                            };
                            repo.mods.push(i_mod);
                    });
                }
            });
        }
    });
    process.on('exit', () => {    fs.writeFileSync(outputFile, JSON.stringify(repo,null,2));    });

}

function init()
{
    let print_help = () => 
    {
        console.log("\x1b[34m%s\x1b[0m", "Skyrim Mod Alternatives CLI");

        console.log("");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Download a mod:", "sma get <modhash>");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Download a modlist:", "sma list <modlist.txt> <downloadDirectory>");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Seed mods inside a folder:", "sma seed <directory>");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Seed a folder:", "sma fseed <directory>");
        console.log("\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ", "Seed a Repository:", "sma seed_repository <directory>");
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
        download(modlist, downloadDirectory);
    }
    else if(process.argv[2] == "seed")
    {
        
        if(process.argv.length <= 3)
        {
            print_help();
            exit();
        }
        let seed_folder = process.argv[3];
        seed(seed_folder);
    }
    else if(process.argv[2]== "fseed")
    {
        if(process.argv.length <= 3)
        {
            print_help();
            exit();
        }
        let seed_folder = process.argv[3];
        seedFolders(seed_folder);
    }
    else if(process.argv[2]== "seed_repository")
    {
        if(process.argv.length <= 3)
        {
            print_help();
            exit();
        }
        let seed_folder = process.argv[3];
        seedRepository(seed_folder);
    }
    else if(process.argv[2]== "create_repository")
    {
        client.destroy();
        if(process.argv.length <= 3)
        {
            print_help();
            exit();
        }
        let seed_folder = process.argv[3];
        createDatabaseFromRepository(seed_folder);
    }
    else if(process.argv[2] == "get")
    {
        
        if(process.argv.length <= 3)
        {
            print_help();
            exit();
        }
        let hash = process.argv[3];

        downloadSingle(hash, ".");
    }
    else
    {
        print_help();
        exit();
    }
}

init();    




