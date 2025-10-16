import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TasksRoutingModule } from './tasks-routing.module';

import { TaskDashboardComponent } from 'src/app/components/task-dashboard/task-dashboard.component';
import { TaskCardComponent } from 'src/app/components/task-card/task-card.component';
import { ConfirmModalComponent } from 'src/app/components/common-ui/confirm-modal/confirm-modal.component';

@NgModule({
  declarations: [
    TaskDashboardComponent,
    TaskCardComponent,
    ConfirmModalComponent,
  ],
  imports: [CommonModule, FormsModule, TasksRoutingModule],
})
export class TasksModule {}
