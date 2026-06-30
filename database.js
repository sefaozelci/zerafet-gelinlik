const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'database.json');

const defaultData = {
  settings: [
    { key: 'site_name', value: 'Zarafet Gelinlik' },
    { key: 'phone', value: '+90 (212) 555 01 23' },
    { key: 'phone2', value: '+90 (533) 555 01 23' },
    { key: 'email', value: 'info@elegance-gelinlik.com' },
    { key: 'email2', value: 'randevu@elegance-gelinlik.com' },
    { key: 'address', value: 'Nişantaşı, Abdi İpekçi Cad. No: 42, Şişli / İstanbul' },
    { key: 'hours', value: 'Pazartesi - Cumartesi: 10:00 - 19:00' },
    { key: 'instagram', value: '@elegance_gelinlik' },
    { key: 'facebook', value: '' },
    { key: 'whatsapp', value: '905335550123' },
    { key: 'seo_title', value: 'Élégance Gelinlik | Premium Gelinlik Butik' },
    { key: 'seo_description', value: 'Hayalinizdeki gelinliği bulun. Özel tasarım, prenses, A-Line, balık ve modern gelinlik modelleri. Nişantaşı\'nın en prestijli gelinlik butiği.' },
    { key: 'primary_color', value: '#c9a96e' },
    { key: 'text_color', value: '#1a1513' },
    { key: 'bg_color', value: '#faf8f5' },
    { key: 'smtp_host', value: '' },
    { key: 'smtp_port', value: '465' },
    { key: 'smtp_user', value: '' },
    { key: 'smtp_pass', value: '' },
    { key: 'smtp_secure', value: 'true' },
    { key: 'announcement_active', value: '0' },
    { key: 'announcement_text', value: 'Yaz Sezonuna Özel %20 İndirim Fırsatını Kaçırmayın!' },
    { key: 'announcement_link', value: '#randevu' },
    { key: 'section_collections_tag', value: '— Koleksiyonlar —' },
    { key: 'section_collections_title', value: 'Hayalinizdeki Gelinlik' },
    { key: 'section_collections_desc', value: 'Her anınızı özel kılacak, size özel tasarlanmış gelinlik koleksiyonlarımızı keşfedin.' },
    { key: 'section_about_tag', value: '— Hakkımızda —' },
    { key: 'section_about_title', value: 'Zarafet ve Şıklığın<br>Buluşma Noktası' },
    { key: 'section_services_tag', value: '— Hizmetlerimiz —' },
    { key: 'section_services_title', value: 'Sizin İçin Sunduklarımız' },
    { key: 'section_services_desc', value: 'Düğün gününüzü mükemmel kılmak için sunduğumuz özel hizmetlerimiz.' },
    { key: 'section_testimonials_tag', value: '— Müşteri Yorumları —' },
    { key: 'section_testimonials_title', value: 'Mutlu Gelinlerimiz' },
    { key: 'section_testimonials_desc', value: 'Sizden önce bu yolculuğu yaşayan gelinlerimizin deneyimleri.' },
    { key: 'section_appointment_tag', value: '— Randevu —' },
    { key: 'section_appointment_title', value: 'Hayalinizdeki Gelinliği<br>Birlikte Bulalım' },
    { key: 'section_appointment_desc', value: 'Size özel randevu ile gelinlik deneyiminizi unutulmaz kılın. Uzman ekibimiz hayalinizdeki gelinliği bulmanız için yanınızda.' },
    { key: 'section_contact_tag', value: '— İletişim —' },
    { key: 'section_contact_title', value: 'Bize Ulaşın' },
    { key: 'section_contact_desc', value: 'Sorularınız için bize ulaşmaktan çekinmeyin.' },
    { key: 'section_instagram_tag', value: '— Instagram —' },
    { key: 'section_instagram_title', value: 'Bizi Takip Edin' },
    { key: 'section_instagram_desc', value: 'En güncel koleksiyonlarımız ve ilham veren paylaşımlarımız için Instagram\'da bizi takip edin.' },
    { key: 'footer_desc', value: 'Hayalinizdeki gelinliği bulmanız için buradayız. Zarif tasarımlar, kaliteli kumaşlar ve kusursuz bir deneyim sizi bekliyor.' }
  ],
  hero: {
    id: 1, title: 'Hayalinizdeki<br>Gelinliği<br>Bulun', subtitle: 'Özel tasarım gelinlikler ile en özel gününüzde kendinizi bir prenses gibi hissedin.',
    badge_text: 'Premium Gelinlik Butik', stat1_number: '2500', stat1_label: 'Mutlu Gelin',
    stat2_number: '15', stat2_label: 'Yıllık Tecrübe', stat3_number: '500', stat3_label: 'Özel Tasarım',
    bg_image: '/uploads/hero/hero.jpg'
  },
  categories: [
    { id: 1, name: 'Prenses', slug: 'princess' },
    { id: 2, name: 'A-Line', slug: 'aline' },
    { id: 3, name: 'Balık', slug: 'mermaid' },
    { id: 4, name: 'Modern', slug: 'modern' },
    { id: 5, name: 'Vintage', slug: 'vintage' }
  ],
  dresses: [
    { id: 1, name: 'Prenses Isabella', category_id: 1, price_text: '₺45.000', description: 'Kabarık tül etek ve işlemeli korsajıyla masalsı bir görünüm sunan prenses model gelinlik.', tag: 'En Çok Satan', image: '/uploads/dresses/dress1.jpg', images: ['/uploads/dresses/dress1.jpg'], is_active: 1, sort_order: 1 },
    { id: 2, name: 'A-Line Sophia', category_id: 2, price_text: '₺38.000', description: 'Zarif A-Line kesimi ile hem şık hem rahat bir görünüm.', tag: 'Yeni Sezon', image: '/uploads/dresses/dress2.jpg', images: ['/uploads/dresses/dress2.jpg'], is_active: 1, sort_order: 2 },
    { id: 3, name: 'Balık Victoria', category_id: 3, price_text: '₺52.000', description: 'Vücut hatlarını zarif bir şekilde saran balık kesim gelinlik.', tag: 'Premium', image: '/uploads/dresses/dress3.jpg', images: ['/uploads/dresses/dress3.jpg'], is_active: 1, sort_order: 3 },
    { id: 4, name: 'Modern Aria', category_id: 4, price_text: '₺42.000', description: 'Minimalist çizgileri ve modern tasarımıyla dikkat çeken bu gelinlik contemporary düğünler için.', tag: 'Trend', image: '/uploads/dresses/dress4.jpg', images: ['/uploads/dresses/dress4.jpg'], is_active: 1, sort_order: 4 },
    { id: 5, name: 'Vintage Rose', category_id: 5, price_text: '₺48.000', description: 'Nostaljik dokunuşları ve vintage ilhamıyla tasarlanan bu gelinlik, romantik ruhlu gelinler için.', tag: 'Özel Koleksiyon', image: '/uploads/dresses/dress5.jpg', images: ['/uploads/dresses/dress5.jpg'], is_active: 1, sort_order: 5 }
  ],
  services: [
    { id: 1, title: 'Gelinlik Seçimi', description: 'Uzman danışmanlarımız eşliğinde en uygun gelinliği bulun.', features: JSON.stringify(['Birebir danışmanlık', 'Özel deneme odası', 'Uzman stil önerileri']), icon: 'heart', is_featured: 1, sort_order: 1 },
    { id: 2, title: 'Özel Tasarım', description: 'Hayalinizdeki gelinliği birlikte tasarlayalım.', features: JSON.stringify(['Kişiye özel tasarım', 'Kumaş ve model seçimi']), icon: 'tool', is_featured: 0, sort_order: 2 },
    { id: 3, title: 'Tadilat & Uyum', description: 'Gelinliğinizin vücudunuza mükemmel oturması için profesyonel tadilat hizmeti.', features: JSON.stringify(['Profesyonel terzi', 'Mükemmel kalıp']), icon: 'smile', is_featured: 0, sort_order: 3 },
    { id: 4, title: 'Aksesuar & Styling', description: 'Gelinliğinizi tamamlayacak duvak, taç, takı ve ayakkabı.', features: JSON.stringify(['Duvak & taç', 'Komple styling']), icon: 'star', is_featured: 0, sort_order: 4 }
  ],
  testimonials: [
    { id: 1, name: 'Elif Yılmaz', initials: 'EY', date_text: 'Mart 2024', rating: 5, text: 'Hayalimdeki gelinliği burada buldum! Ekip o kadar ilgili ki.', is_active: 1 },
    { id: 2, name: 'Ayşe Kara', initials: 'AK', date_text: 'Ocak 2024', rating: 5, text: 'Özel tasarım gelinliğim için Élégance\'ı tercih ettim.', is_active: 1 },
    { id: 3, name: 'Zeynep Demir', initials: 'ZD', date_text: 'Kasım 2023', rating: 5, text: 'Harika bir deneyimdi!', is_active: 1 }
  ],
  appointments: [],
  about: {
    id: 1, text1: '15 yılı aşkın deneyimimizle, her gelinin hayalindeki gelinliğe kavuşmasını sağlıyoruz.', text2: 'Her gelinliğimiz, en kaliteli kumaşlar ve el işçiliğiyle özenle hazırlanmaktadır.', image: '/uploads/about/about.jpg'
  },
  about_features: [
    { id: 1, title: 'Premium Kalite', description: 'En kaliteli kumaşlar', icon: 'gem', sort_order: 1 },
    { id: 2, title: 'Uzman Ekip', description: 'Deneyimli tasarımcılar', icon: 'users', sort_order: 2 },
    { id: 3, title: 'Kişiye Özel', description: 'Benzersiz deneyim', icon: 'heart', sort_order: 3 }
  ],
  admin_users: [
    { id: 1, username: 'admin', password_hash: bcrypt.hashSync('admin123', 10) }
  ],
  autoIncrement: { dresses: 6, services: 5, testimonials: 4, appointments: 1, about_features: 4 }
};

let db = null;

function initDb() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbPath)) {
    try {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      // Basic migration checks
      if (!db.autoIncrement) db.autoIncrement = defaultData.autoIncrement;
      // Add missing settings if they don't exist
      const keysToMigrate = ['primary_color', 'text_color', 'bg_color', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'announcement_active', 'announcement_text', 'announcement_link', 'section_collections_tag', 'section_collections_title', 'section_collections_desc', 'section_about_tag', 'section_about_title', 'section_services_tag', 'section_services_title', 'section_services_desc', 'section_testimonials_tag', 'section_testimonials_title', 'section_testimonials_desc', 'section_appointment_tag', 'section_appointment_title', 'section_appointment_desc', 'section_contact_tag', 'section_contact_title', 'section_contact_desc', 'section_instagram_tag', 'section_instagram_title', 'section_instagram_desc', 'footer_desc'];
      
      keysToMigrate.forEach(k => {
          let def = defaultData.settings.find(s => s.key === k);
          if (def && !db.settings.find(s => s.key === k)) db.settings.push(def);
      });
      // Migrate dresses to have images array
      db.dresses.forEach(d => {
        if (!d.images) d.images = [d.image];
      });
      saveDb();
    } catch (e) {
      console.error("Veritabanı okunamadı, sıfırlanıyor...", e);
      db = defaultData;
      saveDb();
    }
  } else {
    db = defaultData;
    saveDb();
  }
  console.log('JSON Veritabanı başarıyla yüklendi.');
}

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

module.exports = {
  get db() { return db; },
  saveDb,
  initDb
};
