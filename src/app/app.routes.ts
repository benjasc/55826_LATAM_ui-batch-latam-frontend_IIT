import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'workboard' },
  {
    path: 'workboard',
    title: 'Pizarra de Trabajo',
    loadComponent: () => import('@features/workboard/workboard-page').then((m) => m.WorkboardPage),
  },
  {
    path: 'new-process',
    title: 'Nuevo Procesamiento',
    loadComponent: () => import('@features/new-process/new-process-page').then((m) => m.NewProcessPage),
  },
  {
    path: 'search',
    title: 'Buscar Procesos',
    loadComponent: () => import('@features/search/search-page').then((m) => m.SearchPage),
  },
  {
    path: '403',
    loadComponent: () => import('@features/error/error-page').then((m) => m.ErrorPage),
    data: { title: '¡No autorizado!', message: 'No tiene permisos para acceder a esta aplicación.' },
  },
  {
    path: '500',
    loadComponent: () => import('@features/error/error-page').then((m) => m.ErrorPage),
    data: { title: '¡Ha ocurrido un problema!', message: 'Lo sentimos, se ha presentado un problema interno.' },
  },
  {
    path: '**',
    loadComponent: () => import('@features/error/error-page').then((m) => m.ErrorPage),
  },
];
