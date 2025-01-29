const express = require('express');
const jobRoutes = require('./src/routes/jobRoutes');
const useRoutes = require('./src/routes/authRouts');
const favoriteRoutes = require('./src/routes/favoriteRouts');
const AnalysisRoutes = require('./src/routes/analysisRoutes');
const userFunctionsRoutes = require('./src/routes/userRoutes');

const app = express();
const cors = require('cors');

app.use(cors()); // Permite cereri CORS
app.use(express.json());


app.use('/users/upload', userFunctionsRoutes);
app.use('/api', favoriteRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/users', useRoutes);
app.use('/analysis', AnalysisRoutes);

module.exports = app;