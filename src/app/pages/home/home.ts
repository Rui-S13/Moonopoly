import { Header } from '../../components/header/header';
import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ListingType } from '../../models/listing.models';
import { priceRangeValidator } from '../../utils/validators';
import { ReactiveFormsModule } from '@angular/forms';
import { MoonService } from '../../services/moon';
import { Footer } from '../../components/footer/footer';

@Component({
  imports: [ReactiveFormsModule, Header, Footer],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  regions: string[] = [];

  constructor(
    private router: Router,
    private moon: MoonService,
  ) {
    this.regions = this.moon.getRegionNames();
  }

  search = new FormGroup(
    {
      type: new FormControl<ListingType | null>(null),
      minPrice: new FormControl<number | null>(null, Validators.min(1)),
      maxPrice: new FormControl<number | null>(null, Validators.min(1)),
      region: new FormControl<string>('', { nonNullable: true }),
    },
    {
      validators: priceRangeValidator,
    },
  );

  searchListings(): void {
    if (this.search.hasError('invalidPriceRange')) {
      return;
    };
    
    const s = this.search.getRawValue();

    this.router.navigate(['/listings'], {
      queryParams: {
        region: s.region || null,
        type: s.type || null,
        minPrice: s.minPrice,
        maxPrice: s.maxPrice,
      },
    });
  }
}
