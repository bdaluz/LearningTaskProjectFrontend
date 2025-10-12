import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../interfaces/Task';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  baseApiUrl: string = environment.baseApiUrl;
  private taskApiUrl = `${this.baseApiUrl}/ToDoTask`;
  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.taskApiUrl);
  }

  createTask(data: { title: string; description: string }): Observable<Task> {
    return this.http.post<Task>(this.taskApiUrl, data);
  }

  updateTask(id: number, data: Partial<Task>): Observable<string> {
    return this.http.put<string>(`${this.taskApiUrl}/${id}`, data);
  }

  completeTask(taskId: number): Observable<any> {
    return this.http.patch(`${this.taskApiUrl}/CompleteTask/${taskId}`, null);
  }

  deleteTask(taskId: number): Observable<any> {
    return this.http.delete(`${this.taskApiUrl}/${taskId}`);
  }
}
