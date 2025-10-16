import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/services/task.service';
import { Task } from 'src/app/interfaces/Task';
import { timer } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.scss'],
})
export class TaskDashboardComponent implements OnInit {
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

  saveIfChanged(task: Task): void {
    if (task.id === undefined) return;

    const { title, description } = task;

    this.taskService.updateTask(task.id, { title, description }).subscribe({
      next: () => {
        this.displayMessage('Task updated successfully!', 'success');
      },
      error: () =>
        this.displayMessage('Error updating task, try again later.', 'error'),
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
    timer(3000).subscribe(() => {
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
      },
      error: (error: HttpErrorResponse) => {
        this.displayMessage(`Error creating task: Verify your input.`, 'error');
      },
    });
  }
}
