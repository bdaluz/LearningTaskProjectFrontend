import { Router } from '@angular/router';
import { AuthService } from './../../services/auth.service';
import { Component, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { UserBasicInfo } from 'src/app/interfaces/UserBasicInfo';
import { ThemeService, Theme } from 'src/app/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnDestroy {
  userEmail: string = '';
  usernameInitial: string = '';
  isDropdownOpen: boolean = false;
  isLoggedIn: boolean = false;

  currentTheme: Theme = 'light';
  private themeSub?: Subscription;
  logoSrc: string = '/assets/TasksIcon.png';

  constructor(
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: UserBasicInfo | null) => {
      this.isLoggedIn = !!user;
      if (user) {
        this.userEmail = user.email;
        this.usernameInitial = user.username.charAt(0).toUpperCase();
      } else {
        this.userEmail = '';
        this.usernameInitial = '';
        this.isDropdownOpen = false;
      }
    });

    this.themeSub = this.themeService.theme$.subscribe((t: Theme) => {
      this.currentTheme = t;
      this.logoSrc =
        t === 'dark'
          ? '/assets/TasksIconDark.png'
          : '/assets/TasksIconLight.png';
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.closeDropdown();
        this.router.navigate(['/login']);
      },
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  onAvatarKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.toggleDropdown();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent) {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  ngOnDestroy(): void {
    if (this.themeSub) this.themeSub.unsubscribe();
  }
}
