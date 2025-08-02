const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

(async () => {
    try {
      const connection = await db.getConnection();
      console.log(' Connexion réussie à la base de données !');
      connection.release(); // Toujours relâcher la connexion
    } catch (err) {
      console.error('Échec de la connexion à la base de données :', err.message);
    }
  })();

module.exports = db;
