import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { SignupRequest } from './../../interfaces/SignupRequest';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit, OnDestroy {
  signupForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;

  displayUsernameError = false;
  displayEmailError = false;
  displayPasswordError = false;
  displayConfirmPasswordError = false;

  hidePassword = true;
  hideConfirmPassword = true;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
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

    const usernameControl = this.signupForm.get('username');
    if (usernameControl) {
      usernameControl.valueChanges
        .pipe(debounceTime(500), takeUntil(this.destroy$))
        .subscribe(() => {
          this.displayUsernameError =
            usernameControl.invalid && usernameControl.dirty;
        });
    }

    const emailControl = this.signupForm.get('email');
    if (emailControl) {
      emailControl.valueChanges
        .pipe(debounceTime(500), takeUntil(this.destroy$))
        .subscribe(() => {
          this.displayEmailError = emailControl.invalid && emailControl.dirty;
        });
    }

    const passwordControl = this.signupForm.get('password');
    const confirmPasswordControl = this.signupForm.get('confirmPassword');

    if (passwordControl && confirmPasswordControl) {
      passwordControl.valueChanges
        .pipe(debounceTime(500), takeUntil(this.destroy$))
        .subscribe(() => {
          this.displayPasswordError =
            passwordControl.invalid && passwordControl.dirty;
          this.displayConfirmPasswordError =
            confirmPasswordControl.invalid && confirmPasswordControl.dirty;
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
    this.errorMessage = '';
    this.successMessage = '';

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.displayUsernameError = this.f['username'].invalid;
      this.displayEmailError = this.f['email'].invalid;
      this.displayPasswordError = this.f['password'].invalid;
      this.displayConfirmPasswordError = this.f['confirmPassword'].invalid;
      this.errorMessage = 'Please fix the errors in the form.';
      return;
    }

    this.isSubmitting = true;

    const signupRequestRaw = this.signupForm.getRawValue();
    const signupRequest: SignupRequest = {
      username: signupRequestRaw.username,
      email: signupRequestRaw.email,
      password: signupRequestRaw.password,
    };

    this.authService.signup(signupRequest).subscribe({
      next: (response) => {
        this.successMessage =
          'Your account has been successfully created! Redirecting to login...';
        this.isSubmitting = false;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else {
          this.errorMessage =
            'Failed to create account. Please try again later.';
        }
      },
    });
  }

  get f() {
    return this.signupForm.controls;
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
