import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private apiUrl = 'http://localhost:5000'; // URL Backend
  private isLoggedIn = new BehaviorSubject<boolean>(!!this.getToken());

  constructor(private http: HttpClient, private router: Router) {}

  register(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, { username, password });
  }

  isLoggedInUser(): boolean {
    const token = localStorage.getItem('token');
    return !!token; // Returnează true dacă tokenul există
  }

  isTokenExpired(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Transformăm în milisecunde
      return Date.now() > expiry;
      
    }
    return true; // Dacă nu există token, considerăm că este expirat
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/users/login`, { username, password });
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
    this.isLoggedIn.next(true);
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn.next(false);
    this.router.navigate(['/login']);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return this.isLoggedIn.asObservable();
  }
  
}
