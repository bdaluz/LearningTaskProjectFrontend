import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/services/task.service';
import { Task } from 'src/app/interfaces/Task';
import { Subject, debounceTime, timer } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.css'],
})
export class TaskDashboardComponent implements OnInit {
  tasks: Task[] = [];
  originalValues: Map<number, { title: string; description: string }> =
    new Map();
  private debounceTimers = new Map<number, any>();

  //For Modal

  showConfirmModal: boolean = false;
  taskToDelete: Task | null = null;
  message: string = '';
  messageType: 'success' | 'error' | '' = '';

  //

  //For New Task Card

  newTitle: string = '';
  newDescription: string = '';

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
    if (task.id === undefined || task.id === null) {
      this.displayMessage('Error: Task ID not found.', 'error');
      return;
    }

    this.taskService.completeTask(task.id).subscribe({
      next: () => {
        task.isCompleted = !task.isCompleted;
        this.displayMessage(
          `Task ${task.isCompleted ? 'completed' : 'reopened'}!`,
          'success'
        );
      },
      error: (err: HttpErrorResponse) => {
        this.displayMessage(`Error changing status: Try again.`, 'error');
      },
    });
  }

  startEditing(task: Task): void {
    if (task.id === undefined || task.id === null) return;

    if (!this.originalValues.has(task.id)) {
      this.originalValues.set(task.id, {
        title: task.title,
        description: task.description,
      });
    }
  }

  saveIfChanged(task: Task): void {
    if (task.id === undefined || task.id === null) return;

    const original = this.originalValues.get(task.id);
    if (!original) return;

    const hasTitleChange = task.title !== original.title;
    const hasDescriptionChanged = task.description !== original.description;

    if (hasTitleChange || hasDescriptionChanged) {
      this.taskService
        .updateTask(task.id, {
          title: task.title,
          description: task.description,
        })
        .subscribe({
          next: () => {
            this.originalValues.set(task.id, {
              title: task.title,
              description: task.description,
            });
            this.displayMessage('Task updated successfully!', 'success');
          },
          error: (err: HttpErrorResponse) => {
            this.displayMessage(
              `Error updating task, try again later.`,
              'error'
            );
          },
        });
    }
  }

  onTaskInput(task: Task): void {
    if (task.id === undefined || task.id === null) return;

    if (this.debounceTimers.has(task.id)) {
      clearTimeout(this.debounceTimers.get(task.id));
    }

    const timerId = setTimeout(() => {
      this.saveIfChanged(task);
      this.debounceTimers.delete(task.id);
    }, 2000);

    this.debounceTimers.set(task.id, timerId);
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
        error: (error: HttpErrorResponse) => {
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

  createNewTask() {
    if (!this.newTitle.trim() || !this.newDescription.trim()) {
      this.displayMessage('Title and description cannot be empty.', 'error');
      return;
    }

    const newTaskData = {
      title: this.newTitle.trim(),
      description: this.newDescription.trim(),
    };

    this.taskService.createTask(newTaskData).subscribe({
      next: (createdTask: Task) => {
        this.tasks.push(createdTask);
        this.displayMessage('Task created successfully!', 'success');
        this.newTitle = '';
        this.newDescription = '';
      },
      error: (error: HttpErrorResponse) => {
        this.displayMessage(`Error creating task: Verify your input.`, 'error');
      },
    });
  }

  //
}
