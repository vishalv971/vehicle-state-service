const express = require("express");
const parser = require("body-parser");
const NodeCache = require("node-cache");
const { Pool } = require("pg");
const cors = require("./cors");
require("dotenv").config();

class Server {
    app = null;
    cache = null;
    pool = null;

    constructor() {
        this.app = express();
        this.cache = new NodeCache({ stdTTL: 60 });
        this.prepareApp();
        this.connectToDb();
        this.setupAPIEndpoints();
    }

    prepareApp() {
        this.app.set("port", process.env.PORT || 3001);
        this.app.use(cors);
        this.app.use(parser.urlencoded({ extended: false }));
    }

    async connectToDb() {
        const user = process.env.DB_USER;
        const password = process.env.DB_PASSWORD;
        const host = process.env.DB_HOST;
        const database = process.env.DB_NAME;
        const port = process.env.DB_PORT;

        const pool = new Pool({
            user,
            host,
            database,
            password,
            port,
        });
        try {
            await pool.query("SELECT 1");
            console.log("Connected to the database successfully");
            this.pool = pool;
        } catch (err) {
            console.error("Failed to connect to the database:", err);
            throw err;
        }
    }

    setupAPIEndpoints() {
        this.app.get("/vehicles/:vehicleId/:timestamp", async (req, res) => {
            const { vehicleId, timestamp } = req.params;

            // validate input
            if (!vehicleId || !timestamp) {
                return res.status(400).json({ error: "Invalid input" });
            }

            // Build cache key
            const cacheKey = `${vehicleId}--${timestamp}`;

            // Fetch from cache, return if available
            const cachedData = this.cache.get(cacheKey);

            if (cachedData) {
                return res.json(cachedData);
            }
            try {
                // Query the database
                const queryVehicle = `
                    SELECT v."id", v."make", v."model", l."state", l."timestamp"
                    FROM "vehicles" v
                    JOIN (
                        SELECT "vehicleId", "state", "timestamp", ROW_NUMBER() OVER (PARTITION BY "vehicleId" ORDER BY "timestamp" DESC) AS rn
                        FROM "stateLogs"
                        WHERE "vehicleId" = $1 AND "timestamp" <= $2
                    ) l ON v."id" = l."vehicleId" AND l.rn = 1
                    WHERE v."id" = $1;
                `;

                const result = await this.pool.query(queryVehicle, [
                    vehicleId,
                    timestamp,
                ]);

                if (result.rows.length === 0) {
                    return res.status(404).json({ error: "Vehicle not found" });
                }
                const {
                    id,
                    make,
                    model,
                    state,
                    timestamp: vehicleTimestamp,
                } = result.rows[0];
                const vehicleData = {
                    id,
                    make,
                    model,
                    state,
                    timestamp: vehicleTimestamp,
                };

                // Cache the result
                this.cache.set(cacheKey, vehicleData);

                res.json(vehicleData);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Internal server error" });
            }
        });
    }
    start() {
        this.app.listen(this.app.get("port"), () => {
            console.log("Server listening on port " + this.app.get("port"));
        });
    }
}

module.exports = Server;
