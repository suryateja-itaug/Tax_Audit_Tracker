import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { adminRoutes } from './admin.routing.model';
import { AdminComponent } from './admin.component';
import { AdminService } from './admin-services/admin-services';
import { Components } from './components/components';
import { LayoutComponent } from './layout/admin-layout/layout.component';
import { Header } from './layout/header/header';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { Dashboard } from './pages/dashboard/dashboard';
import { Clients } from './pages/clients/clients';
import { Engagementes } from './pages/engagementes/engagementes';
import { Userlist } from './pages/userlist/userlist';
import { Reports } from './pages/reports/reports';
import { Pages } from './pages/pages';
import { EngagementDetail } from './pages/engagement-detail/engagement-detail';
import { ClientDetail } from './pages/client-detail/client-detail';

@NgModule({
  declarations: [
    AdminComponent,
    Components,
    LayoutComponent,
    Header,
    SidebarComponent,
    Dashboard,
    Clients,
    Engagementes,
    Userlist,
    Reports,
    Pages,
    EngagementDetail,
    ClientDetail,
  ],
  imports: [CommonModule, FormsModule, RouterModule.forChild(adminRoutes)],
  providers: [ AdminService],
})
export class AdminModule {}
