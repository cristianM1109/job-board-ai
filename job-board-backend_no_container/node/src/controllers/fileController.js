const fs = require('fs');
const CV = require('../models/CV');

const uploadCV = async (req, res) => {
  try {
    const userId = req.user.id; // ID-ul utilizatorului autentificat
    const file = req.file; // Fișierul încărcat
    

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Salvăm detaliile fișierului în baza de date
    const newCV = await CV.create({
      fileName: file.originalname, // Numele original al fișierului
      filePath: file.path, // Calea completă a fișierului pe server
      userId,
    });

    res.status(201).json({ message: 'CV uploaded successfully', newCV });
  } catch (error) {
    console.error('Error uploading CV:', error.message);
    res.status(500).json({ error: 'Failed to upload CV' });
  }
};


// Listează toate CV-urile utilizatorului
const getUserCVs = async (req, res) => {
  try {
    const userId = req.user.id;
    const cvs = await CV.findAll({ where: { userId } });
    res.status(200).json(cvs);
  } catch (error) {
    console.error('Error fetching CVs:', error.message);
    res.status(500).json({ error: 'Failed to fetch CVs' });
  }
};

// Șterge un CV
const deleteCV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cvId } = req.params;

    const cv = await CV.findOne({ where: { id: cvId, userId } });
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    // Ștergem fișierul din sistem
    fs.unlinkSync(cv.filePath);

    await cv.destroy();
    res.status(200).json({ message: 'CV deleted successfully' });
  } catch (error) {
    console.error('Error deleting CV:', error.message);
    res.status(500).json({ error: 'Failed to delete CV' });
  }
};

module.exports = { uploadCV, getUserCVs, deleteCV }; 