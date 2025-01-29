const Favorite = require('../models/Favorite');
const Job = require('../models/Job'); 


// Adaugă un job la favorite
const addFavoriteJob = async (req, res) => {
    const { job } = req.body; // Job-ul trimis de frontend
    const userId = req.user.id; // ID-ul utilizatorului autentificat
  
    try {
      // Verifică dacă job-ul există deja în baza de date
      let existingJob = await Job.findOne({ where: { id: job.id } });
  
      if (!existingJob) {
        // Adaugă job-ul în tabelul Jobs
        existingJob = await Job.create({
          id: job.id, // ID-ul din API extern
          title: job.role,
          description: job.text,
          company: job.company_name,
          location: job.location || 'Remote',
          salary: job.salary || null,
          employmentType: job.employment_type,
          remote: job.remote,
          logo: job.logo,
          url: job.url,
          datePosted: job.date_posted,
          keywords: job.keywords || [],
          source: job.source,
        });
      }
  
      // Verifică dacă job-ul este deja favorit pentru utilizator
      const existingFavorite = await Favorite.findOne({
        where: { jobId: job.id, userId },
      });
  
      if (existingFavorite) {
        return res.status(204).json({ message: 'Job already in favorites' });
      }
  
      // Adaugă job-ul în tabelul Favorites
      await Favorite.create({
        userId,
        jobId: existingJob.id,
      });
  
      res.status(201).json({ message: 'Job added to favorites' });
    } catch (error) {
      console.error('Error adding favorite job:', error.message);
      res.status(500).json({ error: 'Failed to add job to favorites' });
    }
  };
  
  // Obține toate joburile favorite ale utilizatorului
  const getFavoriteJobs = async (req, res) => {
    const userId = req.user.id; // ID-ul utilizatorului logat
  
    try {
      const favorites = await Favorite.findAll({
        where: { userId },
        include: {
          model: Job, // Include detaliile despre job
          as: 'job', // Aliniat cu relația definită în modelul Favorite
        },
      });
  
      // Extrage doar joburile favorite
      const favoriteJobs = favorites.map((favorite) => favorite.job);
  
      res.status(200).json(favoriteJobs);
    } catch (error) {
      console.error('Error fetching favorite jobs:', error.message);
      res.status(500).json({ error: 'Failed to fetch favorite jobs' });
    }
  };
  
  // Șterge un job din favorite
  const deleteFavoriteJob = async (req, res) => {
    const userId = req.user.id;
    const { jobId } = req.params;
  
    try {
      const favorite = await Favorite.findOne({ where: { userId, jobId } });
      if (!favorite) {
        return res.status(404).json({ message: 'Job not found in favorites' });
      }
  
      await favorite.destroy();
      res.status(200).json({ message: 'Job removed from favorites' });
    } catch (error) {
      console.error('Error deleting favorite job:', error.message);
      res.status(500).json({ error: 'Failed to delete job from favorites' });
    }
  };
  
  module.exports = { addFavoriteJob, getFavoriteJobs, deleteFavoriteJob };
