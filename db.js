const { Pool } = require('pg');

// PostgreSQL bağlantı ayarları
const pool = new Pool({
  user: 'postgres',          
  host: 'localhost',         
  database: 'ligTakipSistemi', 
  password: 'sedatmrt',  
  port: 5432,              
});

const setupDatabase = async () => {
  try {
    await pool.query(`
      -- Fonksiyon ve tetikleyicilerin SQL scriptlerini buraya yapıştırın.
    `);
    console.log('Trigger ve fonksiyonlar başarıyla yüklendi.');
  } catch (err) {
    console.error('Trigger ve fonksiyon yükleme hatası:', err.message);
  }
};

setupDatabase();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
