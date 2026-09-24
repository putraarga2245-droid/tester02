const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('../DB.js/db'); // Menyesuaikan ke folder DB.js dan file db.js[cite: 1, 2]

const app = express();
app.use(express.json());

// 1. Skema untuk User / Akun Email
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 2. Skema untuk Data (Tahu milik email siapa, dan fitur hapus aman)
const itemSchema = new mongoose.Schema({
  emailPemilik: { type: String, required: true }, // Menandai data ini punya email siapa
  isiData: { type: String, required: true },
  status: { type: String, default: 'active' } // Kalau 'deleted', data disembunyikan tapi tetap aman di database
});
const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);


// --- FITUR 1: BUAT AKUN EMAIL (REGISTER) ---
app.post('/api/register', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    
    const cekUser = await User.findOne({ email });
    if (cekUser) {
      return res.status(400).json({ status: "Gagal", pesan: "Email sudah terdaftar!" });
    }

    const newUser = new User({ email, password });
    await newUser.save();
    
    res.json({ status: "OK", pesan: "Email berhasil dibuat!", email });
  } catch (error) {
    res.status(500).json({ status: "Error", pesan: error.message });
  }
});


// --- FITUR 2: LOGIN ---
app.post('/api/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });
    if (user) {
      res.json({ status: "OK", pesan: "Login Berhasil!", email: user.email });
    } else {
      res.status(401).json({ status: "Gagal", pesan: "Email atau Password salah!" });
    }
  } catch (error) {
    res.status(500).json({ status: "Error", pesan: error.message });
  }
});


// --- FITUR 3: SIMPAN DATA (Tercatat milik email siapa) ---
app.post('/api/data', async (req, res) => {
  try {
    await connectDB();
    const { emailPemilik, isiData } = req.body;

    const newItem = new Item({ 
      emailPemilik, 
      isiData, 
      status: 'active' 
    });
    
    await newItem.save();
    res.json({ status: "OK", pesan: "Data berhasil disimpan ke database!", data: newItem });
  } catch (error) {
    res.status(500).json({ status: "Error", pesan: error.message });
  }
});


// --- FITUR 4: AMBIL DATA (Berdasarkan email yang login) ---
app.get('/api/data/:email', async (req, res) => {
  try {
    await connectDB();
    const email = req.params.email;

    // Hanya ambil data milik email tersebut dan statusnya bukan 'deleted'
    const dataUser = await Item.find({ 
      emailPemilik: email, 
      status: { $ne: 'deleted' } 
    });
    
    res.json(dataUser);
  } catch (error) {
    res.status(500).json({ status: "Error", pesan: error.message });
  }
});


// --- FITUR 5: HAPUS DATA TAPI TIDAK HILANG (Soft Delete) ---
app.delete('/api/data/:id', async (req, res) => {
  try {
    await connectDB();
    const id = req.params.id;

    // Data tidak dihapus permanen, tapi statusnya diganti jadi 'deleted'
    // Jadi datanya tetap utuh dan aman tersimpan di MongoDB
    const item = await Item.findByIdAndUpdate(
      id, 
      { status: 'deleted' }, 
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ status: "Gagal", pesan: "Data tidak ditemukan" });
    }

    res.json({ 
      status: "OK", 
      pesan: "Data dihapus dari layar, tapi tetap aman tersimpan di database MongoDB!", 
      dataArsip: item 
    });
  } catch (error) {
    res.status(500).json({ status: "Error", pesan: error.message });
  }
});

module.exports = app;
