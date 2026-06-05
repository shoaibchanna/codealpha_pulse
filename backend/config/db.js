const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pulse_db',
  waitForConnections: true,
  connectionLimit: 10,
});

pool.getConnection()
  .then(c => { console.log('✅ MySQL connected'); c.release(); })
  .catch(e => { console.error('❌ MySQL error:', e.message); process.exit(1); });

module.exports = pool;
