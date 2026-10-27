import { Header } from '../../components/header/header';
import { Component, OnInit, signal } from '@angular/core';
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

@Component({
  imports: [Header, ReactiveFormsModule, RouterLink, RouterLinkActive, MoonMap, Footer],
  selector: 'app-publish',
  styleUrl: './publish.css',
  templateUrl: './publish.html',
})
export class Publish {
  private existing: Listing[] = [];

  errorMessage = '';

  previewCenter: [number, number] = [0, 0];
  previewWidth = 0;
  previewHeight = 0;

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
    if ([v.latitude, v.longitude, v.widthKm, v.heightKm].some((x) => x == null)) {
      return null;
    }
    const mine: Plot = {
      center: [v.latitude, v.longitude],
      widthKm: v.widthKm,
      heightKm: v.heightKm,
    };
    const clash = this.existing.find((l) => l.id !== this.editing()?.id && plotsOverlap(mine, l));
    return clash ? { overlap: clash.id } : null;
  }

  constructor(
    private listingService: ListingService,
    private router: Router,
    private notifications: NotificationService,
    private route: ActivatedRoute,
    private auth: AuthService,
  ) {
    this.form.valueChanges.subscribe((value) => {
      this.previewCenter = [Number(value.latitude), Number(value.longitude)];
      this.previewWidth = Number(value.widthKm);
      this.previewHeight = Number(value.heightKm);
    });
  }

  onSubmit(): void {
    const v = this.form.getRawValue();
    const current = this.editing();

    const payload = {
      description: v.description,
      type: v.type,
      price: v.price!,
      status: v.status,
      center: [v.latitude!, v.longitude!] as Coordinates,
      widthKm: v.widthKm!,
      heightKm: v.heightKm!,
      publishedAt: current?.publishedAt ?? new Date().toISOString().slice(0, 10),
      imageUrl: current?.imageUrl,
    };

    const request = current
      ? this.listingService.updateListing(current.id, payload)
      : this.listingService.addListing(payload);

    request.subscribe({
      next: () => {
        this.notifications.success(current ? 'Listing updated.' : 'Listing published.');
        this.form.reset();
        this.router.navigate([current ? '/my-listings' : '/listings']);
      },
      error: () => {
        this.notifications.error(
          current ? 'Could not update the listing.' : 'Could not publish the listing.',
        );
      },
    });
  }
}
