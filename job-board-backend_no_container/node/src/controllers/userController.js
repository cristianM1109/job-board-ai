const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Modelul User
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

// Înregistrare
	
const registerUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Verifică dacă utilizatorul există deja
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Criptare parolă
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creare utilizator
    const user = await User.create({ username, password: hashedPassword });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Autentificare

const authenicateUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(409).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(409).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verificare utilizator autentificat
	
const checkUserAuth = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      // Token invalid
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      // Token expirat
      return res.status(401).json({ message: 'Token expired' });
    } else {
      // Alte erori
      console.error('Error in checkUserAuth:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = { registerUser, authenicateUser, checkUserAuth};
