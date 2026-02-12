import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [

  { path: '', component: LoginComponent },

  {
    path: 'admin',
    loadChildren: () =>
      import('./features/users/admin/admin.module')
        .then(m => m.AdminModule)
  },

  {
    path: 'audit',
    redirectTo: () => '/admin/dashboard?module=audit'
  },

  {
    path: 'tax',
    redirectTo: () => '/admin/dashboard?module=tax'
  },

  { path: '**', redirectTo: '' }

];
