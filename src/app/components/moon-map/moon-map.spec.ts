import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoonMap } from './moon-map';

describe('MoonMap', () => {
  let component: MoonMap;
  let fixture: ComponentFixture<MoonMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoonMap],
    }).compileComponents();

    fixture = TestBed.createComponent(MoonMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
