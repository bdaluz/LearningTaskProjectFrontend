import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginRequest } from 'src/app/interfaces/LoginRequest';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm!: FormGroup;
  errorMessage: string = '';
  isSubmitting: boolean = false;
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.loginForm.disable();

    const credentials: LoginRequest = this.loginForm.value;
    try {
      this.authService.login(credentials).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loginForm.enable();
          this.isSubmitting = false;

          if (error && (error as any).status === 401) {
            this.errorMessage = 'Invalid username or password.';
          } else if (error && (error as any).status === 0) {
            this.errorMessage = 'Server is unavailable.';
          } else {
            this.errorMessage =
              'An unexpected error occurred. Please try again.';
          }
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    } catch (err) {
      console.error('[Login] synchronous error while subscribing', err);
      this.loginForm.enable();
      this.isSubmitting = false;
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword = !this.hidePassword;
  }
}
