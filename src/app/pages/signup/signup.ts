import { Component, signal } from '@angular/core';
import { passwordsMatchValidator } from '../../utils/validators';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NavigationHistory } from '../../services/navigation-history';
import { safeReturnUrl } from '../../utils/navigation';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-signup',
  styleUrl: './signup.css',
  templateUrl: './signup.html',
})
export class Signup {
  signUpError = signal(false);

  form = new FormGroup(
    {
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      displayName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [passwordsMatchValidator] },
  );

  constructor(
    private auth: AuthService,
    private router: Router,
    private navHistory: NavigationHistory,
    private route: ActivatedRoute,
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, displayName } = this.form.getRawValue();

    this.signUpError.set(false);

    this.auth.signUp(email, password, displayName.trim()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(
          returnUrl ? safeReturnUrl(returnUrl) : (this.navHistory.lastContentUrl ?? '/'),
        );
      },
      error: () => this.signUpError.set(true),
    });
  }

  goBack(event: Event): void {
    event.preventDefault();
    this.navHistory.goBackFromAuth();
  }
}
