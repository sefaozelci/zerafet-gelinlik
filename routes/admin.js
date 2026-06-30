const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const requireAuth = require('../middleware/auth');
const { db, saveDb } = require('../database');
const { sendMail } = require('../utils/mailer');

// ============================================
// MULTER YAPILANDIRMASI
// ============================================

const uploadDirs = ['public/uploads/hero', 'public/uploads/dresses', 'public/uploads/about'];
for (const dir of uploadDirs) {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

function createUpload(type) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dest = path.join(__dirname, '..', 'public', 'uploads', type);
      cb(null, dest);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
      cb(null, uniqueName);
    }
  });
  return multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
      const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = allowedTypes.test(file.mimetype);
      if (extName && mimeType) {
        cb(null, true);
      } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir!'));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });
}

const uploadHero = createUpload('hero');
const uploadDress = createUpload('dresses');
const uploadAbout = createUpload('about');

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

function getSettingsObj() {
  const settings = {};
  for (const item of db.settings) {
    settings[item.key] = item.value;
  }
  return settings;
}

function getFlash(req) {
  const flash = req.session.flash || null;
  req.session.flash = null;
  return flash;
}

// ============================================
// GİRİŞ / ÇIKIŞ
// ============================================

router.get('/login', (req, res) => {
  if (req.session.adminId) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { flash: getFlash(req) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.admin_users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    req.session.flash = { type: 'error', message: 'Kullanıcı adı veya şifre hatalı!' };
    return res.redirect('/admin/login');
  }

  req.session.adminId = user.id;
  req.session.adminUsername = user.username;
  req.session.flash = { type: 'success', message: 'Başarıyla giriş yaptınız!' };
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// ============================================
// TÜM ADMIN ROTALARI İÇİN AUTH GEREKLİ
// ============================================
router.use(requireAuth);

// ============================================
// DASHBOARD
// ============================================

router.get('/', (req, res) => {
  const settings = getSettingsObj();
  const flash = getFlash(req);

  const dressCount = db.dresses.length;
  const totalAppointments = db.appointments.length;
  const testimonialCount = db.testimonials.length;
  const pendingAppointments = db.appointments.filter(a => a.status === 'bekliyor').length;

  const recentAppointments = [...db.appointments]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  res.render('layouts/admin-layout', {
    contentView: 'dashboard',
    pageTitle: 'Dashboard',
    currentPath: '/admin',
    settings,
    flash,
    dressCount,
    totalAppointments,
    testimonialCount,
    pendingAppointments,
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingCount: pendingAppointments,
    recentAppointments,
    adminUsername: req.session.adminUsername
  });
});

// ============================================
// AYARLAR
// ============================================

router.get('/settings', (req, res) => {
  res.render('layouts/admin-layout', {
    contentView: 'settings',
    pageTitle: 'Site Ayarları',
    currentPath: '/admin/settings',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length
  });
});

router.post('/settings', (req, res) => {
  const fields = [
    'site_name', 'phone', 'phone2', 'email', 'email2',
    'address', 'hours', 'instagram', 'facebook', 'whatsapp',
    'seo_title', 'seo_description', 'primary_color', 'text_color', 'bg_color',
    'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure'
  ];

  for (const field of fields) {
    let settingItem = db.settings.find(s => s.key === field);
    let val = req.body[field] || '';
    
    // Handle checkbox
    if (field === 'smtp_secure') {
      val = req.body.smtp_secure ? 'true' : 'false';
    }

    if (settingItem) {
      settingItem.value = val;
    } else {
      db.settings.push({ key: field, value: val });
    }
  }
  saveDb();

  req.session.flash = { type: 'success', message: 'Ayarlar başarıyla güncellendi!' };
  res.redirect('/admin/settings');
});

// ============================================
// İÇERİK & REKLAM (CONTENT)
// ============================================

router.get('/content', (req, res) => {
  res.render('layouts/admin-layout', {
    contentView: 'content',
    pageTitle: 'İçerik & Reklam Yönetimi',
    currentPath: '/admin/content',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length
  });
});

router.post('/content', (req, res) => {
  const contentFields = [
    'announcement_active', 'announcement_text', 'announcement_link',
    'section_collections_tag', 'section_collections_title', 'section_collections_desc',
    'section_about_tag', 'section_about_title',
    'section_services_tag', 'section_services_title', 'section_services_desc',
    'section_testimonials_tag', 'section_testimonials_title', 'section_testimonials_desc',
    'section_appointment_tag', 'section_appointment_title', 'section_appointment_desc',
    'section_contact_tag', 'section_contact_title', 'section_contact_desc',
    'section_instagram_tag', 'section_instagram_title', 'section_instagram_desc',
    'footer_desc'
  ];

  for (const field of contentFields) {
    let settingItem = db.settings.find(s => s.key === field);
    let val = req.body[field] || '';
    
    if (settingItem) {
      settingItem.value = val;
    } else {
      db.settings.push({ key: field, value: val });
    }
  }
  saveDb();

  req.session.flash = { type: 'success', message: 'İçerikler başarıyla güncellendi!' };
  res.redirect('/admin/content');
});

// ============================================
// HERO BÖLÜMÜ
// ============================================

router.get('/hero', (req, res) => {
  res.render('layouts/admin-layout', {
    contentView: 'hero',
    pageTitle: 'Hero Bölümü',
    currentPath: '/admin/hero',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    hero: db.hero
  });
});

router.post('/hero', uploadHero.single('bg_image'), (req, res) => {
  const { title, subtitle, badge_text, stat1_number, stat1_label, stat2_number, stat2_label, stat3_number, stat3_label } = req.body;

  let bgImage = db.hero.bg_image;
  if (req.file) {
    bgImage = '/uploads/hero/' + req.file.filename;
  }

  db.hero = {
    ...db.hero,
    title, subtitle, badge_text, stat1_number, stat1_label, stat2_number, stat2_label, stat3_number, stat3_label, bg_image: bgImage
  };
  saveDb();

  req.session.flash = { type: 'success', message: 'Hero bölümü başarıyla güncellendi!' };
  res.redirect('/admin/hero');
});

// ============================================
// GELİNLİKLER
// ============================================

router.get('/dresses', (req, res) => {
  const dresses = [...db.dresses]
    .sort((a, b) => a.sort_order - b.sort_order || b.id - a.id)
    .map(d => {
      const cat = db.categories.find(c => c.id === Number(d.category_id));
      return { ...d, category_name: cat ? cat.name : '' };
    });

  res.render('layouts/admin-layout', {
    contentView: 'dresses',
    pageTitle: 'Gelinlikler',
    currentPath: '/admin/dresses',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    dresses
  });
});

router.get('/dresses/new', (req, res) => {
  res.render('layouts/admin-layout', {
    contentView: 'dress-form',
    pageTitle: 'Yeni Gelinlik Ekle',
    currentPath: '/admin/dresses/new',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    dress: null,
    categories: db.categories,
    isEdit: false
  });
});

router.post('/dresses/new', uploadDress.array('images', 10), (req, res) => {
  const { name, category_id, price_text, description, tag, is_active, sort_order } = req.body;
  const images = req.files ? req.files.map(f => '/uploads/dresses/' + f.filename) : [];
  const image = images.length > 0 ? images[0] : '';

  db.dresses.push({
    id: db.autoIncrement.dresses++,
    name,
    category_id: Number(category_id) || null,
    price_text: price_text || '',
    description: description || '',
    tag: tag || '',
    image,
    images,
    is_active: is_active ? 1 : 0,
    sort_order: Number(sort_order) || 0
  });
  saveDb();

  req.session.flash = { type: 'success', message: 'Gelinlik başarıyla eklendi!' };
  res.redirect('/admin/dresses');
});

router.get('/dresses/edit/:id', (req, res) => {
  const dress = db.dresses.find(d => d.id === Number(req.params.id));

  if (!dress) {
    req.session.flash = { type: 'error', message: 'Gelinlik bulunamadı!' };
    return res.redirect('/admin/dresses');
  }

  res.render('layouts/admin-layout', {
    contentView: 'dress-form',
    pageTitle: 'Gelinliği Düzenle',
    currentPath: '/admin/dresses/edit/' + dress.id,
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    dress,
    categories: db.categories,
    isEdit: true
  });
});

router.post('/dresses/edit/:id', uploadDress.array('images', 10), (req, res) => {
  const dressIndex = db.dresses.findIndex(d => d.id === Number(req.params.id));
  
  if (dressIndex === -1) {
    req.session.flash = { type: 'error', message: 'Gelinlik bulunamadı!' };
    return res.redirect('/admin/dresses');
  }

  const { name, category_id, price_text, description, tag, is_active, sort_order } = req.body;
  
  let newImages = [];
  if (req.files && req.files.length > 0) {
    newImages = req.files.map(f => '/uploads/dresses/' + f.filename);
  }
  
  let finalImages = newImages.length > 0 ? newImages : (db.dresses[dressIndex].images || [db.dresses[dressIndex].image]);
  let finalImage = finalImages.length > 0 ? finalImages[0] : '';

  db.dresses[dressIndex] = {
    ...db.dresses[dressIndex],
    name,
    category_id: Number(category_id) || null,
    price_text: price_text || '',
    description: description || '',
    tag: tag || '',
    image: finalImage,
    images: finalImages,
    is_active: is_active ? 1 : 0,
    sort_order: Number(sort_order) || 0
  };
  saveDb();

  req.session.flash = { type: 'success', message: 'Gelinlik başarıyla güncellendi!' };
  res.redirect('/admin/dresses');
});

router.post('/dresses/delete/:id', (req, res) => {
  db.dresses = db.dresses.filter(d => d.id !== Number(req.params.id));
  saveDb();
  req.session.flash = { type: 'success', message: 'Gelinlik başarıyla silindi!' };
  res.redirect('/admin/dresses');
});

// ============================================
// HİZMETLER
// ============================================

router.get('/services', (req, res) => {
  const services = [...db.services].sort((a, b) => a.sort_order - b.sort_order);

  res.render('layouts/admin-layout', {
    contentView: 'services',
    pageTitle: 'Hizmetler',
    currentPath: '/admin/services',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    services
  });
});

router.get('/services/new', (req, res) => {
  res.render('layouts/admin-layout', {
    contentView: 'service-form',
    pageTitle: 'Yeni Hizmet Ekle',
    currentPath: '/admin/services/new',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    service: null,
    isEdit: false
  });
});

router.post('/services/new', (req, res) => {
  const { title, description, icon, is_featured, sort_order } = req.body;
  const features = req.body.features || [];
  const featuresJson = JSON.stringify(Array.isArray(features) ? features.filter(f => f.trim() !== '') : [features]);

  db.services.push({
    id: db.autoIncrement.services++,
    title,
    description: description || '',
    features: featuresJson,
    icon: icon || '',
    is_featured: is_featured ? 1 : 0,
    sort_order: Number(sort_order) || 0
  });
  saveDb();

  req.session.flash = { type: 'success', message: 'Hizmet başarıyla eklendi!' };
  res.redirect('/admin/services');
});

router.get('/services/edit/:id', (req, res) => {
  const service = db.services.find(s => s.id === Number(req.params.id));

  if (!service) {
    req.session.flash = { type: 'error', message: 'Hizmet bulunamadı!' };
    return res.redirect('/admin/services');
  }

  res.render('layouts/admin-layout', {
    contentView: 'service-form',
    pageTitle: 'Hizmeti Düzenle',
    currentPath: '/admin/services/edit/' + service.id,
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    service,
    isEdit: true
  });
});

router.post('/services/edit/:id', (req, res) => {
  const serviceIndex = db.services.findIndex(s => s.id === Number(req.params.id));
  if (serviceIndex === -1) {
    req.session.flash = { type: 'error', message: 'Hizmet bulunamadı!' };
    return res.redirect('/admin/services');
  }

  const { title, description, icon, is_featured, sort_order } = req.body;
  const features = req.body.features || [];
  const featuresJson = JSON.stringify(Array.isArray(features) ? features.filter(f => f.trim() !== '') : [features]);

  db.services[serviceIndex] = {
    ...db.services[serviceIndex],
    title,
    description: description || '',
    features: featuresJson,
    icon: icon || '',
    is_featured: is_featured ? 1 : 0,
    sort_order: Number(sort_order) || 0
  };
  saveDb();

  req.session.flash = { type: 'success', message: 'Hizmet başarıyla güncellendi!' };
  res.redirect('/admin/services');
});

router.post('/services/delete/:id', (req, res) => {
  db.services = db.services.filter(s => s.id !== Number(req.params.id));
  saveDb();
  req.session.flash = { type: 'success', message: 'Hizmet başarıyla silindi!' };
  res.redirect('/admin/services');
});

// ============================================
// MÜŞTERİ YORUMLARI
// ============================================

router.get('/testimonials', (req, res) => {
  const testimonials = [...db.testimonials].sort((a, b) => b.id - a.id);

  res.render('layouts/admin-layout', {
    contentView: 'testimonials',
    pageTitle: 'Müşteri Yorumları',
    currentPath: '/admin/testimonials',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    testimonials
  });
});

router.get('/testimonials/new', (req, res) => {
  res.render('layouts/admin-layout', {
    contentView: 'testimonial-form',
    pageTitle: 'Yeni Yorum Ekle',
    currentPath: '/admin/testimonials/new',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    testimonial: null,
    isEdit: false
  });
});

router.post('/testimonials/new', (req, res) => {
  const { name, initials, date_text, rating, text, is_active } = req.body;

  db.testimonials.push({
    id: db.autoIncrement.testimonials++,
    name,
    initials: initials || '',
    date_text: date_text || '',
    rating: Number(rating) || 5,
    text: text || '',
    is_active: is_active ? 1 : 0
  });
  saveDb();

  req.session.flash = { type: 'success', message: 'Yorum başarıyla eklendi!' };
  res.redirect('/admin/testimonials');
});

router.get('/testimonials/edit/:id', (req, res) => {
  const testimonial = db.testimonials.find(t => t.id === Number(req.params.id));

  if (!testimonial) {
    req.session.flash = { type: 'error', message: 'Yorum bulunamadı!' };
    return res.redirect('/admin/testimonials');
  }

  res.render('layouts/admin-layout', {
    contentView: 'testimonial-form',
    pageTitle: 'Yorumu Düzenle',
    currentPath: '/admin/testimonials/edit/' + testimonial.id,
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    testimonial,
    isEdit: true
  });
});

router.post('/testimonials/edit/:id', (req, res) => {
  const index = db.testimonials.findIndex(t => t.id === Number(req.params.id));
  if (index === -1) {
    req.session.flash = { type: 'error', message: 'Yorum bulunamadı!' };
    return res.redirect('/admin/testimonials');
  }

  const { name, initials, date_text, rating, text, is_active } = req.body;

  db.testimonials[index] = {
    ...db.testimonials[index],
    name,
    initials: initials || '',
    date_text: date_text || '',
    rating: Number(rating) || 5,
    text: text || '',
    is_active: is_active ? 1 : 0
  };
  saveDb();

  req.session.flash = { type: 'success', message: 'Yorum başarıyla güncellendi!' };
  res.redirect('/admin/testimonials');
});

router.post('/testimonials/delete/:id', (req, res) => {
  db.testimonials = db.testimonials.filter(t => t.id !== Number(req.params.id));
  saveDb();
  req.session.flash = { type: 'success', message: 'Yorum başarıyla silindi!' };
  res.redirect('/admin/testimonials');
});

// ============================================
// HAKKIMIZDA
// ============================================

router.get('/about', (req, res) => {
  res.render('layouts/admin-layout', {
    contentView: 'about',
    pageTitle: 'Hakkımızda',
    currentPath: '/admin/about',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    about: db.about,
    features: [...db.about_features].sort((a, b) => a.sort_order - b.sort_order)
  });
});

router.post('/about', uploadAbout.single('image'), (req, res) => {
  const { text1, text2 } = req.body;

  let aboutImage = db.about.image;
  if (req.file) {
    aboutImage = '/uploads/about/' + req.file.filename;
  }

  db.about = {
    ...db.about,
    text1: text1 || '',
    text2: text2 || '',
    image: aboutImage
  };

  const featureTitles = req.body.feature_titles || [];
  const featureDescriptions = req.body.feature_descs || [];

  const titlesArr = Array.isArray(featureTitles) ? featureTitles : [featureTitles];
  const descsArr = Array.isArray(featureDescriptions) ? featureDescriptions : [featureDescriptions];

  db.about_features = [];
  for (let i = 0; i < titlesArr.length; i++) {
    if (titlesArr[i] && titlesArr[i].trim()) {
      db.about_features.push({
        id: db.autoIncrement.about_features++,
        title: titlesArr[i].trim(),
        description: (descsArr[i] || '').trim(),
        icon: '',
        sort_order: i + 1
      });
    }
  }
  
  saveDb();

  req.session.flash = { type: 'success', message: 'Hakkımızda bölümü başarıyla güncellendi!' };
  res.redirect('/admin/about');
});

// ============================================
// RANDEVULAR
// ============================================

router.get('/appointments', (req, res) => {
  const appointments = [...db.appointments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.render('layouts/admin-layout', {
    contentView: 'appointments',
    pageTitle: 'Randevular',
    currentPath: '/admin/appointments',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    appointments
  });
});

router.post('/appointments/status/:id', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['bekliyor', 'onaylandi', 'iptal', 'tamamlandi'];

  if (!validStatuses.includes(status)) {
    req.session.flash = { type: 'error', message: 'Geçersiz durum!' };
    return res.redirect('/admin/appointments');
  }

  const appItem = db.appointments.find(a => a.id === Number(req.params.id));
  if (appItem) {
    const oldStatus = appItem.status;
    appItem.status = status;
    saveDb();

    // Müşteriye Mail Gönder
    if (oldStatus !== status && appItem.email) {
      let mailHtml = '';
      if (status === 'onaylandi') {
        mailHtml = `
          <div style="font-family:sans-serif; color:#333;">
              <h2 style="color:#28a745;">Randevunuz Onaylandı!</h2>
              <p>Sayın <strong>${appItem.full_name}</strong>,</p>
              <p><strong>${appItem.appointment_date}</strong> tarihindeki randevu talebiniz onaylanmıştır. Sizi mağazamızda görmekten mutluluk duyacağız.</p>
              <br>
              <p>Sevgilerle,<br><strong>Élégance Gelinlik</strong></p>
          </div>
        `;
        sendMail(appItem.email, 'Randevunuz Onaylandı - Élégance Gelinlik', mailHtml);
      } else if (status === 'iptal') {
        mailHtml = `
          <div style="font-family:sans-serif; color:#333;">
              <h2 style="color:#dc3545;">Randevunuz İptal Edildi</h2>
              <p>Sayın <strong>${appItem.full_name}</strong>,</p>
              <p><strong>${appItem.appointment_date}</strong> tarihindeki randevu talebiniz iptal edilmiştir. Yeni bir randevu almak için web sitemizi ziyaret edebilirsiniz.</p>
              <br>
              <p>Sevgilerle,<br><strong>Élégance Gelinlik</strong></p>
          </div>
        `;
        sendMail(appItem.email, 'Randevunuz Hakkında - Élégance Gelinlik', mailHtml);
      }
    }
  }

  req.session.flash = { type: 'success', message: 'Randevu durumu güncellendi!' };
  res.redirect('/admin/appointments');
});

router.post('/appointments/delete/:id', (req, res) => {
  db.appointments = db.appointments.filter(a => a.id !== Number(req.params.id));
  saveDb();
  req.session.flash = { type: 'success', message: 'Randevu başarıyla silindi!' };
  res.redirect('/admin/appointments');
});

// ============================================
// HESAP (Şifre Değiştirme)
// ============================================

router.get('/account', (req, res) => {
  res.render('layouts/admin-layout', {
    contentView: 'account',
    pageTitle: 'Hesap Ayarları',
    currentPath: '/admin/account',
    settings: getSettingsObj(),
    flash: getFlash(req),
    pendingTestimonials: db.testimonials.filter(t => t.is_active == 0).length,
    pendingAppointments: db.appointments.filter(a => a.status === 'bekliyor').length,
    adminUsername: req.session.adminUsername
  });
});

router.post('/account', (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  const userIndex = db.admin_users.findIndex(u => u.id === req.session.adminId);
  if (userIndex === -1) {
    req.session.flash = { type: 'error', message: 'Kullanıcı bulunamadı!' };
    return res.redirect('/admin/account');
  }

  const user = db.admin_users[userIndex];

  if (!bcrypt.compareSync(current_password, user.password_hash)) {
    req.session.flash = { type: 'error', message: 'Mevcut şifre hatalı!' };
    return res.redirect('/admin/account');
  }

  if (!new_password || new_password.length < 6) {
    req.session.flash = { type: 'error', message: 'Yeni şifre en az 6 karakter olmalıdır!' };
    return res.redirect('/admin/account');
  }

  if (new_password !== confirm_password) {
    req.session.flash = { type: 'error', message: 'Yeni şifreler eşleşmiyor!' };
    return res.redirect('/admin/account');
  }

  db.admin_users[userIndex].password_hash = bcrypt.hashSync(new_password, 10);
  saveDb();

  req.session.flash = { type: 'success', message: 'Şifreniz başarıyla değiştirildi!' };
  res.redirect('/admin/account');
});

module.exports = router;
