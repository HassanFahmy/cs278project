"use strict";

const express = require("express");
const http = require("http");
const path = require("path");

const initApi = require("./api");
const updater = require("./lib/server/updater");

//const PORT = 1930;
const PORT = process.env.PORT || 80

const app = express();
const server = http.createServer(app);

const publicPath = path.join(__dirname, "public");
app.use("/lib/client", express.static(path.join(__dirname, "lib/client")));
app.use(express.static(publicPath));
updater(server, publicPath);

const main = async () => {
  await initApi(app);
  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
  });
};
main();
