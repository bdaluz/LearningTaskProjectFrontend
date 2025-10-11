import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;

  message: string | null = null;
  isLoading: boolean = false;
  isError: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.message = null;

    const email = this.forgotPasswordForm.controls['email'].value;

    this.authService.requestPasswordReset(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isError = false;
        this.message =
          'If an account with that email address exists, a password reset link has been sent.';
        this.forgotPasswordForm.reset();
      },
      error: (error: Error) => {
        this.isLoading = false;
        this.isError = false;
        this.message =
          'If an account with that email address exists, a password reset link has been sent.';
        console.error('Error requesting password reset:', error);
      },
    });
  }
}
