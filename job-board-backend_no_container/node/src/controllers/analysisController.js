const express = require('express');
const axios = require('axios');
const path = require('path');
const CV = require('../models/CV');
const Favorite = require('../models/Favorite');
const Job = require('../models/Job');
const redisClient = require('../../redis.js'); // Import conexiunea Redis

const router = express.Router();

const calculateCompatibilityScores = async (req, res) => {
  const userId = req.user.id; 
  const cacheKey = `compatibility_scores_user_${userId}`; 

  try {
    
    const cachedScores = await redisClient.get(cacheKey);
    if (cachedScores) {
      console.log('Scorurile de compatibilitate au fost preluate din cache.');
      return res.status(200).json({ scores: JSON.parse(cachedScores) });
    }

    const userCVs = await CV.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    if (!userCVs || userCVs.length === 0) {
      return res.status(400).json({ error: 'Nu există niciun CV asociat acestui utilizator.' });
    }

    // Utilizăm cel mai recent CV
    const latestCV = userCVs[0];
    const fileName = path.basename(latestCV.filePath);
    const adjustedCvPath = path.join('uploads', fileName);
    
    // 3. Obține joburile favorite
    const favorites = await Favorite.findAll({
      where: { userId },
      include: {
        model: Job,
        as: 'job',
      },
    });

    if (!favorites || favorites.length === 0) {
      return res.status(400).json({ error: 'Nu există joburi favorite asociate utilizatorului.' });
    }

    // Extrage detaliile joburilor
    const jobs = favorites.map((favorite) => ({
      id: favorite.job.id,
      title: favorite.job.title,
      description: favorite.job.description || `Job at ${favorite.job.company}, requiring skills like ${favorite.job.keywords.join(', ')}.`,
      keywords: favorite.job.keywords || [],
    }));

    // 4. Trimite datele către Flask
    const flaskEndpoint = 'http://127.0.0.1:8000/process-cv';
    const payload = {
      cv_file_path: adjustedCvPath,
      jobs: jobs,
    };

    const flaskResponse = await axios.post(flaskEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    // 5. Salvează scorurile în cache cu un timp de expirare
    const scores = flaskResponse.data.compatibility_scores;
    await redisClient.set(cacheKey, JSON.stringify(scores), { EX: 3600 }); // Expirare 1 oră

    // 6. Returnează scorurile către frontend
    res.status(200).json({ scores });
  } catch (error) {
    console.error('Eroare la calcularea scorurilor:', error.message);
    if (error.response) {
      console.error('Răspuns de eroare de la Flask:', error.response.data);
    }
    res.status(500).json({ error: 'A apărut o problemă la calcularea scorurilor de compatibilitate.' });
  }
};
  

  // Functie pentru calcularea scorurilor de compatibilitate pe cuvinte cheie
const calculateKeywordCompatibilityScores = async (req, res) => {
  const userId = req.user.id; // ID-ul utilizatorului logat
  const cacheKey = `keyword_compatibility_scores_user_${userId}`; // Cheie unică pentru cache

  try {
    // 1. Verifică dacă scorurile sunt deja în cache
    const cachedScores = await redisClient.get(cacheKey);
    if (cachedScores) {
      console.log('Scorurile de compatibilitate cu cuvinte cheie au fost preluate din cache.');
      return res.status(200).json({ scores: JSON.parse(cachedScores) });
    }

    // 2. Verifică dacă utilizatorul are un CV încărcat
    const userCVs = await CV.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    if (!userCVs || userCVs.length === 0) {
      return res.status(400).json({ error: 'Nu există niciun CV asociat acestui utilizator.' });
    }

    // Utilizăm cel mai recent CV
    const latestCV = userCVs[0];
    const fileName = path.basename(latestCV.filePath);
    const adjustedCvPath = path.join('uploads', fileName);

    // 3. Obține joburile favorite
    const favorites = await Favorite.findAll({
      where: { userId },
      include: {
        model: Job,
        as: 'job',
      },
    });

    if (!favorites || favorites.length === 0) {
      return res.status(400).json({ error: 'Nu există joburi favorite asociate utilizatorului.' });
    }

    // Extrage detaliile joburilor
    const jobs = favorites.map((favorite) => ({
      id: favorite.job.id,
      title: favorite.job.title,
      description: favorite.job.description || `Job at ${favorite.job.company}, requiring skills like ${favorite.job.keywords.join(', ')}.`,
      keywords: favorite.job.keywords || [],
    }));

    // 4. Trimite datele către Flask
    const flaskEndpoint = 'http://127.0.0.1:8000/keyword-compatibility';
    const payload = {
      cv_file_path: adjustedCvPath,
      jobs: jobs,
    };

    const flaskResponse = await axios.post(flaskEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    // 5. Salvează scorurile în cache cu un timp de expirare
    const scores = flaskResponse.data.compatibility_scores;
    await redisClient.set(cacheKey, JSON.stringify(scores), { EX: 3600 }); // Expirare 1 oră

    // 6. Returnează scorurile către frontend
    res.status(200).json({ scores });
  } catch (error) {
    console.error('Eroare la calcularea scorurilor cu cuvinte cheie:', error.message);
    if (error.response) {
      console.error('Răspuns de eroare de la Flask:', error.response.data);
    }
    res.status(500).json({ error: 'A apărut o problemă la calcularea scorurilor cu cuvinte cheie.' });
  }
};
  

module.exports = { calculateCompatibilityScores, calculateKeywordCompatibilityScores };



