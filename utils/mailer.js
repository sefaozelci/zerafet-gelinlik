const nodemailer = require('nodemailer');
const { db } = require('../database');

function getSetting(key) {
  const item = db.settings.find(s => s.key === key);
  return item ? item.value : '';
}

async function sendMail(to, subject, html) {
  const host = getSetting('smtp_host');
  const port = getSetting('smtp_port');
  const user = getSetting('smtp_user');
  const pass = getSetting('smtp_pass');
  const secure = getSetting('smtp_secure') === 'true';

  // Eğer ayarlar eksikse hata fırlatmadan konsola yaz, sitenin çalışmasını durdurma
  if (!host || !user || !pass) {
    console.log('SMTP ayarları eksik. Mail gönderilmedi. Konu:', subject);
    return false;
  }

  try {
    let transporter = nodemailer.createTransport({
      host: host,
      port: Number(port) || (secure ? 465 : 587),
      secure: secure, 
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    let info = await transporter.sendMail({
      from: `"${getSetting('site_name')}" <${user}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log("Mail başarıyla gönderildi: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Mail gönderme hatası:", error);
    return false;
  }
}

module.exports = { sendMail };
