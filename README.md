[wip]

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



# Seed mods
Seeding mods using seed.js. 
usage:
Invoking the script from the directory where the files are:
```
node seed.js  
```
Invoking the script specifying the directory where the files are:
```
node seed.js <directory>
```
Notice that only files that match the database will be seeded.


# Download Mods using a modlist
The modlist format is super simple:
```
#this is a comment
#this is a list of hashes (as seen on SkyrimModAlternatives.json) 
fd46debd8ccec5d532633d5b051f62f706638f6a
```

In order to download mods:
```
node download.js <modlist_file> <download_dir>
```
if <download_dir> is not specified, the default download folder will be <current_dir>/downloads

# Contribute adding new mods (And seeding them!)

While this is a decentralized project, we still need to create the database of mods. 
This database, once created, is shared as a torrent like all the other mods. So while there is people using the system, the database will live on.

The database is a sqlite database generated from the SkyrimModAlternatives.json file. 
This file contains the following information that uniquely identifies a mod:
```json
{
  "mods": [
    {
      "SkyrimVersion": "AE",
      "Name": "SexLab SE Sex Animation Framwork",
      "ModVersion": "1.64c",
      "FileName": "SexLabFrameworkAE_v164c.7z",
      "TorrentHash": "fd46debd8ccec5d532633d5b051f62f706638f6a",
      "FileSize": "72208706", 
      "Url": "https://www.loverslab.com/files/file/20058-sexlab-se-sex-animation-framework-v164c-010722/",
      "NexusId": "",
      "LoversId": "20058",
      "FileId": "1202958",
      "NSFW": true,
      "Author": "By Ashal"
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

An example of a Chrome/Firefox tampermonkey plugin to download from webtorrent would be:

```js
(function () {
  "use strict";

  const torrentId =
    "magnet:?xt=urn:btih:88594aaacbde40ef3e2510c47374ec0aa396c08e&dn=bbb_sunflower_1080p_30fps_normal.mp4&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=http%3A%2F%2Fdistribution.bbb3d.renderfarming.net%2Fvideo%2Fmp4%2Fbbb_sunflower_1080p_30fps_normal.mp4";
  const client = new WebTorrent();
  client.add(torrentId, onTorrent);

  console.log("ran");
  var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (url, fileName) {
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  })();

  function onTorrent(torrent) {
    torrent.files.forEach(function (file) {
      file.getBlobURL(function (err, url) {
        saveData(url, torrent.name);
      });
    });
  }

})();
```

With this knowledge we can create a plugin that downloads from any torrent website using our community-driven project.
