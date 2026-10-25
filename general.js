const express = require("express");
const axios = require("axios");
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const doesExist = (username) => {
  return users.some((user) => user.username === username);
};

const getAllBooks = () => {
  return books;
};



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


public_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }

  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    return res.status(200).json({ message: "Login successful!" });
  } else {
    return res.status(401).json({ message: "Invalid username or password" });
  }
});


// Get the book list available in the shop
public_users.get("/", async (req, res) => {
  try {
    const allBooks = await getAllBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (e) {
    res.status(500).send(e);
  }
});

const getBooksByAuthor = (author) => {
  return new Promise((resolve, reject) => {
    const matchingBooks = Object.values(books).filter(
      (book) => book.author.toLowerCase() === author.toLowerCase()
    );
    if (matchingBooks.length > 0) {
      resolve(matchingBooks);
    } else {
      reject("No books found by that author.");
    }
  });
};

public_users.get("/author/:author", (req, res) => {
  const author = req.params.author;

  getBooksByAuthor(author)
    .then((matchingBooks) => {
      return res.status(200).send(JSON.stringify(matchingBooks, null, 4));
    })
    .catch((error) => {
      return res.status(404).json({ message: error });
    });
});
const getBooksByTitle = (title) => {
  return new Promise((resolve, reject) => {
    const matchingBooks = Object.values(books).filter(
      (book) => book.title.toLowerCase() === title.toLowerCase()
    );
    if (matchingBooks.length > 0) {
      resolve(matchingBooks);
    } else {
      reject("No books found with that title.");
    }
  });
};

public_users.get("/title/:title", (req, res) => {
  const title = req.params.title;

  getBooksByTitle(title)
    .then((matchingBooks) => {
      return res.status(200).send(JSON.stringify(matchingBooks, null, 4));
    })
    .catch((error) => {
      return res.status(404).json({ message: error });
    });
});

const getBookByISBN = (isbn) => {
  return new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject("ISBN not found.");
    }
  });
};

public_users.get("/isbn/:isbn", (req, res) => {
  const targetISBN = req.params.isbn;

  getBookByISBN(targetISBN)
    .then((book) => {
      return res.status(200).json(book);
    })
    .catch((error) => {
      return res.status(404).json({ message: error });
    });
});

// Get book details based on ISBN
public_users.get("/isbn/:isbn", async (req, res) => {
  const targetISBN = parseInt(req.params.isbn);
  const targetBook = await books[targetISBN];
  if (!targetBook) {
    return res.status(404).json({ message: "ISBN not found." });
  } else {
    return res.status(200).json(targetBook);
  }
});

// Get book details based on author
public_users.get("/author/:author", async (req, res) => {
  // get array of matching book objects
  const matchingBooks = Object.values(await books).filter(
    (book) => book.author.toLowerCase() === req.params.author.toLowerCase()
  );
  if (matchingBooks.length > 0) {
    return res.status(200).send(JSON.stringify(matchingBooks, null, 4));
  } else {
    return res.status(404).json({ message: "No books by that author." });
  }
});

// Get all books based on title
public_users.get("/title/:title", async (req, res) => {
  const matchingTitle = Object.values(await books).filter(
    (book) => book.title.toLowerCase() === req.params.title.toLowerCase()
  )[0];
  if (matchingTitle) {
    return res.status(200).json(matchingTitle);
  } else {
    return res.status(404).json({ message: "Title not found." });
  }
});

//  Get book review
public_users.get("/review/:isbn", function (req, res) {
  const targetISBN = req.params.isbn;
  const targetBook = books[targetISBN];
  if (targetBook) {
    return res.status(200).send(JSON.stringify(targetBook.reviews, null, 4));
  } else {
    return res.status(404).json({ message: "ISBN not found." });
  }
});

module.exports.general = public_users;
