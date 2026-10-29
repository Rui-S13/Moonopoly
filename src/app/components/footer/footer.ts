import { Component } from '@angular/core';
import { Logo } from '../logo/logo';

@Component({
  imports: [Logo],
  selector: 'app-footer',
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer {}
