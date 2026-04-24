const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',        // ⚠️ CHANGE THIS to your MySQL username
    password: '1234',         // ⚠️ CHANGE THIS to your MySQL password
    database: 'university_project',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

module.exports = promisePool;