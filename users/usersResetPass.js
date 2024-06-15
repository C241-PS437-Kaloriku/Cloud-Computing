const nodemailer = require('nodemailer'); 
require('dotenv').config();

// Fungsi untuk generate token campuran huruf dan angka sebanyak 6 karakter
const generateRandomToken = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

// Konfigurasi untuk nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: process.env.PORT_TRASPORTER,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,  
    pass: process.env.EMAIL_PASS 
  }
});

// Fungsi untuk mengirim email dengan token reset password
const sendResetPasswordEmail = async (email, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,  // Email pengirim
    to: email,
    subject: 'Reset Password',
    text: `Token untuk reset password Anda adalah: ${token}`
  };

  await transporter.sendMail(mailOptions);
};

// Fungsi untuk mengirim email dengan token registrasi akun
const sendRegisUsersEmail = async (email, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,  
    to: email,
    subject: 'Registrasi Akun',
    text: `Token verifikasi untuk akun anda adalah: ${token}`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  generateRandomToken,
  sendResetPasswordEmail,
  sendRegisUsersEmail
};
