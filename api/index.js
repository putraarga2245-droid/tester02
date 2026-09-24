const express = require('express');
const mongoose = require('mongoose');
// Sesuaikan dengan nama folder di GitHub kamu yaitu "DB" (huruf besar)
const connectDB = require('../DB/db'); 

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
  emailPemilik: { type: String, required: true },
  isiData: { type: String, required: true },
  status: { type: String, default: 'active' }
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


// --- FITUR 3: SIMPAN DATA ---
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


// --- FITUR 4: AMBIL DATA ---
app.get('/api/data/:email', async (req, res) => {
  try {
    await connectDB();
    const email = req.params.email;

    const dataUser = await Item.find({ 
      emailPemilik: email, 
      status: { $ne: 'deleted' } 
    });
    
    res.json(dataUser);
  } catch (error) {
    res.status(500).json({ status: "Error", pesan: error.message });
  }
});


// --- FITUR 5: HAPUS DATA AMAN (Soft Delete) ---
app.delete('/api/data/:id', async (req, res) => {
  try {
    await connectDB();
    const id = req.params.id;

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
