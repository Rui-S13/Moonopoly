import { Header } from '../../components/header/header';
import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ListingService } from '../../services/listing';
import { Coordinates } from '../../models/listing.models';
import { Listing, ListingStatus } from '../../models/listing.models';
import { Plot, plotsOverlap } from '../../utils/plot-geometry';
import { MoonMap } from '../../components/moon-map/moon-map';
import { Footer } from '../../components/footer/footer';
import { NotificationService } from '../../services/notification';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ImageService } from '../../services/image';

@Component({
  imports: [Header, ReactiveFormsModule, RouterLink, RouterLinkActive, MoonMap, Footer],
  selector: 'app-publish',
  styleUrl: './publish.css',
  templateUrl: './publish.html',
})
export class Publish implements OnDestroy {
  private existing: Listing[] = [];

  errorMessage = '';

  previewCenter: [number, number] = [0, 0];
  previewWidth = 0;
  previewHeight = 0;

  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  fileError = signal('');
  removeImage = signal(false);
  saving = signal(false);

  editing = signal<Listing | null>(null);

  form = new FormGroup(
    {
      description: new FormControl('', { validators: [Validators.minLength(10)] }),
      type: new FormControl<'sale' | 'rent'>('sale', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      price: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      latitude: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(-90),
        Validators.max(90),
      ]),
      longitude: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(-180),
        Validators.max(180),
      ]),
      widthKm: new FormControl<number | null>(null, [Validators.required, Validators.min(0.1)]),
      heightKm: new FormControl<number | null>(null, [Validators.required, Validators.min(0.1)]),
      status: new FormControl<ListingStatus>('available', { nonNullable: true }),
    },
    { validators: [(group) => this.overlapValidator(group)] },
  );

  ngOnInit(): void {
    this.listingService.getListings().subscribe((listings) => {
      this.existing = listings;
      this.form.updateValueAndValidity();
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.listingService.getListing(Number(idParam)).subscribe(async (listing) => {
        const userId = await this.auth.getUserId();
        if (!listing || listing.ownerId !== userId) {
          this.notifications.error('You can only edit your own listings.');
          this.router.navigate(['/my-listings']);
          return;
        }
        this.editing.set(listing);
        this.form.patchValue({
          description: listing.description,
          type: listing.type,
          price: listing.price,
          latitude: listing.center[0],
          longitude: listing.center[1],
          widthKm: listing.widthKm,
          heightKm: listing.heightKm,
          status: listing.status,
        });
      });
    }
  }

  private overlapValidator(group: AbstractControl): ValidationErrors | null {
    const v = group.value;
    if (v.status === 'sold') return null; // a sold plot no longer blocks anything
    if ([v.latitude, v.longitude, v.widthKm, v.heightKm].some((x) => x == null)) {
      return null;
    }
    const mine: Plot = {
      center: [v.latitude, v.longitude],
      widthKm: v.widthKm,
      heightKm: v.heightKm,
    };
    const clash = this.existing.find(
      (l) => l.status !== 'sold' && l.id !== this.editing()?.id && plotsOverlap(mine, l),
    );
    return clash ? { overlap: clash.id } : null;
  }

  constructor(
    private listingService: ListingService,
    private router: Router,
    private notifications: NotificationService,
    private route: ActivatedRoute,
    private auth: AuthService,
    private images: ImageService,
  ) {
    this.form.valueChanges.subscribe((value) => {
      this.previewCenter = [Number(value.latitude), Number(value.longitude)];
      this.previewWidth = Number(value.widthKm);
      this.previewHeight = Number(value.heightKm);
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const current = this.editing();
    const v = this.form.getRawValue();

    let uploadedPath: string | undefined;
    try {
      const file = this.selectedFile();
      if (file) uploadedPath = await this.images.upload(file);
    } catch {
      this.notifications.error('Could not upload the photo. Please try again.');
      this.saving.set(false);
      return;
    }

    const imageUrl = uploadedPath ?? (this.removeImage() ? undefined : current?.imageUrl);

    const payload = {
      description: v.description,
      type: v.type,
      price: v.price!,
      status: v.status,
      center: [v.latitude!, v.longitude!] as Coordinates,
      widthKm: v.widthKm!,
      heightKm: v.heightKm!,
      publishedAt: current?.publishedAt ?? new Date().toISOString().slice(0, 10),
      imageUrl,
    };

    const request = current
      ? this.listingService.updateListing(current.id, payload)
      : this.listingService.addListing(payload);

    request.subscribe({
      next: () => {
        // The old photo is no longer used if it was replaced or removed
        if (current?.imageUrl && current.imageUrl !== imageUrl) {
          void this.images.remove(current.imageUrl);
        }
        this.notifications.success(current ? 'Listing updated.' : 'Listing published.');
        this.saving.set(false);
        this.form.reset();
        this.clearPreview();
        this.router.navigate([current ? '/my-listings' : '/listings']);
      },
      error: () => {
        // Don't leave an orphaned file behind if the listing wasn't saved
        if (uploadedPath) void this.images.remove(uploadedPath);
        this.notifications.error(
          current ? 'Could not update the listing.' : 'Could not publish the listing.',
        );
        this.saving.set(false);
      },
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.clearPreview();
    this.fileError.set('');
    if (!file) return;

    const problem = this.images.validate(file);
    if (problem) {
      this.fileError.set(problem);
      input.value = '';
      return;
    }

    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
    this.removeImage.set(false);
  }

  clearFile(): void {
    this.clearPreview();
    this.fileError.set('');
  }

  private clearPreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.selectedFile.set(null);
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }
}
