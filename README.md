# Moonopoly

> Houston, we have a mortgage.

Moonopoly is a fictional real-estate marketplace for plots of land on the Moon. Visitors can search listings by type, price, status and lunar region, see them on a map of the lunar surface, save favorites, and contact sellers. Registered users can publish, edit and delete their own listings, with photos.

It is a single-page application built with Angular and Supabase, created as the practical project of the Angular Fundamentals module.

- **Live site:** https://rui-s13.github.io/Moonopoly/
- **Repository:** https://github.com/Rui-S13/Moonopoly

> Moonopoly is fiction. No actual lunar land is sold here, and all listings are for demonstration purposes only.

## Features

- **Search and filters:** type (sale or rent), price range, lunar region, listing status and favorites only. The filters and the map position are stored in the address, so Back, refresh and shared links restore them.
- **Interactive map:** a Leaflet map of the Moon with a pin and a to-scale outline for every listing. Hovering a card highlights its pin, clicking a pin opens a preview, and the list follows the visible part of the map. On phones the map is replaced by a plain list, with a map on each listing page.
- **Listings:** photo upload with a placeholder when there is none, terrain information calculated from the coordinates (region, Earth-facing, likely water ice), sort options and an overlap check so two live listings can't cover the same land.
- **Accounts:** sign up, log in, log out, forgot password, change email and password, delete account.
- **Profiles:** a public display name and an optional public contact email, shown as "Published by" on each listing.
- **Seller tools:** a "My listings" page to change a listing's status, edit it or delete it.
- **Favorites**, saved to the user's account.
- **Feedback:** loading, empty and error states on every page that loads data, and notification messages after important actions.

## Tech stack

| Area | Technology |
|---|---|
| Framework | Angular (standalone components, signals), TypeScript |
| Backend | Supabase: authentication, PostgreSQL database with row-level security, file storage |
| Map | Leaflet, with lunar tiles from NASA Moon Trek |
| Styling | Plain CSS with variables (all colours live in `:root`), Inter font |
| Hosting | GitHub Pages, built and deployed by GitHub Actions |

## Requirements checklist

Each requirement of the project brief, and where it is met.

| # | Requirement | Where |
|---|---|---|
| 1 | **Structure and components** | Created with Angular CLI. Pages in `src/app/pages/` and reusable pieces in `src/app/components/`: `header`, `footer`, `logo`, `listing-card`, `moon-map`, `notification-box`. |
| 2 | **Templates and data binding** | Interpolation `{{ }}` and property binding `[ ]` in every template. Event binding `( )` for clicks, form submits and pointer events. Two-way binding `[( )]` with `ngModel` on the sort selector of the listings page. `@if` and `@for` throughout, and `@switch` for the status badge in `listing-card`. Built-in pipes: `currency`, `date`, `number`. |
| 3 | **Component communication** | `ListingCard` receives `listing`, `isFavorite` and `highlighted` with `@Input`, and emits `favorite`, `highlight` and `selected` with `@Output` and `EventEmitter`. `MoonMap` also receives listings and emits `boundsChange`, `listingSelected` and more. |
| 4 | **Services, interfaces, dependency injection** | `@Injectable` services in `src/app/services/` (`ListingService`, `FavoritesService`, `AuthService`, `ProfileService`, `ImageService`, `MoonService`, `NotificationService`, `NavigationHistory`), injected with Angular's dependency injection. Interfaces in `src/app/models/`. |
| 5 | **Data, Supabase, deployment** | Supabase for authentication, database and storage (`SupabaseService`). **HttpClient:** Implemented in `MoonService`, using `HttpClient` to fetch lunar region data from `public/data/moon-regions.json`. The response is typed using the `RegionArea` interface. Loading and error states in `Listings`, `ListingDetail`, `Favorites`, `MyListings` and `Home`. Production build and deployment to GitHub Pages with GitHub Actions (`.github/workflows/`). The Supabase URL and key come from environment variables. |
| 6 | **Router** | Routes in `app.routes.ts`, `router-outlet` in the root component, `routerLink` navigation, a route guard (`authGuard`) for pages that need login, route parameters (`/listings/:id`) and query parameters for filters. |
| 7 | **Reactive forms** | `FormGroup`, `FormControl` and `ReactiveFormsModule` in the publish and edit form, login, sign-up, profile, password and email changes, password reset and the filters. Validators: `required`, `email`, `minLength`, `min`, plus custom ones (price range, plot overlap, matching passwords). Error messages are shown, and submission is blocked while a form is invalid. |
| 8 | **Lifecycle and organisation** | `OnInit` loads data in the pages. `OnDestroy` removes the Leaflet map (`MoonMap`), unsubscribes from the route (`ListingDetail`), and clears timers and preview URLs. Files are organised by responsibility: pages, components, services, models, guards and utils. |

## Getting started

### Prerequisites

- Node.js v24.18.0 and npm 11.16.0
- Angular CLI: `npm install -g @angular/cli`
- A free [Supabase](https://supabase.com) project

### Install

```bash
git clone https://github.com/Rui-S13/Moonopoly
cd Moonopoly
npm install
```

### Environment variables

The app needs two values from your Supabase project (Project settings, API):

| Value | What it is |
|---|---|
| `supabaseUrl` | The project address |
| `supabaseKey` | The **public** (anon or publishable) key |

Put them in `src/environments/environment.ts`. **Never use the `service_role` key in this project.**

> The public key is visible in the compiled site, which is normal for Supabase browser apps. What protects the data is row-level security, not hiding the key. Environment variables and GitHub secrets keep the key out of the repository.

### Set up Supabase

1. Open the SQL editor and run `supabase/policies.sql`. It creates the tables, security policies, the profile trigger and the account deletion function.
2. In Storage, check that the public bucket `listing-images` exists (the script creates it).
3. In Authentication, URL configuration, set the **Site URL** to the deployed address, and add `http://localhost:4200` and the deployed address, including `/reset-password`, to the **Redirect URLs**.
4. Email: Supabase's built-in email service is limited (see "Known limitations"). For many users, configure custom SMTP, or disable "Confirm email" for development.

### Run and build

```bash
ng serve        # development server at http://localhost:4200
ng build        # production build
```

## Deployment

A GitHub Actions workflow builds the app and publishes it to GitHub Pages on every push to the main branch. It writes the environment file from two repository secrets (Settings, Secrets and variables, Actions): `SUPABASE_URL` and `SUPABASE_KEY`.

Because GitHub Pages serves static files, the build uses the repository name as its base path, and a copy of `index.html` is saved as `404.html`, so reloading a deep link such as `/listings/3` still opens the app.

## Project structure

Simplified:

```
src/app/
├── components/   header, footer, logo, listing-card, moon-map, notification-box
├── pages/        home, listings, listing-detail, publish, favorites, my-listings,
│                 profile, login, signup, forgot-password, reset-password
├── services/     listing, favorites, auth, profile, image, moon, notification,
│                 navigation-history, supabase-service
├── models/       listing and profile interfaces
├── guards/       auth.guard
└── utils/        plot-geometry, validators, navigation, sort-option
supabase/
└── policies.sql  tables, policies, trigger and functions
```

## Data model and security

| Table | Purpose | Main fields |
|---|---|---|
| `listings` | The plots for sale or rent | `id`, `description`, `type`, `price`, `status`, `latitude`, `longitude`, `width_km`, `height_km`, `image_url`, `published_at`, `owner_id` |
| `profiles` | Public information about a user | `id` (the user), `display_name`, `contact_email` |
| `favorites` | A user's saved listings | `user_id`, `listing_id` |

Photos are stored in the `listing-images` bucket, in a folder named after the owner's user id.

Row-level security is switched on, and summarised here:

- **Listings:** anyone can read. Only logged-in users can insert, and only with themselves as owner and a contact email in their profile. Only the owner can update or delete.
- **Profiles:** anyone can read. Users can only insert and update their own.
- **Favorites:** each user can read, add and remove only their own.
- **Photos:** anyone can view. Users can only upload to, list and delete from their own folder, and the bucket limits file size and type.
- **Account deletion:** a database function that can only delete the account of whoever calls it.

## Design decisions

- **Overlap in kilometres, not degrees.** Plots are compared using real distances on a sphere, so a 5 km plot near a pole is not treated like a 5 km plot at the equator. Sold listings don't block anything, so a sold plot can be listed again by its new owner.
- **One source of truth for names.** The display name lives in `profiles`. The copy sent at sign-up is only used to create the first profile.
- **Sign-up and password reset never reveal whether an email is registered.** They show the same message in both cases.
- **State in the address.** Filters and map position are query parameters, which gives working Back buttons and shareable links.
- **No map on phones.** The list is the main view, and each listing page has its own map.
- **Terrain information is calculated, not stored.** Region, Earth-facing and likely water ice are derived from the coordinates, so they can't disagree with them.
- **Status filter defaults to active listings** (available and reserved), as most real-estate sites do.

## Known limitations

- **Plot overlap** is checked in the browser, so it can be bypassed by calling the database directly. A real guarantee would need geographic indexing in the database. It is also approximate within a few kilometres of the poles, and it ignores plots that cross longitude ±180°.
- **Regions** are approximated as rectangles from IAU extents, so real regions with irregular shapes are only roughly matched. "Likely water ice" is a simple rule based on distance to the poles, not real data.
- **Contact emails are public.** Anyone can read the optional contact email in a profile. A production version would hide it behind a message relay.
- **Email sending** uses Supabase's built-in service, which allows 2 emails per hour and is intended for testing. A production version would use custom SMTP.
- **Map tiles** come from NASA's public tile service, so the map depends on its availability.
- Scroll position of the results list is not restored when returning to the page.
- Listings from owners who stop using the site stay until the owner marks them sold or deletes them.

## Future work

- Messaging between buyers and sellers
- Automatic expiry of old listings
- A database-level guarantee against overlapping plots
- Automatically generated photos of a plot from its coordinates
- Restoring the list's scroll position and the selected listing
- Ownership transfer when a plot is sold
- Real region outlines instead of rectangles

## Credits

- Lunar imagery: NASA / GSFC / Arizona State University (LRO Wide Angle Camera mosaic), via NASA Moon Trek.
- Region names: IAU Gazetteer of Planetary Nomenclature, USGS Astrogeology Science Center.
- Map library: [Leaflet](https://leafletjs.com).
- Backend: [Supabase](https://supabase.com).
- Font: Inter, from Google Fonts.

## Author

Rui Silva ([@Rui-S13](https://github.com/Rui-S13)). Created for the Angular Fundamentals module.