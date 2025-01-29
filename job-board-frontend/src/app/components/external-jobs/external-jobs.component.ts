import { Component, HostListener, OnInit } from '@angular/core';
import { JobService } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-external-jobs',
  templateUrl: './external-jobs.component.html',
  styleUrls: ['./external-jobs.component.scss'],
})
export class ExternalJobsComponent implements OnInit {
  externalJobs: any[] = []; // Lista completă de joburi
  filteredJobs: any[] = []; // Lista joburilor filtrate
  currentPageJobs: any[] = []; // Joburi afișate progresiv (lazy loading)
  currentPage: number = 1; // Pagina curentă
  totalJobs: number = 0; // Total joburi
  totalPages: number = 1; // Total pagini
  limit: number = 50; // Joburi per pagină
  lazyBatchSize: number = 10; // Joburi încărcate pe scroll
  isLoading: boolean = false; // Status încărcare
  lazyLoadingDone: boolean = false; // Lazy loading finalizat
  showFullDescription: { [key: string]: boolean } = {}; // Stare pentru "Show More/Less"
  isFiltering: boolean = false; // Dacă sunt aplicate filtre

  // Filtre
  filters = {
    title: '',
    company: '',
    location: '',
    remote: '',
  };

  constructor(
    public authService: AuthService,
    private jobService: JobService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchJobs(); // Încarcă joburile inițiale
  }

  fetchJobs(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.jobService.getExternalJobs(this.currentPage, this.limit).subscribe(
      (response) => {
        this.externalJobs = response.jobs;
        this.totalJobs = response.count;
        this.totalPages = Math.ceil(this.totalJobs / this.limit);
        this.currentPageJobs = [];
        this.lazyLoadingDone = false;
        this.isLoading = false;

        this.externalJobs.forEach((job) => {
          this.showFullDescription[job.id] = false;
        });

        this.loadMoreJobs(true);
      },
      (error) => {
        console.error('Error fetching external jobs:', error);
        this.isLoading = false;
      }
    );
  }

  applyFilters(): void {
    console.log('Filters applied:', this.filters); // Debugging pentru a verifica filtrele
  
    if (this.isLoading) return;
  
    this.isLoading = true;
    this.isFiltering = true;
  
    this.jobService.filterExternalJobs(this.filters).subscribe(
      (response) => {
        console.log('Filtered jobs received:', response.jobs); // Debugging pentru răspunsul API-ului
        this.filteredJobs = response.jobs;
        this.currentPageJobs = [];
        this.lazyLoadingDone = false;
        this.isLoading = false;
  
        // Dezactivează paginarea când filtrele sunt aplicate
        this.currentPage = 1;
        this.totalPages = 1;
  
        this.loadMoreFilteredJobs(true);
      },
      (error) => {
        console.error('Error filtering external jobs:', error);
        this.isLoading = false;
      }
    );
  }

  resetFilters(): void {
    this.filters = { title: '', company: '', location: '', remote: '' };
    this.isFiltering = false;
    this.currentPage = 1;
    this.fetchJobs(); // Reîncarcă joburile standard cu paginare
  }

  loadMoreJobs(isInitialLoad: boolean = false): void {
    // Dacă sunt aplicate filtre, folosește doar lazy loading
    if (this.isFiltering) {
      this.loadMoreFilteredJobs(isInitialLoad);
      return;
    }
  
    const nextBatch = this.externalJobs.slice(
      this.currentPageJobs.length,
      this.currentPageJobs.length + this.lazyBatchSize
    );
  
    this.currentPageJobs = [...this.currentPageJobs, ...nextBatch];
  
    if (
      this.currentPageJobs.length >= this.externalJobs.length ||
      this.currentPageJobs.length >= this.limit
    ) {
      this.lazyLoadingDone = true;
    }
  }

  loadMoreFilteredJobs(isInitialLoad: boolean = false): void {
    const nextBatch = this.filteredJobs.slice(
      this.currentPageJobs.length,
      this.currentPageJobs.length + this.lazyBatchSize
    );
  
    this.currentPageJobs = [...this.currentPageJobs, ...nextBatch];
  
    if (this.currentPageJobs.length >= this.filteredJobs.length) {
      this.lazyLoadingDone = true;
    }
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.offsetHeight - 200;

    if (!this.lazyLoadingDone && scrollPosition >= threshold && !this.isLoading) {
      this.loadMoreJobs();
    }
  }

  addToFavorites(job: any): void {
    const jobDetails = {
      job: {
        id: job.id,
        role: job.role,
        description: job.description || job.text,
        company_name: job.companyName || job.company_name,
        location: job.location || 'Remote',
        salary: job.salary || null,
        employment_type: job.employmentType || job.employment_type,
        remote: job.remote,
        logo: job.logo,
        url: job.url,
        date_posted: job.datePosted || job.date_posted,
        keywords: job.keywords,
        source: job.source,
      },
    };

    this.jobService.addFavoriteJob(jobDetails).subscribe(
      (response) => {
        if (response.status === 204) {
          // Dacă statusul este 204
          this.snackBar.open('This job is already in your favorites!', 'Close', {
            duration: 3000,
          });
        } else if (response.status === 201) {
          // Dacă job-ul a fost adăugat cu succes
          this.snackBar.open('Job added to favorites!', 'Close', {
            duration: 3000,
          });
        }
      },
      (error) => {
          // Pentru alte tipuri de erori
          console.error('Error adding job to favorites:', error);
          this.snackBar.open('Failed to add job to favorites. Please try again.', 'Close', {
            duration: 3000,
          });
        
      }
    );
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchJobs();
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchJobs();
      this.scrollToTop();
    }
  }

  toggleDescription(jobId: string): void {
    this.showFullDescription[jobId] = !this.showFullDescription[jobId];
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
