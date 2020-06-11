// helper functions and stuff
function generateRandomString() {
  let ranChars = Math.random().toString(36).substr(2, 6);
  return ranChars;
};
function fetchUserKeys() {
  let userKeys = Object.keys(userDatabase);
  return userKeys;
}
function fetchUsernames() {
  let keys = fetchUserKeys();
  let userNames = [];
  for (key of keys) {
    userNames.push(userDatabase[key]["username"]);
  }
  return userNames;
}
function fetchEmails() {
  let keys = fetchUserKeys();
  let emails = [];
  for (key of keys) {
    emails.push(userDatabase[key]["email"]);
  }
  return emails;
}
function fetchUserKeysFromLoginInfo(loginInfo) {
  for (keys in userDatabase) {
    if (loginInfo.includes("@")) {
      if (userDatabase[keys]["email"] === loginInfo) {
        return keys;
      }
    } else {
      if (userDatabase[keys]["username"] === loginInfo) {
        return keys;
      }
    }
  }
}

module.exports = { generateRandomString, fetchUserKeys, fetchUsernames, fetchEmails, fetchUserKeysFromLoginInfo };