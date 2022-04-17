# SkyrimModAlternatives
This is a project that aims to put together the Skyrim Mod Community and creating efforts to: 
```
1- Create a free and explorable database of existing mods
2- Create a free and community-driven alternative to download them
3- Preserve mods while avoiding takedowns or just dissapearing with the pass of time
4- Decentralized system, all this code can run in any computer and anyone can use this software, it's opensource and based on the webtorrent project. 
```


The Helper Scripts are scripts that expand the download buttons from NexusMods and LoversLab in order to show the #hash that you need to use for creating a modlist, and a link to download that file from your browser (or generate a torrent/magnet file)

<img width="614" alt="image" src="https://user-images.githubusercontent.com/6445619/163729234-a643fe86-7323-4f33-8e34-10fc34b81a6f.png">
<img width="243" alt="image" src="https://user-images.githubusercontent.com/6445619/163729250-a5acf6da-3494-4a92-976c-957a09e02528.png">


# Install helper script for NexusMods
- [Download from GitHub](https://github.com/Rucadi/SkyrimModAlternatives/raw/master/scripts/sma_nexus.user.js)
# Install Helper Script for LoversLab
- [Download from GitHub](https://github.com/Rucadi/SkyrimModAlternatives/raw/master/scripts/sma_loverslab.user.js)



# Usage

<img width="778" alt="image" src="https://user-images.githubusercontent.com/6445619/163729989-ab14fb69-fa52-494d-884f-fe03b5925f41.png">
Notice that only files that match the database will be seeded.


# Contribute adding new mods (And seeding them!)

While this is a decentralized project, we still need to create the database of mods. 
This database, once created, is shared as a torrent like all the other mods. So while there is people using the system, the database will live on.

The database is a sqlite database generated from the SkyrimModAlternatives.json file. 
This file contains the following information that uniquely identifies a mod:
```json
{
  "mods": [
    {
      "SkyrimVersion": "SE",
      "Name": "SkyUI",
      "ModVersion": "5.2",
      "FileName": "SkyUI_5_2_SE-12604-5-2SE.7z",
      "TorrentHash": "0253a1f8d0e52e5cd9da8890fd3ed7ab1520e3b2",
      "FileSize": "2783417", 
      "Url": "https://www.nexusmods.com/skyrimspecialedition/mods/12604",
      "NexusId": "12604",
      "LoversId": "",
      "FileId": "35407",
      "NSFW": false,
      "Author": "SkyUI Team"
    }
  ]
}

```
This information probes useful to: 

```
1 - Know the origin of the mod
2 - Identify the mod
3 - Create web extensions that allow us to download from an alternative location when looking for mods on a mod website.
```
