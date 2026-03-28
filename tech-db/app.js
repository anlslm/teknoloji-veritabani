// ============================================================
//  TECHDB — app.js
//  Tüm veri yönetimi, yardımcı fonksiyonlar
// ============================================================

const DB_KEY     = 'techdb_kayitlar';
const SAYAC_KEY  = 'techdb_sayac';
const KONFIG_KEY = 'techdb_konfig';

// ──────────────────────────────────────────────
//  Sistem Konfigürasyonu
// ──────────────────────────────────────────────

const VARSAYILAN_KONFIG = {
  gruplar: [
    {
      id: 'tur',
      etiket: 'Tür',
      aciklama: 'Kayıt türleri — Teknoloji Tanımlama Formu\'nda TÜR alanında görünür',
      secenekler: ['Teknoloji', 'Alt Sistem', 'Sistem', 'Komponent'],
      silinebilir: false
    },
    {
      id: 'teknolojiAlani',
      etiket: 'Teknoloji Alanı',
      aciklama: 'Teknoloji alanı sınıflandırması',
      secenekler: ['Malzeme', 'Yazılım'],
      silinebilir: true
    },
    {
      id: 'urunGrubu',
      etiket: 'Ürün Grubu',
      aciklama: 'Ürünün ait olduğu platform / araç grubu',
      secenekler: ['Kara Araçları', 'Hava Araçları', 'Deniz Araçları', 'Uzay Araçları'],
      silinebilir: true
    },
    {
      id: 'durumu',
      etiket: 'Durumu',
      aciklama: 'Kaydın mevcut durumu / aşaması — Konfigürasyon ekranından özelleştirilebilir',
      secenekler: [],
      silinebilir: true
    },
    {
      id: 'faaliyetPlani',
      etiket: 'Faaliyet Planı',
      aciklama: 'Kaydın bağlı olduğu faaliyet planı — Konfigürasyon ekranından özelleştirilebilir',
      secenekler: [],
      silinebilir: true
    }
  ]
};

function konfigGetir() {
  try {
    const stored = JSON.parse(localStorage.getItem(KONFIG_KEY));
    if (stored && Array.isArray(stored.gruplar)) {
      // Varsayılan config'de olup stored'da olmayan grupları ekle
      const mevcutIdler = new Set(stored.gruplar.map(g => g.id));
      let degisti = false;
      VARSAYILAN_KONFIG.gruplar.forEach(g => {
        if (!mevcutIdler.has(g.id)) {
          stored.gruplar.push(JSON.parse(JSON.stringify(g)));
          degisti = true;
        }
      });
      if (degisti) localStorage.setItem(KONFIG_KEY, JSON.stringify(stored));
      return stored;
    }
  } catch {}
  return JSON.parse(JSON.stringify(VARSAYILAN_KONFIG));
}

function konfigKaydet(konfig) {
  localStorage.setItem(KONFIG_KEY, JSON.stringify(konfig));
}

function konfigSecenekGetir(grupId) {
  const grup = konfigGetir().gruplar.find(g => g.id === grupId);
  return grup ? [...grup.secenekler] : [];
}

function turlerGetir() {
  return konfigSecenekGetir('tur');
}

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
    guncelTRL: veri.guncelTRL ? parseInt(veri.guncelTRL, 10) : null,
    hedeflenenTRL: parseInt(veri.hedeflenenTRL, 10),
    butce: parseFloat(veri.butce) || 0,
    iscilik: veri.iscilik.trim(),
    teknolojiAlani: veri.teknolojiAlani || '',
    urunGrubu: veri.urunGrubu || '',
    durumu: veri.durumu || '',
    faaliyetPlani: veri.faaliyetPlani || '',
    aktif: veri.aktif !== undefined ? !!veri.aktif : true,
    trlHedefleri: Array.isArray(veri.trlHedefleri)
      ? veri.trlHedefleri.filter(h => h.hedef && h.tarih)
      : [],
    olusturanId: (aktifKullanici() || {}).id  || null,
    olusturanAd: (aktifKullanici() || {}).ad  || null,
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
    guncelTRL: veri.guncelTRL ? parseInt(veri.guncelTRL, 10) : null,
    hedeflenenTRL: parseInt(veri.hedeflenenTRL, 10),
    butce: parseFloat(veri.butce) || 0,
    iscilik: veri.iscilik.trim(),
    teknolojiAlani: veri.teknolojiAlani || '',
    urunGrubu: veri.urunGrubu || '',
    durumu: veri.durumu || '',
    faaliyetPlani: veri.faaliyetPlani || '',
    aktif: veri.aktif !== undefined ? !!veri.aktif : (kayitlar[idx].aktif !== false),
    trlHedefleri: Array.isArray(veri.trlHedefleri)
      ? veri.trlHedefleri.filter(h => h.hedef && h.tarih)
      : (kayitlar[idx].trlHedefleri || []),
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

const TUR_RENK_SABIT = {
  'Teknoloji':  '#4f8ef7',
  'Alt Sistem': '#f7a44f',
  'Sistem':     '#4fd97f',
  'Komponent':  '#c84ff7'
};

function turRenkGetir(tur) {
  if (TUR_RENK_SABIT[tur]) return TUR_RENK_SABIT[tur];
  // Bilinmeyen TÜR'ler için hash tabanlı renk üret
  let hash = 0;
  for (const c of (tur || '')) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  return `hsl(${Math.abs(hash) % 360}, 60%, 55%)`;
}

function turEtiketi(tur) {
  const renk = turRenkGetir(tur);
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
      display: flex;
    }

    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ── Dikey Sidebar ── */
    .sidebar {
      width: 210px; flex-shrink: 0;
      height: 100vh; position: fixed; left: 0; top: 0;
      background: var(--bg2);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      z-index: 200;
      overflow-y: auto;
    }
    .sidebar-brand {
      padding: 18px 16px 16px;
      font-size: 15px; font-weight: 700;
      color: var(--text); letter-spacing: .3px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .sidebar-brand span { color: var(--accent); }
    .sidebar-section {
      padding: 12px 8px 4px;
      font-size: 10px; font-weight: 700;
      color: var(--text2); text-transform: uppercase;
      letter-spacing: .8px; padding-left: 14px;
    }
    .sidebar-nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
    .sidebar-link {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 8px;
      font-size: 13px; font-weight: 500;
      color: var(--text2); text-decoration: none;
      transition: background .15s, color .15s;
    }
    .sidebar-link:hover { background: var(--bg3); color: var(--text); text-decoration: none; }
    .sidebar-link.active { background: var(--accent); color: #fff; }
    .sidebar-link .sl-icon { font-size: 15px; line-height: 1; }

    /* ── Ana İçerik Alanı ── */
    .main-wrap {
      margin-left: 210px;
      flex: 1;
      display: flex; flex-direction: column;
      min-height: 100vh;
      min-width: 0;
    }
    .topbar {
      height: 56px; flex-shrink: 0;
      background: var(--bg2); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; gap: 12px;
      padding: 0 24px;
      position: sticky; top: 0; z-index: 100;
    }
    .topbar-title { font-size: 15px; font-weight: 600; color: var(--text); }
    .topbar-spacer { flex: 1; }

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

    /* ── Sidebar Kullanıcı Bloğu ── */
    .sidebar-user {
      padding: 14px 14px 16px;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }
    .sidebar-user-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    }
    .sidebar-user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--accent)30; border: 1px solid var(--accent)50;
      color: var(--accent); font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .sidebar-user-ad  { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.2; }
    .sidebar-user-rol { font-size: 10px; color: var(--text2); text-transform: uppercase; letter-spacing: .5px; }
    .sidebar-cikis {
      width: 100%; padding: 7px 10px; text-align: left;
      background: none; border: 1px solid var(--border);
      border-radius: 7px; color: var(--text2); font-size: 12px;
      cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .sidebar-cikis:hover { background: #e9456012; border-color: var(--danger); color: var(--danger); }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  `;
}

// ──────────────────────────────────────────────
//  Paylaşımlı Sidebar HTML
// ──────────────────────────────────────────────

function sidebarHTML(aktifSayfa) {
  const k      = aktifKullanici();
  const rol    = k ? k.rol : 'kullanici';
  const rSev   = ROL_SIRASI[rol] || 0;

  const linkler = [
    { href: 'index.html',   ikon: '📋', etiket: 'Kayıt Listesi',        min: 1 },
    { href: 'roadmap.html', ikon: '🗺️', etiket: 'Yol Haritası',         min: 1 },
    { href: 'ddp.html',     ikon: '💼', etiket: 'Dış Destekli Projeler', min: 2 },
    { href: 'config.html',  ikon: '⚙️', etiket: 'Konfigürasyon',         min: 3 },
  ];

  const linkHTML = linkler
    .filter(l => rSev >= l.min)
    .map(l => `<a href="${l.href}" class="sidebar-link ${aktifSayfa === l.href ? 'active' : ''}">
      <span class="sl-icon">${l.ikon}</span>${l.etiket}
    </a>`)
    .join('');

  const ROL_ETIKET = { yonetici: 'Yönetici', tys: 'TYS', kullanici: 'Kullanıcı' };
  const kullaniciBlok = k ? `
    <div class="sidebar-user">
      <div class="sidebar-user-row">
        <div class="sidebar-user-avatar">${k.ad.charAt(0).toUpperCase()}</div>
        <div>
          <div class="sidebar-user-ad">${k.ad}</div>
          <div class="sidebar-user-rol">${ROL_ETIKET[rol] || rol}</div>
        </div>
      </div>
      <button class="sidebar-cikis" onclick="oturumKapat()">← Çıkış Yap</button>
    </div>` : '';

  return `
    <div class="sidebar">
      <div class="sidebar-brand">Teknoloji <span>Veritabanı</span></div>
      <nav class="sidebar-nav">${linkHTML}</nav>
      ${kullaniciBlok}
    </div>
  `;
}

// ──────────────────────────────────────────────
//  DDP — Dış Destekli Projeler
// ──────────────────────────────────────────────

const DDP_KEY   = 'techdb_ddp_kayitlar';
const DDP_SAYAC = 'techdb_ddp_sayac';

const FON_SAGLAYICILAR = ['TÜBİTAK', 'SSB', 'Diğer'];

function ddpKayitlariGetir() {
  try { return JSON.parse(localStorage.getItem(DDP_KEY)) || []; }
  catch { return []; }
}

function ddpKayitlariKaydet(dizi) {
  localStorage.setItem(DDP_KEY, JSON.stringify(dizi));
}

function ddpIdUret() {
  let sayac = parseInt(localStorage.getItem(DDP_SAYAC) || '0', 10) + 1;
  localStorage.setItem(DDP_SAYAC, String(sayac));
  return 'DDP-' + String(sayac).padStart(4, '0');
}

function ddpIdIleGetir(id) {
  return ddpKayitlariGetir().find(k => k.id === id) || null;
}

function ddpEkle(veri) {
  const kayitlar = ddpKayitlariGetir();
  const simdi    = new Date().toISOString();
  const yeni = {
    id:              ddpIdUret(),
    ad:              veri.ad.trim(),
    basvuruTarihi:   veri.basvuruTarihi  || '',
    baslangicTarihi: veri.baslangicTarihi || '',
    bitisTarihi:     veri.bitisTarihi    || '',
    toplamButce:     parseFloat(veri.toplamButce)  || 0,
    hibeTutari:      parseFloat(veri.hibeTutari)   || 0,
    fonSaglayici:    veri.fonSaglayici   || '',
    program:         (veri.program       || '').trim(),
    fikiriHakPaylasimi: (veri.fikiriHakPaylasimi || '').trim(),
    iliskiliKayitlar: veri.iliskiliKayitlar || [],
    olusturmaTarihi:  simdi,
    guncellenmeTarihi: simdi
  };
  kayitlar.push(yeni);
  ddpKayitlariKaydet(kayitlar);
  return yeni.id;
}

function ddpGuncelle(id, veri) {
  const kayitlar = ddpKayitlariGetir();
  const idx = kayitlar.findIndex(k => k.id === id);
  if (idx === -1) return false;
  kayitlar[idx] = {
    ...kayitlar[idx],
    ad:              veri.ad.trim(),
    basvuruTarihi:   veri.basvuruTarihi  || '',
    baslangicTarihi: veri.baslangicTarihi || '',
    bitisTarihi:     veri.bitisTarihi    || '',
    toplamButce:     parseFloat(veri.toplamButce)  || 0,
    hibeTutari:      parseFloat(veri.hibeTutari)   || 0,
    fonSaglayici:    veri.fonSaglayici   || '',
    program:         (veri.program       || '').trim(),
    fikiriHakPaylasimi: (veri.fikiriHakPaylasimi || '').trim(),
    iliskiliKayitlar: veri.iliskiliKayitlar || [],
    guncellenmeTarihi: new Date().toISOString()
  };
  ddpKayitlariKaydet(kayitlar);
  return true;
}

function ddpSil(id) {
  ddpKayitlariKaydet(ddpKayitlariGetir().filter(k => k.id !== id));
}

// ══════════════════════════════════════════════
//  KİMLİK DOĞRULAMA
// ══════════════════════════════════════════════

const AUTH_KEY    = 'techdb_kullanicilar';
const SESSION_KEY = 'techdb_oturum';
const ROL_SIRASI  = { kullanici: 1, tys: 2, yonetici: 3 };

// FNV-1a 32-bit — senkron, hafif hash
function hash(metin) {
  let h = 0x811c9dc5;
  for (let i = 0; i < metin.length; i++) {
    h = Math.imul(h ^ metin.charCodeAt(i), 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const VARSAYILAN_KULLANICILAR = [
  { id: 'usr-0001', ad: 'Yönetici',      kullaniciAdi: 'admin',     sifreHash: hash('admin123'),      rol: 'yonetici'  },
  { id: 'usr-0002', ad: 'TYS Kullanıcı', kullaniciAdi: 'tys',       sifreHash: hash('tys123'),        rol: 'tys'       },
  { id: 'usr-0003', ad: 'Görüntüleyici', kullaniciAdi: 'kullanici',  sifreHash: hash('kullanici123'),  rol: 'kullanici' },
];

function kullanicilarGetir() {
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (stored && Array.isArray(stored) && stored.length) return stored;
  } catch {}
  const liste = JSON.parse(JSON.stringify(VARSAYILAN_KULLANICILAR));
  localStorage.setItem(AUTH_KEY, JSON.stringify(liste));
  return liste;
}

function kullaniciDogrula(kullaniciAdi, sifre) {
  return kullanicilarGetir().find(k =>
    k.kullaniciAdi === kullaniciAdi && k.sifreHash === hash(sifre)
  ) || null;
}

function oturumAc(kullanici) {
  const oturum = {
    id: kullanici.id, ad: kullanici.ad,
    kullaniciAdi: kullanici.kullaniciAdi, rol: kullanici.rol
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(oturum));
  return oturum;
}

function oturumKapat() {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = 'login.html';
}

function aktifKullanici() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

// minRol: 'kullanici' | 'tys' | 'yonetici'
// Yetersiz yetkide index.html'e, oturum yoksa login.html'e yönlendirir.
function sayfaKoruma(minRol) {
  const k = aktifKullanici();
  if (!k) { location.replace('login.html'); return null; }
  if ((ROL_SIRASI[k.rol] || 0) < (ROL_SIRASI[minRol] || 0)) {
    location.replace('index.html'); return null;
  }
  return k;
}
