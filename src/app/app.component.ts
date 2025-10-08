import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'LearningTaskProjectFrontend';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.populate();
  }
}
