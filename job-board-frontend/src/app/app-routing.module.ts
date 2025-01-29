import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobListComponent } from './components/job-list/job-list.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ExternalJobsComponent } from './components/external-jobs/external-jobs.component';
import { UploadCvComponent } from './components/upload-cv/upload-cv.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'jobs', pathMatch: 'full' }, // Redirecționează către lista joburilor
  { path: 'jobs', component: JobListComponent },       // Pagină pentru listarea joburilor
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'external-jobs', component: ExternalJobsComponent },
  { path: 'upload-cv', component: UploadCvComponent },
  { path: 'app-dashboard', component: DashboardComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
