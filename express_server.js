const express = require("express");
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// server to listen for client requests
app.listen(PORT, () => {
  console.log(`Example app, listening on port ${PORT}`);
});

// setup the server with a welcome msg on a GET request for "/"
app.get("/", (req, res) => {
  res.send("Hello!");
});

// setup the server with a reponse to a GET request for "/urls.json"
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});