import { Component, OnInit } from '@angular/core';
import { JobService } from '../../services/job.service';
import { Job } from '../../models/job.model';
import { CvService } from '../../services/cv.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userCvs :any[] = [];
  favoriteJobs: Job[] = []; // Joburi favorite
  jobAnalysis: { jobId: string; matched_skills: string[]; missing_skills: string[]; recommendations: string } | null = null;
  recommendedJobs: (Job & { showDetails?: boolean })[] = [];
  loadingJobId: string | null = null; // ID-ul jobului analizat în acest moment
  isLoadingRecommendations: boolean = false; // Inițializăm cu true
  constructor(private jobService: JobService, private cvService: CvService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.fetchUserCvs();
    this.loadFavoriteJobs();
  }

  loadFavoriteJobs(): void {
    this.jobService.getFavoriteJobs().subscribe(
      (jobs) => {
        this.favoriteJobs = jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          company: job.company,
          location: job.location,
          salary: job.salary,
          url: job.url
        }));
      },
      (error) => {
        console.error('Error fetching favorite jobs:', error);
      }
    );
  }

  fetchUserCvs(): void {
    this.cvService.getUserCvs().subscribe(
      (cvs) => {
        this.userCvs = cvs;
        this.loadJobRecommendations();
        console.log(this.userCvs);
      },
      (error) => {
        console.error('Error fetching CVs:', error);
      }
    );
  }

  analyzeJob(jobId: string): void {
    this.loadingJobId = jobId; // Setăm jobul care este în procesare
    this.jobService.analyzeFavoriteJob(jobId).subscribe(
      (response) => {
        this.jobAnalysis = { ...response.analysis, jobId }; // Stocăm rezultatul analizei pentru jobul selectat
        this.loadingJobId = null; // Resetăm spinner-ul
      },
      (error) => {
        console.error('Error analyzing job:', error);
        this.loadingJobId = null; // Resetăm spinner-ul chiar și în caz de eroare
      }
    );
  }

  // Funcție pentru afișarea unui snack bar
  showSnackBar(message: string, action: string = 'Close', duration: number = 3000): void {
    this.snackBar.open(message, action, {
      duration, // Durata în milisecunde
      horizontalPosition: 'center', // Poziție orizontală
      verticalPosition: 'top', // Poziție verticală
    });
  }

  loadJobRecommendations(): void {
    this.isLoadingRecommendations = true; // Începe încărcarea
    console.log(this.userCvs);
    if (!this.userCvs || this.userCvs.length === 0) {
      this.showSnackBar('Please upload your CV to get job recommendation.');
      return;
    }
    this.jobService.getJobRecommendations().subscribe(
      (response) => {
        const recommendedIds = response.recommendations.map((rec: any) => rec.job_id.toLowerCase().trim());
        console.log('ID-uri recomandate:', recommendedIds);
  
        // Obține toate joburile externe și filtrează doar cele recomandate
        this.jobService.getExternalJobs(1, 1000).subscribe(
          (externalJobsResponse) => {
            console.log('External Jobs:', externalJobsResponse);
            const externalJobs = externalJobsResponse.jobs;
            
            // Filtrăm joburile care sunt în lista de recomandări
            this.recommendedJobs = externalJobs
              .filter((job: any) => recommendedIds.includes(job.id.toLowerCase().trim()))
              .map((job: any) => ({
                id: job.id,
                title: job.role || 'Titlu indisponibil', // Folosim `role` ca titlu
                description: job.description || 'Descriere indisponibilă',
                company: job.companyName || 'Companie necunoscută',
                location: job.location || 'Locație necunoscută',
                url: job.url || '',
                showDetails: false,
              }));
            
            console.log('Joburi recomandate filtrate:', this.recommendedJobs);
            this.isLoadingRecommendations = false; // Finalizează încărcarea
          },
          (error) => {
            console.error('Eroare la obținerea joburilor externe:', error);
            this.isLoadingRecommendations = false; // Finalizează chiar și în caz de eroare
          }
        );
      },
      (error) => {
        console.error('Eroare la obținerea recomandărilor:', error);
        this.isLoadingRecommendations = false; // Finalizează chiar și în caz de eroare
      }
    );
  }

  toggleDetails(jobId: string): void {
    const job = this.recommendedJobs.find(job => job.id === jobId); // Folosim `id` din model
    if (job) {
      job.showDetails = !job.showDetails;
    }
  }

  applyForJob(jobUrl: string | undefined): void {
    if (jobUrl) {
      window.open(jobUrl, '_blank');
    } else {
      console.error('URL indisponibil pentru acest job.');
    }
  }
}
