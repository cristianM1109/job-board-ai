import { Component, OnInit } from '@angular/core';
import { JobService } from '../../services/job.service';
import { Chart, registerables } from 'chart.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CvService } from '../../services/cv.service';

Chart.register(...registerables);

@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss']
})
export class JobListComponent implements OnInit {
  favoriteJobs: any[] = [];
  userCvs :any[] = [];
  isLoading: boolean = true;
  compatibilityScores: any = {}; // Scoruri pentru Sentence Transformers
  keywordScores: any = {}; // Scoruri pentru Keywords
  selectedView: 'transformers' | 'keywords' = 'transformers'; // Selectarea graficului
  jobTitleMap: Map<string, string> = new Map(); // Mapare între ID-uri și titluri
  chartInstances: { [key: string]: Chart | null } = {
    transformers: null,
    keywords: null
  };
  constructor(private jobService: JobService, private snackBar: MatSnackBar, private cvService: CvService) {}

  ngOnInit(): void {
    this.fetchUserCvs();
    
  }
  // Funcție pentru afișarea unui snack bar
  showSnackBar(message: string, action: string = 'Close', duration: number = 3000): void {
    this.snackBar.open(message, action, {
      duration, // Durata în milisecunde
      horizontalPosition: 'center', // Poziție orizontală
      verticalPosition: 'top', // Poziție verticală
    });
  }

  fetchFavoriteJobs(): void {
    this.jobService.getFavoriteJobs().subscribe(
      (jobs) => {
        this.favoriteJobs = jobs;
        this.isLoading = false;
        
        // Construiește harta între ID-uri și titluri
        jobs.forEach(job => {
          this.jobTitleMap.set(job.id, job.title);
        });

        this.fetchCompatibilityScores();
      },
      (error) => {
        console.error('Error fetching favorite jobs:', error);
        this.isLoading = false;
      }
    );
  }
  fetchUserCvs(): void {
    this.cvService.getUserCvs().subscribe(
      (cvs) => {
        this.userCvs = cvs;
        this.fetchFavoriteJobs();
      },
      (error) => {
        console.error('Error fetching CVs:', error);
      }
    );
  }

  fetchCompatibilityScores(): void {
    if (!this.favoriteJobs || this.favoriteJobs.length === 0) {
      this.showSnackBar('Please add some jobs to favorite list to have accesss to statistics.');
      return;
    }
    if (!this.userCvs || this.userCvs.length === 0) {
      this.showSnackBar('Please upload your CV to calculate compatibility scores.');
      return;
    }
    // Fetch scorurile bazate pe Sentence Transformers
    this.jobService.getCompatibilityScores().subscribe(
      (response) => {
        this.compatibilityScores = response.scores;
        this.createChart('transformers-chart', this.compatibilityScores, 'Sentence Transformers');
      },
      (error) => {
        console.error('Error fetching compatibility scores:', error);
      }
    );

    // Fetch scorurile bazate pe cuvinte cheie
    this.jobService.getKeywordCompatibilityScores().subscribe(
      (response) => {
        this.keywordScores = response.scores;
        this.createChart('keywords-chart', this.keywordScores, 'Keyword-Based');
      },
      (error) => {
        console.error('Error fetching keyword compatibility scores:', error);
      }
    );
  }

  createChart(canvasId: string, scores: any, label: string): void {
    // 1. Extragem titlurile joburilor
    const labels = Object.keys(scores).map((id) => this.jobTitleMap.get(id) || 'Unknown Job');
  
    // 2. Extragem scorurile, tratând diferențele de structură
    const values = Object.values(scores).map((score: any) => {
      // Dacă scorul este un obiect cu un câmp "score", îl folosim
      if (typeof score === 'object' && score.score !== undefined) {
        return score.score;
      }
      // Dacă scorul este direct numeric, îl folosim
      if (typeof score === 'number') {
        return score;
      }
      // Dacă structura este diferită, folosim 0 ca fallback
      return 0;
    });
  
    const canvasContainer = document.getElementById(canvasId)?.parentElement;
  
    if (!canvasContainer) {
      return;
    }
  
    // Distruge graficul existent, dacă există
    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId]!.destroy();
      this.chartInstances[canvasId] = null;
    }
  
    // Resetează canvas-ul pentru a preveni erori
    canvasContainer.innerHTML = `<canvas id="${canvasId}"></canvas>`;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  
    // Creează un nou grafic
    this.chartInstances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label,
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              callback: function (value, index) {
                const label = labels[index];
                return label.length > 15 ? label.match(/.{1,15}/g)?.join('\n') : label;
              },
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            max: 1, // Setează scara pentru a afișa maxim 1 (100%)
            ticks: {
              font: {
                size: 12,
              },
              callback: function (value) {
                const numericValue = Number(value); // Convertește `value` la număr
                return `${numericValue * 100}%`; // Adaugă simbolul "%" pe axă
              },
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              font: {
                size: 14,
              },
            },
          },
        },
        layout: {
          padding: {
            top: 20,
            bottom: 20,
          },
        },
      },
    });
  }
  
  onSelectionChange(): void {
    // Așteaptă ca DOM-ul să fie actualizat înainte de a manipula canvas-ul
    setTimeout(() => {
      const chartId =
        this.selectedView === 'transformers' ? 'transformers-chart' : 'keywords-chart';
      const scores =
        this.selectedView === 'transformers'
          ? this.compatibilityScores
          : this.keywordScores;
  
      if (Object.keys(scores).length > 0) {
        this.createChart(chartId, scores, this.selectedView === 'transformers' ? 'Sentence Transformers' : 'Keyword-Based');
      } else {
        console.warn('No scores available for the selected view.');
      }
    }, 0);
  }

  deleteFavorite(jobId: string): void {
    if (confirm('Are you sure you want to remove this job from your favorites?')) {
      this.jobService.deleteFavoriteJob(jobId).subscribe(
        () => {
          // Elimină jobul din lista de favorite
          this.favoriteJobs = this.favoriteJobs.filter(job => job.id !== jobId);
          this.jobTitleMap.delete(jobId); // Șterge jobul din mapare
  
          // Elimină scorurile asociate jobului șters
          delete this.compatibilityScores[jobId];
          delete this.keywordScores[jobId];
  
          // Reconstruiește graficul curent
          this.onSelectionChange();
          this.showSnackBar('Job removed from favorites.');
        },
        (error) => {
          console.error('Error deleting favorite job:', error);
          this.showSnackBar('Failed to remove job from favorites.');
        }
      );
    }
  }
}
