/* ===== ป้าณาน้ำผลไม้ปั่น — UI Component Manager ===== */

/**
 * Renders the Unified Header with Profile Dropdown
 */
async function renderHeader() {
  const headerEl = document.getElementById('header');
  if (!headerEl) return;

  const user = await Auth.getCurrentUser();
  if (!user) return;

  const base = getBasePath();
  const role = user.role;
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';

  // Dynamic Menu Links based on Role
  let dropdownLinks = '';
  if (role === 'customer') {
    dropdownLinks = `
      <div class="dropdown-label">🛒 คำสั่งซื้อ</div>
      <a href="${base}customer/menu.html" class="${current === 'menu.html' ? 'active' : ''}">🥤 สั่งเครื่องดื่ม</a>
      <a href="${base}customer/orders.html" class="${current === 'orders.html' ? 'active' : ''}">📋 ประวัติการสั่งซื้อ</a>
      <div class="dropdown-divider"></div>
      <div class="dropdown-label">👤 บัญชี</div>
      <a href="${base}customer/profile.html" class="${current === 'profile.html' ? 'active' : ''}">⚙️ แก้ไขข้อมูลส่วนตัว</a>
    `;
  } else if (role === 'owner') {
    dropdownLinks = `
      <div class="dropdown-label">📊 ภาพรวม & สถิติ</div>
      <a href="${base}owner/dashboard.html" class="${current === 'dashboard.html' ? 'active' : ''}">📈 แดชบอร์ด</a>
      <a href="${base}owner/pos.html" class="${current === 'pos.html' ? 'active' : ''}">🛒 ขายสินค้า (POS)</a>
      <a href="${base}owner/orders.html" class="${current === 'orders.html' ? 'active' : ''}">🧾 รายการออเดอร์</a>
      <a href="${base}owner/reports.html" class="${current === 'reports.html' ? 'active' : ''}">💹 สรุปยอดขาย</a>
      <div class="dropdown-divider"></div>
      <div class="dropdown-label">🛠️ จัดการระบบ</div>
      <a href="${base}owner/products.html" class="${current === 'products.html' ? 'active' : ''}">🍹 จัดการสินค้า</a>
      <a href="${base}owner/employees.html" class="${current === 'employees.html' ? 'active' : ''}">👥 จัดการพนักงาน</a>
      <a href="${base}owner/customers.html" class="${current === 'customers.html' ? 'active' : ''}">🤝 ข้อมูลลูกค้า</a>
      <div class="dropdown-divider"></div>
      <div class="dropdown-label">👤 บัญชี</div>
      <a href="${base}owner/profile.html" class="${current === 'profile.html' ? 'active' : ''}">⚙️ การตั้งค่าส่วนตัว</a>
    `;
  } else { // Employee
    dropdownLinks = `
      <div class="dropdown-label">🛒 งานปัจจุบัน</div>
      <a href="${base}employee/dashboard.html" class="${current === 'dashboard.html' ? 'active' : ''}">📈 หน้าแรก</a>
      <a href="${base}employee/pos.html" class="${current === 'pos.html' ? 'active' : ''}">🛒 ขายสินค้า (POS)</a>
      <a href="${base}employee/orders.html" class="${current === 'orders.html' ? 'active' : ''}">🧾 ดูออเดอร์ทั้งหมด</a>
      <div class="dropdown-divider"></div>
      <div class="dropdown-label">👥 บริการ</div>
      <a href="${base}employee/customers.html" class="${current === 'customers.html' ? 'active' : ''}">🤝 ข้อมูลลูกค้า</a>
      <div class="dropdown-divider"></div>
      <div class="dropdown-label">👤 บัญชี</div>
      <a href="${base}employee/profile.html" class="${current === 'profile.html' ? 'active' : ''}">⚙️ โปรไฟล์ของฉัน</a>
    `;
  }

  headerEl.innerHTML = `
    <header class="app-header">
      <div class="header-container">
        <a href="${base}${role}/dashboard.html" class="header-brand">
          <span class="brand-emoji">🍹</span>
          <div class="brand-text">
            <span>ป้าณาน้ำผลไม้ปั่น</span>
          </div>
        </a>

        <div class="header-user">
          <div class="user-dropdown" id="mainUserDropdown">
            <div class="avatar-wrapper" onclick="toggleUserMenu(event)">
              <div class="avatar">${getInitials(user.name)}</div>
              <span class="user-display-name">${user.name.split(' ')[0]}</span>
              <span class="dropdown-caret">▼</span>
            </div>
            
            <div class="user-dropdown-menu" id="userMenu">
              <div class="dropdown-user-info">
                <strong>คุณ${user.name}</strong>
                <p>บทบาท: ${role === 'owner' ? 'เจ้าของร้าน (Admin)' : role === 'employee' ? 'พนักงานประจำ' : 'คุณลูกค้า (Member)'}</p>
              </div>
              <div class="dropdown-scroll-area">
                ${dropdownLinks}
              </div>
              <div class="dropdown-divider"></div>
              <a href="#" class="logout-link" onclick="Auth.logout();return false">🚪 ล็อกเอาท์ออกจากระบบ</a>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="sidebar-overlay" id="menuOverlay" onclick="closeUserMenu()"></div>
  `;
}

/**
 * Multi-layer User Menu Toggler
 */
function toggleUserMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('userMenu');
  const overlay = document.getElementById('menuOverlay');
  if (menu) menu.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeUserMenu() {
  const menu = document.getElementById('userMenu');
  const overlay = document.getElementById('menuOverlay');
  if (menu) menu.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// Global click-away handler
document.addEventListener('click', (e) => {
  if (!e.target.closest('#mainUserDropdown')) {
    closeUserMenu();
  }
});

/**
 * Unified Mobile Cart Toggle for BOTH POS and Customer Menu
 */
function initMobileCartToggle() {
  const isMobile = window.innerWidth <= 767;
  if (!isMobile) return;

  // Watch for any .cart-header (handles both POS and Customer)
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.cart-header');
    if (!header) return;

    // Ignore if clicking internal buttons like "Clear Cart"
    if (e.target.closest('button')) return;

    const panel = header.closest('.cart-panel') || document.getElementById('customerCartPanel');
    if (panel) {
      panel.classList.toggle('open');
      // Prevent page scrolling when cart is open as full sheet
      if (panel.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  });
}

function renderFooter() {
  const footerEl = document.getElementById('footer');
  if (!footerEl) return;
  footerEl.innerHTML = `
    <footer class="app-footer" style="padding: var(--sp-2xl) 0; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
      <p>© 2026 — <span style="font-weight:700; color:var(--primary)">ป้าณาน้ำผลไม้ปั่น</span> — ระบบบริหารจัดการร้านอัจฉริยะ</p>
    </footer>
  `;
}

/**
 * Main Initialization Sequence
 */
async function initComponents() {
  await renderHeader();
  renderFooter();
  // Init features after a short tick to ensure DOM is ready
  setTimeout(() => {
    initMobileCartToggle();
  }, 150);
}
