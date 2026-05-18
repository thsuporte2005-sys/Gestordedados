// services/auth.js - Autenticacao local com fallback Supabase-ready
(function () {
    const USERS_KEY = 'gestor_auth_users';
    const SESSION_KEY = 'gestor_auth_session';
    const PROFILE_KEY = 'gestor_profile';
    const DEVICES_KEY = 'gestor_devices';
    const NOTIFICATION_PREFS_KEY = 'gestor_notification_prefs';

    const defaultProfile = {
        displayName: 'Tiago Silva',
        email: 'admin@gestor.com',
        role: 'Admin do Ecossistema',
        avatarData: '',
        avatarZoom: 100,
        avatarX: 50,
        avatarY: 50
    };

    const defaultPrefs = {
        sales: true,
        pixel: true,
        ai: true,
        channels: {
            push: true,
            email: true,
            central: true
        }
    };

    function readJSON(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function randomId(prefix) {
        return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    }

    async function hashSecret(secret) {
        if (window.crypto?.subtle) {
            const data = new TextEncoder().encode(secret);
            const digest = await window.crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
        }
        return btoa(unescape(encodeURIComponent(secret)));
    }

    function isSupabaseAuthReady() {
        return Boolean(window.supabaseClient?.auth);
    }

    function getUsers() {
        return readJSON(USERS_KEY, []);
    }

    function saveUsers(users) {
        writeJSON(USERS_KEY, users);
    }

    async function ensureSeedUser() {
        const users = getUsers();
        if (users.length > 0) return;

        users.push({
            id: 'user_demo_tiago',
            displayName: defaultProfile.displayName,
            email: defaultProfile.email,
            passwordHash: await hashSecret('Admin123!'),
            role: defaultProfile.role,
            createdAt: new Date().toISOString()
        });
        saveUsers(users);
        if (!localStorage.getItem(PROFILE_KEY)) writeJSON(PROFILE_KEY, defaultProfile);
        if (!localStorage.getItem(NOTIFICATION_PREFS_KEY)) writeJSON(NOTIFICATION_PREFS_KEY, defaultPrefs);
    }

    function getProfile() {
        return { ...defaultProfile, ...readJSON(PROFILE_KEY, defaultProfile) };
    }

    function saveProfile(profile) {
        const nextProfile = { ...getProfile(), ...profile };
        writeJSON(PROFILE_KEY, nextProfile);
        return nextProfile;
    }

    function getNotificationPrefs() {
        const prefs = readJSON(NOTIFICATION_PREFS_KEY, defaultPrefs);
        return {
            ...defaultPrefs,
            ...prefs,
            channels: { ...defaultPrefs.channels, ...(prefs.channels || {}) }
        };
    }

    function saveNotificationPrefs(prefs) {
        const nextPrefs = {
            ...getNotificationPrefs(),
            ...prefs,
            channels: { ...getNotificationPrefs().channels, ...(prefs.channels || {}) }
        };
        writeJSON(NOTIFICATION_PREFS_KEY, nextPrefs);
        return nextPrefs;
    }

    function detectDevice() {
        const ua = navigator.userAgent || '';
        const isMobile = /iphone|android|mobile/i.test(ua);
        const isMac = /macintosh|mac os/i.test(ua);
        const isWindows = /windows/i.test(ua);
        return {
            type: isMobile ? 'mobile' : 'desktop',
            name: isMobile ? 'Dispositivo movel' : isMac ? 'MacBook / Desktop macOS' : isWindows ? 'Desktop Windows' : 'Navegador atual',
            location: 'Brasil',
            userAgent: ua
        };
    }

    function getDevices() {
        const devices = readJSON(DEVICES_KEY, []);
        const session = getSession();
        return devices.map(device => ({
            ...device,
            current: Boolean(session && device.sessionId === session.sessionId)
        }));
    }

    function saveDevices(devices) {
        writeJSON(DEVICES_KEY, devices);
    }

    function registerDevice(session) {
        const deviceInfo = detectDevice();
        const devices = getDevices().filter(device => device.sessionId !== session.sessionId);
        devices.unshift({
            id: randomId('device'),
            sessionId: session.sessionId,
            userId: session.userId,
            name: deviceInfo.name,
            type: deviceInfo.type,
            location: deviceInfo.location,
            lastAccess: new Date().toISOString(),
            userAgent: deviceInfo.userAgent
        });
        saveDevices(devices.slice(0, 8));
    }

    function getSession() {
        return readJSON(SESSION_KEY, null);
    }

    function setSession(user) {
        const session = {
            sessionId: randomId('session'),
            userId: user.id,
            email: user.email,
            displayName: user.displayName || user.email,
            role: user.role || defaultProfile.role,
            createdAt: new Date().toISOString()
        };
        writeJSON(SESSION_KEY, session);
        saveProfile({
            displayName: session.displayName,
            email: session.email,
            role: session.role
        });
        registerDevice(session);
        return session;
    }

    async function signIn(email, password) {
        await ensureSeedUser();
        const cleanEmail = String(email || '').trim().toLowerCase();

        if (isSupabaseAuthReady()) {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email: cleanEmail, password });
            if (error) throw new Error(error.message);
            return setSession({
                id: data.user.id,
                email: data.user.email,
                displayName: data.user.user_metadata?.display_name || defaultProfile.displayName,
                role: data.user.user_metadata?.role || defaultProfile.role
            });
        }

        const passwordHash = await hashSecret(password);
        const users = getUsers();
        const user = users.find(item => item.email.toLowerCase() === cleanEmail && item.passwordHash === passwordHash);
        if (!user) throw new Error('E-mail ou senha invalidos.');
        return setSession(user);
    }

    async function signUp({ displayName, email, password }) {
        await ensureSeedUser();
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanName = String(displayName || '').trim();

        if (isSupabaseAuthReady()) {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    data: {
                        display_name: cleanName,
                        role: defaultProfile.role
                    }
                }
            });
            if (error) throw new Error(error.message);
            return setSession({
                id: data.user?.id || randomId('user'),
                email: cleanEmail,
                displayName: cleanName,
                role: defaultProfile.role
            });
        }

        const users = getUsers();
        if (users.some(user => user.email.toLowerCase() === cleanEmail)) {
            throw new Error('Este e-mail ja possui uma conta.');
        }

        const user = {
            id: randomId('user'),
            displayName: cleanName,
            email: cleanEmail,
            passwordHash: await hashSecret(password),
            role: defaultProfile.role,
            createdAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        return setSession(user);
    }

    async function requestPasswordReset(email) {
        const cleanEmail = String(email || '').trim().toLowerCase();

        if (isSupabaseAuthReady()) {
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(cleanEmail);
            if (error) throw new Error(error.message);
            return { sent: true };
        }

        const users = getUsers();
        if (!users.some(user => user.email.toLowerCase() === cleanEmail)) {
            throw new Error('Nao encontramos uma conta com este e-mail.');
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        writeJSON('gestor_password_reset', {
            email: cleanEmail,
            code,
            expiresAt: Date.now() + 10 * 60 * 1000
        });
        return { sent: true, demoCode: code };
    }

    async function confirmPasswordReset({ email, code, password }) {
        const reset = readJSON('gestor_password_reset', null);
        const cleanEmail = String(email || '').trim().toLowerCase();
        if (!reset || reset.email !== cleanEmail || reset.code !== code || reset.expiresAt < Date.now()) {
            throw new Error('Codigo invalido ou expirado.');
        }

        const users = getUsers();
        const idx = users.findIndex(user => user.email.toLowerCase() === cleanEmail);
        if (idx === -1) throw new Error('Conta nao encontrada.');
        users[idx].passwordHash = await hashSecret(password);
        saveUsers(users);
        localStorage.removeItem('gestor_password_reset');
        return true;
    }

    async function updatePassword(currentPassword, newPassword) {
        const session = getSession();
        if (!session) throw new Error('Sessao expirada.');

        if (isSupabaseAuthReady()) {
            const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
            if (error) throw new Error(error.message);
            return true;
        }

        const users = getUsers();
        const idx = users.findIndex(user => user.id === session.userId);
        if (idx === -1) throw new Error('Usuario nao encontrado.');
        if (users[idx].passwordHash !== await hashSecret(currentPassword)) {
            throw new Error('Senha atual incorreta.');
        }
        users[idx].passwordHash = await hashSecret(newPassword);
        saveUsers(users);
        return true;
    }

    function startEmailUpdate(newEmail) {
        const cleanEmail = String(newEmail || '').trim().toLowerCase();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        writeJSON('gestor_email_update', {
            email: cleanEmail,
            code,
            expiresAt: Date.now() + 10 * 60 * 1000
        });
        return code;
    }

    async function confirmEmailUpdate(code) {
        const pending = readJSON('gestor_email_update', null);
        const session = getSession();
        if (!session) throw new Error('Sessao expirada.');
        if (!pending || pending.code !== code || pending.expiresAt < Date.now()) {
            throw new Error('Codigo de e-mail invalido ou expirado.');
        }

        if (isSupabaseAuthReady()) {
            const { error } = await window.supabaseClient.auth.updateUser({ email: pending.email });
            if (error) throw new Error(error.message);
        }

        const users = getUsers();
        const idx = users.findIndex(user => user.id === session.userId);
        if (idx > -1) {
            users[idx].email = pending.email;
            saveUsers(users);
        }

        const nextSession = { ...session, email: pending.email };
        writeJSON(SESSION_KEY, nextSession);
        saveProfile({ email: pending.email });
        localStorage.removeItem('gestor_email_update');
        return pending.email;
    }

    async function signOut() {
        const session = getSession();
        if (isSupabaseAuthReady()) {
            try {
                await window.supabaseClient.auth.signOut();
            } catch (error) {
                console.warn('Falha ao encerrar sessao Supabase', error);
            }
        }
        if (session) {
            const devices = getDevices().filter(device => device.sessionId !== session.sessionId);
            saveDevices(devices);
        }
        localStorage.removeItem(SESSION_KEY);
    }

    function disconnectDevice(deviceId) {
        const session = getSession();
        const devices = getDevices().filter(device => {
            if (device.id !== deviceId) return true;
            return Boolean(session && device.sessionId === session.sessionId);
        });
        saveDevices(devices);
        return getDevices();
    }

    function disconnectOtherDevices() {
        const session = getSession();
        const devices = getDevices().filter(device => session && device.sessionId === session.sessionId);
        saveDevices(devices);
        return devices;
    }

    async function requireAuth() {
        await ensureSeedUser();
        const session = getSession();
        if (!session) {
            window.location.href = 'login.html';
            return null;
        }
        registerDevice(session);
        return session;
    }

    window.AuthManager = {
        ensureSeedUser,
        getSession,
        requireAuth,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        confirmPasswordReset,
        getProfile,
        saveProfile,
        getDevices,
        disconnectDevice,
        disconnectOtherDevices,
        getNotificationPrefs,
        saveNotificationPrefs,
        updatePassword,
        startEmailUpdate,
        confirmEmailUpdate,
        validatePassword(password) {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
        }
    };
})();
