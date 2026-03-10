import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, Shield, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-admin-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule, TranslateModule],
  templateUrl: './admin-signup.component.html',
  styleUrl: './admin-signup.component.css'
})
export class AdminSignupComponent {
  signupForm: any;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      dob: ['', Validators.required],
      registration_id: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.error.set('Please fill in all required fields correctly');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formData = this.signupForm.value;
    const adminData = {
      name: formData.name,
      email: formData.email,
      dob: formData.dob,
      registration_id: formData.registration_id,
      password: formData.password,
      submitted_date: new Date().toISOString()
    };

    // send pending request to backend
    fetch('/api/admin/pending-admins/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData)
    })
      .then(res => {
        if (!res.ok) throw res;
        return res.json();
      })
      .then(() => {
        this.success.set(true);
        this.loading.set(false);
        // redirect to login after short delay
        setTimeout(() => {
          this.router.navigate(['/admin/login']);
        }, 2000);
      })
      .catch(async err => {
        let msg = 'Failed to submit request';
        try {
          const e = await err.json();
          msg = e.detail || JSON.stringify(e);
        } catch (_){ }
        this.error.set(msg);
        this.loading.set(false);
      });
  }

  goBack() {
    this.router.navigate(['/admin/login']);
  }
}
