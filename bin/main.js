#!/usr/bin/env node

import fs from 'fs'
import WebTorrent from './wtor.js'
import { exit } from 'process'
import fsx from 'fs-extra'
import path from 'path'
import util from './utils.js'
import SimplePeer from 'simple-peer'
import createTorrent from 'create-torrent'
import parseTorrent from 'parse-torrent'

const client = new WebTorrent(
  {
    webSeeds: true,
    tracker: {
      rtcConfig: {
        ...SimplePeer.config,
        ...util.rtcConfig
      }
    }
  }
)

function downloadSingle (hash, downloadDirectory) {
  console.log('downloading ', hash)
  client.add(util.createTorrentFromHash(hash), { path: downloadDirectory, announce: util.getAnnounceList() }, function (torrent) {
    torrent.on('done', function (torrent) {
      exit(0)
    })
  })

  setInterval(function () {
    process.stdout.clearLine()
    process.stdout.write('DOWN: ' + client.downloadSpeed + ' UP: ' + client.uploadSpeed + ' Progress: ' + client.progress + '\r')
  }, 1000)
}

function downloadModlist (modlist, downloadDirectory) {
  const trackedFiles = new SharedArrayBuffer(2)
  trackedFiles[0] = 0// downloading
  trackedFiles[1] = 0// downloaded

  fsx.ensureDirSync(downloadDirectory)

  if (!fs.statSync(modlist).isFile()) {
    console.log('modlist.txt is not a file')
    exit()
  }
  function onTorrentAdded (torrent) {
    console.log('[' + torrent.infoHash + ']' + torrent.name + ' Downloading...\n')

    torrent.on('done', function (torrent) {
      trackedFiles[0]--
      trackedFiles[1]++
      console.log('[' + torrent.infoHash + ']' + torrent.name + ' downloaded successfully\n')
    })
  }

  util.readLinesOfFile(modlist, function (line) {
    if (line.includes('#')) return
    const tline = line.trim()
    if (tline.length === 0) return
    trackedFiles[0]++
    client.add(util.createTorrentFromHash(tline), { path: downloadDirectory, announce: util.getAnnounceList() }, onTorrentAdded)
  })

  setInterval(function () {
    process.stdout.clearLine()
    process.stdout.write('DOWN: ' + client.downloadSpeed + ' UP: ' + client.uploadSpeed + ' Downloaded: ' + trackedFiles[1] + ' Remaining: ' + trackedFiles[0] + ' Progress: ' + client.progress + '\r')
  }, 1000)
}

function seedModFiles (seedDirectory) {
  fs.readdir(seedDirectory, (err, files) => {
    if (err) { throw err }
    files.forEach(file => {
      console.log(file)
      createTorrent(path.join(seedDirectory, file), (err, torrent) => {
        if (err) { throw err }
        console.log('Seeding: ' + torrent.name)
        client.seed(torrent, { announce: util.getAnnounceList() })
      })
    })
  })

  setInterval(function () {
    process.stdout.clearLine()
    process.stdout.write('DOWN: ' + client.downloadSpeed + ' UP: ' + client.uploadSpeed + ' Ratio: ' + client.ratio + ' \r')
  }, 1000) // Stats every second
}

const getDirectories = (source, callback) =>
  callback(
    fs.readdirSync(source, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  )

function createDatabaseFromRepository (databaseDirectory, callback) {
  const repo = {
    mods: [],
    authors: []
  }
  let counter = 0
  const onFinishedDo = () => {
    counter--
    if (counter === 0) { callback(repo) }
  }
  getDirectories(databaseDirectory, (list) => {
    counter += list.length
    for (const author of list) {
      const authorModFolder = path.join(databaseDirectory, author, 'mods')
      const authorProfileFolder = path.join(databaseDirectory, author, 'profile')

      createTorrent(authorProfileFolder.toString(), (err, torrent) => {
        if (err) { throw err }
        repo.authors.push({
          name: author,
          hash: parseTorrent(torrent).infoHash
        })
        onFinishedDo()
      })

      getDirectories(authorModFolder, (list) => {
        counter += list.length
        for (const modFolderName of list) {
          const modFolder = path.join(authorModFolder, modFolderName)
          const modPreviewImage = path.join(authorModFolder, modFolderName.toString() + '.jpg')
          createTorrent(modPreviewImage.toString(), (err, imageTorrent) => {
            createTorrent(modFolder.toString(), (err, torrent) => {
              if (err) { throw err }
              const mod = JSON.parse(fs.readFileSync(path.join(modFolder, 'mod.json')))
              repo.mods.push({
                Name: mod.name,
                Description: mod.description,
                Type: mod.type,
                SkyrimVersion: mod.versions.map(v => v.gameVersion),
                Hash: parseTorrent(torrent).infoHash,
                NSFW: mod.NSFW,
                Author: author,
                Permission: mod.permission,
                ImagePreview: parseTorrent(imageTorrent).infoHash
              })
              onFinishedDo()
            })
          })
        }
      })
    }
  })
}

function seedRepository (databaseDirectory) {
  createDatabaseFromRepository(databaseDirectory, (repo) => {
    const buffer = Buffer.from(JSON.stringify(repo))
    client.seed(buffer, { announce: util.getAnnounceList(), name: 'SkyrimModAlternatives.json' }, (torrent) => {
      console.log('seeding: ' + torrent.name + ' ' + torrent.infoHash)
    })
  })
  getDirectories(databaseDirectory, (list) => {
    for (const author of list) {
      const authorModFolder = path.join(databaseDirectory, author, 'mods')
      const authorModfilesFolder = path.join(databaseDirectory, author, 'modfiles')
      const authorProfileFolder = path.join(databaseDirectory, author, 'profile')

      
      client.seed(authorProfileFolder.toString(), { announce: util.getAnnounceList() }, (torrent) => {
        console.log('Seeding author profile: ' + author + ' ' + torrent.infoHash)
      })

      getDirectories(authorModFolder, (list) => {
        for (const mod of list) {
          client.seed(path.join(authorModFolder, mod.toString() + '.jpg'), { announce: util.getAnnounceList() }, (torrent) => {
            console.log('Author: ' + author + ': seeding preview image: ' + torrent.name + ' ' + torrent.infoHash)
          })
          client.seed(path.join(authorModFolder, mod).toString(), { announce: util.getAnnounceList() }, (torrent) => {
            console.log('Author: ' + author + ': seeding mod: ' + torrent.name + ' ' + torrent.infoHash)
          })
        }
      })

      if(fs.existsSync(authorModfilesFolder)) {
      getDirectories(authorModfilesFolder, (list) => {
        for (const modfile of list) {
          //get all files in the path list
          fs.readdir(path.join(authorModfilesFolder, modfile).toString(), (err, files) => {
            if (err) { throw err }
            for (const file of files) {
              client.seed(path.join(authorModfilesFolder, modfile, file), { announce: util.getAnnounceList() }, (torrent) => {
                console.log('Author: ' + author + ': seeding modfile: ' + torrent.name + ' ' + torrent.infoHash)
              })
            }
          });
          
        }
      })
    }

    }
  })
}

function init () {
  const printHelp = () => {
    console.log('\x1b[34m%s\x1b[0m', 'Skyrim Mod Alternatives CLI')

    console.log('')
    console.log('\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ', 'Download a mod:', 'sma get <modhash>')
    console.log('\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ', 'Download a modlist:', 'sma list <modlist.txt> <downloadDirectory>')
    console.log('\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ', 'Seed mods inside a folder:', 'sma seed <directory>')
    console.log('\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ', 'Seed a Repository:', 'sma seed_repository <directory>')
    console.log('')
    console.log('\x1b[33m%s\x1b[0m \x1b[32m%s\x1b[0m ', 'Example:', 'sma list modlist.txt mod_downloads')
    exit()
  }
  // check if there is an argument
  if (process.argv.length <= 2) printHelp()

  const operationMode = process.argv.length > 2 ? process.argv[2] : null// operration mode
  const param1 = process.argv.length > 3 ? process.argv[3] : null
  const param2 = process.argv.length > 4 ? process.argv[4] : null

  if (operationMode === 'get' && param1 !== null) downloadSingle(param1, param2 === null ? process.cwd() : param2)
  else if (operationMode === 'list' && param1 !== null) downloadModlist(param1, param2 === null ? process.cwd() : param2)
  else if (operationMode === 'seed' && param1 !== null) seedModFiles(param1)
  else if (operationMode === 'seed_repository' && param1 !== null) seedRepository(param1)
  else printHelp()
}

init()
