## Express Endpoint Practice Assignment: Car Management API

### A. Introduction:

These notes outline the code for building four key functionalities within an Express API for car management:

* Retrieving All Cars (GET /cars)
* Adding a new car (POST /car)
* Updating a Car (PUT /car)
* Soft Deleting a Car (DELETE /car/:id)

### B. Project Setup:

1. **Create a Project Directory:**
   - Open your terminal and navigate to your desired workspace directory.
   - Run the following commands to create a new project directory and initialize a basic project structure:

     ```bash
     mkdir Express-Endpoint-Practice-Assignment
     cd Express-Endpoint-Practice-Assignment
     touch index.js
     code .  
     ```

2. **Initialize Package Management:**
   - Run `npm init` to create a `package.json` file, which will manage project dependencies.

3. **Install Dependencies:**
   - Install the necessary Node.js packages using `npm install` followed by the package name. Here's a breakdown of the installed packages and their purposes:

     ```bash
     npm install express cors mysql2 jsonwebtoken bcrypt body-parser dotenv nodemon
     ```

     - **express:** Provides tools for building web servers and APIs in Node.js.
     - **cors:** Enables Cross-Origin Resource Sharing (CORS) for safe communication with other websites.
     - **mysql2:** Facilitates connection to a MySQL database.
     - **jsonwebtoken:** Offers libraries for creating and verifying secure JSON Web Tokens (JWTs) for authorization.
     - **bcrypt:** Secures password storage by hashing them for safekeeping.
     - **body-parser:** Parses raw request bodies into a format usable by the Express app.
     - **dotenv:** Enables loading environment variables from a `.env` file for sensitive data.
     - **nodemon:** Automatically restarts the server whenever code changes are detected, streamlining development.

4. **Create `package-lock.json`:**
   - Run `npm install` again to generate a `package-lock.json` file. This file ensures consistent dependency versions, facilitating reproducible builds, faster installations, and improved security and versioning flexibility.

5. **Verify Nodemon Installation:**
   - Run `nodemon index.js` in your terminal. If Nodemon is working correctly, your server should start automatically and restart whenever you make changes to your code.

6. **Create `.gitignore` File:**
   - Create a `.gitignore` file to specify files or folders that should be excluded from version control using Git. Commonly excluded files include:

     ```
     node_modules
     .env
     ```

7. **Create `.env` File:**
   - Create a `.env` file to store sensitive environment variables like database credentials, port numbers, and API keys. Here's an example structure for the `.env` file:

     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=password  # (Replace with your actual database password)
     DB_NAME=chat_app_data
     DB_PORT=3306
     JWT_KEY=chatapptokenkey  # (Replace with a strong, secret key)

     PORT=3000
     ```

     **Important:** Never commit the `.env` file to your version control system, as it contains sensitive information.

---

### C. Database Connection Middleware

**Purpose:** This middleware connects to the database, sets up session mode, and configures the time zone for every request made to the application. It ensures that each request has access to a database connection and properly configures the SQL environment based on predefined settings.

```javascript
app.use(async function (req, res, next) {
  try {
    req.db = await databasePool.getConnection();
    req.db.connection.config.namedPlaceholders = true;
    await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');
    await req.db.query(`SET time_zone = '-8:00'`);
    await next();
    req.db.release();
  } catch (err) {
    console.error("Middleware connecting to database (pool:", databasePool.name, ")");
    if (req.db) req.db.release();
    res.status(500).json({
      error: "Internal Server Error: Unable to connect to car database",
      details: err.message,
    });
  }
});
```

**Middleware Function Definition:**

`app.use(async function (req, res, next) {...})` This line defines an asynchronous middleware function that runs before the route handlers for every request. Middleware functions have access to the request (`req`), response (`res`), and the next middleware function in the stack (`next`).

**Connecting to the Database:**

- **try...catch Block:** Encapsulates the logic to ensure proper error handling.
- **try:** Attempts to establish a connection to the database using a connection pool (`databasePool`). The connection pool is a common way to manage database connections efficiently, reusing them across multiple requests.
- **req.db = await databasePool.getConnection();** Retrieves a connection from the pool. This connection is then attached to the request object (`req`) under the `db` property, making it accessible within subsequent middleware and route handlers.
- **req.db.connection.config.namedPlaceholders = true;** Configures the connection to use named placeholders in SQL queries instead of positional placeholders. Named placeholders make SQL queries more readable and less prone to errors due to changing parameter order.
- **await req.db.query('SET SESSION sql_mode = "TRADITIONAL"');** Executes a SQL command to set the session's SQL mode to "TRADITIONAL". This affects how MySQL interprets SQL syntax, enforcing traditional behavior for certain operations.
- **await req.db.query(`SET time_zone = '-8:00'`);** Sets the session's time zone to '-8:00'. This is crucial for applications dealing with time-sensitive data, ensuring consistent time calculations across different environments.
- **await next();** Calls the next middleware function in the stack, allowing the request to proceed to the next handler or route.
- **req.db.release();** Releases the database connection back to the pool after it has been used, ensuring resources are managed efficiently.

**Error Handling:**

- **catch (err):** Catches any errors that occur during the process.
- **console.error(...):** Logs the error message to the server console, providing visibility into issues that prevent the database connection from being established.
- **if (req.db) req.db.release();** Checks if a database connection was obtained and releases it back to the pool, preventing resource leaks even in case of errors.
- **res.status(500).json({...});** Sends a JSON response with a status code of 500 (Internal Server Error) to the client, indicating that an internal server error occurred. The response includes an error message and details about the failure, aiding in debugging and informing the client about the issue.

---

### D. Building API Endpoints: Routes for Car Management

The four key functionalities within our Express API:

**1. Retrieving All Cars (GET /car):**

**Purpose:** This route fetches a list of all cars from the database, excluding those marked as "deleted".
  ```javascript
  app.get("/car", async function (req, res) {
    try {
      const [car] = await req.db.query(`SELECT * FROM car WHERE deleted_flag = 0;`);
      res.json({ car });
    } catch (err) {
      console.error("Error in GET request to /car:", err);
      res.status(500).json({ error: "Internal Server Error: Failed to retrieve car data", details: err.message });
    }
  });
  ```

**Function Definition:**

`app.get("/car", async function (req, res) {...})`: This line defines an asynchronous function that handles GET requests sent to the "/car" URL path of your application. `req` represents the incoming request object containing information about the request such as headers and parameters. `res` represents the response object used to send a response back to the client.

**Fetching Car Data:**

- **try...catch Block:** This block ensures proper error handling throughout the process.
- **try:** The code inside this block attempts to fetch car data from the database.
- **const [car] = await req.db.query(...):** This line performs an asynchronous database query using the `req.db` object, which likely holds a connection pool. The query selects all data (denoted by "*") from the "car" table, with the additional condition that `deleted_flag` must be equal to 0. This ensures that only "active" cars (not logically deleted ones) are retrieved.
- **await:** This keyword pauses the function's execution until the database query finishes, ensuring that the operation completes before proceeding.
- **[car]:** This part assumes the query returns an array of results. By destructuring the first element `[car]`, we store the retrieved car data in the `car` variable.

**Sending Response:**

- **res.json({ car }):** If the query is successful, this line sends a JSON response back to the client. The response object contains a property named `car` with the value of the fetched car data.

**Error Handling:**

- **catch (err):** This block handles any errors that might occur during the process, ensuring that the application can gracefully handle unexpected issues.
- **console.error(...):** Logs the error message to the server console for debugging purposes, aiding in troubleshooting and resolving issues.
- **res.status(500).json(...):** Sets the response status code to 500 (Internal Server Error) and sends an error message back to the client with details about the encountered error, providing feedback to the client about what went wrong.

---

**2. Posting a New Car (POST /car):**

**Purpose:** This route adds a new car to the database.
  ```javascript
  app.post("/car", async function (req, res) {
    const { make, model, year } = req.body;
    try {
      const [result] = await req.db.query(
        `INSERT INTO car (make, model, year, date_created, deleted_flag)
         VALUES (:make, :model, :year, NOW(), 0);`,
        { make, model, year }
      );
      res.json({ id: result.insertId, make, model, year, message: 'Car successfully created', success: true });
    } catch (err) {
      console.error("Error in POST request to /car:", err);
      res.status(500).json({ error: "Internal Server Error: Failed to create car", details: err.message });
    }
  });
  ```

**Function Definition:**

`app.post("/car", async function (req, res) {...})`: This line defines an asynchronous function that handles POST requests sent to the "/car" URL path of your application. `req` represents the incoming request object containing information about the request such as headers and parameters. `res` represents the response object used to send a response back to the client.

**Creating a New Car Record:**

- **try...catch Block:** This block ensures proper error handling throughout the process.
- **try:** The code inside this block attempts to insert a new car record into the database.
- **const [result] = await req.db.query(...):** This line performs an asynchronous database query using the `req.db` object, which likely holds a connection pool. The query inserts a new car with the provided `make`, `model`, and `year`, and sets `deleted_flag` to 0 to indicate the car is active. The query returns the ID of the newly inserted car.
- **await:** This keyword pauses the function's execution until the database query finishes, ensuring that the operation completes before proceeding.
- **[result]:** This part assumes the query returns an array of results. By destructuring the first element `[result]`, we store the result of the insertion operation in the `result` variable, which includes the ID of the newly inserted car.

**Sending Response:**

- **res.json({ id: result.insertId, make, model, year, message: 'Car successfully created', success: true }):** If the query is successful, this line sends a JSON response back to the client. The response object contains properties like `id`, `make`, `model`, `year`, and a success message indicating that the car was successfully created.

**Error Handling:**

- **catch (err):** This block handles any errors that might occur during the process, ensuring that the application can gracefully handle unexpected issues.
- **console.error(...):** Logs the error message to the server console for debugging purposes, aiding in troubleshooting and resolving issues.
- **res.status(500).json(...):** Sets the response status code to 500 (Internal Server Error) and sends an error message back to the client with details about the encountered error, providing feedback to the client about what went wrong.

---

**3. Updating a Car (PUT /car):**

**Purpose:** This route allows updating specific car details based on the provided ID.
  ```javascript
  app.put("/car", async function (req, res) {
    const { id, make, model, year } = req.body;
    try {
      await req.db.query(
        `UPDATE car SET make = :make, model = :model, year = :year WHERE id = :id;`,
        { id, make, model, year }
      );
      res.json({ id, make, model, year, success: true });
    } catch (err) {
      console.error("Error in PUT request to /car:", err);
      res.status(500).json({ error: "Internal Server Error: Failed to update car", details: err.message });
    }
  });
  ```

**Function Definition:**

`app.put("/car", async function (req, res) {...})`: This line defines an asynchronous function that handles PUT requests sent to the "/car" URL path of your application. `req` represents the incoming request object containing information about the request such as headers and parameters. `res` represents the response object used to send a response back to the client.

**Updating Existing Car Record:**

- **try...catch Block:** This block ensures proper error handling throughout the process.
- **try:** The code inside this block attempts to update an existing car record in the database with the provided `id`, `make`, `model`, and `year`.
- **await req.db.query(...):** This line performs an asynchronous database query using the `req.db` object, updating the specified car's details with the new values provided in the request body.
- **await:** This keyword pauses the function's execution until the database query finishes, ensuring that the operation completes before proceeding.

**Sending Response:**

- **res.json({ id, make, model, year, success: true }):** If the query is successful, this line sends a JSON response back to the client, including the ID of the updated car and the updated details, along with a success message indicating that the car was successfully updated.

**Error Handling:**

- **catch (err):** This block handles any errors that might occur during the update process, ensuring that the application can gracefully handle unexpected issues.
- **console.error(...):** Logs the error message to the server console for debugging purposes, aiding in troubleshooting and resolving issues.
- **res.status(500).json(...):** Sets the response status code to 500 (Internal Server Error) and sends an error message back to the client with details about the encountered error, providing feedback to the client about what went wrong.

---

**4. Soft Deleting a Car (DELETE /car/:id):**

**Purpose:** This route "soft deletes" a car by marking it as deleted in the database instead of permanently removing it.
  ```javascript
  app.delete("/car/:id", async function (req, res) {
    const { id: carId } = req.params;
    try {
      await req.db.query(`UPDATE car SET deleted_flag = 1 WHERE id = :carId`, { carId });
      res.json({ success: true });
    } catch (err) {
      console.error("Error in DELETE request to /car/:id:", err);
      res.status(500).json({ error: "Internal Server Error: Failed to delete car", details: err.message });
    }
  });
  ```

Function Definition:

`app.delete("/car/:id", async function (req, res) {...}):` This line defines an asynchronous function that handles DELETE requests sent to the "/car/:id" URL path of your application. `req` represents the incoming request object containing information about the request such as headers and parameters. `res` represents the response object used to send a response back to the client.

- **try...catch Block:** This block ensures proper error handling throughout the process.
- **try:** The code inside this block attempts to mark a car as deleted in the database by updating the `deleted_flag` to 1 for the specified car ID.
- **await req.db.query(...):** This line performs an asynchronous database query using the `req.db` object, executing the UPDATE operation to set `deleted_flag` to 1 for the specified car ID.
- **await:** This keyword pauses the function's execution until the database query finishes, ensuring that the operation completes before proceeding.

**Sending Response:**

- **res.json({ success: true }):** If the query is successful, this line sends a JSON response back to the client, indicating the success of the operation.

**Error Handling:**

- **catch (err):** This block handles any errors that might occur during the deletion process, ensuring that the application can gracefully handle unexpected issues.
- **console.error(...):** Logs the error message to the server console for debugging purposes, aiding in troubleshooting and resolving issues.
- **res.status(500).json(...):** Sets the response status code to 500 (Internal Server Error) and sends an error message back to the client with details about the encountered error, providing feedback to the client about what went wrong.

---

### How to start the server

- Run the following command to locate the project folder
```bash
cd Express-Endpoint-Practice-Assignment
```
- Run `nodemon expressDatabase.js` to start the node server

---

### How to use Insomnia.core app 

**Purpose:** The following notes show how to successfully send GET, POST, PUT, and DELETE requests using Insomnia.core to manage car data in your Node.js Express application

**GET:**

* **URL:** `http://localhost:3000/car` (no additional path parameters needed)
* **JSON Payload:** Not required for a GET request. It retrieves data and doesn't modify anything.

**POST:**

* **URL:** `http://localhost:3000/car`
* **JSON Payload:** Required. It should include the following properties for a new car:
  - `make`: String (e.g., "Ford")
  - `model`: String (e.g., "Taurus")
  - `year`: Number (e.g., 2024)
  - You can optionally include `deleted_flag` set to `1` to mark the car as deleted upon creation (based on your current server logic).

**PUT:**

* **URL:** `http://localhost:3000/car/:id` (replace `:id` with the actual car ID you want to update)
* **JSON Payload:** Optional, but recommended to specify the properties you want to update. It can include any or all of the following properties:
  - `make`: String (e.g., "Honda")
  - `model`: String (e.g., "Civic")
  - `year`: Number (e.g., 2020)
  - `deleted_flag`: Number (1 or 0 to set the deleted flag)

**DELETE (soft delete):**

* **URL:** `http://localhost:3000/car/:id` (replace `:id` with the actual car ID you want to "soft delete")
* **JSON Payload:** Not required for a soft delete operation. The server sets the `deleted_flag` to `1` for the specified car ID.

**Important Notes:**

- Remember to replace `:id` in the URL with the actual ID of the car you're working with for PUT and DELETE operations.
- The JSON payload properties in PUT requests are optional, but it's a good practice to explicitly specify which fields you want to update to avoid unintended modifications.
- The server currently uses "soft delete" by setting a flag instead of permanently removing the car from the database.

