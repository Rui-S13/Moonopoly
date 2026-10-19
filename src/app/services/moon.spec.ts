import { TestBed } from '@angular/core/testing';
import { MoonService } from './moon';

describe('Moon', () => {
  let service: MoonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
