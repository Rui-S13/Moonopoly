import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const priceRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const minPrice = control.get('minPrice')?.value;
  const maxPrice = control.get('maxPrice')?.value;

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { invalidPriceRange: true };
  }

  return null;
};