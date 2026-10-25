const express = require("express");
const axios = require("axios");
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;
const public_users = express.Router();

const doesExist = (username) => {
  return users.some((user) => user.username === username);
};

// Build the server's own base URL so Axios can call the data endpoints below
const baseUrl = (req) => `${req.protocol}://${req.get("host")}`;

const sendError = (res, e) => {
  return res
    .status(e.response?.status || 500)
    .json(e.response?.data || { message: "Internal server error." });
};

/* ------------------------------------------------------------------ */
/* Register                                                            */
/* ------------------------------------------------------------------ */
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Missing username or password" });
  } else if (doesExist(username)) {
    return res.status(404).json({ message: "user already exists." });
  } else {
    users.push({ username: username, password: password });
    return res
      .status(200)
      .json({ message: "User successfully registered.  Please login." });
  }
});

/* ------------------------------------------------------------------ */
/* Data endpoints (plain lookups in booksdb.js, called through Axios)  */
/* ------------------------------------------------------------------ */
public_users.get("/data/books", (req, res) => {
  return res.status(200).json(books);
});

public_users.get("/data/isbn/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (book) {
    return res.status(200).json(book);
  }
  return res.status(404).json({ message: "ISBN not found." });
});

public_users.get("/data/author/:author", (req, res) => {
  const matchingBooks = Object.values(books).filter(
    (book) => book.author.toLowerCase() === req.params.author.toLowerCase()
  );
  if (matchingBooks.length > 0) {
    return res.status(200).json(matchingBooks);
  }
  return res.status(404).json({ message: "No books found by that author." });
});

public_users.get("/data/title/:title", (req, res) => {
  const matchingBooks = Object.values(books).filter(
    (book) => book.title.toLowerCase() === req.params.title.toLowerCase()
  );
  if (matchingBooks.length > 0) {
    return res.status(200).json(matchingBooks);
  }
  return res.status(404).json({ message: "No books found with that title." });
});

/* ------------------------------------------------------------------ */
/* Public routes (all four use Axios)                                  */
/* ------------------------------------------------------------------ */

// Get all books (async/await with Axios)
public_users.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${baseUrl(req)}/data/books`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (e) {
    return sendError(res, e);
  }
});

// Get book by ISBN (Promise callbacks with Axios)
public_users.get("/isbn/:isbn", (req, res) => {
  axios
    .get(`${baseUrl(req)}/data/isbn/${encodeURIComponent(req.params.isbn)}`)
    .then((response) => {
      return res.status(200).json(response.data);
    })
    .catch((e) => {
      return sendError(res, e);
    });
});

// Get books by author (async/await with Axios)
public_users.get("/author/:author", async (req, res) => {
  try {
    const response = await axios.get(
      `${baseUrl(req)}/data/author/${encodeURIComponent(req.params.author)}`
    );
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (e) {
    return sendError(res, e);
  }
});

// Get books by title (Promise callbacks with Axios)
public_users.get("/title/:title", (req, res) => {
  axios
    .get(`${baseUrl(req)}/data/title/${encodeURIComponent(req.params.title)}`)
    .then((response) => {
      return res.status(200).send(JSON.stringify(response.data, null, 4));
    })
    .catch((e) => {
      return sendError(res, e);
    });
});

/* ------------------------------------------------------------------ */
/* Get book review                                                     */
/* ------------------------------------------------------------------ */
public_users.get("/review/:isbn", function (req, res) {
  const targetBook = books[req.params.isbn];
  if (targetBook) {
    return res.status(200).send(JSON.stringify(targetBook.reviews, null, 4));
  } else {
    return res.status(404).json({ message: "ISBN not found." });
  }
});

module.exports.general = public_users;
