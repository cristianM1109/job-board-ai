import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CvService } from '../../services/cv.service';

@Component({
  selector: 'app-upload-cv',
  templateUrl: './upload-cv.component.html',
  styleUrl: './upload-cv.component.scss'
})
export class UploadCvComponent implements OnInit {
  selectedFile: File | null = null;
  uploadStatus: string = '';
  
  userCvs: any[] = []; // Lista de CV-uri
  isLoading: boolean = true; // Status de încărcare

  constructor(private http: HttpClient, private cvService: CvService) {}
  ngOnInit(): void {
    this.fetchUserCvs(); // Obține CV-urile utilizatorului la inițializare
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
  
      // Verifică tipul MIME sau extensia fișierului
      if (file.type !== 'application/pdf') {
        this.uploadStatus = 'Only PDF files are allowed.';
        this.selectedFile = null; // Resetează fișierul selectat
        return;
      }
  
      this.selectedFile = file;
      this.uploadStatus = ''; // Resetează mesajul de stare
    }
  }

  fetchUserCvs(): void {
    this.cvService.getUserCvs().subscribe(
      (cvs) => {
        this.userCvs = cvs;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching CVs:', error);
        this.isLoading = false;
      }
    );
  }

  deleteCv(cvId: string): void {
    if (confirm('Are you sure you want to delete this CV?')) {
      this.cvService.deleteCv(cvId).subscribe(
        () => {
          this.userCvs = this.userCvs.filter((cv) => cv.id !== cvId);
          alert('CV deleted successfully!');
        },
        (error) => {
          console.error('Error deleting CV:', error);
          alert('Failed to delete CV. Please try again.');
        }
      );
    }
  }

  uploadCV(event: Event): void {
    event.preventDefault();

    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('cv', this.selectedFile);

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${localStorage.getItem('token')}`
    );

    this.http
      .post('http://localhost:5000/users/upload/upload-cv', formData, { headers })
      .subscribe({
        next: (response: any) => {
          this.uploadStatus = 'CV uploaded successfully!';
          this.selectedFile = null; // Resetează fișierul selectat
          this.fetchUserCvs(); // Actualizează lista de CV-uri
        },
        error: (error) => {
          console.error('Error uploading CV:', error);
          this.uploadStatus = 'Failed to upload CV. Please try again.';
        },
      });
  }
}
