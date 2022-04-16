import sqlite3 from 'sqlite3';
import fs from 'fs'

const db_name = "SMA.db";
const db = new sqlite3.Database(db_name);
//drop table mods sqlite3
db.run("DROP TABLE IF EXISTS mods", 
    (dbt, err) => {
            db.run("CREATE TABLE IF NOT EXISTS mods ( SkyrimVersion TEXT, name TEXT, filename TEXT, torrentHash TEXT PRIMARY KEY, Url TEXT, NexusId TEXT, LoversId TEXT, FileId TEXT, NSFW BOOLEAN, Author TEXT)",
                (dbt, err) => {
                    init();
                });
})
 
function init()
{
    //check if there is a parameter and if there is one, then use it as the file name
    //if there is no parameter, then use the default file name
    var filePath = "SkyrimModAlternatives.json";

    if(process.argv.length > 2){filePath = process.argv[2];}

    //read the file at the path filePath and parse it as JSON
    fs.readFile(filePath, 'utf8', function (err, data) {

        if (err) {
            return console.log(err);
        } 
        //console.log(data);
        try{
            var jsonData = JSON.parse(data);
            //all jsondata mods into db
            for(var i = 0; i < jsonData.mods.length; i++)
            {
                var mod = jsonData.mods[i];
                db.run("INSERT INTO mods VALUES (?,?,?,?,?,?,?,?,?,?)", [mod.SkyrimVersion, mod.name, mod.filename, mod.torrentHash, mod.Url, mod.NexusId, mod.LoversId, mod.FileId, mod.NSFW, mod.Author]);
            }
            

        }
        catch(err)
        {
            console.log("Error parsing JSON file");
            return;
        }

    });
}