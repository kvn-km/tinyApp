const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
let urlDatabase = require("./data/urlDatabase.json");
let userDatabase = require("./data/userDatabase.json");
const fs = require("fs");
const { generateRandomString, fetchUserKeys, fetchUsernames, fetchEmails, fetchUserKeysFromLoginInfo } = require("./data/helperFunctions");

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
  let templateVars = { loginPage: false, validationCheck: true, newUserCheck: true, urls: urlDatabase, username: req.cookies["username"], email: req.cookies["email"] };
  res.render("register", templateVars);
});

// login page
app.get("/login", (req, res) => {
  let templateVars = { loginPage: true, validationCheck: true, newUserCheck: false, urls: urlDatabase, username: req.cookies["username"], email: req.cookies["email"] };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => {
  if (req.cookies.email !== undefined) {
    console.log("Cookies:", req.cookies);
  }
  let templateVars = { urls: urlDatabase, username: req.cookies["username"], email: req.cookies["email"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"], email: req.cookies["email"] };
  res.render("urls_new", templateVars);
});

// ":xxxx is to signify variable deposits"
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"], email: req.cookies["email"] };
  if (templateVars.longURL === undefined) {
    res.send("<html><body><b>400 ERROR</b><br>Long URL for " + templateVars.shortURL + " doesn't exist.<br>Please try again.</body></html>\n");
  } else {
    res.render("urls_show", templateVars);
  }
});

// redirect to fullURL from a shortened version of our path... using /u/
app.get("/u/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"], email: req.cookies["email"] };
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
  let theDatabase = userDatabase;
  const theUserEmails = fetchEmails();
  if (theUserEmails.includes(req.body.email)) {
    let templateVars = { loginPage: false, validationCheck: true, newUserCheck: false, urls: urlDatabase, username: req.cookies["username"], email: req.cookies["email"] };
    res.render("register", templateVars);
  } else if (req.body.email === "" || req.body.email.includes(" ") || req.body.email.indexOf("@") < 0 || req.body.email.indexOf(".") < 0) {
    let templateVars = { loginPage: false, newUserCheck: true, validationCheck: false, username: req.cookies["username"], email: req.cookies["email"] };
    res.render("register", templateVars);
  } else {
    const randoID = generateRandomString();
    let newUser = {};
    res.cookie("id", randoID);
    res.cookie("username", req.body.username);
    res.cookie("email", req.body.email);
    res.cookie("password", req.body.password);
    let theUsersCookies = { "id": randoID, "username": req.body.username, "email": req.body.email, "password": req.body.password };
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
  if (theUserEmails.includes(req.body.loginInfo) && req.body.password === userDatabase[theUsersKey]["password"]) {
    res.cookie("id", theUsersKey);
    res.cookie("username", userDatabase[theUsersKey]["username"]);
    res.cookie("email", userDatabase[theUsersKey]["email"]);
    res.cookie("password", userDatabase[theUsersKey]["password"]);
    res.redirect("/urls");
  } else if (theUsernames.includes(req.body.loginInfo) && req.body.password === userDatabase[theUsersKey]["password"]) {
    res.cookie("id", theUsersKey);
    res.cookie("username", userDatabase[theUsersKey]["username"]);
    res.cookie("email", userDatabase[theUsersKey]["email"]);
    res.cookie("password", userDatabase[theUsersKey]["password"]);
    res.redirect("/urls");
  } else {
    let templateVars = { loginPage: true, validationCheck: false, username: req.cookies["username"], email: req.cookies["email"] };
    res.render("login", templateVars);
  }
});

// logout and clear cookie
app.post("/logout", (req, res) => {
  console.log("User:", req.cookies.email, "has logged out.");
  res.clearCookie("id");
  res.clearCookie("username");
  res.clearCookie("email");
  res.clearCookie("password");
  res.redirect("/urls");
});

app.get('*', function(req, res) {
  res.status(404).send("<html><body><b>404 ERROR</b><br>That page doesn't exist.<br>Please try again.</body></html>\n");
});

// server to listen for client requests
app.listen(PORT, () => {
  console.log(`Example app, listening on port ${PORT}`);
});