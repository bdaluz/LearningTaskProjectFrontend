import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ChangePasswordRequest } from 'src/app/interfaces/ChangePasswordRequest';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isSubmitting = false;

  displayPasswordError = false;
  displayConfirmPasswordError = false;

  hidePassword = true;
  hideConfirmPassword = true;

  private token: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');

    this.resetForm = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^()-])[A-Za-z\d@$!%*?&_#^()-]{8,256}$/
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );

    const passwordControl = this.resetForm.get('password');
    const confirmPasswordControl = this.resetForm.get('confirmPassword');

    if (passwordControl) {
      passwordControl.valueChanges
        .pipe(debounceTime(500), takeUntil(this.destroy$))
        .subscribe(() => {
          this.displayPasswordError =
            passwordControl.invalid && passwordControl.dirty;
        });
    }

    if (confirmPasswordControl) {
      confirmPasswordControl.valueChanges
        .pipe(debounceTime(500), takeUntil(this.destroy$))
        .subscribe(() => {
          this.displayConfirmPasswordError =
            confirmPasswordControl.invalid && confirmPasswordControl.dirty;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator: ValidatorFn = (
    formGroup: AbstractControl
  ): ValidationErrors | null => {
    const passwordControl = formGroup.get('password');
    const confirmPasswordControl = formGroup.get('confirmPassword');

    if (!passwordControl || !confirmPasswordControl) {
      return null;
    }

    if (passwordControl.value !== confirmPasswordControl.value) {
      confirmPasswordControl.setErrors({
        ...confirmPasswordControl.errors,
        mismatch: true,
      });
    } else if (confirmPasswordControl.hasError('mismatch')) {
      const { mismatch, ...otherErrors } = confirmPasswordControl.errors || {};
      confirmPasswordControl.setErrors(
        Object.keys(otherErrors).length > 0 ? otherErrors : null
      );
    }
    return null;
  };

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.resetForm.invalid || !this.token) {
      this.resetForm.markAllAsTouched();
      this.displayPasswordError = this.f['password'].invalid;
      this.displayConfirmPasswordError = this.f['confirmPassword'].invalid;
      this.errorMessage = 'Please fix the errors in the form.';
      return;
    }

    this.isSubmitting = true;

    const request: ChangePasswordRequest = {
      token: this.token,
      newPassword: this.resetForm.value.password,
    };

    this.authService.resetPassword(request).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage =
          'Your password has been reset successfully! You will be redirected to the login page shortly.';
        setTimeout(() => this.router.navigate(['/login']), 4000);
      },
      error: (err) => {
        this.isSubmitting = false;
        let serverMessage = null;
        if (err.error && typeof err.error === 'object' && err.error.message) {
          serverMessage = err.error.message;
        } else if (err.error && typeof err.error === 'string') {
          serverMessage = err.error;
        }
        this.errorMessage =
          serverMessage ||
          'The token is invalid or has expired. Please request a new one.';
      },
    });
  }

  get f() {
    return this.resetForm.controls;
  }

  togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
