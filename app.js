// ARAMA KISMI ICIN 
function toggleFields() {
  const type = document.getElementById('add-type').value;

  // Tüm alanları gizle
  document.getElementById('player-fields').style.display = 'none';
  document.getElementById('team-fields').style.display = 'none';
  document.getElementById('coach-fields').style.display = 'none';

  // Seçilen türe göre ilgili alanları göster
  if (type === 'oyuncu') {
    document.getElementById('player-fields').style.display = 'block';
  } else if (type === 'takim') {
    document.getElementById('team-fields').style.display = 'block';
  } else if (type === 'antrenor') {
    document.getElementById('coach-fields').style.display = 'block';
  }
}


async function searchData() {
  const type = document.getElementById('search-type').value;
  const response = await fetch(`http://localhost:3000/arama?type=${type}`);
  const data = await response.json();

  const tableBody = document.querySelector('#search-results tbody');
  tableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${Object.values(row).join(', ')}</td>`;
    tableBody.appendChild(tr);
  });
}
function clearResults() {
  document.querySelector('#search-results tbody').innerHTML = '';
}

function clearStats() {
  document.getElementById('results').innerHTML = '';
}

function resetForm() {
  document.getElementById('add-type').value = '';
  document.getElementById('player-fields').style.display = 'none';
  document.getElementById('team-fields').style.display = 'none';
  document.getElementById('coach-fields').style.display = 'none';
  document.getElementById('referee-fields').style.display = 'none';
  document.querySelectorAll('.input-field').forEach(input => input.value = '');
}

//TAKIMLARI GORUNTULEMEK ICIN
async function fetchTakimlar() {
  const ligId = document.getElementById('lig-id-takimlar').value;

  if (!ligId) {
    alert('Lütfen geçerli bir Lig ID girin!');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/takimlar/${ligId}`);
    const data = await response.json();

    if (data.length === 0) {
      alert('Bu Lig ID için takım bulunamadı!');
      return;
    }

    const tableBody = document.querySelector('#takimlar tbody');
    tableBody.innerHTML = '';

    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.takimAdi}</td>
        <td>${row.stadyumAdi}</td>
        <td>${row.oyuncuSayisi}</td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Hata:', err);
    alert(`Takım verileri getirilemedi: ${err.message}`);
  }
}
function clearTakimlar() {
  document.querySelector('#takimlar tbody').innerHTML = '';
}



// PUAN DURUMUNU GOSTEREN KISIM
async function fetchPuanDurumu() {
  const ligId = document.getElementById('lig-id').value;

  if (!ligId) {
    alert('Lütfen geçerli bir Lig ID girin!');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/puan-durumu/${ligId}`);
    const data = await response.json();

    if (data.length === 0) {
      alert('Bu Lig ID için veri bulunamadı!');
      return;
    }

    const tableBody = document.querySelector('#puan-durumu tbody');
    tableBody.innerHTML = '';

    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.takimAdi}</td>
        <td>${row.oynananMacSayisi}</td>
        <td>${row.kazanilanMacSayisi}</td>
        <td>${row.beraberlikSayisi}</td>
        <td>${row.kaybedilenMacSayisi}</td>
        <td>${row.puan}</td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Hata:', err);
    alert(`Puan durumu verileri getirilemedi: ${err.message}`);
  }
}

function clearPuanDurumu() {
  document.querySelector('#puan-durumu tbody').innerHTML = '';
}

// VERI ISLEMLERI KISMI 
// Ekleme Fonksiyonu
function addData() {
  const type = document.getElementById('add-type').value;

  if (!type) {
    alert('Lütfen bir veri türü seçin.');
    return;
  }

  let data = {};
  let endpoint = '';

  // Seçilen türe göre form verilerini topla ve endpoint belirle
  if (type === 'oyuncu') {
    const oyuncuAdi = document.getElementById('player-name').value;
    const pozisyon = document.getElementById('player-position').value;
    const dogumTarihi = document.getElementById('player-date').value;
    const takimAdi = document.getElementById('player-team').value;

    console.log({ oyuncuAdi, pozisyon, dogumTarihi, takimAdi })
    
    if (!oyuncuAdi || !pozisyon || !dogumTarihi || !takimAdi) {
      alert('Lütfen tüm oyuncu bilgilerini doldurun.');
      return;
    }

    data = { oyuncuAdi, pozisyon, dogumTarihi, takimAdi };
    endpoint = '/api/addPlayer';

  } else if (type === 'antrenor') {
    const adi = document.getElementById('coach-adi').value;
    const soyadi = document.getElementById('coach-soyadi').value;
    const deneyimYili = document.getElementById('coach-deneyimYili').value;
    const takimId = document.getElementById('coach-teamId').value;

    if (!adi || !soyadi || !deneyimYili || !takimId) {
      alert('Lütfen tüm antrenör bilgilerini doldurun.');
      return;
    }

    data = { adi, soyadi, deneyimYili, takimId };
    endpoint = '/api/addCoach';

  } else if (type === 'takim') {
    const takimAdi = document.getElementById('team-name').value;
    const ligId = document.getElementById('team-ligId').value;
    const stadyumAdi = document.getElementById('team-stadium').value;

    if (!takimAdi || !ligId || !stadyumAdi) {
      alert('Lütfen tüm takım bilgilerini doldurun.');
      return;
    }

    data = { takimAdi, ligId, stadyumAdi };
    endpoint = '/api/addTeam';
  }

  // API isteği gönder
  
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('HTTP error ' + response.status);
      }
      return response.json();
    })
    .then((result) => {
      alert(result.message || `${type} başarıyla eklendi.`);
    })
    .catch((error) => {
      console.error('Hata:', error);
      alert('Bir hata oluştu: ' + error.message);
    });
}

function toggleDeleteFields() {
  const type = document.getElementById('delete-type').value;

  // Alanları gizle
  document.getElementById('delete-player-fields').style.display = 'none';
  document.getElementById('delete-coach-fields').style.display = 'none';
  document.getElementById('delete-team-fields').style.display = 'none';

  // Seçime göre alanları göster
  if (type === 'oyuncu') {
    document.getElementById('delete-player-fields').style.display = 'block';
  } else if (type === 'antrenor') {
    document.getElementById('delete-coach-fields').style.display = 'block';
  } else if (type === 'takim') {
    document.getElementById('delete-team-fields').style.display = 'block';
  }
}

function deleteData() {
  const type = document.getElementById('delete-type').value;
  let data = {};

  if (type === 'oyuncu') {
    data = {
      type,
      name: document.getElementById('delete-player-name').value,
      position: document.getElementById('delete-player-position').value,
    };
  } else if (type === 'antrenor') {
    data = {
      type,
      name: document.getElementById('delete-coach-name').value,
      surname: document.getElementById('delete-coach-surname').value,
    };
  } else if (type === 'takim') {
    data = {
      type,
      name: document.getElementById('delete-team-name').value,
    };
  } else {
    alert('Lütfen bir tür seçin.');
    return;
  }

  fetch('/api/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.error) {
        alert(`Hata: ${result.error}`);
      } else {
        alert(`Başarıyla silindi: ${result.message}`);
      }
    })
    .catch((error) => {
      console.error('Fetch Hatası:', error);
      alert('Silme işlemi sırasında bir hata oluştu.');
    });
}




