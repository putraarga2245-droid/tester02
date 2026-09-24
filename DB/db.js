const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    // Menggunakan MONGODB_URI sesuai dengan yang ada di file .env
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Berhasil Terhubung!");
  } catch (error) {
    console.error("Koneksi MongoDB Gagal:", error);
    throw error;
  }
};

module.exports = connectDB;
