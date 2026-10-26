import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Listings } from './pages/listings/listings';
import { ListingDetail } from './pages/listing-detail/listing-detail';
import { Publish } from './pages/publish/publish';
import { authGuard } from './guards/auth.guard';
import { Favorites } from './pages/favorites/favorites';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'listings', component: Listings },
  { path: 'listings/:id', component: ListingDetail },
  { path: 'publish', component: Publish, canActivate: [authGuard] },
  { path: 'favorites', component: Favorites, canActivate: [authGuard] },
  { path: 'login', component: Login },
  {path: 'signup', component: Signup},
  { path: '**', redirectTo: '' },
];