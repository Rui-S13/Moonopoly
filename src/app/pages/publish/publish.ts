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
import { getBounds, plotsOverlap } from '../../utils/plot-geometry';

@Component({
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive],
  selector: 'app-publish',
  styleUrl: './publish.css',
  templateUrl: './publish.html',
})
export class Publish {
  private existing: Listing[] = [];

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
    const mine = getBounds([v.latitude, v.longitude], v.widthKm, v.heightKm);
    const clash = this.existing.find((l) =>
      plotsOverlap(mine, getBounds(l.center, l.widthKm, l.heightKm)),
    );
    return clash ? { overlap: clash.id } : null;
  }

  constructor(
    private listingService: ListingService,
    private router: Router,
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.listingService.addListing({
      description: v.description,
      type: v.type,
      price: v.price!,
      status: 'available',
      center: [v.latitude!, v.longitude!] as Coordinates,
      widthKm: v.widthKm!,
      heightKm: v.heightKm!,
      publishedAt: new Date().toISOString().slice(0, 10),
      contactEmail: v.contactEmail,
    });

    this.form.reset();
    this.router.navigate(['/listings']);
  }
}
