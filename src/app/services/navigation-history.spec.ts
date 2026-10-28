import { TestBed } from '@angular/core/testing';
import { NavigationHistory } from './navigation-history';

describe('NavigationHistory', () => {
  let service: NavigationHistory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationHistory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
