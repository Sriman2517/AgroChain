const express = require("express")
const bodyParser = require("body-parser")
const session = require("express-session")
const path = require("path")
const sqlite3 = require("sqlite3").verbose()
const bcrypt = require("bcryptjs")
const validator = require("validator")

const app = express()
const PORT = 3000

// Create and initialize the SQLite database
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error opening database", err.message)
  } else {
    console.log("Connected to the SQLite database")
    // Create users table
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      type TEXT NOT NULL,
      phone TEXT NOT NULL,
      aadhar TEXT NOT NULL,
      address TEXT NOT NULL,
      state TEXT NOT NULL,
      registeredAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
      (err) => {
        if (err) {
          console.error("Error creating users table", err.message)
        } else {
          console.log("Users table ready")
        }
      },
    )

    // Initialize additional tables for dashboards
    initializeDatabase()
  }
})

// Initialize database tables for dashboards
function initializeDatabase() {
  db.serialize(() => {
    // Create products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        price REAL NOT NULL,
        unit TEXT,
        current_stock REAL NOT NULL,
        min_stock REAL,
        description TEXT,
        last_updated TEXT
      )
    `)

    // Create orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        customer TEXT NOT NULL,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        order_date TEXT NOT NULL,
        status TEXT NOT NULL,
        delivery_date TEXT,
        delivery_address TEXT,
        special_instructions TEXT
      )
    `)

    // Create payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        customer TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        method TEXT NOT NULL
      )
    `)

    // Create vehicles table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL,
        type TEXT NOT NULL,
        capacity TEXT NOT NULL,
        driver TEXT NOT NULL,
        status TEXT NOT NULL,
        license_plate TEXT,
        fuel_level TEXT,
        mileage TEXT,
        last_maintenance TEXT,
        next_maintenance TEXT,
        assigned_order_id INTEGER,
        FOREIGN KEY (assigned_order_id) REFERENCES dealer_orders (id)
      )
    `)

    // Create wishlist table
    db.run(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        date_added TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `)

    // Create dealer_orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS dealer_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        dealer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT,
        unit_price REAL NOT NULL,
        total REAL NOT NULL,
        order_date TEXT NOT NULL,
        status TEXT NOT NULL,
        delivery_date TEXT,
        delivery_address TEXT,
        special_instructions TEXT,
        processing_date TEXT,
        shipping_date TEXT,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `)

    // Create dealer_inventory table
    db.run(`
      CREATE TABLE IF NOT EXISTS dealer_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dealer_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT,
        price REAL NOT NULL,
        unit TEXT,
        quantity REAL NOT NULL,
        min_stock REAL,
        description TEXT,
        last_updated TEXT,
        status TEXT
      )
    `)

    // Create retailer_inventory table
    db.run(`
      CREATE TABLE IF NOT EXISTS retailer_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        retailer_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT,
        price REAL NOT NULL,
        unit TEXT,
        quantity REAL NOT NULL,
        min_stock REAL,
        description TEXT,
        last_updated TEXT,
        status TEXT
      )
    `)

    // Create retailer_orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS retailer_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        retailer_id INTEGER NOT NULL,
        dealer_id INTEGER NOT NULL,
        dealer_inventory_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT,
        unit_price REAL NOT NULL,
        total REAL NOT NULL,
        order_date TEXT NOT NULL,
        status TEXT NOT NULL,
        delivery_date TEXT,
        delivery_address TEXT,
        special_instructions TEXT,
        processing_date TEXT,
        shipping_date TEXT
      )
    `)

    // Create contact_submissions table
    db.run(
      `
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0
      )`,
      (err) => {
        if (err) {
          console.error("Error creating contact_submissions table", err.message)
        } else {
          console.log("Contact submissions table ready")
        }
      },
    )

    // Check if products table is empty and insert sample data if needed
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (err) {
        console.error(err.message)
        return
      }

      if (row.count === 0) {
        insertSampleData()
      }
    })

    // Check if dealer_inventory table is empty and insert sample data if needed
    db.get("SELECT COUNT(*) as count FROM dealer_inventory", (err, row) => {
      if (err) {
        console.error(err.message)
        return
      }

      if (row.count === 0) {
        insertDealerInventorySampleData()
      }
    })

    // Check if retailer_inventory table is empty and insert sample data if needed
    db.get("SELECT COUNT(*) as count FROM retailer_inventory", (err, row) => {
      if (err) {
        console.error(err.message)
        return
      }

      if (row.count === 0) {
        insertRetailerInventorySampleData()
      }
    })
  })
}

// Insert sample data
function insertSampleData() {
  const today = new Date().toISOString().split("T")[0]

  // Sample products
  const products = [
    ["Organic Apples", "Fruits", 3.99, "kg", 50, 10, "Fresh organic apples from local farms", today],
    ["Fresh Eggs", "Dairy", 4.5, "dozen", 40, 5, "Free-range chicken eggs", today],
    ["Organic Honey", "Other", 12.99, "L", 5, 10, "Raw unfiltered honey", today],
    ["Organic Wheat", "Grains", 320, "ton", 5000, 500, "Premium quality organic wheat", today],
    ["Fresh Tomatoes", "Vegetables", 2.5, "kg", 200, 50, "Vine-ripened tomatoes", today],
    ["Premium Apples", "Fruits", 3.75, "kg", 300, 50, "Premium quality apples", today],
    ["Organic Corn", "Grains", 280, "ton", 3000, 500, "Organic corn from sustainable farms", today],
    ["Fresh Potatoes", "Vegetables", 1.8, "kg", 500, 100, "Farm-fresh potatoes", today],
    ["Organic Rice", "Grains", 350, "ton", 2000, 500, "Organic rice from local farms", today],
  ]

  const productStmt = db.prepare(`
    INSERT INTO products (name, category, price, unit, current_stock, min_stock, description, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  products.forEach((product) => {
    productStmt.run(product, (err) => {
      if (err) console.error("Error inserting product:", err.message)
    })
  })

  productStmt.finalize()

  // Sample orders
  const orders = [
    ["#1234", "John Smith", "Organic Apples (5kg), Fresh Eggs (2 dozen)", 45.5, "2025-03-02", "Delivered"],
    ["#1235", "Maria Garcia", "Tomatoes (2kg), Lettuce (3 heads)", 22.75, "2025-03-03", "Processing"],
    ["#1236", "Robert Johnson", "Honey (1L), Potatoes (10kg)", 38.2, "2025-03-03", "Pending"],
  ]

  const orderStmt = db.prepare(`
    INSERT INTO orders (order_id, customer, items, total, order_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  orders.forEach((order) => {
    orderStmt.run(order, (err) => {
      if (err) console.error("Error inserting order:", err.message)
    })
  })

  orderStmt.finalize()

  // Sample payments
  const payments = [
    ["PMT001", "#1234", "John Smith", 45.5, "2025-03-02", "Complete", "Credit Card"],
    ["PMT002", "#1235", "Maria Garcia", 22.75, "2025-03-03", "Pending", "Bank Transfer"],
    ["PMT003", "#1236", "Robert Johnson", 38.2, "2025-03-03", "Pending", "Cash on Delivery"],
  ]

  const paymentStmt = db.prepare(`
    INSERT INTO payments (payment_id, order_id, customer, amount, date, status, method)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  payments.forEach((payment) => {
    paymentStmt.run(payment, (err) => {
      if (err) console.error("Error inserting payment:", err.message)
    })
  })

  paymentStmt.finalize()

  // Sample vehicles
  const vehicles = [
    [
      "VEH-001",
      "Refrigerated Truck",
      "5 tons",
      "Michael Brown",
      "Available",
      "AG-5432",
      "85%",
      "45,230 km",
      "2025-02-28",
      "2025-04-15",
      null,
    ],
    [
      "VEH-002",
      "Flatbed Truck",
      "8 tons",
      "Sarah Johnson",
      "On Route",
      "AG-7890",
      "60%",
      "78,450 km",
      "2025-03-05",
      "2025-05-10",
      null,
    ],
    [
      "VEH-003",
      "Refrigerated Van",
      "2 tons",
      "John Smith",
      "Maintenance",
      "AG-1234",
      "90%",
      "32,780 km",
      "2025-03-10",
      "2025-06-20",
      null,
    ],
  ]

  const vehicleStmt = db.prepare(`
    INSERT INTO vehicles (vehicle_id, type, capacity, driver, status, license_plate, fuel_level, mileage, last_maintenance, next_maintenance, assigned_order_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  vehicles.forEach((vehicle) => {
    vehicleStmt.run(vehicle, (err) => {
      if (err) console.error("Error inserting vehicle:", err.message)
    })
  })

  vehicleStmt.finalize()

  // Sample dealer orders
  const dealerOrders = [
    [
      "#DO-001",
      1,
      4,
      1000,
      "ton",
      320,
      320000,
      "2025-03-01",
      "Pending",
      "2025-03-10",
      "123 Dealer St, City",
      "Handle with care",
      null,
      null,
    ],
    [
      "#DO-002",
      1,
      5,
      500,
      "kg",
      2.5,
      1250,
      "2025-03-02",
      "Processing",
      "2025-03-12",
      "123 Dealer St, City",
      "",
      "2025-03-03",
      null,
    ],
    [
      "#DO-003",
      1,
      6,
      800,
      "kg",
      3.75,
      3000,
      "2025-03-03",
      "Delivered",
      "2025-03-05",
      "123 Dealer St, City",
      "",
      "2025-03-03",
      "2025-03-04",
    ],
  ]

  const dealerOrderStmt = db.prepare(`
    INSERT INTO dealer_orders (order_id, dealer_id, product_id, quantity, unit, unit_price, total, order_date, status, delivery_date, delivery_address, special_instructions, processing_date, shipping_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  dealerOrders.forEach((order) => {
    dealerOrderStmt.run(order, (err) => {
      if (err) console.error("Error inserting dealer order:", err.message)
    })
  })

  dealerOrderStmt.finalize()

  console.log("Sample data inserted successfully")
}

// Insert sample dealer inventory data
function insertDealerInventorySampleData() {
  const today = new Date().toISOString().split("T")[0]

  // Sample dealer inventory items
  const inventoryItems = [
    [1, "Processed Wheat Flour", "Grains", 5.99, "kg", 500, 100, "Premium quality wheat flour", today, "In Stock"],
    [1, "Packaged Apples", "Fruits", 6.5, "kg", 200, 50, "Packaged premium apples", today, "In Stock"],
    [1, "Organic Honey Jars", "Other", 15.99, "jar", 100, 20, "Organic honey in glass jars (500ml)", today, "In Stock"],
    [1, "Corn Flour", "Grains", 4.25, "kg", 300, 75, "Fine ground corn flour", today, "In Stock"],
    [2, "Fresh Tomato Sauce", "Vegetables", 3.99, "bottle", 150, 30, "Homemade tomato sauce", today, "In Stock"],
    [2, "Potato Chips", "Snacks", 2.99, "bag", 200, 40, "Crispy potato chips", today, "In Stock"],
    [3, "Rice Flour", "Grains", 4.5, "kg", 250, 50, "Fine ground rice flour", today, "In Stock"],
    [3, "Apple Juice", "Beverages", 3.25, "bottle", 100, 20, "Fresh pressed apple juice", today, "In Stock"],
  ]

  const inventoryStmt = db.prepare(`
    INSERT INTO dealer_inventory (dealer_id, product_name, category, price, unit, quantity, min_stock, description, last_updated, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  inventoryItems.forEach((item) => {
    inventoryStmt.run(item, (err) => {
      if (err) console.error("Error inserting inventory item:", err.message)
    })
  })

  inventoryStmt.finalize()

  console.log("Sample dealer inventory data inserted successfully")
}

// Insert sample retailer inventory data
function insertRetailerInventorySampleData() {
  const today = new Date().toISOString().split("T")[0]

  // Sample retailer inventory items
  const inventoryItems = [
    [1, "Wheat Flour", "Grains", 7.99, "kg", 100, 20, "Premium quality wheat flour", today, "In Stock"],
    [1, "Packaged Apples", "Fruits", 8.5, "kg", 50, 10, "Packaged premium apples", today, "In Stock"],
    [1, "Honey Jars", "Other", 18.99, "jar", 30, 5, "Organic honey in glass jars (500ml)", today, "In Stock"],
    [2, "Tomato Sauce", "Vegetables", 5.99, "bottle", 40, 10, "Homemade tomato sauce", today, "In Stock"],
    [2, "Potato Chips", "Snacks", 3.99, "bag", 60, 15, "Crispy potato chips", today, "In Stock"],
  ]

  const inventoryStmt = db.prepare(`
    INSERT INTO retailer_inventory (retailer_id, product_name, category, price, unit, quantity, min_stock, description, last_updated, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  inventoryItems.forEach((item) => {
    inventoryStmt.run(item, (err) => {
      if (err) console.error("Error inserting retailer inventory item:", err.message)
    })
  })

  inventoryStmt.finalize()

  console.log("Sample retailer inventory data inserted successfully")
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, "public")))

// View engine setup (EJS)
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Session setup
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }, // 1 hour
  }),
)

// Admin Credentials
const ADMIN_EMAIL = "agrochain@gmail.com"
const ADMIN_PASSWORD = "agrochain8"

// States list
const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
]

// Custom email validation function
function isValidEmail(email) {
  // Basic email format validation with enhanced TLD restriction
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  // Check if email matches the regex
  if (!emailRegex.test(email)) return false

  // Split email into parts
  const parts = email.split("@")
  const domainParts = parts[1].split(".")

  // Ensure TLD does not contain numbers
  const tld = domainParts[domainParts.length - 1]
  if (/\d/.test(tld)) return false

  return true
}

// Password strength validator
function isStrongPassword(password) {
  // At least 8 characters long
  // Contains at least one uppercase, one lowercase, one number, and one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next()
  res.redirect("/login")
}

// Middleware to check if admin is logged in
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.email === ADMIN_EMAIL) return next()
  res.redirect("/login")
}

// Logging middleware
app.use((req, res, next) => {
  console.log(`Request for: ${req.url}`)
  next()
})

// Routes
app.get("/", (req, res) => res.render("index"))

// Add a route to handle the login form submission from login.html
app.get("/login", (req, res) => {
  // If user is already logged in, redirect to their dashboard
  if (req.session.user) {
    return res.redirect(`/${req.session.user.type}`)
  }
  res.render("login", { error: null })
})

app.post("/login", (req, res) => {
  const { email, password } = req.body

  // Check if admin login
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.user = { email, type: "admin" }
    return res.redirect("/admin")
  }

  // Check database for user
  db.get("SELECT * FROM users WHERE email = ? OR username = ?", [email, email], (err, user) => {
    if (err) {
      console.error(err.message)
      return res.render("login", { error: "Database error" })
    }

    if (!user) {
      return res.render("login", { error: "Invalid email or password" })
    }

    // Compare password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error(err.message)
        return res.render("login", { error: "Authentication error" })
      }

      if (isMatch) {
        // Store user in session
        req.session.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          type: user.type,
          firstName: user.firstName,
          lastName: user.lastName,
        }

        // Redirect based on user type
        switch (user.type) {
          case "farmer":
            return res.redirect("/farmer")
          case "dealer":
            return res.redirect("/dealer")
          case "retailer":
            return res.redirect("/retailer")
          default:
            return res.redirect("/")
        }
      } else {
        return res.render("login", { error: "Invalid email or password" })
      }
    })
  })
})

app.get("/signup", (req, res) =>
  res.render("signup", {
    error: null,
    states: STATES,
    oldInput: {},
  }),
)

app.post("/signup", (req, res) => {
  const { firstName, lastName, username, email, password, confirmPassword, type, phone, aadhar, address, state } =
    req.body

  // Create an oldInput object to preserve form data in case of validation errors
  const oldInput = {
    firstName,
    lastName,
    username,
    email,
    type,
    phone,
    aadhar,
    address,
    state,
  }

  // Validate input
  if (
    !firstName ||
    !lastName ||
    !username ||
    !email ||
    !password ||
    !confirmPassword ||
    !type ||
    !phone ||
    !aadhar ||
    !address ||
    !state
  ) {
    return res.render("signup", {
      error: "All fields are required",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Validate names
  if (!/^[A-Za-z]+$/.test(firstName) || !/^[A-Za-z]+$/.test(lastName)) {
    return res.render("signup", {
      error: "First and last names should only contain letters",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Validate username
  if (!/^[A-Za-z0-9_]{4,}$/.test(username)) {
    return res.render("signup", {
      error: "Username must be at least 4 characters long and contain only letters, numbers, and underscores",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Validate email
  if (!isValidEmail(email)) {
    return res.render("signup", {
      error: "Invalid email format",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Validate password match
  if (password !== confirmPassword) {
    return res.render("signup", {
      error: "Passwords do not match",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Validate password strength
  if (!isStrongPassword(password)) {
    return res.render("signup", {
      error:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Validate phone number
  if (!/^[0-9]{10}$/.test(phone)) {
    return res.render("signup", {
      error: "Phone number must be 10 digits",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Validate Aadhar number
  if (!/^[0-9]{12}$/.test(aadhar)) {
    return res.render("signup", {
      error: "Aadhar number must be 12 digits",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Validate user type
  if (!["farmer", "dealer", "retailer"].includes(type)) {
    return res.render("signup", {
      error: "Invalid user type",
      states: STATES,
      oldInput: oldInput,
    })
  }

  // Check if username or email already exists
  db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, email], (err, user) => {
    if (err) {
      console.error(err.message)
      return res.render("signup", {
        error: "Database error",
        states: STATES,
        oldInput: oldInput,
      })
    }

    if (user) {
      if (user.email === email) {
        return res.render("signup", {
          error: "Email already registered",
          states: STATES,
          oldInput: oldInput,
        })
      } else {
        return res.render("signup", {
          error: "Username already taken",
          states: STATES,
          oldInput: oldInput,
        })
      }
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error(err.message)
        return res.render("signup", {
          error: "Error hashing password",
          states: STATES,
          oldInput: oldInput,
        })
      }

      // Insert new user
      const sql = `INSERT INTO users (firstName, lastName, username, email, password, type, phone, aadhar, address, state) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

      db.run(
        sql,
        [firstName, lastName, username, email, hashedPassword, type, phone, aadhar, address, state],
        function (err) {
          if (err) {
            console.error(err.message)
            return res.render("signup", {
              error: "Error registering user",
              states: STATES,
              oldInput: oldInput,
            })
          }

          // Store user in session
          req.session.user = {
            id: this.lastID,
            email,
            username,
            type,
            firstName,
            lastName,
          }

          // Redirect based on user type
          switch (type) {
            case "farmer":
              return res.redirect("/farmer")
            case "dealer":
              return res.redirect("/dealer")
            case "retailer":
              return res.redirect("/retailer")
            default:
              return res.redirect("/")
          }
        },
      )
    })
  })
})

// Pages
app.get("/index", (req, res) => res.render("index"))
app.get("/aboutus", (req, res) => res.render("aboutus"))
app.get("/contactus", (req, res) => res.render("contactus"))

// Protected routes
app.get("/admin", isAdmin, (req, res) => {
  // Query to get counts of each user type
  const countQuery = `
    SELECT 
      COUNT(CASE WHEN type = 'farmer' THEN 1 END) as farmerCount,
      COUNT(CASE WHEN type = 'dealer' THEN 1 END) as dealerCount,
      COUNT(CASE WHEN type = 'retailer' THEN 1 END) as retailerCount,
      COUNT(*) as totalUsers
    FROM users
  `

  // Query to get recent users for activity log
  const recentUsersQuery = `
    SELECT id, firstName, lastName, type, registeredAt
    FROM users
    ORDER BY registeredAt DESC
    LIMIT 5
  `

  // Query to get unread contact submissions count
  const unreadContactQuery = `
    SELECT COUNT(*) as count
    FROM contact_submissions
    WHERE is_read = 0
  `

  // Execute the count query
  db.get(countQuery, [], (err, counts) => {
    if (err) {
      console.error("Error fetching user counts:", err.message)
      return res.render("error", { message: "Database error" })
    }

    // Execute the recent users query
    db.all(recentUsersQuery, [], (err, recentUsers) => {
      if (err) {
        console.error("Error fetching recent users:", err.message)
        return res.render("error", { message: "Database error" })
      }

      // Execute the unread contact query
      db.get(unreadContactQuery, [], (err, unreadContact) => {
        if (err) {
          console.error("Error fetching unread contact count:", err.message)
          return res.render("error", { message: "Database error" })
        }

        // Get transaction data for chart
        const transactionData = {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          values: [120, 190, 300, 250, 420, 380],
        }

        // Render the admin page with the data
        res.render("admin", {
          counts: counts,
          recentUsers: recentUsers,
          transactionData: transactionData,
          unreadContact: unreadContact.count,
        })
      })
    })
  })
})

app.get("/farmer", isAuthenticated, (req, res) => {
  if (req.session.user.type !== "farmer" && req.session.user.type !== "admin") {
    return res.redirect(`/${req.session.user.type}`)
  }

  db.all("SELECT * FROM users WHERE type = ?", ["farmer"], (err, farmers) => {
    if (err) {
      console.error(err.message)
      return res.render("error", { message: "Database error" })
    }

    res.render("farmer", {
      farmers: farmers,
      currentUser: req.session.user,
    })
  })
})

app.get("/dealer", isAuthenticated, (req, res) => {
  if (req.session.user.type !== "dealer" && req.session.user.type !== "admin") {
    return res.redirect(`/${req.session.user.type}`)
  }

  db.all("SELECT * FROM users WHERE type = ?", ["dealer"], (err, dealers) => {
    if (err) {
      console.error(err.message)
      return res.render("error", { message: "Database error" })
    }

    res.render("dealer", {
      dealers: dealers,
      currentUser: req.session.user,
    })
  })
})

app.get("/retailer", isAuthenticated, (req, res) => {
  if (req.session.user.type !== "retailer" && req.session.user.type !== "admin") {
    return res.redirect(`/${req.session.user.type}`)
  }

  db.all("SELECT * FROM users WHERE type = ?", ["retailer"], (err, retailers) => {
    if (err) {
      console.error(err.message)
      return res.render("error", { message: "Database error" })
    }

    res.render("retailer", {
      retailers: retailers,
      currentUser: req.session.user,
    })
  })
})

// Feature routes
app.get("/feature1", (req, res) => res.render("feature1"))
app.get("/feature2", (req, res) => res.render("feature2"))
app.get("/feature3", (req, res) => res.render("feature3"))
app.get("/feature4", (req, res) => res.render("feature4"))

// User type specific routes
app.get("/farmeruser", (req, res) => res.render("farmeruser"))
app.get("/delaruser", (req, res) => res.render("delaruser"))
app.get("/retaileruser", (req, res) => res.render("retaileruser"))

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err)
    }
    res.redirect("/login")
  })
})

// ==================== DASHBOARD API ROUTES ====================

// Get dashboard stats
app.get("/api/dashboard/stats", (req, res) => {
  const stats = {}
  // Get total products
  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    stats.totalProducts = row.count

    // Get total categories
    db.get("SELECT COUNT(DISTINCT category) as count FROM products", (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      stats.totalCategories = row.count

      // Get low stock items
      db.get(
        "SELECT COUNT(*) as count FROM products WHERE current_stock < min_stock AND current_stock > 0",
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message })
          }
          stats.lowStockItems = row.count

          // Get active orders (both regular and dealer orders)
          db.get("SELECT COUNT(*) as count FROM orders WHERE status != 'Delivered'", (err, row1) => {
            if (err) {
              return res.status(500).json({ error: err.message })
            }

            db.get("SELECT COUNT(*) as count FROM dealer_orders WHERE status != 'Delivered'", (err, row2) => {
              if (err) {
                return res.status(500).json({ error: err.message })
              }

              stats.activeOrders = row1.count + row2.count

              // Get total revenue (both regular and dealer orders)
              db.get("SELECT SUM(total) as sum FROM orders", (err, row1) => {
                if (err) {
                  return res.status(500).json({ error: err.message })
                }

                db.get("SELECT SUM(total) as sum FROM dealer_orders", (err, row2) => {
                  if (err) {
                    return res.status(500).json({ error: err.message })
                  }

                  const regularRevenue = row1.sum || 0
                  const dealerRevenue = row2.sum || 0
                  stats.totalRevenue = regularRevenue + dealerRevenue

                  res.json(stats)
                })
              })
            })
          })
        },
      )
    })
  })
})

// Get recent orders
app.get("/api/orders/recent", (req, res) => {
  // Get both regular and dealer orders
  Promise.all([
    new Promise((resolve, reject) => {
      db.all("SELECT * FROM orders ORDER BY order_date DESC LIMIT 3", (err, rows) => {
        if (err) reject(err)
        else resolve(rows.map((row) => ({ ...row, type: "regular" })))
      })
    }),
    new Promise((resolve, reject) => {
      db.all(
        `
        SELECT do.*, p.name as product 
        FROM dealer_orders do
        JOIN products p ON do.product_id = p.id
        ORDER BY order_date DESC LIMIT 3
      `,
        (err, rows) => {
          if (err) reject(err)
          else
            resolve(
              rows.map((row) => ({
                ...row,
                type: "dealer",
                customer: "Dealer #" + row.dealer_id,
                items: `${row.product} (${row.quantity} ${row.unit})`,
              })),
            )
        },
      )
    }),
  ])
    .then(([regularOrders, dealerOrders]) => {
      // Combine and sort by date
      const allOrders = [...regularOrders, ...dealerOrders]
        .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
        .slice(0, 5)

      res.json(allOrders)
    })
    .catch((err) => {
      res.status(500).json({ error: err.message })
    })
})

// Get all products
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products ORDER BY name", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Check if products are in wishlist for user_id 1 (demo user)
    const productPromises = rows.map((product) => {
      return new Promise((resolve, reject) => {
        db.get("SELECT * FROM wishlist WHERE user_id = 1 AND product_id = ?", [product.id], (err, row) => {
          if (err) {
            reject(err)
            return
          }
          resolve({
            ...product,
            liked: !!row,
          })
        })
      })
    })

    Promise.all(productPromises)
      .then((productsWithLiked) => {
        res.json(productsWithLiked)
      })
      .catch((err) => {
        res.status(500).json({ error: err.message })
      })
  })
})

// Get a single product
app.get("/api/products/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (!row) {
      return res.status(404).json({ error: "Product not found" })
    }
    res.json(row)
  })
})

// Create a new product
app.post("/api/products", (req, res) => {
  const { name, category, price, unit, current_stock, min_stock, description } = req.body
  const last_updated = new Date().toISOString().split("T")[0]

  if (!name || !price || !current_stock) {
    return res.status(400).json({ error: "Name, price, and current stock are required" })
  }

  const sql = `
    INSERT INTO products (name, category, price, unit, current_stock, min_stock, description, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `

  db.run(sql, [name, category, price, unit, current_stock, min_stock, description, last_updated], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.status(201).json({
      id: this.lastID,
      name,
      category,
      price,
      unit,
      current_stock,
      min_stock,
      description,
      last_updated,
    })
  })
})

// Update a product
app.put("/api/products/:id", (req, res) => {
  const { name, category, price, unit, current_stock, min_stock, description } = req.body
  const last_updated = new Date().toISOString().split("T")[0]

  if (!name || !price || !current_stock) {
    return res.status(400).json({ error: "Name, price, and current stock are required" })
  }

  const sql = `
    UPDATE products
    SET name = ?, category = ?, price = ?, unit = ?, current_stock = ?, min_stock = ?, description = ?, last_updated = ?
    WHERE id = ?
  `

  db.run(
    sql,
    [name, category, price, unit, current_stock, min_stock, description, last_updated, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Product not found" })
      }

      db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        res.json(row)
      })
    },
  )
})

// Delete a product
app.delete("/api/products/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Product not found" })
    }

    res.json({ message: "Product deleted successfully" })
  })
})

// Get all orders
app.get("/api/orders", (req, res) => {
  db.all("SELECT * FROM orders ORDER BY order_date DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

// Update order status
app.put("/api/orders/:id/status", (req, res) => {
  const { status } = req.body

  if (!status) {
    return res.status(400).json({ error: "Status is required" })
  }

  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" })
    }

    res.json({ message: "Order status updated successfully" })
  })
})

// Add this endpoint to handle farmer approval of dealer orders
app.put("/api/dealer/orders/:id/approve", (req, res) => {
  const orderId = req.params.id

  // First, get the order details
  db.get(
    `SELECT do.*, p.name as product_name, p.category, p.description 
     FROM dealer_orders do
     JOIN products p ON do.product_id = p.id
     WHERE do.id = ?`,
    [orderId],
    (err, order) => {
      if (err) {
        console.error("Error getting order details:", err)
        return res.status(500).json({ error: err.message })
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" })
      }

      // Check if there's enough inventory to fulfill the order
      db.get("SELECT * FROM products WHERE id = ?", [order.product_id], (err, product) => {
        if (err) {
          console.error("Error checking product inventory:", err)
          return res.status(500).json({ error: err.message })
        }

        if (!product) {
          return res.status(404).json({ error: "Product not found" })
        }

        if (product.current_stock < order.quantity) {
          return res.status(400).json({
            error: "Insufficient inventory to fulfill this order",
            available: product.current_stock,
            requested: order.quantity,
          })
        }

        // Update order status to Processing
        db.run(
          "UPDATE dealer_orders SET status = 'Processing', processing_date = ? WHERE id = ?",
          [new Date().toISOString().split("T")[0], orderId],
          function (err) {
            if (err) {
              console.error("Error updating order status:", err)
              return res.status(500).json({ error: err.message })
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: "Order not found" })
            }

            // Reduce the product quantity in inventory
            const newStock = product.current_stock - order.quantity
            const today = new Date().toISOString().split("T")[0]

            db.run(
              "UPDATE products SET current_stock = ?, last_updated = ? WHERE id = ?",
              [newStock, today, order.product_id],
              (err) => {
                if (err) {
                  console.error("Error updating product inventory:", err)
                  return res.status(500).json({ error: err.message })
                }

                // Now add the product to dealer's inventory
                const dealerId = order.dealer_id

                // Check if the product already exists in dealer's inventory
                db.get(
                  "SELECT * FROM dealer_inventory WHERE dealer_id = ? AND product_name = ?",
                  [dealerId, order.product_name],
                  (err, existingProduct) => {
                    if (err) {
                      console.error("Error checking dealer inventory:", err)
                      return res.status(500).json({ error: err.message })
                    }

                    if (existingProduct) {
                      // Update existing inventory item
                      db.run(
                        `UPDATE dealer_inventory 
                         SET quantity = quantity + ?, last_updated = ?, status = ?
                         WHERE id = ?`,
                        [order.quantity, today, "In Stock", existingProduct.id],
                        (err) => {
                          if (err) {
                            console.error("Error updating dealer inventory:", err)
                            return res.status(500).json({ error: err.message })
                          }

                          res.json({
                            message: "Order approved and inventory updated successfully",
                            inventoryUpdated: true,
                            inventoryAction: "updated",
                            newFarmerStock: newStock,
                          })
                        },
                      )
                    } else {
                      // Add new inventory item
                      db.run(
                        `INSERT INTO dealer_inventory 
                         (dealer_id, product_name, category, price, unit, quantity, min_stock, description, last_updated, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                          dealerId,
                          order.product_name,
                          order.category,
                          order.unit_price,
                          order.unit,
                          order.quantity,
                          Math.floor(order.quantity * 0.2), // Set min_stock to 20% of ordered quantity
                          order.description || "",
                          today,
                          "In Stock",
                        ],
                        (err) => {
                          if (err) {
                            console.error("Error adding to dealer inventory:", err)
                            return res.status(500).json({ error: err.message })
                          }

                          res.json({
                            message: "Order approved and inventory updated successfully",
                            inventoryUpdated: true,
                            inventoryAction: "added",
                            newFarmerStock: newStock,
                          })
                        },
                      )
                    }
                  },
                )
              },
            )
          },
        )
      })
    },
  )
})

// Get all payments
app.get("/api/payments", (req, res) => {
  db.all("SELECT * FROM payments ORDER BY date DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

// Get payment stats
app.get("/api/payments/stats", (req, res) => {
  const stats = {}

  // Get total revenue
  db.get("SELECT SUM(amount) as sum FROM payments", (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    stats.totalRevenue = row.sum || 0

    // Get pending payments
    db.get("SELECT SUM(amount) as sum, COUNT(*) as count FROM payments WHERE status = 'Pending'", (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      stats.pendingPayments = row.sum || 0
      stats.pendingCount = row.count || 0

      // Get today's payments
      const today = new Date().toISOString().split("T")[0]
      db.get("SELECT SUM(amount) as sum, COUNT(*) as count FROM payments WHERE date = ?", [today], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        stats.todayPayments = row.sum || 0
        stats.todayCount = row.count || 0

        res.json(stats)
      })
    })
  })
})

// Save farm settings
app.post("/api/farm/settings", (req, res) => {
  const { farm_name, owner_name, address, email, phone } = req.body

  // In a real app, this would save to a database
  // For now, we'll just return success
  res.json({
    success: true,
    message: "Farm settings saved successfully",
    data: { farm_name, owner_name, address, email, phone },
  })
})

// Dealer API Routes

// Get dealer dashboard stats
app.get("/api/dealer/dashboard/stats", (req, res) => {
  // Get actual counts from database
  Promise.all([
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM dealer_orders WHERE status = 'Pending'", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM dealer_orders WHERE status = 'In Transit'", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM vehicles WHERE status = 'Available'", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM vehicles WHERE status = 'On Route'", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT SUM(total) as sum FROM dealer_orders", (err, row) => {
        if (err) reject(err)
        else resolve(row.sum || 0)
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM dealer_inventory", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM dealer_inventory WHERE quantity < min_stock", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM retailer_orders WHERE status = 'Pending'", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
  ])
    .then(
      ([
        pendingOrders,
        activeDeliveries,
        availableProducts,
        availableVehicles,
        activeRoutes,
        totalRevenue,
        inventoryCount,
        lowStockCount,
        pendingRetailerOrders,
      ]) => {
        res.json({
          pendingOrders: pendingOrders + pendingRetailerOrders,
          activeDeliveries,
          availableProducts,
          verifiedFarmers: 43, // Mock data
          availableVehicles,
          activeRoutes,
          scheduledPickups: 5, // Mock data
          pendingDeliveries: pendingOrders + pendingRetailerOrders,
          monthlyRevenue: totalRevenue,
          growthRate: 18, // Mock data
          monthlyOrders: pendingOrders + activeDeliveries + pendingRetailerOrders,
          newCustomers: 12, // Mock data
          inventoryCount,
          lowStockCount,
          pendingRetailerOrders,
        })
      },
    )
    .catch((err) => {
      console.error("Error getting dashboard stats:", err)
      res.status(500).json({ error: err.message })
    })
})

// Get dealer recent orders
app.get("/api/dealer/orders/recent", (req, res) => {
  db.all(
    `
    SELECT do.*, p.name as product, p.unit 
    FROM dealer_orders do
    JOIN products p ON do.product_id = p.id
    ORDER BY order_date DESC LIMIT 5
  `,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      // Format the data
      const formattedOrders = rows.map((order) => ({
        ...order,
        customer: `Dealer #${order.dealer_id}`,
      }))

      res.json(formattedOrders)
    },
  )
})

// Get dealer orders
app.get("/api/dealer/orders", (req, res) => {
  const { status, date, search } = req.query

  let sql = `
    SELECT do.*, p.name as product, p.unit 
    FROM dealer_orders do
    JOIN products p ON do.product_id = p.id
    WHERE 1=1
  `

  const params = []

  if (status && status !== "all") {
    sql += " AND do.status = ?"
    params.push(status)
  }

  if (date) {
    sql += " AND do.order_date = ?"
    params.push(date)
  }

  if (search) {
    sql += " AND (do.order_id LIKE ? OR p.name LIKE ?)"
    params.push(`%${search}%`, `%${search}%`)
  }

  sql += " ORDER BY do.order_date DESC"

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Format the data
    const formattedOrders = rows.map((order) => ({
      ...order,
      customer: `Dealer #${order.dealer_id}`,
    }))

    res.json(formattedOrders)
  })
})

// Get dealer orders for farmer dashboard
app.get("/api/dealer/orders/for-farmer", (req, res) => {
  const { status } = req.query

  let sql = `
    SELECT do.*, p.name as product 
    FROM dealer_orders do
    JOIN products p ON do.product_id = p.id
  `

  const params = []

  if (status && status !== "all") {
    sql += " WHERE do.status = ?"
    params.push(status)
  }

  sql += " ORDER BY order_date DESC"

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Format the data for farmer dashboard
    const formattedOrders = rows.map((order) => ({
      ...order,
      customer: `Dealer #${order.dealer_id}`,
    }))

    res.json(formattedOrders)
  })
})

// Get dealer order details
app.get("/api/dealer/orders/:id", (req, res) => {
  db.get(
    `
    SELECT do.*, p.name as product 
    FROM dealer_orders do
    JOIN products p ON do.product_id = p.id
    WHERE do.id = ?
  `,
    [req.params.id],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" })
      }

      // Format the data
      const formattedOrder = {
        ...order,
        customer: `Dealer #${order.dealer_id}`,
      }

      res.json(formattedOrder)
    },
  )
})

// Update dealer order status
app.put("/api/dealer/orders/:id/status", (req, res) => {
  const { status } = req.body
  const orderId = req.params.id

  // Additional fields to update based on status
  let additionalFields = {}
  const now = new Date().toISOString().split("T")[0]

  if (status === "Processing") {
    additionalFields = { processing_date: now }
  } else if (status === "In Transit") {
    additionalFields = { shipping_date: now }
  }

  // Build the SQL query
  let sql = "UPDATE dealer_orders SET status = ?"
  const params = [status]

  // Add additional fields if any
  Object.keys(additionalFields).forEach((field) => {
    sql += `, ${field} = ?`
    params.push(additionalFields[field])
  })

  sql += " WHERE id = ?"
  params.push(orderId)

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" })
    }

    res.json({ message: "Order status updated successfully" })
  })
})

// Create dealer order
app.post("/api/dealer/orders", (req, res) => {
  const { product_id, quantity, delivery_date, delivery_address, special_instructions, unit } = req.body

  if (!product_id || !quantity || !delivery_date || !delivery_address) {
    return res.status(400).json({ error: "Product ID, quantity, delivery date, and address are required" })
  }

  // Get product details
  db.get("SELECT * FROM products WHERE id = ?", [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    // Calculate total
    const total = product.price * quantity

    // Generate order ID
    const orderId = `#DO-${Math.floor(1000 + Math.random() * 9000)}`

    // Insert order
    db.run(
      `INSERT INTO dealer_orders 
       (order_id, dealer_id, product_id, quantity, unit, unit_price, total, order_date, status, delivery_date, delivery_address, special_instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        1,
        product_id,
        quantity,
        unit || product.unit,
        product.price,
        total,
        new Date().toISOString().split("T")[0],
        "Pending",
        delivery_date,
        delivery_address,
        special_instructions,
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message })
        }

        res.status(201).json({
          id: this.lastID,
          order_id: orderId,
          message: "Order placed successfully",
        })
      },
    )
  })
})

// Accept dealer order (for farmers)
app.put("/api/dealer/orders/:id/accept", (req, res) => {
  const orderId = req.params.id

  // Update order status to Processing
  db.run(
    "UPDATE dealer_orders SET status = 'Processing', processing_date = ? WHERE id = ?",
    [new Date().toISOString().split("T")[0], orderId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Order not found" })
      }

      res.json({ message: "Order accepted successfully" })
    },
  )
})

// Get dealer vehicles
app.get("/api/dealer/vehicles", (req, res) => {
  db.all("SELECT * FROM vehicles", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

// Get dealer vehicle details
app.get("/api/dealer/vehicles/:id", (req, res) => {
  db.get("SELECT * FROM vehicles WHERE id = ?", [req.params.id], (err, vehicle) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" })
    }

    res.json(vehicle)
  })
})

// Add new vehicle
app.post("/api/dealer/vehicles", (req, res) => {
  const {
    vehicle_id,
    type,
    capacity,
    driver,
    status,
    license_plate,
    fuel_level,
    mileage,
    last_maintenance,
    next_maintenance,
  } = req.body

  db.run(
    `INSERT INTO vehicles 
     (vehicle_id, type, capacity, driver, status, license_plate, fuel_level, mileage, last_maintenance, next_maintenance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vehicle_id,
      type,
      capacity,
      driver,
      status,
      license_plate,
      fuel_level,
      mileage,
      last_maintenance,
      next_maintenance,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.status(201).json({
        id: this.lastID,
        message: "Vehicle added successfully",
      })
    },
  )
})

// Assign vehicle to order
app.post("/api/dealer/vehicles/:id/assign", (req, res) => {
  const { order_id } = req.body
  const vehicleId = req.params.id

  if (!order_id) {
    return res.status(400).json({ error: "Order ID is required" })
  }

  // Update vehicle status and assign to order
  db.run(
    "UPDATE vehicles SET status = 'On Route', assigned_order_id = ? WHERE id = ?",
    [order_id, vehicleId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Vehicle not found" })
      }

      // Update order status to In Transit
      db.run(
        "UPDATE dealer_orders SET status = 'In Transit', shipping_date = ? WHERE id = ?",
        [new Date().toISOString().split("T")[0], order_id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message })
          }

          res.json({ message: "Vehicle assigned successfully" })
        },
      )
    },
  )
})

// Schedule vehicle maintenance
app.post("/api/dealer/vehicles/:id/maintenance", (req, res) => {
  const { maintenance_date } = req.body
  const vehicleId = req.params.id

  if (!maintenance_date) {
    return res.status(400).json({ error: "Maintenance date is required" })
  }

  db.run(
    "UPDATE vehicles SET status = 'Maintenance', next_maintenance = ? WHERE id = ?",
    [maintenance_date, vehicleId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Vehicle not found" })
      }

      res.json({ message: "Maintenance scheduled successfully" })
    },
  )
})

// Toggle product like status (wishlist)
app.post("/api/products/:id/like", (req, res) => {
  const productId = req.params.id
  const userId = 1 // In a real app, this would come from authentication

  // Check if product is already in wishlist
  db.get("SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?", [userId, productId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (row) {
      // Remove from wishlist
      db.run("DELETE FROM wishlist WHERE id = ?", [row.id], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }

        res.json({ liked: false, message: "Removed from wishlist" })
      })
    } else {
      // Add to wishlist
      db.run(
        "INSERT INTO wishlist (user_id, product_id, date_added) VALUES (?, ?, ?)",
        [userId, productId, new Date().toISOString()],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message })
          }

          res.json({ liked: true, message: "Added to wishlist" })
        },
      )
    }
  })
})

// Get wishlist
app.get("/api/dealer/wishlist", (req, res) => {
  const userId = 1 // In a real app, this would come from authentication

  db.all(
    `
    SELECT p.*, 1 as liked
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.date_added DESC
  `,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.json(rows)
    },
  )
})

// Search API
app.get("/api/search", (req, res) => {
  const query = req.query.q

  if (!query) {
    return res.status(400).json({ error: "Search query is required" })
  }

  const searchTerm = `%${query}%`

  db.all(
    "SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR description LIKE ?",
    [searchTerm, searchTerm, searchTerm],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.json(rows)
    },
  )
})

// Filter products
app.get("/api/products/filter", (req, res) => {
  const { type, location, price, quality } = req.query

  let sql = "SELECT * FROM products WHERE 1=1"
  const params = []

  if (type) {
    sql += " AND category = ?"
    params.push(type)
  }

  if (price) {
    // Parse price range
    if (price === "low") {
      sql += " AND price < 200"
    } else if (price === "medium") {
      sql += " AND price >= 200 AND price <= 500"
    } else if (price === "high") {
      sql += " AND price > 500"
    }
  }

  // In a real app, you would have location and quality fields in your products table
  // For now, we'll just filter by the fields we have

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Check if products are in wishlist for user_id 1 (demo user)
    const productPromises = rows.map((product) => {
      return new Promise((resolve, reject) => {
        db.get("SELECT * FROM wishlist WHERE user_id = 1 AND product_id = ?", [product.id], (err, row) => {
          if (err) {
            reject(err)
            return
          }
          resolve({
            ...product,
            liked: !!row,
          })
        })
      })
    })

    Promise.all(productPromises)
      .then((productsWithLiked) => {
        res.json(productsWithLiked)
      })
      .catch((err) => {
        res.status(500).json({ error: err.message })
      })
  })
})

// Save dealer profile
app.post("/api/dealer/profile", (req, res) => {
  const { name, email, phone, address } = req.body

  // In a real app, this would save to a database
  // For now, we'll just return success
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: { name, email, phone, address },
  })
})

// Dealer Inventory API Routes

// Get all inventory items
app.get("/api/dealer/inventory", (req, res) => {
  const dealerId = req.query.dealer_id || 1 // Default to dealer_id 1 if not specified

  db.all("SELECT * FROM dealer_inventory WHERE dealer_id = ? ORDER BY product_name", [dealerId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

// Get all dealer inventory items for retailers
app.get("/api/retailer/dealer-inventory", (req, res) => {
  db.all("SELECT * FROM dealer_inventory ORDER BY dealer_id, product_name", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

// Get a single inventory item
app.get("/api/dealer/inventory/:id", (req, res) => {
  const dealerId = req.query.dealer_id || 1 // Default to dealer_id 1 if not specified

  db.get("SELECT * FROM dealer_inventory WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (!row) {
      return res.status(404).json({ error: "Inventory item not found" })
    }
    res.json(row)
  })
})

// Add a new inventory item
app.post("/api/dealer/inventory", (req, res) => {
  const { product_name, category, price, unit, quantity, min_stock, description } = req.body
  const dealerId = req.body.dealer_id || 1 // Default to dealer_id 1 if not specified
  const last_updated = new Date().toISOString().split("T")[0]

  // Determine status based on quantity and min_stock
  let status
  if (quantity <= 0) {
    status = "Out of Stock"
  } else if (quantity < min_stock) {
    status = "Low Stock"
  } else {
    status = "In Stock"
  }

  if (!product_name || !price || !quantity) {
    return res.status(400).json({ error: "Product name, price, and quantity are required" })
  }

  const sql = `
    INSERT INTO dealer_inventory (dealer_id, product_name, category, price, unit, quantity, min_stock, description, last_updated, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  db.run(
    sql,
    [dealerId, product_name, category, price, unit, quantity, min_stock, description, last_updated, status],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      res.status(201).json({
        id: this.lastID,
        dealer_id: dealerId,
        product_name,
        category,
        price,
        unit,
        quantity,
        min_stock,
        description,
        last_updated,
        status,
      })
    },
  )
})

// Update an inventory item
app.put("/api/dealer/inventory/:id", (req, res) => {
  const { product_name, category, price, unit, quantity, min_stock, description } = req.body
  const dealerId = req.body.dealer_id || 1 // Default to dealer_id 1 if not specified
  const last_updated = new Date().toISOString().split("T")[0]

  // Determine status based on quantity and min_stock
  let status
  if (quantity <= 0) {
    status = "Out of Stock"
  } else if (quantity < min_stock) {
    status = "Low Stock"
  } else {
    status = "In Stock"
  }

  if (!product_name || !price || !quantity) {
    return res.status(400).json({ error: "Product name, price, and quantity are required" })
  }

  const sql = `
    UPDATE dealer_inventory
    SET product_name = ?, category = ?, price = ?, unit = ?, quantity = ?, min_stock = ?, description = ?, last_updated = ?, status = ?
    WHERE id = ?
  `

  db.run(
    sql,
    [product_name, category, price, unit, quantity, min_stock, description, last_updated, status, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Inventory item not found" })
      }

      db.get("SELECT * FROM dealer_inventory WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        res.json(row)
      })
    },
  )
})

// Delete an inventory item
app.delete("/api/dealer/inventory/:id", (req, res) => {
  db.run("DELETE FROM dealer_inventory WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Inventory item not found" })
    }

    res.json({ message: "Inventory item deleted successfully" })
  })
})

// Retailer API Routes

// Fix the retailer dashboard stats API route
app.get("/api/retailer/dashboard/stats", (req, res) => {
  const retailerId = req.query.retailer_id || 1 // Default to retailer_id 1 if not specified

  Promise.all([
    // Get active orders count
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM retailer_orders WHERE retailer_id = ? AND status != 'Delivered'",
        [retailerId],
        (err, row) => {
          if (err) reject(err)
          else resolve(row.count)
        },
      )
    }),
    // Get products in stock count
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM retailer_inventory WHERE retailer_id = ?", [retailerId], (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    // Get dealers count
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(DISTINCT dealer_id) as count FROM dealer_inventory", (err, row) => {
        if (err) reject(err)
        else resolve(row.count)
      })
    }),
    // Get pending orders count
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM retailer_orders WHERE retailer_id = ? AND status = 'Pending'",
        [retailerId],
        (err, row) => {
          if (err) reject(err)
          else resolve(row.count)
        },
      )
    }),
    // Get low stock items count
    new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count FROM retailer_inventory WHERE retailer_id = ? AND quantity < min_stock",
        [retailerId],
        (err, row) => {
          if (err) reject(err)
          else resolve(row.count)
        },
      )
    }),
  ])
    .then(([activeOrders, productsCount, dealersCount, pendingOrders, lowStockCount]) => {
      res.json({
        activeOrders,
        productsCount,
        dealersCount,
        pendingOrders,
        lowStockCount,
      })
    })
    .catch((err) => {
      console.error("Error getting retailer dashboard stats:", err)
      res.status(500).json({ error: err.message })
    })
})

// Fix the dealer inventory API route for retailers
app.get("/api/retailer/dealer-inventory", (req, res) => {
  db.all("SELECT * FROM dealer_inventory ORDER BY dealer_id, product_name", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Add status field based on quantity and min_stock if not present
    const enhancedRows = rows.map((item) => {
      if (!item.status) {
        if (item.quantity <= 0) {
          item.status = "Out of Stock"
        } else if (item.quantity < item.min_stock) {
          item.status = "Low Stock"
        } else {
          item.status = "In Stock"
        }
      }
      return item
    })

    res.json(enhancedRows)
  })
})

// Fix the retailer orders API route
app.get("/api/retailer/orders", (req, res) => {
  const retailerId = req.query.retailer_id || 1 // Default to retailer_id 1 if not specified
  const { status } = req.query

  let sql = `
    SELECT * FROM retailer_orders 
    WHERE retailer_id = ?
  `
  const params = [retailerId]

  if (status && status !== "all") {
    sql += " AND status = ?"
    params.push(status)
  }

  sql += " ORDER BY order_date DESC"

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

// Fix the retailer order details API route
app.get("/api/retailer/orders/:id", (req, res) => {
  const retailerId = req.query.retailer_id || 1 // Default to retailer_id 1 if not specified

  db.get(
    "SELECT * FROM retailer_orders WHERE id = ? AND retailer_id = ?",
    [req.params.id, retailerId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" })
      }

      res.json(order)
    },
  )
})

// Fix the retailer inventory API route
app.get("/api/retailer/inventory", (req, res) => {
  const retailerId = req.query.retailer_id || 1 // Default to retailer_id 1 if not specified

  db.all("SELECT * FROM retailer_inventory WHERE retailer_id = ? ORDER BY product_name", [retailerId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    // Add status field based on quantity and min_stock if not present
    const enhancedRows = rows.map((item) => {
      if (!item.status) {
        if (item.quantity <= 0) {
          item.status = "Out of Stock"
        } else if (item.quantity < item.min_stock) {
          item.status = "Low Stock"
        } else {
          item.status = "In Stock"
        }
      }
      return item
    })

    res.json(enhancedRows)
  })
})

// Add retailer order API route
app.post("/api/retailer/orders", (req, res) => {
  const { dealer_inventory_id, quantity, delivery_date, delivery_address, special_instructions } = req.body
  const retailerId = req.body.retailer_id || 1 // Default to retailer_id 1 if not specified

  if (!dealer_inventory_id || !quantity || !delivery_date || !delivery_address) {
    return res.status(400).json({ error: "Dealer inventory ID, quantity, delivery date, and address are required" })
  }

  // First, get the dealer inventory item details
  db.get("SELECT * FROM dealer_inventory WHERE id = ?", [dealer_inventory_id], (err, inventoryItem) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!inventoryItem) {
      return res.status(404).json({ error: "Dealer inventory item not found" })
    }

    // Check if quantity is available
    if (inventoryItem.quantity < quantity) {
      return res.status(400).json({ error: "Requested quantity exceeds available stock" })
    }

    // Calculate total
    const total = inventoryItem.price * quantity

    // Generate order ID
    const orderId = `#RO-${Math.floor(1000 + Math.random() * 9000)}`
    const orderDate = new Date().toISOString().split("T")[0]

    // Insert retailer order
    db.run(
      `INSERT INTO retailer_orders 
       (order_id, retailer_id, dealer_id, dealer_inventory_id, product_name, quantity, unit, unit_price, total, order_date, status, delivery_date, delivery_address, special_instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        retailerId,
        inventoryItem.dealer_id,
        dealer_inventory_id,
        inventoryItem.product_name,
        quantity,
        inventoryItem.unit,
        inventoryItem.price,
        total,
        orderDate,
        "Pending",
        delivery_date,
        delivery_address,
        special_instructions || "",
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message })
        }

        const newOrderId = this.lastID

        res.status(201).json({
          id: newOrderId,
          order_id: orderId,
          message: "Order placed successfully",
        })
      },
    )
  })
})

// Add an endpoint to update retailer order status
app.put("/api/retailer/orders/:id/status", (req, res) => {
  const { status } = req.body
  const orderId = req.params.id

  if (!status) {
    return res.status(400).json({ error: "Status is required" })
  }

  db.run("UPDATE retailer_orders SET status = ? WHERE id = ?", [status, orderId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" })
    }

    res.json({ message: "Order status updated successfully" })
  })
})

// Add dealer approval of retailer orders
app.put("/api/dealer/retailer-orders/:id/approve", (req, res) => {
  const orderId = req.params.id

  // First, get the retailer order details
  db.get(`SELECT * FROM retailer_orders WHERE id = ?`, [orderId], (err, order) => {
    if (err) {
      console.error("Error getting retailer order details:", err)
      return res.status(500).json({ error: err.message })
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }

    // Update order status to Processing
    db.run(
      "UPDATE retailer_orders SET status = 'Processing', processing_date = ? WHERE id = ?",
      [new Date().toISOString().split("T")[0], orderId],
      function (err) {
        if (err) {
          console.error("Error updating order status:", err)
          return res.status(500).json({ error: err.message })
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "Order not found" })
        }

        // Update dealer inventory by subtracting the ordered quantity
        db.run(
          `UPDATE dealer_inventory 
             SET quantity = quantity - ?, last_updated = ?
             WHERE id = ?`,
          [order.quantity, new Date().toISOString().split("T")[0], order.dealer_inventory_id],
          (err) => {
            if (err) {
              console.error("Error updating dealer inventory:", err)
              return res.status(500).json({ error: err.message })
            }

            // Check if we need to update the status based on new quantity
            db.get(
              "SELECT quantity, min_stock FROM dealer_inventory WHERE id = ?",
              [order.dealer_inventory_id],
              (err, inventory) => {
                if (err) {
                  console.error("Error checking inventory status:", err)
                  return res.status(500).json({ error: err.message })
                }

                let newStatus
                if (inventory.quantity <= 0) {
                  newStatus = "Out of Stock"
                } else if (inventory.quantity < inventory.min_stock) {
                  newStatus = "Low Stock"
                } else {
                  newStatus = "In Stock"
                }

                // Update the status if needed
                db.run(
                  "UPDATE dealer_inventory SET status = ? WHERE id = ?",
                  [newStatus, order.dealer_inventory_id],
                  (err) => {
                    if (err) {
                      console.error("Error updating inventory status:", err)
                      return res.status(500).json({ error: err.message })
                    }

                    res.json({
                      message: "Order approved successfully",
                      orderStatus: "Processing",
                      inventoryUpdated: true,
                      newInventoryQuantity: inventory.quantity,
                      newInventoryStatus: newStatus,
                    })
                  },
                )
              },
            )
          },
        )
      },
    )
  })
})

// Get retailer orders for dealer approval
app.get("/api/dealer/retailer-orders", (req, res) => {
  const { status } = req.query
  const dealerId = req.query.dealer_id || 1 // Default to dealer_id 1 if not specified

  let sql = `
    SELECT ro.*, di.product_name, di.unit 
    FROM retailer_orders ro
    JOIN dealer_inventory di ON ro.dealer_inventory_id = di.id
    WHERE ro.dealer_id = ?
  `

  const params = [dealerId]

  if (status && status !== "all") {
    sql += " AND ro.status = ?"
    params.push(status)
  }

  sql += " ORDER BY ro.order_date DESC"

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

// Get a specific retailer order for dealer approval
app.get("/api/dealer/retailer-orders/:id", (req, res) => {
  const orderId = req.params.id

  db.get(
    `SELECT ro.*, di.product_name, di.unit, di.quantity as available_quantity
     FROM retailer_orders ro
     JOIN dealer_inventory di ON ro.dealer_inventory_id = di.id
     WHERE ro.id = ?`,
    [orderId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" })
      }

      res.json(order)
    },
  )
})

// Fix the search API route
app.get("/api/search", (req, res) => {
  const query = req.query.q

  if (!query) {
    return res.status(400).json({ error: "Search query is required" })
  }

  const searchTerm = `%${query}%`

  // Search in dealer_inventory for retailers
  db.all(
    "SELECT * FROM dealer_inventory WHERE product_name LIKE ? OR category LIKE ?",
    [searchTerm, searchTerm],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      // Format the results for the search dropdown
      const formattedResults = rows.map((item) => ({
        id: item.id,
        name: item.product_name,
        category: item.category,
      }))

      res.json(formattedResults)
    },
  )
})

// Add this route to handle contact form submissions
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required" })
  }

  // Insert submission into database
  const sql = `INSERT INTO contact_submissions (name, email, phone, message) 
               VALUES (?, ?, ?, ?)`

  db.run(sql, [name, email, phone || "", message], function (err) {
    if (err) {
      console.error("Error saving contact submission:", err.message)
      return res.status(500).json({ error: "Failed to save your message" })
    }

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!",
      id: this.lastID,
    })
  })
})

// Add this route to get all contact submissions for admin
app.get("/api/contact/submissions", isAdmin, (req, res) => {
  db.all(`SELECT * FROM contact_submissions ORDER BY submitted_at DESC`, (err, rows) => {
    if (err) {
      console.error("Error fetching contact submissions:", err.message)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(rows)
  })
})

// Add this route to mark a submission as read
app.put("/api/contact/submissions/:id/read", isAdmin, (req, res) => {
  const submissionId = req.params.id

  db.run(`UPDATE contact_submissions SET is_read = 1 WHERE id = ?`, [submissionId], function (err) {
    if (err) {
      console.error("Error marking submission as read:", err.message)
      return res.status(500).json({ error: "Database error" })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Submission not found" })
    }

    res.json({ success: true, message: "Marked as read" })
  })
})

// Add this route to get unread count
app.get("/api/contact/submissions/unread", isAdmin, (req, res) => {
  db.get(`SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = 0`, (err, row) => {
    if (err) {
      console.error("Error counting unread submissions:", err.message)
      return res.status(500).json({ error: "Database error" })
    }

    res.json({ unreadCount: row.count })
  })
})

// Add this route to get a single submission
app.get("/api/contact/submissions/:id", isAdmin, (req, res) => {
  const submissionId = req.params.id

  db.get(`SELECT * FROM contact_submissions WHERE id = ?`, [submissionId], (err, row) => {
    if (err) {
      console.error("Error fetching submission:", err.message)
      return res.status(500).json({ error: "Database error" })
    }

    if (!row) {
      return res.status(404).json({ error: "Submission not found" })
    }

    res.json(row)
  })
})

// Add this route for the contact submissions page
app.get("/admin/contact-submissions", isAdmin, (req, res) => {
  res.render("contact-submissions")
})

// Add this route to mark all submissions as read
app.put("/api/contact/submissions/mark-all-read", isAdmin, (req, res) => {
  db.run(`UPDATE contact_submissions SET is_read = 1 WHERE is_read = 0`, function (err) {
    if (err) {
      console.error("Error marking all submissions as read:", err.message)
      return res.status(500).json({ error: "Database error" })
    }

    res.json({ success: true, message: "All submissions marked as read", updated: this.changes })
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render("error", {
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  })
})

// 404 route
app.use((req, res) => {
  res.status(404).render("404", { url: req.url })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// Close the database connection when the app is terminated
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message)
    }
    console.log("Database connection closed")
    process.exit(0)
  })
})

module.exports = app
