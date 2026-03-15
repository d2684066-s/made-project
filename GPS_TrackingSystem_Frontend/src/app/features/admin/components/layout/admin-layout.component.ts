import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, LayoutDashboard, Bus, Plus, Users, UserCog, AlertTriangle, GraduationCap, Route, Ambulance, LogOut, Menu, X, Shield, CreditCard, Wifi } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, TranslateModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  mobileMenuOpen = signal(false);
  get user() { return this.authService.user; }

  navItems = [
    { path: '/admin', iconName: 'layout-dashboard', label: 'DASHBOARD', end: true },
    { path: '/admin/add-vehicle', iconName: 'plus', label: 'ADD_VEHICLE', end: false },
    { path: '/admin/vehicles', iconName: 'bus', label: 'REGISTERED_VEHICLES', end: false },
    { path: '/admin/offences', iconName: 'alert-triangle', label: 'OFFENCES', end: false },
    { path: '/admin/student-offences', iconName: 'graduation-cap', label: 'STUDENT_OFFENCES', end: false },
    { path: '/admin/students', iconName: 'users', label: 'STUDENTS', end: false },
    { path: '/admin/faculty', iconName: 'users', label: 'FACULTY', end: false },
    { path: '/admin/drivers', iconName: 'user-cog', label: 'DRIVERS', end: false },
    { path: '/admin/trips', iconName: 'route', label: 'TRIPS', end: false },
    { path: '/admin/bookings', iconName: 'ambulance', label: 'BOOKINGS', end: false },
    { path: '/admin/support', iconName: 'alert-triangle', label: 'SUPPORT', end: false },
    { path: '/admin/faculty-offences', iconName: 'user-cog', label: 'FACULTY_OFFENCES', end: false },
  ];

  constructor(private authService: AuthService, private router: Router, private translate: TranslateService) {
    // Ensure layout translations are loaded when admin layout initializes
    const saved = localStorage.getItem('lang') || this.translate.getDefaultLang() || 'en';
    this.translate.use(saved).subscribe({
      next: () => {
        // no-op: ensures translations are available for sidebar and nav items
      },
      error: (err) => {
        console.error('Failed to load translations in AdminLayout', err);
      }
    });
  }

  handleLogout() {
    this.authService.logout();
  }
}
