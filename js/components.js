/* ===== Header & Footer Components ===== */

async function renderHeader() {
  const headerEl = document.getElementById('header');
  if (!headerEl) return;

  const user = await Auth.getCurrentUser();
  if (!user) return;

  const base = getBasePath();
  const role = user.role;
  const current = window.location.pathname.split('/').pop();

  let dropdownLinks = '';

  if (role === 'customer') {
    dropdownLinks = `
      <div class="dropdown-label">การใช้งาน</div>
      <a href="${base}customer/menu.html" class="${current === 'menu.html' ? 'active' : ''}">🛒 สั่งซื้อสินค้า</a>
      <a href="${base}customer/orders.html" class="${current === 'orders.html' ? 'active' : ''}">📋 ประวัติการสั่งซื้อ</a>
      <div class="dropdown-label">บัญชี</div>
      <a href="${base}customer/profile.html" class="${current === 'profile.html' ? 'active' : ''}">👤 แก้ไขโปรไฟล์</a>
    `;
  } else if (role === 'owner') {
    dropdownLinks = `
      <div class="dropdown-label">เมนูหลัก</div>
      <a href="${base}owner/dashboard.html" class="${current === 'dashboard.html' ? 'active' : ''}">📊 ภาพรวมร้าน</a>
      <a href="${base}owner/pos.html" class="${current === 'pos.html' ? 'active' : ''}">🛒 ขายสินค้า</a>
      <a href="${base}owner/orders.html" class="${current === 'orders.html' ? 'active' : ''}">📋 ประวัติคำสั่งซื้อ</a>
      <a href="${base}owner/reports.html" class="${current === 'reports.html' ? 'active' : ''}">📈 รายงานยอดขาย</a>
      <div class="dropdown-label">ระบบจัดการ</div>
      <a href="${base}owner/products.html" class="${current === 'products.html' ? 'active' : ''}">🍹 สินค้าในร้าน</a>
      <a href="${base}owner/employees.html" class="${current === 'employees.html' ? 'active' : ''}">👥 พนักงาน</a>
      <a href="${base}owner/customers.html" class="${current === 'customers.html' ? 'active' : ''}">🤝 ข้อมูลลูกค้า</a>
      <div class="dropdown-label">บัญชี</div>
      <a href="${base}owner/profile.html" class="${current === 'profile.html' ? 'active' : ''}">👤 แก้ไขโปรไฟล์</a>
    `;
  } else { // Employee
    dropdownLinks = `
      <div class="dropdown-label">เมนูหลัก</div>
      <a href="${base}employee/dashboard.html" class="${current === 'dashboard.html' ? 'active' : ''}">📊 ภาพรวม</a>
      <a href="${base}employee/pos.html" class="${current === 'pos.html' ? 'active' : ''}">🛒 ขายสินค้า</a>
      <a href="${base}employee/orders.html" class="${current === 'orders.html' ? 'active' : ''}">📋 ประวัติคำสั่งซื้อ</a>
      <div class="dropdown-label">จัดการ</div>
      <a href="${base}employee/customers.html" class="${current === 'customers.html' ? 'active' : ''}">🤝 ลูกค้า</a>
      <div class="dropdown-label">บัญชี</div>
      <a href="${base}employee/profile.html" class="${current === 'profile.html' ? 'active' : ''}">👤 แก้ไขโปรไฟล์</a>
    `;
  }

  headerEl.innerHTML = `
    <header class="app-header main-header">
      <div class="header-container">
        <a href="${base}${role}/dashboard.html" class="header-brand">
          <span class="brand-emoji">🍹</span>
          <div class="brand-text">
            <span>ป้าณาน้ำผลไม้ปั่น</span>
            <small>${role === 'owner' ? 'Owner Admin' : role === 'employee' ? 'Staff POS' : 'Customer'}</small>
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
                <strong>${user.name}</strong>
                <p>${role === 'owner' ? 'เจ้าของร้าน' : role === 'employee' ? 'พนักงาน' : 'ลูกค้า'}</p>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-scroll-area">
                ${dropdownLinks}
              </div>
              <div class="dropdown-divider"></div>
              <a href="#" class="logout-link" onclick="Auth.logout();return false">🚪 ออกจากระบบ</a>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="sidebar-overlay" id="menuOverlay" onclick="closeUserMenu()"></div>
  `;
}

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

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#mainUserDropdown')) {
    closeUserMenu();
  }
});

function renderFooter() {
  const footerEl = document.getElementById('footer');
  if (!footerEl) return;
  footerEl.innerHTML = `
    <footer class="app-footer">
      <p>© 2026 <span class="footer-brand">ป้าณาน้ำผลไม้ปั่น</span> — ระบบบริหารจัดการร้าน</p>
    </footer>
  `;
}

/* Mobile cart panel bottom-sheet toggle */
function initMobileCart() {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (!isMobile) return;

  // POS cart panel
  const cartHeaders = document.querySelectorAll('.cart-header');
  cartHeaders.forEach(header => {
    header.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      const panel = header.closest('.cart-panel') || header.closest('#customerCartPanel');
      if (panel) panel.classList.toggle('open');
    });
  });

  // Customer cart panel
  const custCart = document.getElementById('customerCartPanel');
  if (custCart) {
    const custHeader = custCart.querySelector('.cart-header');
    if (custHeader) {
      custHeader.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        custCart.classList.toggle('open');
      });
    }
  }
}

async function initComponents() {
  await renderHeader();
  renderFooter();
  // Init mobile features after DOM is ready
  setTimeout(() => {
    initMobileCart();
  }, 100);
}

