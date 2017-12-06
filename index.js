var cool = require('cool-ascii-faces');
var express = require('express');
var session = require('express-session');
var md5 = require('md5');
var bodyParser = require('body-parser');
var app = express();

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var assert = require('assert');
var url = process.env.MONGODB_URI;
var sess;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(session({secret: 'MagicMike'}));

app.use(function(req, res, next) {
  res.locals.email = req.session.email;
  res.locals.name = req.session.name;
  next();
});

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  return response.redirect('/boutique');
});

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.get('/times', function(request, response) {
    var result = '';
    var times = process.env.TIMES || 5;
    for (i=0; i < times; i++)
      result += i + ' ';
  response.send(result);
});

app.get('/boutique', function(request, response) {
	MongoClient.connect(url, function(err,db) {
		assert.equal(null,err);
		var coll = db.collection('items');
		
		coll.find().toArray(function(e, docs) {
			assert.equal(null, e);
			
			coll.distinct("category", function(err, categories) {
				assert.equal(null, err);
				response.render('pages/boutique', {
					"items" : docs, 
					"categories": categories.sort(),
					"selectedCategory": "Toutes",
					"selectedPrice": 1
				});
				db.close();
			});
		});
	});
});

app.post('/boutique', function(request, response) {
	MongoClient.connect(url, function(err,db) {
		assert.equal(null,err);
		var coll = db.collection('items');
		var category = request.body.category;
		var price = request.body.price;
		var query = {};
		
		if (category != "Toutes")
			query.category = category;
		
		switch (price)
		{
			case "0":
				query.price = {"$lt":25};
				break;
				
			case "25":
				query.price = {"$gte":25, "$lt":50};
				break;
				
			case "50":
				query.price = {"$gte":50, "$lt":100};
				break;
				
			case "100":
				query.price = {"$gte":100};
		}
		
		coll.find(query).toArray(function(e, docs) {
			assert.equal(null, e);
			
			coll.distinct("category", function(err, categories) {
				assert.equal(null, err);
				response.render('pages/boutique', {
					"items" : docs, 
					"categories": categories.sort(),
					"selectedCategory": category,
					"selectedPrice": price
				});
				db.close();
			});
		});
	});
});

app.get('/produit', function(request, response) {
	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		var coll = db.collection('items');
		var id = new ObjectID(request.query.id);
		coll.findOne({"_id":id}, function(err, doc) {
			assert.equal(null, err);
			response.render('pages/produit', {"item": doc});
			db.close();
		});
	});
});

app.get('/connexion', function(request, response) {
	response.render('pages/connexion', {"message" : ""});
});

app.post('/connexion', function(request, response){
	MongoClient.connect(url, function(err,db) {
		assert.equal(null, err);
		var coll = db.collection('users');
		var email = request.body.email;
		var pwd = md5(request.body.pwd);
		coll.findOne({"email" : email, "password" : pwd}, function(err, doc) {
			assert.equal(null, err);
			if (doc){
				sess = request.session;
				sess.email = doc.email;
				sess.name = doc.name.firstname + " " + doc.name.lastname;
				response.redirect('/boutique');
			}
			else{
				response.render('pages/connexion', {"message" : "InvalidUserPass"});
			}
			db.close()
		})
	})
});

app.get('/logout', function(request, response) {
	request.session.destroy(function(err) {
		if(err) {
		  console.log(err);
		}
		else {
		  response.render('pages/connexion', {"message" : "Logout"});
		}
	});
});

app.get('/inscription', function(request, response) {
	response.render('pages/inscription', {"message" : ""});
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
