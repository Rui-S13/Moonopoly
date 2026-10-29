import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ProfileService } from '../../services/profile';
import { NotificationService } from '../../services/notification';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { Router } from '@angular/router';
import { ImageService } from '../../services/image';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, Header, Footer],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  constructor(
    private auth: AuthService,
    private profiles: ProfileService,
    private notifications: NotificationService,
    private router: Router,
    private images: ImageService,
  ) {}

  loading = signal(true);
  error = signal(false);
  saving = signal(false);

  confirming = signal(false);
  confirmText = signal('');
  deleting = signal(false);

  form = new FormGroup({
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40)],
    }),
    contactEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
  });

  async ngOnInit(): Promise<void> {
    const userId = await this.auth.getUserId();
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.profiles.getProfile(userId).subscribe({
      next: (profile) => {
        if (profile) {
          this.form.patchValue({
            displayName: profile.displayName,
            contactEmail: profile.contactEmail ?? '',
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { displayName, contactEmail } = this.form.getRawValue();
    this.saving.set(true);

    try {
      await this.profiles.updateMyProfile(displayName.trim(), contactEmail.trim());
      this.notifications.success('Profile saved.');
    } catch (e) {
      if (e instanceof Error && e.message === 'CONTACT_REQUIRED') {
        this.notifications.error(
          'You have active listings, so a contact email is required. Mark them as sold or delete them first.',
        );
      } else {
        this.notifications.error('Could not save your profile. Please try again.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  onConfirmInput(event: Event): void {
    this.confirmText.set((event.target as HTMLInputElement).value);
  }

  async onDeleteAccount(): Promise<void> {
    if (this.confirmText() !== 'DELETE') return;
    this.deleting.set(true);

    try {
      await this.images.removeAllMine();
      await this.auth.deleteAccount();
      this.notifications.success('Your account has been deleted.');
      this.router.navigate(['/']);
    } catch {
      this.notifications.error('Could not delete your account. Please try again.');
      this.deleting.set(false);
    }
  }
}
