// ==UserScript==
// @name         NexusScript
// @namespace    https://github.com/Rucadi/SkyrimModAlternatives
// @version      0.1
// @description  Download using Torrents from NexusMods
// @author       Rucadi
// @include      https://www.nexusmods.com/skyrimspecialedition/mods/*
// @include      http://www.nexusmods.com/skyrimspecialedition/mods/*
// @require      https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-asm.min.js

// ==/UserScript==

(function() {
    'use strict';

    let db = {}

    function downloadButton(hashId, gameVersion, modVersion)
    {
        let elements = document.getElementsByClassName("modactions clearfix");
        elements[0].innerHTML += '<li id="action-manual"><a class="btn inline-flex" href="https://rucadi.github.io/sma.html?TorrentHash='+hashId+'" target="_blank">'+gameVersion+" "+modVersion+'</a></li>';
        elements[0].innerHTML +='<li>'+hashId+'</li></ul>';
    }

    function getModIdFromWebsite()
    {
        const paths =  window.location.pathname.split("/").filter(entry => entry !== "");
        const lastPath = paths[paths.length - 1];
        return lastPath;
    }

    function load_binary_resource(url) {
        var byteArray = [];
        var req = new XMLHttpRequest();
        req.open('GET', url, false);
        req.overrideMimeType('text\/plain; charset=x-user-defined');
        req.send(null);
        if (req.status != 200) return byteArray;
        for (var i = 0; i < req.responseText.length; ++i) {
            byteArray.push(req.responseText.charCodeAt(i) & 0xff)
        }
        return byteArray;
    }

    let buffer = load_binary_resource('https://raw.githubusercontent.com/Rucadi/SkyrimModAlternatives/master/SMA.db');

    initSqlJs().then(function(SQL){
		db = new SQL.Database(buffer);
		db.each("SELECT * FROM mods WHERE NexusId="+getModIdFromWebsite(), (row)=>
         {
            downloadButton(row.TorrentHash, row.SkyrimVersion, row.ModVersion);
        });
    });

})();
