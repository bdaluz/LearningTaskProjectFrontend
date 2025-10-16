import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from 'src/app/interfaces/Task';

@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
})
export class TaskCardComponent {
  @Input() isCreateMode: boolean = false;

  @Input() task?: Task;

  @Output() taskCompleted = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<Task>();
  @Output() taskUpdated = new EventEmitter<Task>();

  @Output() taskCreated = new EventEmitter<{
    title: string;
    description: string;
  }>();

  newTitle: string = '';
  newDescription: string = '';

  private originalTaskState: { title: string; description: string } | null =
    null;
  private debounceTimer: any;

  onCreate(): void {
    this.taskCreated.emit({
      title: this.newTitle,
      description: this.newDescription,
    });
    this.newTitle = '';
    this.newDescription = '';
  }

  onToggleCompletion(): void {
    if (this.task) this.taskCompleted.emit(this.task);
  }

  onDeleteRequest(): void {
    if (this.task) this.taskDeleted.emit(this.task);
  }

  startEditing(): void {
    if (this.task && !this.originalTaskState) {
      this.originalTaskState = {
        title: this.task.title,
        description: this.task.description,
      };
    }
  }

  saveIfChanged(): void {
    if (!this.task || !this.originalTaskState) return;

    const hasChanged =
      this.task.title !== this.originalTaskState.title ||
      this.task.description !== this.originalTaskState.description;

    if (hasChanged) {
      this.taskUpdated.emit(this.task);
    }

    this.originalTaskState = null;
    clearTimeout(this.debounceTimer);
  }

  onTaskInput(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.saveIfChanged();
    }, 2000);
  }
}
