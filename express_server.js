const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const fs = require("fs");
let urlDatabase = require("./data/urlDatabase.json");

// set ejs as the view engine, and use body-parser to parse POST body from Buffer
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// helper function
function generateRandomString() {
  let ranChars = Math.random().toString(36).substr(2, 6);
  return ranChars;
}

// server to listen for client requests
app.listen(PORT, () => {
  console.log(`Example app, listening on port ${PORT}`);
});

// error handling...kinda
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something broke!');
  next();
});

// setup the server with a welcome msg on a GET request for "/"
app.get("/", (req, res) => {
  res.send("Hello!");
});

// setup the server with a reponse to a GET request for "/urls.json"
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let theURL = { urls: urlDatabase };
  res.render("urls_index", theURL);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// ":xxxx is to signify variable deposits"
app.get("/urls/:shortURL", (req, res) => {
  let theURL = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  if (theURL.longURL === undefined) {
    res.send("<html><body><b>404 ERROR</b><br>Long URL for " + theURL.shortURL + " doesn't exist.<br>Please try again.</body></html>\n");
  } else {
    res.render("urls_show", theURL);
  }
});

// create and redirect to new shortURL from form
// add new url key/value pair to json file
app.post("/urls", (req, res) => {

  const generatedShortURL = generateRandomString();
  let theURL = { shortURL: generatedShortURL, longURL: urlDatabase[generatedShortURL] };

  let newURL = {};
  newURL[theURL.shortURL] = req.body.longURL;
  Object.assign(urlDatabase, newURL);

  fs.writeFile("./data/urlDatabase.json", JSON.stringify(urlDatabase), (err) => {
    if (err) throw err;
  });

  res.redirect(`/urls/${generatedShortURL}`);
});

// redirect to fullURL from a shortened version of our path... using /u/
app.get("/u/:shortURL", (req, res) => {
  const longURL = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.redirect(longURL.longURL);
});

