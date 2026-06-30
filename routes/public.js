const express = require('express');
const router = express.Router();
const { db } = require('../database');

/**
 * GET / - Ana sayfa
 * Tüm verileri JSON veritabanından çekip site/index görünümüne gönder
 */
router.get('/', (req, res) => {
  try {
    // Ayarlar
    const settings = {};
    for (const item of db.settings) {
      settings[item.key] = item.value;
    }

    // Hero
    const hero = db.hero || {};

    // Kategoriler
    const categories = [...db.categories].sort((a, b) => a.id - b.id);

    // Gelinlikler (kategori adlarıyla birlikte)
    const dresses = db.dresses
      .filter(d => d.is_active === 1)
      .sort((a, b) => a.sort_order - b.sort_order || b.id - a.id)
      .map(d => {
        const cat = categories.find(c => c.id === Number(d.category_id));
        return { ...d, category_name: cat ? cat.name : '', category_slug: cat ? cat.slug : '' };
      });

    // Hizmetler
    const services = [...db.services].sort((a, b) => a.sort_order - b.sort_order);
    for (const service of services) {
      try {
        service.featureList = JSON.parse(service.features || '[]');
      } catch (e) {
        service.featureList = [];
      }
    }

    // Müşteri yorumları
    const testimonials = db.testimonials
      .filter(t => t.is_active === 1)
      .sort((a, b) => b.id - a.id);

    // Hakkımızda
    const about = db.about || {};

    // Hakkımızda özellikleri
    const aboutFeatures = [...db.about_features].sort((a, b) => a.sort_order - b.sort_order);

    res.render('site/index', {
      settings,
      hero,
      categories,
      dresses,
      services,
      testimonials,
      about,
      aboutFeatures
    });
  } catch (error) {
    console.error('Ana sayfa yükleme hatası:', error);
    res.status(500).send('Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.');
  }
});

/**
 * GET /gelinlik/:id - Gelinlik Detay sayfası
 */
router.get('/gelinlik/:id', (req, res) => {
  try {
    const settings = {};
    for (const item of db.settings) {
      settings[item.key] = item.value;
    }

    const dressId = parseInt(req.params.id);
    const dress = db.dresses.find(d => d.id === dressId);

    if (!dress) {
      return res.status(404).send('Gelinlik bulunamadı');
    }

    const category = db.categories.find(c => c.id === Number(dress.category_id));
    dress.category_name = category ? category.name : '';

    const relatedDresses = db.dresses
      .filter(d => d.id !== dressId && d.is_active === 1)
      .slice(0, 4)
      .map(d => {
        const cat = db.categories.find(c => c.id === Number(d.category_id));
        return { ...d, category_name: cat ? cat.name : '' };
      });

    res.render('site/dress-detail', {
      settings,
      dress,
      relatedDresses
    });

  } catch (error) {
    console.error('Detay sayfası yükleme hatası:', error);
    res.status(500).send('Bir hata oluştu.');
  }
});

module.exports = router;
