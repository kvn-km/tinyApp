const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

// set ejs as the view engine, and use body-parser to parse POST body from Buffer
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// url data we will work with
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let ranChars = Math.random().toString(36).substr(2, 6);
  return ranChars;
}


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

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b> World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// ":xxxx is to signify variable deposits"
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  // console.log(req.params);
  // console.log(templateVars);
  res.render("urls_show", templateVars);
});

// create and redirect to new shortURL from form
app.post("/urls", (req, res) => {
  console.log(req.body);
  const generatedShortURL = generateRandomString();
  urlDatabase[generatedShortURL] = req.body.longURL;
  let templateVars = { shortURL: generatedShortURL, longURL: urlDatabase[generatedShortURL] };
  res.redirect(`/urls/${generatedShortURL}`);
});

// redirect to fullURL from a shortened version of our path... using /u/
app.get("/u/:shortURL", (req, res) => {
  const longURL = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.redirect(longURL.longURL);
});