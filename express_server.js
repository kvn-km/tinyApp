const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
let urlDatabase = require("./data/urlDatabase.json");
const fs = require("fs");

// helper function
function generateRandomString() {
  let ranChars = Math.random().toString(36).substr(2, 6);
  return ranChars;
};

// set ejs as the view engine, and use body-parser to parse POST body from Buffer
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// error handling...kinda
app.use((err, req, res, next) => {
  console.error("err:", err.status);
  console.log("res:", res.status);
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

// registration page
app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("/register", templateVars);
});

app.get("/urls", (req, res) => {
  if (req.cookies.username !== undefined) {
    console.log("Cookie:", req.cookies);
  }
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

// ":xxxx is to signify variable deposits"
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  if (templateVars.longURL === undefined) {
    res.send("<html><body><b>400 ERROR</b><br>Long URL for " + templateVars.shortURL + " doesn't exist.<br>Please try again.</body></html>\n");
  } else {
    res.render("urls_show", templateVars);
  }
});

// redirect to fullURL from a shortened version of our path... using /u/
app.get("/u/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  if (templateVars.longURL === undefined) {
    res.send("<html><body><b>400 ERROR</b><br>Long URL for " + templateVars.shortURL + " doesn't exist.<br>Please try again.</body></html>\n");
  } else {
    res.redirect(urlDatabase[req.params.shortURL]);
  }
});

// create and redirect to new shortURL from form
// add new url key/value pair to json file
app.post("/urls", (req, res) => {
  const generatedShortURL = generateRandomString();
  let templateVars = { shortURL: generatedShortURL, longURL: urlDatabase[generatedShortURL] };
  let newURL = {};
  newURL[templateVars.shortURL] = req.body.longURL;
  Object.assign(urlDatabase, newURL);
  fs.writeFile("./data/urlDatabase.json", JSON.stringify(urlDatabase), (err) => {
    if (err) throw err;
  });
  res.redirect(`/urls/${generatedShortURL}`);
});

// delete post and redirect back
app.post("/urls/:shortURL/delete", (req, res) => {
  let database = urlDatabase;
  let shortURLtoDelete = req.params.shortURL;
  delete database[shortURLtoDelete];
  fs.writeFile("./data/urlDatabase.json", JSON.stringify(database), (err) => {
    if (err) throw err;
  });
  res.redirect("/urls");
});

// edit post and redirect back
app.post("/urls/:shortURL/edit", (req, res) => {
  const newLongURL = req.body.longURL;
  let database = urlDatabase;
  console.log(database);
  database[req.params.shortURL] = newLongURL;
  console.log(database);
  fs.writeFile("./data/urlDatabase.json", JSON.stringify(database), (err) => {
    if (err) throw err;
  });
  res.redirect("/urls");
});

// new user registration
app.post("/register", (req, res) => {
  console.log(req.body);
  const newUser = req.body;


  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// login with user name
app.post("/login", (req, res) => {
  console.log("User:", req.body.username, "has logged in.");
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// logout and clear cookie
app.post("/logout", (req, res) => {
  console.log("User:", req.cookies.username, "has logged out.");
  res.clearCookie("username", req.body.username);
  res.redirect("/urls");
});

app.get('*', function(req, res) {
  res.status(404).send("<html><body><b>404 ERROR</b><br>That page doesn't exist.<br>Please try again.</body></html>\n");
});

// server to listen for client requests
app.listen(PORT, () => {
  console.log(`Example app, listening on port ${PORT}`);
});