import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'play',
    loadComponent: () =>
      import('./pages/play/play.page').then((m) => m.PlayPage),
  },
  {
    path: 'victory',
    loadComponent: () =>
      import('./pages/victory/victory.page').then((m) => m.VictoryPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./pages/stats/stats.page').then((m) => m.StatsPage),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products/products.page').then((m) => m.ProductsPage),
  },
  {
    path: 'attractions',
    loadComponent: () =>
      import('./pages/attractions/attractions.page').then((m) => m.AttractionsPage),
  },
  { path: '**', redirectTo: '' },
];
