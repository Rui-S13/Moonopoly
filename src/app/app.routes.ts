import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Listings } from './pages/listings/listings';
import { ListingDetail } from './pages/listing-detail/listing-detail';
import { Publish } from './pages/publish/publish';
import { authGuard } from './guards/auth.guard';
import { Favorites } from './pages/favorites/favorites';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'listings', component: Listings },
  { path: 'listings/:id', component: ListingDetail },
  { path: 'publish', component: Publish, canActivate: [authGuard] },
  { path: 'favorites', component: Favorites },
  { path: 'login', component: Login },
  { path: '**', redirectTo: '' },
];