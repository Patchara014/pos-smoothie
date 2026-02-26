/* ===== Auth Module — Supabase ===== */
const Auth = {
    async login(username, password) {
        const user = await DataStore.getUserByUsername(username);
        if (!user) return { success: false, message: 'ไม่พบบัญชีผู้ใช้นี้' };
        if (user.password !== password) return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
        sessionStorage.setItem('pos_session', JSON.stringify({ userId: user.id, role: user.role, loginAt: new Date().toISOString() }));
        return { success: true, user };
    },

    async register(data) {
        const existing = await DataStore.getUserByUsername(data.username);
        if (existing) return { success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' };
        const user = await DataStore.addUser({ ...data, role: data.role || 'customer' });
        if (!user) return { success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
        return { success: true, user };
    },

    logout() {
        sessionStorage.removeItem('pos_session');
        window.location.href = getBasePath() + 'index.html';
    },

    getSession() {
        try { return JSON.parse(sessionStorage.getItem('pos_session')); } catch { return null; }
    },

    async getCurrentUser() {
        const session = this.getSession();
        if (!session) return null;
        return await DataStore.getUser(session.userId);
    },

    isLoggedIn() { return !!this.getSession(); },

    checkRole(allowedRoles) {
        const session = this.getSession();
        if (!session) return false;
        return allowedRoles.includes(session.role);
    },

    guard(allowedRoles) {
        if (!this.isLoggedIn()) { window.location.href = getBasePath() + 'index.html'; return false; }
        if (allowedRoles && !this.checkRole(allowedRoles)) { window.location.href = getBasePath() + 'index.html'; return false; }
        return true;
    }
};

function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/owner/') || path.includes('/employee/') || path.includes('/customer/')) return '../';
    return './';
}
