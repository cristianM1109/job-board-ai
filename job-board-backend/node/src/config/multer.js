const multer = require('multer');
const path = require('path');

// Configurare pentru a salva fișierele încărcate
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Folderul unde se vor salva fișierele
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname); // Extrage extensia fișierului
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`); // Creează un nume unic pentru fișier
  },
});

// Filtru pentru fișierele acceptate
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limita de 5MB
});


module.exports = upload ;