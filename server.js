var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectId = mongodb.ObjectId;
var cors = require('cors');
var basicAuth = require('express-basic-auth')

var FOOD_COLLECTION = "foods";

var app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database;
    console.log("Database connection ready");

    // Initialize the app.
    var server = app.listen(process.env.PORT || 8080, function() {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});

// FOOD API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

/*  "/api/foods"
 *    GET: find food matching string
 *    POST: creates a new contact
 */

app.get("/api/food/:name", function(req, res) {
    var foodName = req.params.name;
    var limit = Number(req.query.limit || 1);

    if(limit === 1) {
        db.collection(FOOD_COLLECTION).findOne({"name": {"$regex": foodName, "$options": "i"}}, function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to get contact");
            } else {
                if (doc === null) {
                    doc = {};
                }
                res.status(200).json(doc);
            }
        });
    } else {
        db.collection(FOOD_COLLECTION).find({"name": {"$regex": foodName, "$options": "i"}}).limit(limit).toArray(function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to get food");
            } else {
                if (doc === null) {
                    doc = {};
                }
                res.status(200).json(doc);
            }
        });
    }
});

app.get("/api/anyfood", function(req, res) {
    var random = Math.floor(Math.random() * 8000);

    db.collection(FOOD_COLLECTION).findOne({},{}, { skip: random},
        function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to get food");
            } else {
                if (doc == null) {
                    doc = {};
                }
                res.status(200).json(doc);
            }
        });
});

app.post("/api/food", function(req, res) {
    var food = req.body.food;
    console.log(food);
    db.collection(FOOD_COLLECTION).insert(food, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to add food item");
        } else {
            if (doc === null) {
                doc = {};
            }
            res.status(200).json(doc);
        }
    });
});

app.delete("/api/food/:id", function(req, res) {
    var id = req.params.id;
    console.log('Food to be deleted', id);
    db.collection(FOOD_COLLECTION).update({_id: new ObjectId(id)}, { $inc: { removeCount: 1 }}, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get food item: ", id);
        } else {
            if (doc === null) {
                doc = {};
                handleError(res, err.message, "Food item is empty: ", id);
                return;
            }

            res.status(200).json(doc);
        }
    });
});

