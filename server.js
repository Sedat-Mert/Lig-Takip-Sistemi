const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db'); // Veritabanı bağlantı dosyanız
const app = express();
const pool = require('./db');

// Middleware'ler
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// ARAMA MODÜLÜ
app.get('/arama', async (req, res) => {
  const { type } = req.query;
  let query = '';

  switch (type) {
    case 'oyuncu':
      query = `
      SELECT "oyuncuAdi", "pozisyon", TO_CHAR("dogumTarihi", 'DD-MM-YYYY') AS "dogumTarihi"
      FROM oyuncu
    `;
      break;
    case 'antrenor':
      query = 'SELECT "adi", "soyadi" FROM antrenor';
      break;
    case 'hakem':
      query = 'SELECT "adi", "soyadi" FROM hakem';
      break;
    case 'lig':
      query = 'SELECT "ligAdi", "sezon" FROM lig';
      break;
    default:
      return res.status(400).send('Geçersiz arama tipi.');
  }

  try {
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(`Hata: ${err.message}`);
  }
});

// LİSTELEME MODÜLÜ
app.get('/listele/:ligId', async (req, res) => {
  const { ligId } = req.params;
  try {
    const takimlar = await db.query(`
      SELECT "takimAdi" FROM takim WHERE "ligId" = $1
    `, [ligId]);

    const oyuncular = await db.query(`
      SELECT "oyuncuAdi", "pozisyon" FROM oyuncu
      WHERE "takimId" IN (SELECT "takimId" FROM takim WHERE "ligId" = $1)
    `, [ligId]);

    res.json({
      takimlar: takimlar.rows,
      oyuncular: oyuncular.rows
    });
  } catch (err) {
    res.status(500).send(`Hata: ${err.message}`);
  }
});

// TAKIMLARI GORUNTULEMEK ICIN
app.get('/takimlar/:ligId', async (req, res) => {
  const ligId = req.params.ligId;

  try {
    const result = await pool.query(
      `SELECT "takimAdi", "stadyumAdi", "oyuncuSayisi" 
       FROM "takim" 
       WHERE "ligId" = $1`,
      [ligId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bu Lig ID için takım bulunamadı!' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Hata:', err);
    res.status(500).json({ error: 'Takım verileri alınırken bir hata oluştu.' });
  }
});



// PUAN DURUMU ÇEKME ENDPOINT
app.get('/puan-durumu/:ligId', async (req, res) => {
  const { ligId } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        t."takimAdi",
        m."oynananMacSayisi",
        m."kazanilanMacSayisi",
        m."beraberlikSayisi",
        m."kaybedilenMacSayisi",
        (m."kazanilanMacSayisi" * 3 + m."beraberlikSayisi") AS "puan"
      FROM puanlama m
      INNER JOIN takim t ON m."takimId" = t."takimId"
      WHERE m."ligId" = $1
      ORDER BY "puan" DESC;
    `, [ligId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Puan durumu sorgusu hatası:', err.message);
    res.status(500).send('Sunucu Hatası: Puan durumu getirilemedi.');
  }
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW();');
    res.status(200).json({ message: 'Veritabanı bağlantısı başarılı!', time: result.rows[0] });
  } catch (err) {
    console.error('Veritabanı bağlantı hatası:', err);
    res.status(500).json({ message: 'Veritabanı bağlantısı başarısız.', error: err.message });
  }
});

// OYUNCU EKLEME
async function addData() {
  const oyuncuAdi = document.getElementById('player-name').value;
  const pozisyon = document.getElementById('player-position').value;
  const dogumTarihi = document.getElementById('player-date').value;
  const takimAdi = document.getElementById('player-team').value;

  if (!oyuncuAdi || !pozisyon || !dogumTarihi || !takimAdi) {
    alert('Lütfen tüm alanları doldurun.');
    return;
  }

  const data = { oyuncuAdi, pozisyon, dogumTarihi, takimAdi };
  const endpoint = '/api/addPlayer';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
    } else {
      alert(`Bir hata oluştu: ${result.message}`);
    }
  } catch (error) {
    alert(`Sunucuyla bağlantı kurulamadı: ${error.message}`);
  }
}

app.post('/api/addPlayer', async (req, res) => {
  const { oyuncuAdi, pozisyon, dogumTarihi, takimAdi } = req.body;

  if (!oyuncuAdi || !pozisyon || !dogumTarihi || !takimAdi) {
    return res.status(400).json({ message: 'Tüm alanlar doldurulmalıdır.' });
  }

  try {
    const query = `
      SELECT oyuncu_ekle_takim_ismiyle($1, $2, $3, $4);
    `;
    const values = [oyuncuAdi, pozisyon, dogumTarihi, takimAdi];
    
    await pool.query(query, values);
    res.status(201).json({ message: 'Oyuncu başarıyla eklendi.' });
  } catch (err) {
    console.error('Hata Ayrıntıları:', err);
    res.status(500).json({ message: 'Oyuncu eklenirken bir hata oluştu.', error: err.message });
  }
});

// Antrenör Ekleme Endpoint'i
app.post('/api/addCoach', async (req, res) => {
  const { adi, soyadi, deneyimYili, takimId } = req.body;

  if (!adi || !soyadi || !deneyimYili || !takimId) {
    return res.status(400).json({ message: 'Tüm alanlar doldurulmalıdır.' });
  }

  try {
    const query = `SELECT antrenor_ekle($1, $2, $3, $4);`;
    const values = [adi, soyadi, deneyimYili, takimId];

    console.log('Çalıştırılan Sorgu:', query);
    console.log('Parametreler:', values);

    const result = await pool.query(query, values);

    console.log('Sorgu Sonucu:', result.rows);
    res.status(201).json({ message: 'Antrenör başarıyla eklendi.' });
  } catch (err) {
    console.error('Hata Ayrıntıları:', err);
    res.status(500).json({ message: 'Antrenör eklenirken bir hata oluştu.', error: err.message });
  }
});

// Takım Ekleme Endpoint'i
app.post('/api/addTeam', async (req, res) => {
  const { takimAdi, ligId, stadyumAdi } = req.body;

  if (!takimAdi || !ligId || !stadyumAdi) {
    return res.status(400).json({ message: 'Tüm alanlar doldurulmalıdır.' });
  }

  try {
    const query = `SELECT takim_ekle($1, $2, $3);`;
    const values = [takimAdi, ligId, stadyumAdi];

    console.log('Çalıştırılan Sorgu:', query);
    console.log('Parametreler:', values);

    const result = await pool.query(query, values);

    console.log('Sorgu Sonucu:', result.rows);
    res.status(201).json({ message: 'Takım başarıyla eklendi.' });
  } catch (err) {
    console.error('Hata Ayrıntıları:', err);
    res.status(500).json({ message: 'Takım eklenirken bir hata oluştu.', error: err.message });
  }
});

// Silme işlemi için POST endpoint
app.post('/api/delete', async (req, res) => {
  const { type, name, position, surname } = req.body;

  try {
    let query, params;

    if (type === 'oyuncu') {
      query = `SELECT oyuncu_sil($1, $2);`;
      params = [name, position];
    } else if (type === 'antrenor') {
      query = `SELECT antrenor_sil($1, $2);`;
      params = [name, surname];
    } else if (type === 'takim') {
      query = `SELECT takim_sil($1);`;
      params = [name];
    } else {
      return res.status(400).json({ error: 'Geçersiz tür.' });
    }

    const result = await pool.query(query, params);
    res.status(200).json({ message: `${type} başarıyla silindi.`, result: result.rows });
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ error: 'Veritabanı hatası oluştu.', details: error.message });
  }
});
// Sunucu Başlat
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});
