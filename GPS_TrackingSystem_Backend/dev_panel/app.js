// Developer Panel Application

const API_URL = 'http://localhost:8000/api';
const DEVELOPER_CREDENTIALS = {
    email: 'd2684066@gmail.com',
    password: 'Durga@3'
};

// State Management
const state = {
    isLoggedIn: false,
    developerEmail: null,
    authToken: null,
    pendingAdmins: [],
    approvedAdmins: [],
    studentOffences: [],
    facultyOffences: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Developer Panel initializing...');
    initializeApp();
});

function initializeApp() {
    console.log('📋 Setting up event listeners...');
    
    // Check if already logged in
    const savedEmail = localStorage.getItem('dev_panel_email');
    const savedToken = localStorage.getItem('dev_panel_token');
    console.log('💾 Saved credentials:', { email: savedEmail, token: !!savedToken });
    
    if (savedEmail && savedToken) {
        console.log('✅ Auto-login detected, showing dashboard...');
        state.isLoggedIn = true;
        state.developerEmail = savedEmail;
        state.authToken = savedToken;
        showDashboard();
        loadAdminRequests();
    } else {
        console.log('❌ No saved credentials, showing login form');
    }

    // Event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    
    // Tab Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab);
        });
    });

    // Password toggle
    const toggleBtn = document.querySelector('.toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', togglePasswordVisibility);
    }

    // Modal Confirm
    const confirmBtn = document.getElementById('modal-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', executeConfirmedAction);
    }
    
    console.log('✅ Initialization complete');
}

// ===== LOGIN HANDLERS =====
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login attempt started');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    const loader = document.getElementById('login-loader');
    const errorDiv = document.getElementById('login-error');

    // Reset errors
    clearErrors();

    // Validation
    if (!email || !password) {
        console.log('❌ Validation failed: missing fields');
        showError('All fields are required');
        return;
    }

    // Disable button and show loader
    loginBtn.disabled = true;
    loader.classList.add('show');

    console.log('📤 Making login request to:', `${API_URL}/auth/login/`);
    
    try {
        // Authenticate with backend
        const response = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        console.log('📥 Login response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Login successful:', { hasToken: !!data.access_token, user: data.user });
            
            const token = data.access_token;

            // Store credentials and token
            state.isLoggedIn = true;
            state.developerEmail = email;
            state.authToken = token;
            localStorage.setItem('dev_panel_email', email);
            localStorage.setItem('dev_panel_token', token);

            // Show dashboard
            showDashboard();
            loadAdminRequests();

            // Reset form
            document.getElementById('login-form').reset();
            loginBtn.disabled = false;
            loader.classList.remove('show');

            showToast('Successfully logged in!', 'success');
        } else {
            const errorData = await response.json();
            console.log('❌ Login failed:', errorData);
            showError(errorData.error || 'Invalid email or password');
            loginBtn.disabled = false;
            loader.classList.remove('show');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showError('Connection error. Please try again.');
        loginBtn.disabled = false;
        loader.classList.remove('show');
    }
}

function handleLogout() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) return;

    state.isLoggedIn = false;
    state.developerEmail = null;
    state.authToken = null;
    localStorage.removeItem('dev_panel_email');
    localStorage.removeItem('dev_panel_token');

    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('login-form').reset();

    showToast('You have been logged out', 'success');
}

// ===== DASHBOARD HANDLERS =====
function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('dev-email-display').textContent = state.developerEmail;
}

function switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // refresh data when switching so panel picks up new signups
    loadAdminRequests();
}

// ===== ADMIN REQUEST HANDLERS =====
async function loadAdminRequests() {
    try {
        // fetch pending admin requests from backend
        const pendingHeaders = { 'Content-Type': 'application/json' };
        if (state.authToken) pendingHeaders['Authorization'] = `Bearer ${state.authToken}`;
        const respPending = await fetch(`${API_URL}/admin/pending-admins/`, {
            method: 'GET',
            headers: pendingHeaders
        });
        if (respPending.ok) {
            const pendingData = await respPending.json();
            state.pendingAdmins = pendingData.pending_admins || [];
        } else {
            console.warn('Unable to load pending admins', respPending.status);
            state.pendingAdmins = [];
        }
    } catch (err) {
        console.error('Error fetching pending admins:', err);
        state.pendingAdmins = [];
    }

    try {
        // Fetch real admin data from database with authentication
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add Authorization header if token exists
        if (state.authToken) {
            headers['Authorization'] = `Bearer ${state.authToken}`;
        }

        const response = await fetch(`${API_URL}/admin/admins/`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const admins = data.admins || [];

            state.approvedAdmins = admins.map(admin => ({
                id: admin.id,
                name: admin.name,
                email: admin.email,
                registration_id: admin.registration_id,
                dob: admin.dob,
                approved_date: admin.created_at,
                phone: admin.phone
            }));

            renderPendingAdmins();
            renderApprovedAdmins();
        } else if (response.status === 401) {
            // Token expired or invalid, logout
            showToast('Session expired. Please login again.', 'warning');
            handleLogout();
        } else {
            console.error('Failed to fetch admin data:', response.status);
            // still render pending even if admin fetch fails
            renderPendingAdmins();
            renderApprovedAdmins();
        }
    } catch (error) {
        console.error('Error fetching admin data:', error);
        // still render pending even if admin fetch fails
        renderPendingAdmins();
        renderApprovedAdmins();
    }
    // Fetch offence data
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (state.authToken) {
            headers['Authorization'] = `Bearer ${state.authToken}`;
        }

        const [studentResponse, facultyResponse] = await Promise.all([
            fetch(`${API_URL}/safety/student-offences/`, {
                method: 'GET',
                headers: headers
            }),
            fetch(`${API_URL}/safety/faculty-offences/`, {
                method: 'GET',
                headers: headers
            })
        ]);

        if (studentResponse.ok) {
            const studentData = await studentResponse.json();
            state.studentOffences = studentData.offences || [];
        }

        if (facultyResponse.ok) {
            const facultyData = await facultyResponse.json();
            state.facultyOffences = facultyData.offences || [];
        }

        renderOffenceStats();
    } catch (offenceError) {
        console.error('Error fetching offence data:', offenceError);
    }
}

function loadFromLocalStorage() {
    // kept only for legacy backup; pending are no longer stored locally
    const approvedAdminsData = localStorage.getItem('approved_admin_requests');
    state.pendingAdmins = [];
    state.approvedAdmins = approvedAdminsData ? JSON.parse(approvedAdminsData) : [];
    renderPendingAdmins();
    renderApprovedAdmins();
}

function renderPendingAdmins() {
    const tbody = document.getElementById('pending-admins-body');
    const emptyState = document.getElementById('pending-empty-state');
    const table = document.getElementById('pending-admins-table');

    tbody.innerHTML = '';

    if (state.pendingAdmins.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        document.getElementById('admin-count').textContent = 'Total Pending: 0';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';
    document.getElementById('admin-count').textContent = `Total Pending: ${state.pendingAdmins.length}`;

    state.pendingAdmins.forEach((admin, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admin.name}</td>
            <td>${admin.email}</td>
            <td>${admin.registration_id}</td>
            <td>${admin.dob || 'N/A'}</td>
            <td>${formatDate(admin.submitted_at)}</td>
            <td>
                <button class="btn-approve" onclick="approveAdmin(${index})">Approve</button>
                <button class="btn-reject" onclick="rejectAdmin(${index})">Reject</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderApprovedAdmins() {
    console.log('🎨 Rendering approved admins:', state.approvedAdmins.length);
    
    const tbody = document.getElementById('approved-admins-body');
    const emptyState = document.getElementById('approved-empty-state');
    const table = document.getElementById('approved-admins-table');

    if (!tbody || !emptyState || !table) {
        console.error('❌ Required DOM elements not found for admin rendering');
        return;
    }

    tbody.innerHTML = '';

    if (state.approvedAdmins.length === 0) {
        console.log('📭 No approved admins to display');
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    console.log('📊 Displaying', state.approvedAdmins.length, 'admins');
    table.style.display = 'table';
    emptyState.style.display = 'none';

    state.approvedAdmins.forEach((admin, index) => {
        console.log(`👤 Admin ${index + 1}:`, admin.name, admin.email);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admin.name}</td>
            <td>${admin.email}</td>
            <td>${admin.registration_id}</td>
            <td>${admin.dob || 'N/A'}</td>
            <td>${formatDate(admin.approved_date)}</td>
            <td><span class="status-badge approved">Active</span></td>
            <td>
                <button class="btn-delete" onclick="deleteAdmin('${admin.id}')" title="Delete admin">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('✅ Admin rendering complete');
}

async function approveAdmin(index) {
    const admin = state.pendingAdmins[index];
    if (!admin) {
        showToast('Admin record not found', 'error');
        return;
    }

    try {
        const createResp = await fetch(`${API_URL}/auth/admin-signup/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {})
            },
            body: JSON.stringify({
                name: admin.name,
                email: admin.email,
                password: admin.password || 'TempPass@123',
                dob: admin.dob,
                registration_id: admin.registration_id
            })
        });

        if (createResp.ok) {
            const data = await createResp.json();
            showToast('Admin approved and created in backend', 'success');

            // remove pending record on server
            await fetch(`${API_URL}/admin/pending-admins/${admin.id}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {})
                }
            });

            // remove locally too
            state.pendingAdmins.splice(index, 1);

            // add to approved list
            state.approvedAdmins.unshift({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                registration_id: data.user.registration_id,
                dob: data.user.dob,
                approved_date: data.user.created_at
            });

            renderPendingAdmins();
            renderApprovedAdmins();
        } else {
            const err = await createResp.json();
            showToast(`Could not approve admin: ${err.detail || 'error'}`, 'error');
        }
    } catch (err) {
        console.error('approveAdmin error', err);
        showToast('Network error while approving admin', 'error');
    }
}

function rejectAdmin(index) {
    const admin = state.pendingAdmins[index];
    if (!admin) {
        showToast('Admin record not found', 'error');
        return;
    }

    if (!confirm(`Reject and remove request for ${admin.email}?`)) {
        return;
    }

    // delete from server
    fetch(`${API_URL}/admin/pending-admins/${admin.id}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...(state.authToken ? { 'Authorization': `Bearer ${state.authToken}` } : {})
        }
    }).catch(err => console.warn('failed to delete pending admin', err));

    // remove locally
    state.pendingAdmins.splice(index, 1);
    renderPendingAdmins();
    showToast('Admin request rejected', 'warning');
}

async function deleteAdmin(adminId) {
    console.log('🗑️ Delete initiated for admin:', adminId);
    
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
        console.log('❌ Delete cancelled by user');
        return;
    }

    try {
        console.log(`🌐 Sending DELETE request to ${API_URL}/admin/admins/${adminId}/`);
        const response = await fetch(`${API_URL}/admin/admins/${adminId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📥 Response status:', response.status);

        if (response.ok || response.status === 204) {
            showToast('Admin deleted successfully', 'success');
            // Remove from state
            state.approvedAdmins = state.approvedAdmins.filter(a => a.id !== adminId);
            console.log('✅ Admin deleted:', adminId);
            renderApprovedAdmins();
        } else if (response.status === 401) {
            showToast('Session expired. Please login again.', 'warning');
            handleLogout();
        } else {
            const error = await response.json();
            showToast(`Error deleting admin: ${error.detail || 'Unknown error'}`, 'error');
            console.error('❌ Delete failed:', error);
        }
    } catch (error) {
        console.error('Error deleting admin:', error);
        showToast('Error deleting admin', 'error');
    }
}

function executeConfirmedAction() {
    // Since admins are created directly, approval system is not used
    // This function is kept for future use if needed
    closeModal();
    showToast('Admin management is handled through Django admin panel', 'info');
}

function renderOffenceStats() {
    // Update offence statistics in the dashboard
    const totalOffences = state.studentOffences.length + state.facultyOffences.length;
    const paidOffences = [...state.studentOffences, ...state.facultyOffences].filter(o => o.is_paid).length;
    const unpaidOffences = totalOffences - paidOffences;

    // Update stats if elements exist
    const totalOffencesEl = document.getElementById('total-offences');
    const paidOffencesEl = document.getElementById('paid-offences');
    const unpaidOffencesEl = document.getElementById('unpaid-offences');

    if (totalOffencesEl) totalOffencesEl.textContent = totalOffences;
    if (paidOffencesEl) paidOffencesEl.textContent = paidOffences;
    if (unpaidOffencesEl) unpaidOffencesEl.textContent = unpaidOffences;

    // Update offence lists
    renderStudentOffences();
    renderFacultyOffences();

    console.log(`Offence stats updated: ${totalOffences} total, ${paidOffences} paid, ${unpaidOffences} unpaid`);
}

function renderStudentOffences() {
    const container = document.getElementById('student-offences-list');
    if (!container) return;

    container.innerHTML = '';

    if (state.studentOffences.length === 0) {
        container.innerHTML = '<p class="no-data">No student offences recorded</p>';
        return;
    }

    state.studentOffences.forEach(offence => {
        const offenceItem = document.createElement('div');
        offenceItem.className = 'offence-item';
        offenceItem.innerHTML = `
            <div class="offence-header">
                <span class="offence-student">${offence.student_name} (${offence.student_id})</span>
                <span class="offence-severity ${offence.severity}">${offence.severity}</span>
            </div>
            <div class="offence-details">
                <span class="offence-violation">${offence.violation.violation_type}</span>
                <span class="offence-amount">₹${offence.fine_amount}</span>
                <span class="offence-status ${offence.is_paid ? 'paid' : 'unpaid'}">
                    ${offence.is_paid ? '✅ Paid' : '❌ Unpaid'}
                </span>
            </div>
        `;
        container.appendChild(offenceItem);
    });
}

function renderFacultyOffences() {
    const container = document.getElementById('faculty-offences-list');
    if (!container) return;

    container.innerHTML = '';

    if (state.facultyOffences.length === 0) {
        container.innerHTML = '<p class="no-data">No faculty offences recorded</p>';
        return;
    }

    state.facultyOffences.forEach(offence => {
        const offenceItem = document.createElement('div');
        offenceItem.className = 'offence-item';
        offenceItem.innerHTML = `
            <div class="offence-header">
                <span class="offence-faculty">${offence.faculty_name} (${offence.faculty_id})</span>
                <span class="offence-severity ${offence.severity}">${offence.severity}</span>
            </div>
            <div class="offence-details">
                <span class="offence-violation">${offence.violation.violation_type}</span>
                <span class="offence-amount">₹${offence.fine_amount}</span>
                <span class="offence-status ${offence.is_paid ? 'paid' : 'unpaid'}">
                    ${offence.is_paid ? '✅ Paid' : '❌ Unpaid'}
                </span>
            </div>
        `;
        container.appendChild(offenceItem);
    });
}

// ===== MODAL HANDLERS =====
function openModal(title, message, confirmButtonText) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal-confirm').textContent = confirmButtonText;
    document.getElementById('confirmation-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    state.currentAction = null;
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function clearErrors() {
    document.getElementById('login-error').classList.remove('show');
    document.getElementById('email-error').classList.remove('show');
    document.getElementById('password-error').classList.remove('show');
}

function showError(message) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function togglePasswordVisibility() {
    const input = document.getElementById('password');
    const button = document.querySelector('.toggle-password');

    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
            <svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    } else {
        input.type = 'password';
        button.innerHTML = `
            <svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconSvg = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg[type]}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== BACKEND INTEGRATION =====
function createAdminInBackend(adminData) {
    // This will be called when an admin is approved
    // Send the credentials to backend to create the user account
    const adminPayload = {
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        dob: adminData.dob,
        registration_id: adminData.registration_id,
        role: 'admin'
    };

    // In production, this would be an API call to the backend
    console.log('Creating admin in backend:', adminPayload);
    
    // API call example (uncomment when backend is ready)
    /*
    fetch(`${API_URL}/admin/create/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getDevToken()}`
        },
        body: JSON.stringify(adminPayload)
    })
    .then(res => res.json())
    .then(data => {
        console.log('Admin created in backend:', data);
    })
    .catch(err => {
        console.error('Error creating admin:', err);
        showToast('Error creating admin in backend', 'error');
    });
    */
}

// ===== EXPOSE FUNCTIONS FOR HTML =====
window.approveAdmin = approveAdmin;
window.rejectAdmin = rejectAdmin;
window.deleteAdmin = deleteAdmin;

// ===== DEMO DATA FOR TESTING =====
// (No longer necessary since pending admins are stored in backend.)
// If you need to seed test entries manually, you can use the API or
// directly insert into the database.

// Uncomment to insert some local demo entries (not used by default):
// function loadDemoData() {
//     const demoAdmins = [
//         {
//             name: 'Dr. Rajesh Kumar',
//             email: 'rajesh.kumar@college.edu',
//             registration_id: 'ADM001',
//             dob: '1985-06-15',
//             password: 'TempPass@123',
//             submitted_date: new Date(Date.now() - 2*24*60*60*1000).toISOString()
//         },
//         {
//             name: 'Prof. Amit Singh',
//             email: 'amit.singh@college.edu',
//             registration_id: 'ADM002',
//             dob: '1982-03-22',
//             password: 'TempPass@456',
//             submitted_date: new Date(Date.now() - 1*24*60*60*1000).toISOString()
//         }
//     ];
//
//     state.pendingAdmins = demoAdmins;
//     renderPendingAdmins();
// }

// Uncomment to load demo data: loadDemoData();
