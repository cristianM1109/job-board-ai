import { Injectable } from '@angular/core';
import { HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class JobService {
  private apiUrl = 'http://localhost:5000/api/jobs';
  private apiUrlJobs = 'http://localhost:5000/api';
  private baseUrl = 'http://localhost:5000/analysis';

  constructor(private http: HttpClient) {}
  
  getExternalJobs(page: number, limit: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/external-jobs?page=${page}&limit=${limit}`);
  }

  filterExternalJobs(filters: any): Observable<any> {
    const params = new HttpParams()
      .set('title', filters.title || '') // Corectăm cheia pentru title
      .set('company', filters.company || '')
      .set('location', filters.location || '')
      .set('remote', filters.remote || '');
  
    console.log('Filters sent to backend:', params.toString()); // Debugging pentru parametrii trimiși
  
    return this.http.get<any>(`${this.apiUrl}/external-jobs`, { params });
  }
  
  
  getPaginatedJobs(page: number, limit: number, search: string = ''): Observable<any> {
    const token = localStorage.getItem('token'); // Obține token-ul din localStorage

    // Dacă utilizatorul este autentificat, folosește ruta protejată
    if (token) {
      return this.http.get<any>(`${this.apiUrl}/?page=${page}&limit=${limit}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    // Dacă utilizatorul nu este autentificat, trimite cererea fără token
    return this.http.get<any>(`${this.apiUrl}/public-jobs/?page=${page}&limit=${limit}&search=${search}`);
  }

  
 // Metodă pentru adăugarea unui job în favorite
 addFavoriteJob(jobDetails: any): Observable<any> {
  const token = localStorage.getItem('token'); // Adaugă token-ul pentru autentificare

  return this.http.post<any>(`${this.apiUrlJobs}/favorites`, jobDetails, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    observe: 'response',
  });
}

deleteFavoriteJob(jobId: string): Observable<any> {
  const token = localStorage.getItem('token'); // Obține token-ul utilizatorului logat
  return this.http.delete(`${this.apiUrlJobs}/favorites/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

getFavoriteJobs(): Observable<any[]> {
  const token = localStorage.getItem('token'); // Obține tokenul utilizatorului logat

  if (!token) {
    throw new Error('User is not authenticated. Token is missing.');
  }

  return this.http.get<any[]>(`${this.apiUrlJobs}/favorites`, {
    headers: {
      Authorization: `Bearer ${token}`, // Trimite tokenul în header
    },
  });
}

getCompatibilityScores(): Observable<any> {
  const token = localStorage.getItem('token'); // Obține tokenul utilizatorului logat

  if (!token) {
    throw new Error('User is not authenticated. Token is missing.');
  }

  return this.http.post<any[]>(`${this.baseUrl}/process-cv`, {}, { // Corp gol
    headers: {
      Authorization: `Bearer ${token}`, // Trimite tokenul în header
    },
  });
}

getJobRecommendations(): Observable<any> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('User is not authenticated. Token is missing.');

  return this.http.get<any[]>('http://localhost:5000/api/jobs/recommend-jobs', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

analyzeFavoriteJob(jobId: string): Observable<any> {
  const token = localStorage.getItem('token'); // Obține token-ul utilizatorului logat
  return this.http.get<any[]>(`${this.apiUrlJobs}/jobs/analyze-job/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// Obține scorurile de compatibilitate bazate pe cuvinte cheie
getKeywordCompatibilityScores(): Observable<any> {
  const token = localStorage.getItem('token'); // Obține tokenul utilizatorului logat

  if (!token) {
    throw new Error('User is not authenticated. Token is missing.');
  }

  return this.http.get<any[]>(`${this.baseUrl}/keyword-compatibility-scores`, {
    headers: {
      Authorization: `Bearer ${token}`, // Trimite tokenul în header
    },
  });
}

  
}