import { Component, OnInit, ViewChild } from '@angular/core';
import { TaskService } from 'src/app/services/task.service';
import { Task } from 'src/app/interfaces/Task';
import { timer } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.scss'],
})
export class TaskDashboardComponent implements OnInit {
  @ViewChild('createCard') createCardComponent!: TaskCardComponent;

  tasks: Task[] = [];

  //For Modal

  showConfirmModal: boolean = false;
  taskToDelete: Task | null = null;
  message: string = '';
  messageType: 'success' | 'error' | '' = '';

  //

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  private handleApiError(
    error: HttpErrorResponse,
    contextMessage: string
  ): any | null {
    if (error.status === 400 && error.error?.errors) {
      const validationErrors = error.error.errors;
      const messages = (Object.values(validationErrors) as string[][]).flat();

      if (messages.length > 0) {
        this.displayMessage(
          `${contextMessage}:\n` + messages.join('\n'),
          'error'
        );
      } else {
        this.displayMessage(`${contextMessage}: Verify your input.`, 'error');
      }
      return validationErrors;
    }
    this.displayMessage(`${contextMessage}: Try again later.`, 'error');
    return null;
  }

  private isRequiredError(errorMessages: string[]): boolean {
    if (!errorMessages || errorMessages.length === 0) {
      return false;
    }
    return errorMessages.some(
      (msg) =>
        msg.includes('is required') ||
        msg.includes('at least 1 characters long')
    );
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
      },
      error: (err: HttpErrorResponse) => {
        if (
          err.status === 400 &&
          typeof err.error === 'string' &&
          err.error.trim() === 'You have no tasks'
        ) {
          return;
        }
        this.displayMessage(
          `Error loading tasks: Check the connection.`,
          'error'
        );
      },
    });
  }

  toggleTaskCompletion(task: Task): void {
    if (task.id === undefined) return;

    this.taskService.completeTask(task.id).subscribe({
      next: () => {
        task.isCompleted = !task.isCompleted;
        this.displayMessage(
          `Task ${task.isCompleted ? 'completed' : 'reopened'}!`,
          'success'
        );
      },
      error: () =>
        this.displayMessage('Error changing status: Try again.', 'error'),
    });
  }

  saveIfChanged(eventData: {
    task: Task;
    oldState: { title: string; description: string };
  }): void {
    const { task, oldState } = eventData;

    if (task.id === undefined) return;

    this.taskService
      .updateTask(task.id, { title: task.title, description: task.description })
      .subscribe({
        next: () => {
          this.displayMessage('Task updated successfully!', 'success');
        },
        error: (err: HttpErrorResponse) => {
          const validationErrors = this.handleApiError(
            err,
            'Error updating task'
          );

          if (validationErrors) {
            if (
              validationErrors.Title &&
              this.isRequiredError(validationErrors.Title)
            ) {
              task.title = oldState.title;
            }
            if (
              validationErrors.Description &&
              this.isRequiredError(validationErrors.Description)
            ) {
              task.description = oldState.description;
            }
          }
        },
      });
  }

  // Modal

  openDeleteConfirm(task: Task): void {
    this.taskToDelete = task;
    this.showConfirmModal = true;
  }

  handleConfirmDelete(confirmed: boolean): void {
    this.showConfirmModal = false;

    if (
      confirmed &&
      this.taskToDelete &&
      this.taskToDelete.id !== undefined &&
      this.taskToDelete.id !== null
    ) {
      const taskIdToDelete = this.taskToDelete.id;
      this.taskService.deleteTask(taskIdToDelete).subscribe({
        next: () => {
          this.displayMessage('Task deleted successfully!', 'success');
          this.tasks = this.tasks.filter((t) => t.id !== taskIdToDelete);
          this.taskToDelete = null;
        },
        error: () => {
          this.displayMessage(`Error deleting task: Try again later.`, 'error');
          this.taskToDelete = null;
        },
      });
    } else {
      this.taskToDelete = null;
    }
  }

  displayMessage(msg: string, type: 'success' | 'error' | ''): void {
    this.message = msg;
    this.messageType = type;
    timer(4000).subscribe(() => {
      this.message = '';
      this.messageType = '';
    });
  }

  //

  // New task

  createNewTask(newTaskData: { title: string; description: string }) {
    if (!newTaskData.title.trim() || !newTaskData.description.trim()) {
      this.displayMessage('Title and description cannot be empty.', 'error');
      return;
    }
    this.taskService.createTask(newTaskData).subscribe({
      next: (createdTask: Task) => {
        this.tasks.push(createdTask);
        this.displayMessage('Task created successfully!', 'success');
        if (this.createCardComponent) {
          this.createCardComponent.clearFields();
        }
      },
      error: (err: HttpErrorResponse) =>
        this.handleApiError(err, 'Error creating task'),
    });
  }
}
