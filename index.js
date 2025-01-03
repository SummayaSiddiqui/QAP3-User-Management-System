const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "replace_this_with_a_secure_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
  {
    id: 1,
    username: "AdminUser",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user", // Regular user
  },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
  response.render("login", { error: null });
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
  const requestBody = request.body;
  //   console.log(request.body);
  const user = USERS.find((user) => user.email === requestBody.email);
  if (!user || !bcrypt.compareSync(requestBody.password, user.password)) {
    return response.render("login", {
      error: "Credentials do not match.",
    });
  }
  request.session.user = user;
  console.log("Correct credentials!");
  return response.redirect("/landing");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  response.render("signup", { error: null });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
  const requestBody = request.body;
  // console.log(request.body);
  // Check if user already exists
  const existingUser = USERS.find(
    (user) => user.email === requestBody.email
  );
  if (existingUser) {
    console.log("user already exists");
    return response.render("signup", {
      error: "User with this email already exists.",
    });
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(
    requestBody.password,
    SALT_ROUNDS
  );

  // Create a new user
  const newUser = {
    id: USERS.length + 1,
    username: requestBody.username,
    email: requestBody.email,
    password: hashedPassword,
    role: "user",
  };
  USERS.push(newUser);

  console.log("User created successfully:", newUser);
  return response.redirect("/login");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  const errorMessage = request.query.error;
  if (request.session.user) {
    return response.redirect("/landing");
  }
  console.log(request.session);
  return response.render("index", { error: errorMessage });
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
  if (!request.session.user) {
    return response.redirect(
      "/?error=Credentials required to access landing page."
    );
  }

  const user = request.session.user;
  if (user.role === "admin") {
    // Show all users for admin
    return response.render("landing", { user, users: USERS });
  } else {
    // Regular user view
    return response.render("landing", { user });
  }
});

// Logout route
app.get("/logout", (request, response) => {
  request.session.destroy((err) => {
    if (err) {
      console.error("Error while logging out:", err);
      return response
        .status(500)
        .send("An error occurred while logging out.");
    }
    response.redirect("/"); // Redirect to the index/home page
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
