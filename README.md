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

# Install the command line interface
- [You must have node installed](https://nodejs.org/en/download/)
- Do the following command in Windows Terminal: `npm -global i mod-alternatives` or visit the website: https://www.npmjs.com/package/mod-alternatives

# Install helper script for NexusMods
- [Download from GitHub](https://github.com/Rucadi/SkyrimModAlternatives/raw/master/scripts/sma_nexus.user.js)
# Install Helper Script for LoversLab
- [Download from GitHub](https://github.com/Rucadi/SkyrimModAlternatives/raw/master/scripts/sma_loverslab.user.js)



# Usage

<img width="652" alt="image" src="https://user-images.githubusercontent.com/6445619/163731231-ec3a50c6-705b-47fc-a5cd-789fea48a6fc.png">

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
      "Name": "Unofficial Skyrim Special Edition Patch",
      "ModVersion": "4.2.6a",
      "FileName": "Unofficial Skyrim Special Edition Patch-266-4-2-6a-1636838663.7z",
      "TorrentHash": "d09b972082830f89649a3ac66c610ee6d9637b9d",
      "FileSize": "134034173", 
      "Url": "https://www.nexusmods.com/skyrimspecialedition/mods/266",
      "NexusId": "266",
      "LoversId": "",
      "FileId": "241103",
      "NSFW": false,
      "Author": "Unofficial Patch Project Team",
      "Permissions" : "You may upload unmodified copies of the latest version of the patch to any website of your choosing so long as the documentation is retained as-is."
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
