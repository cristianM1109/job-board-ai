import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.errorMessage = '';
    
    this.authService.login(this.username, this.password).subscribe(
      (response) => {
        this.authService.saveToken(response.token);
        this.router.navigate(['/jobs']);
      },
      (error) => {
        if (error.status === 409) {
          this.errorMessage = 'Invalid credentials!';
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again later.';
        }
        console.error('Login failed:', error);
      }
    );
  }
}
