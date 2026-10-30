import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, Header, Footer],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordPage implements OnDestroy {
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  sending = signal(false);
  sent = signal(false);

  cooldown = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.sending() || this.cooldown() > 0) return;

    this.sending.set(true);
    try {
      await this.auth.sendPasswordReset(this.form.getRawValue().email.trim());
      this.sent.set(true);
      this.startCooldown(60); // matches Supabase's one-per-minute window per address
    } catch (e) {
      const err = e as { status?: number; code?: string };
      if (err.status === 429) {
        const hourly = err.code === 'over_email_send_rate_limit';
        this.startCooldown(hourly ? 300 : 60);
        this.notifications.error(
          hourly
            ? 'The email limit has been reached. Please try again in about an hour.'
            : 'Please wait a minute before trying again.',
        );
      } else {
        this.notifications.error('Could not send the email right now. Please try again later.');
      }
    } finally {
      this.sending.set(false);
    }
  }

  private startCooldown(seconds: number): void {
    clearInterval(this.timer);
    this.cooldown.set(seconds);
    this.timer = setInterval(() => {
      this.cooldown.update((s) => s - 1);
      if (this.cooldown() <= 0) clearInterval(this.timer);
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
