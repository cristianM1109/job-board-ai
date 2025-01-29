import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  constructor(public authService: AuthService,
    private notificationService: NotificationService, private router: Router) {}

    ngOnInit(): void {
      setInterval(() => {
        const isLoggedIn = this.authService.isLoggedInUser(); // Verifică dacă utilizatorul este logat
  
        if (!isLoggedIn) {
          return; // Dacă utilizatorul nu este logat, oprește verificarea
        }
  
        // Verifică dacă tokenul a expirat
        if (this.authService.isTokenExpired()) {
          this.notificationService.showMessage(
            'Session expired. Redirecting to login...',
            5000
          );
          this.authService.logout();
        }
      }, 60000); // Verifică la fiecare 60 de secunde
    }

  logout() {
    this.authService.logout();
    this.router.navigate(['/external-jobs']); // Redirecționează utilizatorul la pagina cu anunturi
  }
}
