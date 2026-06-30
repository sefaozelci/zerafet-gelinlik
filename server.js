const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDb } = require('./database');

const app = express();
const PORT = 3000;

// ============================================
// GÖRÜNÜM MOTORU (View Engine)
// ============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================
// MIDDLEWARE
// ============================================

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Oturum yönetimi
app.use(session({
  secret: 'elegance-gelinlik-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 saat
  }
}));

// ============================================
// VERİTABANI BAŞLAT
// ============================================
initDb();

// ============================================
// ROTALAR (Routes)
// ============================================
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// ============================================
// SUNUCUYU BAŞLAT
// ============================================
app.listen(PORT, () => {
  console.log('============================================');
  console.log(`  Élégance Gelinlik Butik`);
  console.log(`  Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`  Admin Panel: http://localhost:${PORT}/admin`);
  console.log('============================================');
});

module.exports = app;
