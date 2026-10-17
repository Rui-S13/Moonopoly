import { TestBed } from '@angular/core/testing';
import { Listing } from './listing';

describe('Listing', () => {
  let service: Listing;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Listing);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
