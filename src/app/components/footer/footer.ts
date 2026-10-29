import { Component } from '@angular/core';
import { Logo } from '../logo/logo';
import { RouterLink } from '@angular/router';

@Component({
  imports: [Logo, RouterLink],
  selector: 'app-footer',
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer {}
