# Vehicle State Service

The Vehicle State Service is a Node.js application that provides an API to retrieve vehicle information and its state at a given timestamp. It uses a PostgreSQL database to store vehicle data and state logs.

## Getting Started

### Prerequisites

- Node.js (v12 or later)
- PostgreSQL (v9.6 or later)

### Installation

1. Clone the repository:
`git clone https://github.com/vishalv971/vehicle-state-service.git`

2. Install dependencies:
`cd vehicle-state-service`
`npm install`

3. Set up the PostgreSQL database:
    - Create a new database.
    - Execute the SQL commands in the `database.sql` file to create the necessary tables and seed data.

4. Create a `.env` file in the root directory and add the following environment variables:
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=your_host
DB_NAME=your_database
DB_PORT=5432

Replace the values with your actual PostgreSQL credentials and connection details.

### Running the Application

To start the server, run the following command:
`npm start`

The server will start running on `http://localhost:3001` (or the port specified in the environment variables).

## API Documentation

### Endpoint

- `GET /vehicles/:vehicleId/:timestamp`

#### Parameters

- `vehicleId` (required): The ID of the vehicle.
- `timestamp` (required): The timestamp in ISO format (e.g., `2022-09-12T10:00:00.000Z`) for which the vehicle state is requested.

#### Response

- `200 OK`: Returns the vehicle information and its state at the given timestamp.

  ```json
  {
    "id": 3,
    "make": "VW",
    "model": "GOLF",
    "state": "selling",
    "timestamp": "2022-09-11T23:21:38.000Z"
  }
  ```
- ```400 Bad Request```: Returns an error message if the input is invalid.
- ```404 Not Found```: Returns an error message if the vehicle is not found.
- ```500 Internal Server Error```: Returns an error message if an internal server error occurs.


## Considerations
### Caching
The application implements an in-memory cache using node-cache to improve performance. The cache has a TTL (Time-To-Live) of 1 minute, which means that cached data will be considered stale after 1 minute, and a new database query will be executed for subsequent requests with the same parameters.

### Architecture
The application follows a modular structure with separate files for the server setup, database connection, API endpoint handling, and other utility functions.

The Server class is the main entry point and handles the following responsibilities:

Setting up the Express application
Configuring middleware
Connecting to the PostgreSQL database
Defining API endpoints
Starting the server
The connectToDb function establishes a connection to the PostgreSQL database and stores the connection pool instance in the Server class for reuse.

The API endpoint handler ```(/vehicles/:vehicleId/:timestamp)``` performs the following tasks:

Input validation
Cache lookup
Database query (if data is not cached)
Caching the result
Returning the vehicle information and state
Error Handling
The application includes error handling for various scenarios, such as:

Invalid input parameters
Vehicle not found
Database connection errors
Internal server errors
Error messages are returned with appropriate HTTP status codes.

### Reliability and Scalability
The application is designed to run in a production environment and can handle multiple instances. The use of a database connection pool and caching mechanism ensures efficient resource utilization and improved performance.

To scale the application horizontally, you can deploy multiple instances behind a load balancer, ensuring that the application can handle increased traffic and provide high availability.
