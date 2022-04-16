[wip]

# SkyrimModAlternatives
This is a project that aims to put together the Skyrim Mod Community and creating efforts to: 
1- Create a free and explorable database of existing mods
2- Create a free and community-driven alternative to download them
3- Preserve mods while avoiding takedowns or just dissapearing with the pass of time
4- Decentralized system, all this code can run in any computer and anyone can use this software, it's opensource and based on the webtorrent project. 


# Seed mods
Seeding mods using seed.js

# Download Mods using a modlist
The modlist format is super simple:
```
#this is a comment
#this is a list of hashes (as seen on SkyrimModAlternatives.json) 
fd46debd8ccec5d532633d5b051f62f706638f6a
```

# Contribute adding new mods (And seeding them!)

While this is a decentralized project, we still need to create the database of mods. 
This database, once created, is shared as a torrent like all the other mods. So while there is people using the system, the database will live on.

The database is a sqlite database generated from the SkyrimModAlternatives.json file. 
This file contains the following information that uniquely identifies a mod:
```json
{
  "SkyrimVersion": "AE",
  "name": "SexLab SE Sex Animation Framwork",
  "filename": "SexLabFrameworkAE_v164c.7z",
  "torrentHash": "fd46debd8ccec5d532633d5b051f62f706638f6a",
  "Url": "https://www.loverslab.com/files/file/20058-sexlab-se-sex-animation-framework-v164c-010722/",
  "NexusId": "",
  "LoversId": "91861",
  "FileId": "1202958",
  "NSFW": true,
  "Author": "By Ashal"
}
```
This information probes useful to: 
1- Know the origin of the mod
2- Identify the mod
3- Create web extensions that allow us to download from an alternative location when looking for mods on a mod website.



