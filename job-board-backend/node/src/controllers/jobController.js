const Job = require('../models/Job');
const axios = require('axios');
const path = require('path');
const CV = require('../models/CV'); 
const redisClient = require('../../redis.js'); 


const fetchExternalJobs = async (req, res) => {
  const { page = 1, limit = 50, title = '', company = '', location = '', remote = '' } = req.query;

  const headers = {
    Authorization: `Token ${process.env.FINDWORK_API_KEY}`,
  };

  // Dacă există filtre, descarcă toate joburile pentru a aplica filtrarea
  if (title || company || location || remote) {
    try {
      let allJobs = [];
      let currentPage = 1;
      let hasNextPage = true;

      // Iterează prin toate paginile până când nu mai există rezultate
      while (hasNextPage) {
        const response = await axios.get(`https://findwork.dev/api/jobs/`, {
          headers,
          params: { page: currentPage },
        });

        allJobs = [...allJobs, ...response.data.results];

        // Determină dacă mai există pagini
        hasNextPage = !!response.data.next;
        currentPage++;
      }

      // Aplică filtrele pe toate joburile descărcate
      const filteredJobs = allJobs.filter((job) => {
        const matchesTitle = title ? (job.role || '').toLowerCase().includes(title.toLowerCase()) : true;
        const matchesCompany = company ? job.company_name.toLowerCase().includes(company.toLowerCase()) : true;
        const matchesLocation = location ? (job.location || 'Remote').toLowerCase().includes(location.toLowerCase()) : true;
        const matchesRemote = remote ? job.remote.toString() === remote : true;
        return matchesTitle && matchesCompany && matchesLocation && matchesRemote;
      });

      // Transformă joburile filtrate în formatul standard
      const jobs = filteredJobs.map((job) => ({
        id: job.id,
        role: job.role,
        companyName: job.company_name,
        employmentType: job.employment_type,
        location: job.location || 'Remote',
        remote: job.remote,
        logo: job.logo,
        url: job.url,
        description: job.text,
        datePosted: job.date_posted,
        keywords: job.keywords,
        source: job.source,
      }));

      return res.status(200).json({ jobs });
    } catch (error) {
      console.error('Error fetching filtered jobs:', error.message);
      return res.status(500).json({ error: 'Failed to fetch external jobs with filters' });
    }
  }

  // Logică normală cu paginare dacă NU există filtre
  const cacheKey = `external_jobs_page_${page}_limit_${limit}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const response = await axios.get(`https://findwork.dev/api/jobs/`, {
      headers,
      params: { page },
    });

    const jobs = response.data.results.slice(0, limit).map((job) => ({
      id: job.id,
      role: job.role,
      companyName: job.company_name,
      employmentType: job.employment_type,
      location: job.location || 'Remote',
      remote: job.remote,
      logo: job.logo,
      url: job.url,
      description: job.text,
      datePosted: job.date_posted,
      keywords: job.keywords,
      source: job.source,
    }));

    await redisClient.set(cacheKey, JSON.stringify({ count: response.data.count, jobs }), {
      EX: 3600,
    });

    return res.status(200).json({ count: response.data.count, jobs });
  } catch (error) {
    console.error('Error fetching external jobs:', error.message);
    return res.status(500).json({ error: 'Failed to fetch external jobs' });
  }
};


const recommendJobs = async (req, res) => {
  const userId = req.user.id; // ID-ul utilizatorului logat
  const { page = 1, limit = 10 } = req.query;

  const cacheKey = `recommend_jobs_user_${userId}`; // Cheie unică pentru cache

  try {
    // 1. Verifică dacă rezultatele există în Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('Recomandările joburilor au fost preluate din cache.');
      return res.status(200).json(JSON.parse(cachedData));
    }

    // 2. Obține cel mai recent CV al utilizatorului
    const userCVs = await CV.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    if (!userCVs || userCVs.length === 0) {
      return res.status(400).json({ error: 'Nu există niciun CV asociat acestui utilizator.' });
    }

    const latestCV = userCVs[0];
    const fileName = path.basename(latestCV.filePath);
    const adjustedCvPath = path.join('uploads', fileName);
    
    // 3. Obține lista de joburi externe din API-ul extern
    const headers = { Authorization: `Token ${process.env.FINDWORK_API_KEY}` };
    const externalJobsResponse = await axios.get('https://findwork.dev/api/jobs/', {
      headers,
      params: { page },
    });  
  
    const externalJobs = externalJobsResponse.data.results.slice(0, limit).map((job) => ({
      id: job.id,
      title: job.role,
      description: job.text || `Job at ${job.company_name}`,
      keywords: job.keywords || [],
    }));

    if (!externalJobs || externalJobs.length === 0) {
      return res.status(400).json({ error: 'Nu s-au găsit joburi externe.' });
    }

    // 4. Trimite CV-ul și joburile către Flask pentru procesare
    const flaskEndpoint = 'http://127.0.0.1:8000/recommend-jobs';
    const payload = {
      cv_file_path: adjustedCvPath,
      jobs: externalJobs,
    };

    const flaskResponse = await axios.post(flaskEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    // 5. Salvează rezultatele în cache cu un timp de expirare
    const recommendations = flaskResponse.data.recommendations;
    await redisClient.set(cacheKey, JSON.stringify({ recommendations }), {
      EX: 3600, // Expirare de 1 oră
    });

    // 6. Returnează rezultatele către frontend
    res.status(200).json({ recommendations });
  } catch (error) {
    console.error('Eroare la generarea recomandărilor:', error.message);
    if (error.response) {
      console.error('Răspuns de eroare de la Flask:', error.response.data);
    }
    res.status(500).json({ error: 'A apărut o problemă la generarea recomandărilor de joburi.' });
  }
};

const analyzeJobCV = async (req, res) => {
  const userId = req.user.id; // ID-ul utilizatorului logat
  const { jobId } = req.params; // ID-ul jobului selectat

  try {
    // 1. Obține cel mai recent CV al utilizatorului
    const userCVs = await CV.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    if (!userCVs || userCVs.length === 0) {
      return res.status(400).json({ error: 'Nu există niciun CV asociat acestui utilizator.' });
    }

    const latestCV = userCVs[0];
    const fileName = path.basename(latestCV.filePath);
    const adjustedCvPath = path.join('uploads', fileName);

    // 2. Obține detaliile jobului selectat
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Jobul selectat nu a fost găsit.' });
    }

    const jobDetails = {
      id: job.id,
      title: job.title,
      description: job.description || '',
      keywords: job.keywords || [],
    };

    // 3. Trimite CV-ul și jobul către Flask pentru procesare
    const flaskEndpoint = 'http://127.0.0.1:8000/analyze-job';
    const payload = {
      cv_file_path: adjustedCvPath,
      job: jobDetails,
    };

    const flaskResponse = await axios.post(flaskEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    // 4. Returnează rezultatele către frontend
    res.status(200).json({ analysis: flaskResponse.data });
  } catch (error) {
    console.error('Eroare la analiza jobului:', error.message);
    if (error.response) {
      console.error('Răspuns de eroare de la Flask:', error.response.data);
    }
    res.status(500).json({ error: 'A apărut o problemă la analiza jobului selectat.' });
  }
};



module.exports = { fetchExternalJobs, recommendJobs, analyzeJobCV };