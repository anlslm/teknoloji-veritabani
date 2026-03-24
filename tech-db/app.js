// ============================================================
//  TECHDB — app.js
//  Tüm veri yönetimi, yardımcı fonksiyonlar
// ============================================================

const DB_KEY     = 'techdb_kayitlar';
const SAYAC_KEY  = 'techdb_sayac';

const TURLER = ['Teknoloji', 'Alt Sistem', 'Sistem', 'Komponent'];

const TRL_ACIKLAMALARI = {
  1: 'Temel prensipler gözlemlenmiş',
  2: 'Teknoloji konsepti oluşturulmuş',
  3: 'Deneysel konsept kanıtlanmış',
  4: 'Laboratuvar ortamında doğrulanmış',
  5: 'Simüle ortamda doğrulanmış',
  6: 'Prototip gerçek ortamda gösterilmiş',
  7: 'Prototip operasyonel ortamda gösterilmiş',
  8: 'Sistem tamamlanmış ve nitelendirme testleri geçilmiş',
  9: 'Gerçek operasyonel ortamda kanıtlanmış'
};

// ──────────────────────────────────────────────
//  localStorage yardımcıları
// ──────────────────────────────────────────────

function tumKayitlariGetir() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
  } catch {
    return [];
  }
}

function kayitlariKaydet(dizi) {
  localStorage.setItem(DB_KEY, JSON.stringify(dizi));
}

function idIleGetir(id) {
  return tumKayitlariGetir().find(k => k.id === id) || null;
}

// ──────────────────────────────────────────────
//  ID üretici
// ──────────────────────────────────────────────

function yeniIdUret() {
  let sayac = parseInt(localStorage.getItem(SAYAC_KEY) || '0', 10) + 1;
  localStorage.setItem(SAYAC_KEY, String(sayac));
  return 'TRK-' + String(sayac).padStart(4, '0');
}

// ──────────────────────────────────────────────
//  CRUD
// ──────────────────────────────────────────────

function kayitEkle(veri) {
  const kayitlar = tumKayitlariGetir();
  const simdi = new Date().toISOString();
  const yeniKayit = {
    id: yeniIdUret(),
    tur: veri.tur,
    ad: veri.ad.trim(),
    gelistirmeBaslangic: veri.gelistirmeBaslangic,
    gelistirmeBitis: veri.gelistirmeBitis,
    sorumlu: veri.sorumlu.trim(),
    baslangicTRL: parseInt(veri.baslangicTRL, 10),
    hedeflenenTRL: parseInt(veri.hedeflenenTRL, 10),
    butce: parseFloat(veri.butce) || 0,
    iscilik: veri.iscilik.trim(),
    iliskiler: [],
    olusturmaTarihi: simdi,
    guncellenmeTarihi: simdi
  };
  kayitlar.push(yeniKayit);
  kayitlariKaydet(kayitlar);
  // İlişkileri bidireksiyonel ekle
  if (veri.iliskiler && veri.iliskiler.length > 0) {
    iliskileriGuncelle(yeniKayit.id, [], veri.iliskiler);
  }
  return yeniKayit.id;
}

function kayitGuncelle(id, veri) {
  const kayitlar = tumKayitlariGetir();
  const idx = kayitlar.findIndex(k => k.id === id);
  if (idx === -1) return false;
  const eskiIliskiler = kayitlar[idx].iliskiler || [];
  kayitlar[idx] = {
    ...kayitlar[idx],
    tur: veri.tur,
    ad: veri.ad.trim(),
    gelistirmeBaslangic: veri.gelistirmeBaslangic,
    gelistirmeBitis: veri.gelistirmeBitis,
    sorumlu: veri.sorumlu.trim(),
    baslangicTRL: parseInt(veri.baslangicTRL, 10),
    hedeflenenTRL: parseInt(veri.hedeflenenTRL, 10),
    butce: parseFloat(veri.butce) || 0,
    iscilik: veri.iscilik.trim(),
    guncellenmeTarihi: new Date().toISOString()
  };
  kayitlariKaydet(kayitlar);
  iliskileriGuncelle(id, eskiIliskiler, veri.iliskiler || []);
  return true;
}

function kayitSil(id) {
  let kayitlar = tumKayitlariGetir();
  const kayit = kayitlar.find(k => k.id === id);
  if (!kayit) return false;
  // Tüm bağlı kayıtlardan bu ID'yi temizle
  (kayit.iliskiler || []).forEach(bagliId => {
    const idx = kayitlar.findIndex(k => k.id === bagliId);
    if (idx !== -1) {
      kayitlar[idx].iliskiler = (kayitlar[idx].iliskiler || []).filter(x => x !== id);
    }
  });
  kayitlar = kayitlar.filter(k => k.id !== id);
  kayitlariKaydet(kayitlar);
  return true;
}

// ──────────────────────────────────────────────
//  Bidireksiyonel ilişki yönetimi
// ──────────────────────────────────────────────

function iliskileriGuncelle(anaId, eskiListe, yeniListe) {
  const kayitlar = tumKayitlariGetir();

  const eklenenler = yeniListe.filter(x => !eskiListe.includes(x));
  const cikarilanlar = eskiListe.filter(x => !yeniListe.includes(x));

  // Ana kaydın ilişkilerini güncelle
  const anaIdx = kayitlar.findIndex(k => k.id === anaId);
  if (anaIdx !== -1) {
    kayitlar[anaIdx].iliskiler = [...yeniListe];
  }

  // Eklenenler: karşı tarafın listesine anaId'yi ekle
  eklenenler.forEach(bagliId => {
    const idx = kayitlar.findIndex(k => k.id === bagliId);
    if (idx !== -1) {
      const liste = kayitlar[idx].iliskiler || [];
      if (!liste.includes(anaId)) {
        kayitlar[idx].iliskiler = [...liste, anaId];
      }
    }
  });

  // Çıkarılanlar: karşı tarafın listesinden anaId'yi kaldır
  cikarilanlar.forEach(bagliId => {
    const idx = kayitlar.findIndex(k => k.id === bagliId);
    if (idx !== -1) {
      kayitlar[idx].iliskiler = (kayitlar[idx].iliskiler || []).filter(x => x !== anaId);
    }
  });

  kayitlariKaydet(kayitlar);
}

// ──────────────────────────────────────────────
//  Formatlayıcılar
// ──────────────────────────────────────────────

function tarihFormatla(isoStr) {
  if (!isoStr) return '—';
  const [y, m, d] = isoStr.split('-');
  return `${d}.${m}.${y}`;
}

function butceFormatla(sayi) {
  if (!sayi && sayi !== 0) return '—';
  return Number(sayi).toLocaleString('tr-TR') + ' ₺';
}

// ──────────────────────────────────────────────
//  URL parametre yardımcısı
// ──────────────────────────────────────────────

function urlParam(ad) {
  return new URLSearchParams(window.location.search).get(ad);
}

// ──────────────────────────────────────────────
//  TÜR renk etiketleri
// ──────────────────────────────────────────────

const TUR_RENK = {
  'Teknoloji':  '#4f8ef7',
  'Alt Sistem': '#f7a44f',
  'Sistem':     '#4fd97f',
  'Komponent':  '#c84ff7'
};

function turEtiketi(tur) {
  const renk = TUR_RENK[tur] || '#888';
  return `<span class="tur-etiket" style="background:${renk}20;color:${renk};border:1px solid ${renk}40">${tur}</span>`;
}

// ──────────────────────────────────────────────
//  Ortak CSS (tüm sayfalar)
// ──────────────────────────────────────────────

function ortakCSS() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #0f1117;
      --bg2:      #1a1d27;
      --bg3:      #22263a;
      --border:   #2e334d;
      --text:     #e2e6f3;
      --text2:    #8b93b3;
      --accent:   #4f8ef7;
      --danger:   #e94560;
      --success:  #4fd97f;
      --warning:  #f7a44f;
      --radius:   10px;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      font-size: 14px;
    }

    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Navbar */
    .navbar {
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      height: 56px;
      display: flex;
      align-items: center;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar-brand {
      font-weight: 700;
      font-size: 16px;
      color: var(--text);
      letter-spacing: 0.5px;
    }
    .navbar-brand span { color: var(--accent); }
    .navbar-spacer { flex: 1; }

    /* Butonlar */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: var(--radius);
      border: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity .15s, transform .1s;
      white-space: nowrap;
    }
    .btn:hover { opacity: .85; transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }
    .btn-primary   { background: var(--accent);   color: #fff; }
    .btn-danger    { background: var(--danger);    color: #fff; }
    .btn-ghost     { background: var(--bg3);       color: var(--text); border: 1px solid var(--border); }
    .btn-success   { background: var(--success);   color: #000; }
    .btn-sm { padding: 5px 10px; font-size: 12px; }

    /* Kart */
    .card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
    }

    /* Form elemanları */
    .form-group { margin-bottom: 18px; }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text2);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-label.required::after { content: ' *'; color: var(--danger); }
    .form-control {
      width: 100%;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
      padding: 9px 12px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color .2s;
      outline: none;
    }
    .form-control:focus { border-color: var(--accent); }
    .form-control::placeholder { color: var(--text2); }
    select.form-control option { background: var(--bg3); }

    /* TÜR etiketi */
    .tur-etiket {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      background: var(--bg3);
      color: var(--text2);
      border: 1px solid var(--border);
    }

    /* Alert */
    .alert {
      padding: 10px 14px;
      border-radius: var(--radius);
      font-size: 13px;
      margin-bottom: 12px;
    }
    .alert-danger  { background: #e9456020; border: 1px solid #e9456040; color: #ff7a93; }
    .alert-success { background: #4fd97f20; border: 1px solid #4fd97f40; color: #4fd97f; }

    /* Yükleniyor / boş */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text2);
    }
    .empty-state-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state-text { font-size: 16px; font-weight: 500; margin-bottom: 6px; color: var(--text); }
    .empty-state-sub  { font-size: 13px; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  `;
}
