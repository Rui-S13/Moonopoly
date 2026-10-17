import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Listings } from './listings';

describe('Listings', () => {
  let component: Listings;
  let fixture: ComponentFixture<Listings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Listings],
    }).compileComponents();

    fixture = TestBed.createComponent(Listings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
