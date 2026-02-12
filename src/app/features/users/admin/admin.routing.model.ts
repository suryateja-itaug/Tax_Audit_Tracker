import { Routes, RouterModule} from '@angular/router';
import { LayoutComponent } from './layout/admin-layout/layout.component';
import { Dashboard } from './pages/dashboard/dashboard';
import { Clients } from './pages/clients/clients';
import { Engagementes } from './pages/engagementes/engagementes';
import { EngagementDetail } from './pages/engagement-detail/engagement-detail';
import { Userlist } from './pages/userlist/userlist';
import { Reports } from './pages/reports/reports';
import { StageStatisticsPage } from './pages/stage-statistics/stage-statistics';
import { NgModule } from '@angular/core';
import { adminOnlyGuard } from './guards/admin-only.guard';
import { ClientDetail } from './pages/client-detail/client-detail';
import { sessionChildGuard, sessionGuard } from './guards/session.guard';



export const adminRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [sessionGuard],
    canActivateChild: [sessionChildGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'clients', component: Clients },
      { path: 'clients/:id', component: ClientDetail },
      { path: 'engagements', component: Engagementes },
      { path: 'engagements/:id', component: EngagementDetail },
      { path: 'users', component: Userlist, canActivate: [adminOnlyGuard] },
      { path: 'users/:id', component: Userlist, canActivate: [adminOnlyGuard] },
      { path: 'reports', component: Reports },
      { path: 'stage-statistics', component: StageStatisticsPage },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(adminRoutes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
