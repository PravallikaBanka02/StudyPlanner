/**
 * Authentication Module
 * Handles Signup, Login, Google Sign-In, and Profile Management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authModal = document.getElementById('authModal');
        this.googleModal = document.getElementById('googleModal');
        this.userMenuDropdown = document.getElementById('userMenuDropdown');
        this.currentTab = 'login'; // 'login' or 'signup'
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuthStatus();
    }

    setupEventListeners() {
        // Tab switching
        const tabLogin = document.getElementById('tabLogin');
        const tabSignup = document.getElementById('tabSignup');
        
        if (tabLogin && tabSignup) {
            tabLogin.addEventListener('click', () => this.switchTab('login'));
            tabSignup.addEventListener('click', () => this.switchTab('signup'));
        }

        // Form submits
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        // Google Sign-in Buttons
        const googleAuthBtn = document.getElementById('btnGoogleAuth');
        if (googleAuthBtn) {
            googleAuthBtn.addEventListener('click', () => this.openGoogleAuthModal());
        }

        // Demo Quick Login
        const demoLoginBtn = document.getElementById('btnDemoLogin');
        if (demoLoginBtn) {
            demoLoginBtn.addEventListener('click', () => this.loginAsDemo());
        }

        // User Profile Dropdown Toggle
        const userBadge = document.getElementById('userBadge');
        if (userBadge) {
            userBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                this.userMenuDropdown.classList.toggle('active');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.userMenuDropdown && !this.userMenuDropdown.contains(e.target) && e.target !== userBadge) {
                this.userMenuDropdown.classList.remove('active');
            }
        });

        // Logout
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
        }

        // Close Auth Modal
        const btnCloseAuth = document.getElementById('btnCloseAuth');
        if (btnCloseAuth) {
            btnCloseAuth.addEventListener('click', () => this.closeAuthModal());
        }
    }

    async checkAuthStatus() {
        try {
            this.currentUser = await window.api.getCurrentUser();
            if (this.currentUser) {
                this.renderUserInterface(this.currentUser);
                if (window.app) window.app.loadTasksAndStats();
            } else {
                // If no user is logged in, default to guest or prompt auth
                this.loginAsDemo();
            }
        } catch (err) {
            console.error('Error verifying auth:', err);
            this.loginAsDemo();
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        const tabLogin = document.getElementById('tabLogin');
        const tabSignup = document.getElementById('tabSignup');
        const nameGroup = document.getElementById('nameGroup');
        const submitBtn = document.getElementById('btnAuthSubmit');
        const authTitle = document.getElementById('authModalTitle');

        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            nameGroup.style.display = 'none';
            submitBtn.textContent = 'Sign In to Account';
            authTitle.textContent = 'Welcome Back';
        } else {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            nameGroup.style.display = 'flex';
            submitBtn.textContent = 'Create New Account';
            authTitle.textContent = 'Get Started with Study Planner';
        }
    }

    openAuthModal(defaultTab = 'login') {
        this.switchTab(defaultTab);
        if (this.authModal) {
            this.authModal.classList.add('active');
        }
    }

    closeAuthModal() {
        if (this.authModal) {
            this.authModal.classList.remove('active');
        }
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        const submitBtn = document.getElementById('btnAuthSubmit');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Please wait...';

            let result;
            if (this.currentTab === 'login') {
                result = await window.api.login(email, password);
                window.showToast('Welcome back, ' + result.user.name + '!', 'success');
            } else {
                const name = document.getElementById('authName').value.trim();
                if (!name) throw new Error('Please enter your full name.');
                result = await window.api.register(name, email, password);
                window.showToast('Account created successfully!', 'success');
            }

            this.currentUser = result.user;
            this.renderUserInterface(this.currentUser);
            this.closeAuthModal();

            if (window.app) window.app.loadTasksAndStats();
        } catch (err) {
            window.showToast(err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    openGoogleAuthModal() {
        if (this.googleModal) {
            this.googleModal.classList.add('active');
        }
    }

    closeGoogleAuthModal() {
        if (this.googleModal) {
            this.googleModal.classList.remove('active');
        }
    }

    async completeGoogleSignIn(accountName, accountEmail, avatarUrl) {
        try {
            this.closeGoogleAuthModal();
            this.closeAuthModal();

            const profile = {
                name: accountName,
                email: accountEmail,
                picture: avatarUrl,
                googleId: 'g_' + Math.random().toString(36).substring(2, 10)
            };

            const result = await window.api.googleAuth(profile);
            this.currentUser = result.user;
            this.renderUserInterface(this.currentUser);

            window.showToast(`Signed in with Google as ${result.user.name}!`, 'success');

            if (window.app) window.app.loadTasksAndStats();
        } catch (err) {
            window.showToast('Google sign-in error: ' + err.message, 'error');
        }
    }

    async loginAsDemo() {
        try {
            const result = await window.api.login('alex@example.com', 'password123');
            this.currentUser = result.user;
            this.renderUserInterface(this.currentUser);
            this.closeAuthModal();
            if (window.app) window.app.loadTasksAndStats();
        } catch (err) {
            console.error('Demo login failed:', err);
        }
    }

    logout() {
        window.api.logout();
        this.currentUser = null;
        this.userMenuDropdown.classList.remove('active');
        window.showToast('You have signed out.', 'info');
        this.openAuthModal('login');
    }

    renderUserInterface(user) {
        const userAvatar = document.getElementById('navUserAvatar');
        const userName = document.getElementById('navUserName');
        const dropdownName = document.getElementById('dropdownUserName');
        const dropdownEmail = document.getElementById('dropdownUserEmail');
        const greetingName = document.getElementById('heroUserName');

        if (userAvatar) userAvatar.src = user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + user.name;
        if (userName) userName.textContent = user.name.split(' ')[0];
        if (dropdownName) dropdownName.textContent = user.name;
        if (dropdownEmail) dropdownEmail.textContent = user.email;
        if (greetingName) greetingName.textContent = user.name.split(' ')[0];
    }
}

// Global Toast notification utility
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

window.authManager = new AuthManager();
