import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css'],
})
export class ConfirmModalComponent {
  @Input() message: string = 'Are you sure you want to continue?';
  @Output() confirm = new EventEmitter<boolean>();

  onConfirm(value: boolean) {
    this.confirm.emit(value);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onConfirm(false);
    }
  }
}
