import { Component, signal } from '@angular/core';
import { passwordsMatchValidator } from '../../utils/validators';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NavigationHistory } from '../../services/navigation-history';
import { safeReturnUrl } from '../../utils/navigation';
import { Logo } from '../../components/logo/logo';
import { NotificationService } from '../../services/notification';

@Component({
  imports: [ReactiveFormsModule, RouterLink, Logo],
  selector: 'app-signup',
  styleUrl: './signup.css',
  templateUrl: './signup.html',
})
export class Signup {
  signUpError = signal('');
  loading = signal(false);
  signupPending = signal(false);

  private messageFor(error: { status?: number; code?: string }): string {
    if (error.status === 429) {
      return 'Too many attempts. Please wait a while before trying again.';
    }
    if (error.code === 'weak_password') {
      return 'That password is too weak. Try a longer one with a mix of characters.';
    }
    return "We couldn't create your account with these details. If you already have one, log in or reset your password.";
  }

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
    private notifications: NotificationService
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.loading()) {
      return;
    }

    this.signUpError.set('');
    this.loading.set(true);

    const { email, password, displayName } = this.form.getRawValue();

    this.auth.signUp(email, password, displayName.trim()).subscribe({
      next: ({ session }) => {
        this.loading.set(false);

        if (!session) {
          this.signupPending.set(true);
          return;
        }

        this.notifications.success('Welcome to Moonopoly!');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(
          returnUrl ? safeReturnUrl(returnUrl) : (this.navHistory.lastContentUrl ?? '/'),
        );
      },
      error: (error) => {
        this.signUpError.set(this.messageFor(error));
        this.loading.set(false);
      },
    });
  }

  goBack(event: Event): void {
    event.preventDefault();
    this.navHistory.goBackFromAuth();
  }
}
