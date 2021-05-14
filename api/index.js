"use strict";

const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const { MongoClient } = require("mongodb");

let DATABASE_NAME = "Cluster0";

/* Do not modify or remove this line. It allows us to change the database for grading */
if (process.env.DATABASE_NAME) DATABASE_NAME = process.env.DATABASE_NAME;

let api = express.Router();
let conn;
let db;
let Users, Posts;

module.exports = async (app) => {
  app.set("json spaces", 2);

  const uri = "mongodb+srv://wael:1234wael@cluster0.1e91g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";  
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  conn = await client.connect(err => { const collection = client.db("test").collection("devices"); client.close(); });
  
  //conn = await MongoClient.connect("mongodb+srv://wael:1234wael@cluster0.1e91g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });
  db = conn.db(DATABASE_NAME);
  Users = db.collection("users");
  Posts = db.collection("posts");

  app.use("/api", api);

};

api.use(bodyParser.json());
api.use(cors());

api.get("/", (req, res) => {
  res.json({ message: "API running" });
});

api.use("/users/:id", async (req, res, next) => {
  let id = req.params.id;
  let user = await Users.findOne({ id });
  if (!user) {
    res.status(404).json({ error: "User doesn't exist" } );
    return;
  }
  res.locals.user = user;
  next();
});


//list users
api.get("/users", async (req, res) => {
  let users = await Users.find().toArray();
  res.json({ users: users.map(user => user.id) });
});


// find user
api.get("/users/:id", async (req, res) => {
  let user = res.locals.user;
  let { id, name, avatarURL, following } = user;
  res.json({ id, name, avatarURL, following });
});

//create user
api.post("/users/", async (req, res) => {
  let id = req.body.id;
  if (!id | id == ""){
    res.status(400).json({ error: "id malformed or missing" } );
    return;
  }
  let user = await Users.findOne({ id });
  if (user) {
    res.status(400).json({ error: "User already exists" } );
    return;
  }
  await Users.insertOne({ id: id, name: id, avatarURL: "", following: [] });
  res.json({ id: id, name: id, avatarURL: "", following: [] });
});

//update user
api.patch("/users/:id", async (req, res) => {
  let user = res.locals.user;
  let avatarURL = req.body.avatarURL;
  let name = req.body.name;
  if (avatarURL){
    user.avatarURL = avatarURL;
  }
  if (name){
    user.name = name;
  }
  await Users.replaceOne({id: user.id}, user);
  res.json({id: user.id, name, avatarURL, following : user.following});
});

//get feed
api.get("/users/:id/feed", async (req, res) => {
  let user = res.locals.user;
  let id = user.id;
  let posts = await Posts.find({userId:id}).toArray();
  for (let follow of user.following){
    let fposts = await Posts.find({userId:follow}).toArray();
    posts.push.apply(posts,fposts);
  }
  let ret = []
  for (let post of posts){
    id = post.userId;
    user = await Users.findOne({ id });
    ret.push(
      {
        "user": {
          "id": id,
          "name": user.name,
          "avatarURL": user.avatarURL
        },
        "time": post.time,
        "text": post.text
      }
    )
  }
  ret.sort(function(a, b) {
    return  b.time - a.time;
});
  res.json( {posts: ret} );

});

//add post
api.post("/users/:id/posts", async (req, res) => {
  let user = res.locals.user;
  let id = user.id;
  let text = req.body.text;
  if (!text){
    res.status(400).json({ error: "post text malformed or missing" } );
    return;
  }
  await Posts.insertOne({userId: id, time: new Date(), text: text});
  res.json({success: true});
});

//follow
api.post("/users/:id/follow", async (req, res) => {
  let user = res.locals.user;
  let id = user.id;
  let target = req.body.target;
  if (!target){
    res.status(400).json({ error: "target malformed or missing" } );
    return;
  }
  if (user.following.includes(target)){
    res.status(400).json({ error: "target already followed" } );
    return;
  }
  if (target === id){
    res.status(400).json({ error: "trying to follow self" } );
    return;
  }
  let followed = await Users.findOne({ id: target });
  if (!followed){
    res.status(400).json({ error: "target user doesn't exist" } );
    return;
  }
  user.following.push(followed.id);
  await Users.replaceOne({id: user.id}, user);
  res.json({ "success": true });
});

api.delete("/users/:id/follow", async (req, res) => {
  let user = res.locals.user;
  let id = user.id;
  let target = req.body.target;
  if (!target){
    res.status(400).json({ error: "target malformed or missing" } );
    return;
  }
  if (!user.following.includes(target)){
    res.status(400).json({ error: "target isn't followed" } );
    return;
  }
  for( var i = 0; i < user.following.length; i++){ if ( user.following[i] === target) { user.following.splice(i, 1); }}
  await Users.replaceOne({id: user.id}, user);
  res.json({ "success": true });
});
/* Catch-all route to return a JSON error if endpoint not defined */
api.all("/*", (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
});
