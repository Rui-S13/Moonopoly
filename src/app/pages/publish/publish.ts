import { Header } from '../../components/header/header';
import { Component, OnInit } from '@angular/core';
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
import { Listing } from '../../models/listing.models';
import { Plot, plotsOverlap } from '../../utils/plot-geometry';
import { MoonMap } from '../../components/moon-map/moon-map';

@Component({
  imports: [Header, ReactiveFormsModule, RouterLink, RouterLinkActive, MoonMap],
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

  form = new FormGroup(
    {
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(10)],
      }),
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
      contactEmail: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
    },
    { validators: [(group) => this.overlapValidator(group)] },
  );

  ngOnInit(): void {
    this.listingService.getListings().subscribe((listings) => {
      this.existing = listings;
      this.form.updateValueAndValidity();
    });
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
    const clash = this.existing.find((l) => plotsOverlap(mine, l));
    return clash ? { overlap: clash.id } : null;
  }

  constructor(
    private listingService: ListingService,
    private router: Router,
  ) {
    this.form.valueChanges.subscribe((value) => {
      this.previewCenter = [Number(value.latitude), Number(value.longitude)];

      this.previewWidth = Number(value.widthKm);
      this.previewHeight = Number(value.heightKm);
    });
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.listingService
      .addListing({
        description: v.description,
        type: v.type,
        price: v.price!,
        status: 'available',
        center: [v.latitude!, v.longitude!] as Coordinates,
        widthKm: v.widthKm!,
        heightKm: v.heightKm!,
        publishedAt: new Date().toISOString().slice(0, 10),
        contactEmail: v.contactEmail,
      })
      .subscribe({
        next: () => {
          this.errorMessage = '';
          this.form.reset();
          this.router.navigate(['/listings']);
        },
        error: () => {
          console.error('Error creating listing:');
          this.errorMessage = 'Failed to publish listing. Please try again.';
        },
      });
  }
}
