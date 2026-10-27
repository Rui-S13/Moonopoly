import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyListings } from './my-listings';

describe('MyListings', () => {
  let component: MyListings;
  let fixture: ComponentFixture<MyListings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyListings],
    }).compileComponents();

    fixture = TestBed.createComponent(MyListings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
