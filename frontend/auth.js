/**
 * Authentication Module
 * Handles Signup, Login, Google Sign-In, and Screen Switching (Auth Screen -> Dashboard Screen)
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authScreen = document.getElementById('authScreen');
        this.dashboardScreen = document.getElementById('dashboardScreen');
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
        // Tab switching on Auth Screen
        const tabLogin = document.getElementById('tabLogin');
        const tabSignup = document.getElementById('tabSignup');
        
        if (tabLogin && tabSignup) {
            tabLogin.addEventListener('click', () => this.switchTab('login'));
            tabSignup.addEventListener('click', () => this.switchTab('signup'));
        }

        // Form submit on Auth Screen
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        // Google Sign-in Buttons
        const googleAuthBtn = document.getElementById('btnGoogleAuth');
        if (googleAuthBtn) {
            googleAuthBtn.addEventListener('click', () => this.openGoogleAuthModal());
        }

        // User Profile Dropdown Toggle
        const userBadge = document.getElementById('userBadge');
        if (userBadge) {
            userBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.userMenuDropdown) {
                    this.userMenuDropdown.classList.toggle('active');
                }
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.userMenuDropdown && !this.userMenuDropdown.contains(e.target) && e.target !== userBadge) {
                this.userMenuDropdown.classList.remove('active');
            }
        });

        // Logout Button
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
        }
    }

    async checkAuthStatus() {
        try {
            this.currentUser = await window.api.getCurrentUser();
            if (this.currentUser) {
                this.showDashboard();
                this.renderUserInterface(this.currentUser);
                if (window.app) window.app.loadAllData();
            } else {
                this.showAuthScreen();
            }
        } catch (err) {
            console.warn('Error checking auth:', err);
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        if (this.authScreen) {
            this.authScreen.style.display = 'flex';
        }
        if (this.dashboardScreen) {
            this.dashboardScreen.style.display = 'none';
        }
    }

    showDashboard() {
        if (this.authScreen) {
            this.authScreen.style.display = 'none';
        }
        if (this.dashboardScreen) {
            this.dashboardScreen.style.display = 'block';
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        const tabLogin = document.getElementById('tabLogin');
        const tabSignup = document.getElementById('tabSignup');
        const nameGroup = document.getElementById('nameGroup');
        const submitBtn = document.getElementById('btnAuthSubmit');
        const authTitle = document.getElementById('authCardTitle');
        const authSubtitle = document.getElementById('authCardSubtitle');

        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            if (nameGroup) nameGroup.style.display = 'none';
            if (submitBtn) submitBtn.textContent = 'Sign In to Account';
            if (authTitle) authTitle.textContent = 'Welcome Back';
            if (authSubtitle) authSubtitle.textContent = 'Enter your credentials to access your study planner';
        } else {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            if (nameGroup) nameGroup.style.display = 'flex';
            if (submitBtn) submitBtn.textContent = 'Create New Account';
            if (authTitle) authTitle.textContent = 'Create an Account';
            if (authSubtitle) authSubtitle.textContent = 'Start organizing your tasks, readings, and study schedule';
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
            submitBtn.textContent = 'Authenticating...';

            let result;
            if (this.currentTab === 'login') {
                result = await window.api.login(email, password);
                window.showToast(`Welcome back, ${result.user.name}!`, 'success');
            } else {
                const name = document.getElementById('authName').value.trim();
                if (!name) throw new Error('Please enter your full name.');
                result = await window.api.register(name, email, password);
                window.showToast('Account created successfully!', 'success');
            }

            this.currentUser = result.user;
            this.renderUserInterface(this.currentUser);
            this.showDashboard();

            if (window.app) window.app.loadAllData();
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

            const profile = {
                name: accountName,
                email: accountEmail,
                picture: avatarUrl,
                googleId: 'g_' + Math.random().toString(36).substring(2, 10)
            };

            const result = await window.api.googleAuth(profile);
            this.currentUser = result.user;
            this.renderUserInterface(this.currentUser);
            this.showDashboard();

            window.showToast(`Signed in with Google as ${result.user.name}!`, 'success');

            if (window.app) window.app.loadAllData();
        } catch (err) {
            window.showToast('Google sign-in error: ' + err.message, 'error');
        }
    }

    logout() {
        window.api.logout();
        this.currentUser = null;
        if (this.userMenuDropdown) {
            this.userMenuDropdown.classList.remove('active');
        }
        window.showToast('You have been signed out.', 'info');
        this.showAuthScreen();
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
