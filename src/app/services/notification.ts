import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);
  private nextId = 1;

  show(type: NotificationType, message: string, durationMs = 4000): void {
    const id = this.nextId++;
    this.notifications.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string): void { this.show('success', message); }
  error(message: string): void { this.show('error', message, 6000); }
  info(message: string): void { this.show('info', message); }

  dismiss(id: number): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }
}