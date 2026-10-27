import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationBox } from './notification-box';

describe('NotificationBox', () => {
  let component: NotificationBox;
  let fixture: ComponentFixture<NotificationBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationBox],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
