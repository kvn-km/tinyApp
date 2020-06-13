const { hashPash, urlsForUserID, generateRandomString, fetchUserKeys, fetchUsernames, fetchEmails, fetchUserKeysFromLoginInfo } = require("../data/helperFunctions");
const { assert } = require("chai");
const bcrypt = require("bcrypt");

const testUsers = {
  "saspaw": {
    userID: "saspaw",
    username: "kvnkm",
    email: "kevinfkim@gmail.com",
    password: "roar-roar"
  },
  "aarsih": {
    userID: "aarsih",
    username: "123",
    email: "123@123.com",
    password: "like-a-dungeon-dragon"
  }
};

describe("fetch User Names", () => {
  it("should fetch usernames from a user list", () => {
    const result = fetchUsernames(testUsers);
    assert.deepEqual(result, ["kvnkm", "123"]);
    assert.notDeepEqual(result, ["123"]);
  });
});

describe("fetch Emails", () => {
  it("should fetch emails from a user list", () => {
    const result = fetchEmails(testUsers);
    assert.deepEqual(result, ["kevinfkim@gmail.com", "123@123.com"]);
    assert.notDeepEqual(result, ["kevifnfkim@gmail.com", "123@1a23.com"]);
  });
});

describe("fetch User Keys From Login Info", () => {
  it("should fetch user key (ID) from user login info", () => {
    const result1 = fetchUserKeysFromLoginInfo("kvnkm");
    const result2 = fetchUserKeysFromLoginInfo("123@123.com");
    assert.strictEqual(result1, "saspaw");
    assert.strictEqual(result2, "aarsih");
  });
});

describe("urls For User ID", () => {
  it("should return urls belonging to user", () => {
    const result1 = urlsForUserID("saspaw");
    const result2 = urlsForUserID("aarsih");
    assert.deepEqual(result1, { "yhy0bv": { "longURL": "http://www.google.ca", "userID": "saspaw" } });
    assert.notDeepEqual(result2, { "yhy0bv": { "longURL": "http://www.google.ca", "userID": "saspaw" } });
  });
});

describe("hash my pash", () => {
  it("should return password hashed", () => {
    const result1 = hashPash("roar-roar", 10);
    const result2 = hashPash("like-a-dungeon-dragon", 10);
    assert.isTrue(bcrypt.compareSync("roar-roar", result1));
    assert.isTrue(bcrypt.compareSync("like-a-dungeon-dragon", result2));
  });
});

