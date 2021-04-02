const express = require('express')
const app = express()
const cors = require("cors");
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
const ObjectId = require('mongodb').ObjectID;
const bodyParser = require('body-parser');
require('dotenv').config();
const port = process.env.PORT || 4004;


app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./haat-bazar-9825a-firebase-adminsdk-j5hyf-50ff1608af.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "process.env.FIRE_DB"
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldkov.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const productsCollection = client.db("haat-bazar").collection("products");
    const ordersCollection = client.db("haat-bazar").collection("orders");

    app.get('/products', (req, res) => {
        productsCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.get('/product/:id', (req, res) => {

        productsCollection.find({ _id: ObjectId(req.params.id) })
            .toArray((err, documents) => {
                res.send(documents[0]);
            })
    })

    app.delete('/delete/:id', (req, res) => {

        productsCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                res.send(result.deletedCount > 0);
            })
    })

    app.post('/addOrder', (req, res) => {
        const newOrder = req.body;
        console.log(newOrder)
        ordersCollection.insertOne(newOrder)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/orders', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        ordersCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                    else {
                        res.status(401).send('Un-authorized Access')
                    }
                })
                .catch((error) => {
                    res.status(401).send('Un-authorized Access')
                });
        }
        else {
            res.status(401).send('Un-authorized Access')
        }
    })

    app.post('/addProduct', (req, res) => {
        const newProduct = req.body;
        console.log('adding new event', newProduct);
        productsCollection.insertOne(newProduct)
            .then(result => {
                console.log('inserted count ', result.insertedCount);
                res.send(result.insertedCount > 0);
            })

    })

});



app.listen(port)