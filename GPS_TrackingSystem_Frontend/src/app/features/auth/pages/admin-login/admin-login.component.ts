import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { LucideAngularModule, Shield, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule, TranslateModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  loginForm: any;

  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    console.log('📝 Admin Login: Form submit', this.loginForm.value);
    
    if (this.loginForm.invalid) {
      console.log('❌ Admin Login: Form validation failed');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    console.log('Admin Login: Calling auth service...');

    this.authService.login(this.loginForm.value, 'admin').subscribe({
      next: () => {
        console.log(' Admin Login: Login successful, navigating to admin');
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        console.error('Admin Login: Login error', err);
        const errorMsg = err.message || err.error?.error || err.error?.detail || 'Invalid credentials';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }
}
