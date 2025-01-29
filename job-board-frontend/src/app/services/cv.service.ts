import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CvService {
  private apiUrl = 'http://localhost:5000/users/upload'; // Endpoint pentru gestionarea CV-urilor

  constructor(private http: HttpClient) {}

  // Obține CV-urile utilizatorului
  getUserCvs(): Observable<any> {
    const token = localStorage.getItem('token'); // Obține token-ul din localStorage
    // Dacă utilizatorul este autentificat, folosește ruta protejată
    if (token) {
        return this.http.get<any>(`${this.apiUrl}/cvs`, {
            headers: { Authorization: `Bearer ${token}` },
          });
      }
  
      // Dacă utilizatorul nu este autentificat, trimite cererea fără token
      return this.http.get<any>(`${this.apiUrl}/cvs`); 
  }

  // Șterge un CV
  deleteCv(cvId: string): Observable<any> {
    const token = localStorage.getItem('token'); // Obține token-ul din localStorage

    if (token) {
        return this.http.delete(`${this.apiUrl}/cvs/${cvId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
      }
  
      // Dacă utilizatorul nu este autentificat, trimite cererea fără token
      return this.http.delete(`${this.apiUrl}/cvs/${cvId}`);
  }
}
