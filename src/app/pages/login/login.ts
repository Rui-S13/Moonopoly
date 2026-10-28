import { Component, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { safeReturnUrl } from '../../utils/navigation';
import { NavigationHistory } from '../../services/navigation-history';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginError = signal(false);

  form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private notifications: NotificationService,
    private route: ActivatedRoute,
    private navHistory: NavigationHistory,
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.loginError.set(false);

    this.auth.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(
          returnUrl ? safeReturnUrl(returnUrl) : (this.navHistory.lastContentUrl ?? '/'),
        );
        this.notifications.success('Welcome back!');
      },
      error: () => this.loginError.set(true),
    });
  }

  goBack(event: Event): void {
    event.preventDefault();
    this.navHistory.goBackFromAuth();
  }
}
