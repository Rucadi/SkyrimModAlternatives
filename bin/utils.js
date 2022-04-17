
import fs from 'fs'
import path from 'path';
import url from 'url'


const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

class Utility
{

    constructor()
    {       
        let db_hash = this.readFirstLineOfFile(path.join(__dirname, '..', 'state', 'db_hash'));
        this.constants = {
            db_name: "SMA.db",
            db_hash: db_hash,
            db_path:  path.join(__dirname, '..', 'state', db_hash, 'SMA.db'),
            trackers_path:  path.join(__dirname, '..', 'state', 'trackers')
        };

    }

    readLinesOfFile =  (file, callback) => {
        const data = fs.readFileSync(file, 'utf8')
        //vector of data with newline separator
        const lines = data.split('\n');
        //iterate over each line
        lines.forEach(line => {
            callback(line);
        });
    }
    
    //read only the first line of a file synchronously
    readFirstLineOfFile = (file) => {
        const data = fs.readFileSync(file, 'utf8')
        return data;
    }
    
    
    createTorrentFromHashAndName = (hash, name) =>
    {
        return "magnet:?xt=urn:btih:"+hash+"&dn="+name+this.getTrackers(this.constants.trackers_path);
    }
    
    createTorrentFromHash = (hash) =>
    {
        return "magnet:?xt=urn:btih:"+hash+this.getTrackers(this.constants.trackers_path);;
    }
    
    getTrackers = (trackerList) =>
    {
        let magnet = "";
        this.readLinesOfFile(trackerList, function(line){
            magnet = magnet + "&tr=" + encodeURIComponent(line);
        });
    
        return magnet;
    }


    constants = {};
};

export default new Utility;