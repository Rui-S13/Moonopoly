import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export const priceRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const minPrice = control.get('minPrice')?.value;
  const maxPrice = control.get('maxPrice')?.value;

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { invalidPriceRange: true };
  }

  return null;
};

export const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
};
