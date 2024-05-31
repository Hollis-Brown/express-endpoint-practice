// Configuration
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
require("dotenv").config();

// Server Setup
const app = express();
const port = process.env.PORT;

const corsOptions = {
  origin: '*', 
  credentials: true,  
  'access-control-allow-credentials': true,
  optionSuccessStatus: 200,
}

const databasePool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Middleware - Connects to database and sets up session mode and time zone
app.use(async function (req, res, next) {
  try {
    req.db = await databasePool.getConnection();
    req.db.connection.config.namedPlaceholders = true;
    await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    await req.db.query(`SET time_zone = '-8:00'`);
    await next();
    req.db.release();
  } catch (err) {
    console.log("Database connection error:", err);
    if (req.db) req.db.release();
    res.status(500).json({
      error: "Internal Server Error: Unable to connect to cars database",
      details: err.message,
    });
  }
});

// Add a route handler for the root path (/)
app.get('/', (req, res) => {
  res.send('Welcome to the Car Management API!');
});


// API Endpoints

// GET all cars (fetches cars with deleted_flag = 0)
app.get("/car", async (req, res) => {
  try {
    const [cars] = await req.db.query(`SELECT * FROM car WHERE deleted_flag = 0;`);
    res.json({ cars });
  } catch (err) {
    console.error("Error in GET request to /car:", err);
    res.status(500).json({ error: "Internal Server Error: Failed to retrieve car data", details: err.message });
  }
});

// POST a new car
app.post("/car", async (req, res) => {
  const { make, model, year } = req.body;
  try {
    const [result] = await req.db.query(
      `INSERT INTO car (make, model, year, deleted_flag)
       VALUES (:make, :model, :year, 0);`,
      { make, model, year }
    );
    res.json({ id: result.insertId, make, model, year, success: true });
  } catch (err) {
    console.error("Error in POST request to /car:", err);
    res.status(500).json({ error: "Internal Server Error: Failed to create car", details: err.message });
  }
});

// PUT or update a car
app.put("/car", async (req, res) => {
  const { id, make, model, year } = req.body;
  try {
    await req.db.query(
      `UPDATE car SET make = :make, model = :model, year = :year WHERE id = :id;`,
      { id, make, model, year }
    );
    console.log("Car updated successfully:", { id, make, model, year }); // Log updated data
    res.json({ id, make, model, year, success: true });
  } catch (err) {
    console.error("Error in PUT request to /car:", err);
    res.status(500).json({ error: "Internal Server Error: Failed to update car", details: err.message });
  }
});

// DELETE a car (sets deleted_flag to 1 instead of actually deleting)
app.delete("/car/:id", async (req, res) => {
  console.log(`Received DELETE request for car with ID: ${req.params.id}`);
  const { id: carId } = req.params;
  try {
    await req.db.query(`UPDATE car SET deleted_flag = 1 WHERE id = :carId`, { carId });
    res.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE request to /car/:id:", err);
    res.status(500).json({ error: "Internal Server Error: Failed to delete car", details: err.message });
  }
});

// Server Start
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});