import { TestBed } from '@angular/core/testing';
import { ListingServiceTest } from './listing-service-test';

describe('ListingServiceTest', () => {
  let service: ListingServiceTest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListingServiceTest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
