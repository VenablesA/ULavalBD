var cool = require('cool-ascii-faces');
var express = require('express');
var app = express();

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = process.env.MONGODB_URI;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index')
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.get('/times', function(request, response) {
    var result = ''
    var times = process.env.TIMES || 5
    for (i=0; i < times; i++)
      result += i + ' ';
  response.send(result);
});

var getItems = function(db, callback){
	db.collection('items').find().toArray();
}

app.get('/boutique', function(request, response) {
	var items;
	MongoClient.connect(url, function(err,db) {
		assert.equal(null,err);
		// items = getItem(db, function(r) {
		// 	res.setHeader('Content-Type', 'application/json');
         //    res.send(JSON.stringify({'items': r}));
         //    db.close();
		// })
		items = db.collection('items').find.toArray();
	});
	response.render('pages/boutique', {"items" : items})
});

app.get('/db', function(request, response) {
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected correctly to server.");
		
		db.collection('items').find().toArray(function(err, docs) {
			var texte = "";
			
			for (var i = 0; i < docs.length; i++) {
				texte += docs[i].name;
				
				prix = docs[i].prix;
				if (prix != null) {
					texte += " = " + prix + "$";
				}

				texte += "<br/>";
			}
			
			response.send(texte);
		});
		
		db.close();
	});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
