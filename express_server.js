const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser"); // replace with cookie-session
var cookieSession = require('cookie-session');
const fs = require("fs");
const bcrypt = require("bcrypt");

let urlDatabase = require("./data/urlDatabase.json");
let userDatabase = require("./data/userDatabase.json");
const { hashPash, urlsForUserID, generateRandomString, fetchUserKeys, fetchUsernames, fetchEmails, fetchUserKeysFromLoginInfo } = require("./data/helperFunctions");

// set ejs as the view engine, and use body-parser to parse POST body from Buffer
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser()); // replaced with cookie-session
app.use(cookieSession({
  name: 'session',
  keys: ["roar-roar", "like-a-dungeon-dragon"]
}));

// error handling...kinda
app.use((err, req, res, next) => {
  console.error("err:", err.status);
  console.log("res:", res.status);
  res.status(500).send('Something broke!');
  next();
});

// setup the server with a welcome msg on a GET request for "/"
app.get("/", (req, res) => {
  let userURLS = urlsForUserID(req.session.userID);
  let templateVars = { urls: userURLS, userID: req.session.userID, username: req.session.username, email: req.session.email };
  res.render("urls_index", templateVars);
});

// setup the server with a reponse to a GET request for "/urls.json"
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// registration page
app.get("/register", (req, res) => {
  let templateVars = { loginPage: false, validationCheck: true, newUserCheck: true, urls: urlDatabase, username: req.session.username, email: req.session.email };
  res.render("register", templateVars);
});

// login page
app.get("/login", (req, res) => {
  if (!req.session.userID) {
    let templateVars = { loginPage: true, validationCheck: true, newUserCheck: false, urls: urlDatabase, username: req.session.username, email: req.session.email };
    res.render("login", templateVars);
  } else {
    let userURLS = urlsForUserID(req.session.userID);
    let templateVars = { urls: userURLS, userID: req.session.userID, username: req.session.username, email: req.session.email };
    res.redirect("/urls", templateVars);
  }
});

app.get("/urls", (req, res) => {
  let userURLS = urlsForUserID(req.session.userID);
  let templateVars = { urls: userURLS, userID: req.session.userID, username: req.session.username, email: req.session.email };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { loginPage: true, userID: req.session.userID, validationCheck: true, newUserCheck: false, urls: urlDatabase, username: req.session.username, email: req.session.email };
  if (req.session.userID) {
    res.render("urls_new", templateVars);
  } else {
    res.render("login", templateVars);
  }
});

// ":xxxx is to signify variable deposits"
app.get("/urls/:shortURL", (req, res) => {
  const shortURLSforTesting = Object.keys(urlDatabase);
  const usersURLS = urlsForUserID(req.session.userID);
  let templateVars = {};
  if (!shortURLSforTesting.includes(req.params.shortURL)) { // shortURL doesnt exist
    res.send("<html><body><b>400 ERROR</b><br>Long URL for " + req.params.shortURL + " doesn't exist.<br>Please try again.</body></html>\n");
  } else {
    if (req.session.userID === null) { // not signed in
      templateVars = { userID: false, username: req.session.username, email: req.session.email };
      res.render("urls_show", templateVars);
    } else if (urlDatabase[req.params.shortURL]["userID"] !== req.session.userID) { // wrong user
      templateVars = { userID: false, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.session.username, email: req.session.email };
      res.render("urls_show", templateVars);
    }
  }
  templateVars = { urls: urlDatabase, userID: req.session.userID, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], username: req.session.username, email: req.session.email };
  res.render("urls_show", templateVars);
});


// redirect to fullURL from a shortened version of our path... using /u/
app.get("/u/:shortURL", (req, res) => {
  let templateVars = { userID: req.session.userID, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.session.username, email: req.session.email };
  if (templateVars.longURL === undefined) {
    res.send("<html><body><b>400 ERROR</b><br>Long URL for " + templateVars.shortURL + " doesn't exist.<br>Please try again.</body></html>\n");
  } else {
    res.redirect(urlDatabase[req.params.shortURL]["longURL"]);
  }
});

// create and redirect to new shortURL from form
// add new url key/value pair to json file
app.post("/urls", (req, res) => {
  const generatedShortURL = generateRandomString();
  let templateVars = { userID: req.session.userID, shortURL: generatedShortURL, longURL: req.params.longURL };
  let newURL = {};
  newURL[templateVars.shortURL] = { "longURL": req.body.longURL, "userID": req.session.userID };
  Object.assign(urlDatabase, newURL);
  fs.writeFile("./data/urlDatabase.json", JSON.stringify(urlDatabase), (err) => {
    if (err) throw err;
  });
  res.redirect(`/urls/${templateVars.shortURL}`);
});

// delete post and redirect back
app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURLtoDelete = req.params.shortURL;
  if (req.session.userID === urlDatabase[shortURLtoDelete]["userID"]) {
    let database = urlDatabase;
    delete database[shortURLtoDelete];
    fs.writeFile("./data/urlDatabase.json", JSON.stringify(database), (err) => {
      if (err) throw err;
    });
    res.redirect("/urls");
  } else {
    res.status(403).send("403 Error. No touchy~!");
  }
});

// edit post and redirect back
app.post("/urls/:shortURL/edit", (req, res) => {
  const newLongURL = req.body.longURL;
  if (req.session.userID === urlDatabase[req.params.shortURL]["userID"]) {
    let database = urlDatabase;
    database[req.params.shortURL]["longURL"] = newLongURL;
    fs.writeFile("./data/urlDatabase.json", JSON.stringify(database), (err) => {
      if (err) throw err;
    });
    res.redirect("/urls");
  } else {
    res.status(403).send("403 Error. No touchy~!");
  }
});

// new user registration
app.post("/register", (req, res) => {
  let theDatabase = userDatabase;
  const theUserEmails = fetchEmails();
  if (theUserEmails.includes(req.body.email)) { // user exists
    let templateVars = { loginPage: false, validationCheck: true, newUserCheck: false, urls: urlDatabase, username: req.session.username, email: req.session.email };
    res.render("register", templateVars);
    // invalid inputs
  } else if (req.body.email === "" || req.body.email.includes(" ") || req.body.email.indexOf("@") < 0 || req.body.email.indexOf(".") < 0) {
    let templateVars = { loginPage: false, newUserCheck: true, validationCheck: false, username: req.session.username, email: req.session.email };
    res.render("register", templateVars);
  } else {
    // register
    const randoID = generateRandomString();
    let newUser = {};
    req.session.userID = randoID;
    req.session.username = req.body.username;
    req.session.email = req.body.email;
    // res.cookie("userID", randoID);
    // res.cookie("username", req.body.username);
    // res.cookie("email", req.body.email);
    const hashashash = hashPash(req.body.password, 10);
    req.session.password = hashashash;
    // res.cookie("password", hashashash);
    let theUsersCookies = { "userID": randoID, "username": req.body.username, "email": req.body.email, "password": hashashash };
    newUser[randoID] = theUsersCookies;
    Object.assign(theDatabase, newUser);
    fs.writeFile("./data/userDatabase.json", JSON.stringify(theDatabase), (err) => {
      if (err) throw err;
    });
    res.redirect("/urls");
  }
});

// login with username or email
app.post("/login", (req, res) => {
  const theUserEmails = fetchEmails();
  const theUsernames = fetchUsernames();
  const theUsersKey = fetchUserKeysFromLoginInfo(req.body.loginInfo);
  const password = req.body.password;
  if (theUserEmails.includes(req.body.loginInfo) && bcrypt.compareSync(password, userDatabase[theUsersKey]["password"])) {
    req.session.userID = theUsersKey;
    req.session.username = userDatabase[theUsersKey]["username"];
    req.session.email = userDatabase[theUsersKey]["email"];
    // res.cookie("userID", theUsersKey);
    // res.cookie("username", userDatabase[theUsersKey]["username"]);
    // res.cookie("email", userDatabase[theUsersKey]["email"]);
    req.session.password = userDatabase[theUsersKey]["password"];
    // res.cookie("password", userDatabase[theUsersKey]["password"]);
    res.redirect("/urls");
  } else if (theUsernames.includes(req.body.loginInfo) && bcrypt.compareSync(password, userDatabase[theUsersKey]["password"])) {
    req.session.userID = theUsersKey;
    req.session.username = userDatabase[theUsersKey]["username"];
    req.session.email = userDatabase[theUsersKey]["email"];
    // res.cookie("userID", theUsersKey);
    // res.cookie("username", userDatabase[theUsersKey]["username"]);
    // res.cookie("email", userDatabase[theUsersKey]["email"]);
    req.session.password = userDatabase[theUsersKey]["password"];
    // res.cookie("password", userDatabase[theUsersKey]["password"]);
    res.redirect("/urls");
  } else {
    let templateVars = { loginPage: true, validationCheck: false, username: req.session.username, email: req.session.email };
    res.status(403).render("login", templateVars);
  }
});

// logout and clear cookie
app.post("/logout", (req, res) => {
  console.log("User:", req.session.email, "has logged out.");
  req.session = null;
  res.redirect("/urls");
});

app.get('*', function(req, res) {
  res.status(404).send("<html><body><b>404 ERROR</b><br>That page doesn't exist.<br>Please try again.</body></html>\n");
});

// server to listen for client requests
app.listen(PORT, () => {
  console.log(`Example app, listening on port ${PORT}`);
});

