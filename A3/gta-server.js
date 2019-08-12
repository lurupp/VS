/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');

var app;
app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */

app.use(express.static('public'));

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

function GeoTag(latitude, longitude, name, hashtag){
  this.latitude = latitude;
  this.longitude = longitude;
  this.name = name;
  this.hashtag = hashtag;
}

/**s
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

let GeoTagModule = (function() {
    geoTag = [];

    let getRadius = function (lat1, lat2, long1, long2, radius) {
      let lat = lat1-lat2;
      let long = long1-long2;

      let dist = Math.sqrt((lat*lat) + (long*long));
      return dist <= radius;
    }

    return {
      searchTagByRadius : function(latitude, longitude, radius){
        let ret = [];

        for(let i = 0; i < geoTag.length; i++){
          if(getRadius(latitude, geoTag[i].latitude, longitude, geoTag[i].longitude, radius)){
            ret.push(geoTag[i]);
          }
        }
        return ret;
      },
      searchByName : function(name) {
        let ret = [];
         for (let i = 0; i < geoTag.length; i++) {
           if(geoTag[i].name === name){
             ret.push(geoTag[i]);
           }
         }
         return ret;
      },
      add : function (latitude, longitude,name,hashtag) {
        let add = new GeoTag(latitude,longitude, name, hashtag);
        geoTag.push(add);
      },
      delete : function(name) {
        for(let i = 0; i < geoTag.length; i++) {
          if(geoTag[i].name ===  name) {
            geoTag.splice(i,1);
            i--;
          }
        }
      },
      getList : function() {
        return geoTag;
      }
    }
})();

/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function(req, res) {
    res.render('gta', {
        taglist: [],
        latitude: "",
        longitude: ""
    });
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

app.post('/tagging',function(req,res){
  let lat = req.body.latitude;
  let long = req.body.longitude;
  let name = req.body.name;
  let hashtag = req.body.hashtag;
  GeoTagModule.add(lat, long, name, hashtag);
  let list = GeoTagModule.searchTagByRadius(lat, long, 100);
  res.render('gta', {
    taglist: GeoTagModule.getList(),
    latitude: req.body.latitude,
    longitude: req.body.longitude
  });
});

/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

 app.post('/discovery',function(req,res){
   console.log(req.body);
   if(req.body.submitSearch !== undefined){
     if(req.body.searchTerm !== "") {
       res.render('gta', {
         taglist: GeoTagModule.searchByName(req.body.searchTerm),
         latitude: req.body.latitude,
         longitude: req.body.longitude
       });
     }
     else {
       res.render('gta', {
         taglist: GeoTagModule.searchTagByRadius(req.body.latitude, req.body.longitude,10),
         latitude: req.body.latitude,
         longitude: req.body.longitude
       });
     }
   }
   else {
     GeoTagModule.delete(req.body.searchTerm);
     res.render('gta', {
       taglist: GeoTagModule.getList(),
       latitude: req.body.latitude,
       longitude: req.body.longitude
     });
   }
 });

/**
 * Setze Port und speichere in Express.
 */

var port = 3000;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);
