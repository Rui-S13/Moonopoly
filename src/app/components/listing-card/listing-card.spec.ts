import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListingCard } from './listing-card';

describe('ListingCard', () => {
  let component: ListingCard;
  let fixture: ComponentFixture<ListingCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListingCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ListingCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
