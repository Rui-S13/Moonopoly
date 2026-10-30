import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, Header, Footer],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordPage implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);
  private notifications = inject(NotificationService);

  saving = signal(false);
  waited = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  form = new FormGroup(
    {
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [matchValidator] },
  );

  ngOnInit(): void {
    this.timer = setTimeout(() => this.waited.set(true), 3000);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      await this.auth.setNewPassword(this.form.getRawValue().newPassword);
      this.notifications.success('Your password has been changed.');
      this.router.navigate(['/']);
    } catch {
      this.notifications.error('Could not change your password. The link may have expired.');
    } finally {
      this.saving.set(false);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}

function matchValidator(group: AbstractControl): ValidationErrors | null {
  const next = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return next && confirm && next !== confirm ? { passwordMismatch: true } : null;
}