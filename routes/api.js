const express = require('express');
const router = express.Router();
const { db, saveDb } = require('../database');
const { sendMail } = require('../utils/mailer');

/**
 * POST /api/appointments
 * Yeni randevu talebi oluştur
 */
router.post('/appointments', (req, res) => {
  try {
    const { full_name, email, phone, wedding_date, appointment_date, service, message } = req.body;

    // Zorunlu alan kontrolü
    if (!full_name || !phone || !service) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen zorunlu alanları doldurunuz (Ad Soyad, Telefon, Hizmet).'
      });
    }

    const newAppointment = {
      id: db.autoIncrement.appointments++,
      full_name,
      email: email || '',
      phone,
      wedding_date: wedding_date || '',
      appointment_date: appointment_date || '',
      service,
      message: message || '',
      status: 'bekliyor',
      created_at: new Date().toISOString()
    };

    db.appointments.push(newAppointment);
    saveDb();

    // Yöneticiye Mail Gönder
    const adminEmail = db.settings.find(s => s.key === 'email')?.value;
    if (adminEmail) {
      const mailHtml = `
        <div style="font-family:sans-serif; color:#333;">
            <h2 style="color:#c9a96e;">Yeni Randevu Talebi</h2>
            <p>Web sitenizden yeni bir randevu talebi ulaştı:</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Müşteri:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${full_name}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Telefon:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${phone}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>E-posta:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${email || '-'}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Randevu Tarihi:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${appointment_date}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Düğün Tarihi:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${wedding_date || '-'}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Hizmet:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${service}</td></tr>
                <tr><td style="padding:8px; border-bottom:1px solid #eee;"><strong>Mesaj:</strong></td><td style="padding:8px; border-bottom:1px solid #eee;">${message || '-'}</td></tr>
            </table>
            <br>
            <a href="http://localhost:3000/admin/appointments" style="background:#c9a96e; color:#fff; padding:10px 15px; text-decoration:none; border-radius:4px;">Panele Git</a>
        </div>
      `;
      sendMail(adminEmail, 'Yeni Randevu Talebi - ' + full_name, mailHtml);
    }

    res.json({
      success: true,
      message: 'Randevu talebiniz başarıyla alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.',
      appointmentId: newAppointment.id
    });
  } catch (error) {
    console.error('Randevu oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu. Lütfen tekrar deneyiniz.'
    });
  }
});

/**
 * POST /api/testimonials
 * Yeni müşteri yorumu oluştur (Onay bekleyen)
 */
router.post('/testimonials', (req, res) => {
  try {
    const { name, text, rating } = req.body;
    if (!name || !text) {
      return res.status(400).json({ success: false, message: 'İsim ve yorum alanları zorunludur.' });
    }

    let initials = name.substring(0, 2).toUpperCase();
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
        initials = (nameParts[0][0] + nameParts[nameParts.length-1][0]).toUpperCase();
    }

    db.testimonials.push({
      id: db.autoIncrement.testimonials++,
      name,
      initials,
      date_text: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
      rating: Number(rating) || 5,
      text,
      is_active: 0 // Admin onayı bekliyor
    });
    saveDb();

    res.json({ success: true, message: 'Yorumunuz başarıyla gönderildi.' });
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    res.status(500).json({ success: false, message: 'Bir hata oluştu.' });
  }
});

module.exports = router;
