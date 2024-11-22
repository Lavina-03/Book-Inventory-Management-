const express = require("express");
const path = require("path");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const mysql = require("mysql2");
// const { Book } = require("./models");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "", // Replace with your MySQL password
  database: "login", // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log("Connected to MySQL!");
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, "views")));

// Variable to simulate user login state
let loggedInUser = null; // Will store the username after login

// Routes

// Login Route
app.post("/login", (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;

  db.query(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server error. Please try again later.");
      }

      if (results.length > 0) {
        console.log(`Logged in as: ${username}`);
        loggedInUser = username; // Set logged-in user
        res.redirect("/home"); // Redirect to home page
      } else {
        res.send(
          'Invalid username or password. <a href="/login.html">Go back to login</a>'
        );
      }
    }
  );
});

// Register Route
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  db.query(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, password],
    (err) => {
      if (err) {
        console.error("Database error:", err); // Log detailed error
        if (err.code === "ER_DUP_ENTRY") {
          return res.send(
            'Username already exists. <a href="/Register.html">Try again</a>'
          );
        }
        return res.status(500).send("Server error. Please try again later.");
      }

      res.redirect("/Login.html"); // Redirect to login after registration
    }
  );
});

// Middleware for protected routes
app.use((req, res, next) => {
  if (
    loggedInUser ||
    req.path === "/Login.html" ||
    req.path === "/Register.html" ||
    req.path === "/register"
  ) {
    next(); // Allow access if logged in or accessing login/register pages
  } else {
    res.redirect("/Login.html"); // Redirect to login if not logged in
  }
});

// Define Routes for Pages
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "views/Home.html"));
});

app.get("/Books", (req, res) => {
  res.sendFile(path.join(__dirname, "views/books.html")); // Replace with your actual file
});

app.get("/orders", (req, res) => {
  res.sendFile(path.join(__dirname, "views/orders.html")); // Replace with your actual file
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views/AboutUs.html")); // Replace with your actual file
});

// Define route for register page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views/Register.html"));
});

app.get("/", (req, res) => {
  res.redirect("/Login.html"); // Redirect to login page
});
// Logout Route
app.get("/logout", (req, res) => {
  loggedInUser = null; // Clear the login state
  res.redirect("/Login.html");
});

// Create a new book (POST request)
app.post("/Books", (req, res) => {
  const {
    title,
    isbn,
    publication_date,
    price,
    stock,
    author_id,
    categories,
    status,
  } = req.body;

  // Insert book into the database
  const query = `INSERT INTO books (title, isbn, publication_date, price, stock,status, author_id, categories) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    query,
    [
      title,
      isbn,
      publication_date,
      price,
      stock,
      status,
      author_id,
      categories.join(","),
    ],
    (err, result) => {
      if (err) throw err;
      res
        .status(201)
        .json({ message: "Book added successfully!", bookId: result.insertId });
    }
  );
});
// Fetch all books
app.get("/api/books", (req, res) => {
  const query = "SELECT * FROM Books";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching books:", err);
      res.status(500).json({ error: "Failed to fetch books" });
    } else {
      res.json(results);
    }
  });
});

// Fetch a single book's details by ID
app.get("/api/books/:id", (req, res) => {
  const bookId = req.params.id;
  const query = "SELECT * FROM Books WHERE id = ?";
  db.query(query, [bookId], (err, results) => {
    if (err) {
      console.error("Error fetching book:", err);
      res.status(500).json({ error: "Failed to fetch book" });
    } else if (results.length > 0) {
      res.json(results[0]); // Return the book details
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  });
});

// Update a book's details (PUT request)
app.put("/Books/:id", (req, res) => {
  const bookId = req.params.id;
  const {
    title,
    isbn,
    publication_date,
    price,
    stock,
    author_id,
    categories,
    status,
  } = req.body;

  const query = `
    UPDATE Books
    SET title = ?, isbn = ?, publication_date = ?, price = ?, stock = ?, status = ?, author_id = ?, categories = ?
    WHERE id = ?
  `;
  db.query(
    query,
    [
      title,
      isbn,
      publication_date,
      price,
      stock,
      status,
      author_id,
      categories.join(","),
      bookId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating book:", err);
        res.status(500).json({ error: "Failed to update book" });
      } else {
        res.json({ message: "Book updated successfully!" });
      }
    }
  );
});

// DELETE endpoint for deleting a book
app.delete("/api/books/:id", (req, res) => {
  const { id } = req.params;

  // SQL query to delete a book by ID
  const deleteQuery = "DELETE FROM Books WHERE id = ?";

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting book:", err);
      res.status(500).json({ message: "Error deleting book", error: err });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ message: "Book not found" });
    } else {
      res.status(200).json({ message: "Book deleted successfully" });
    }
  });
});


app.get("/api/books", (req, res) => {
  const { title, status, category } = req.query;

  // Start with the base query
  let query = "SELECT * FROM Books WHERE 1=1";
  let params = [];

  // Apply Title Filter
  if (title) {
      query += " AND title LIKE ?";
      params.push(`%${title}%`); // Use LIKE for partial matches
  }

  // Apply Status Filter
  if (status) {
      query += " AND status = ?";
      params.push(status); // Exact match for status
  }

  

  // Execute the query
  db.query(query, params, (err, results) => {
      if (err) {
          console.error("Error executing query:", err);
          return res.status(500).json({ error: "Database query failed" });
      }

      // Return the filtered results
      res.json(results);
  });
});
// Start server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
