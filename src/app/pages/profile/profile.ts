import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
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

  currentEmail = computed(() => this.auth.currentUser()?.email ?? '');
  savingEmail = signal(false);
  savingPassword = signal(false);
  pendingEmail = signal('');

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

  emailForm = new FormGroup({
    newEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  passwordForm = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [passwordRules] },
  );

  async onChangeEmail(): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const newEmail = this.emailForm.getRawValue().newEmail.trim();
    if (newEmail.toLowerCase() === this.currentEmail().toLowerCase()) {
      this.notifications.info('That is already your account email.');
      return;
    }

    this.savingEmail.set(true);
    try {
      await this.auth.changeEmail(newEmail);
      this.pendingEmail.set(newEmail);
      this.emailForm.reset();
      this.notifications.success('Check your inbox to confirm the change.');
    } catch {
      this.notifications.error('Could not change your email. It may already be in use.');
    } finally {
      this.savingEmail.set(false);
    }
  }

  async onChangePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.savingPassword.set(true);
    try {
      await this.auth.changePassword(currentPassword, newPassword);
      this.passwordForm.reset();
      this.notifications.success('Your password has been changed.');
    } catch (e) {
      this.notifications.error(
        e instanceof Error && e.message === 'WRONG_PASSWORD'
          ? 'Your current password is incorrect.'
          : 'Could not change your password. Please try again.',
      );
    } finally {
      this.savingPassword.set(false);
    }
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

function passwordRules(group: AbstractControl): ValidationErrors | null {
  const current = group.get('currentPassword')?.value;
  const next = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;

  const errors: ValidationErrors = {};
  if (next && confirm && next !== confirm) errors['passwordMismatch'] = true;
  if (current && next && current === next) errors['samePassword'] = true;
  return Object.keys(errors).length ? errors : null;
}
