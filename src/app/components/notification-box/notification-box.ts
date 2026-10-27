import { Component, inject } from '@angular/core';
import { NotificationService } from '../../services/notification';

@Component({
  imports: [],
  selector: 'app-notification-box',
  styleUrl: './notification-box.css',
  templateUrl: './notification-box.html',
})
export class NotificationBox {
  constructor (private service: NotificationService) {}
}
