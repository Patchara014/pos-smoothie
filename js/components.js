/* ===== Header & Footer Components ===== */

async function renderHeader() {
  const headerEl = document.getElementById('header');
  if (!headerEl) return;

  const user = await Auth.getCurrentUser();
  if (!user) return;

  const base = getBasePath();
  const role = user.role;
  let navLinks = '';

  if (role === 'customer') {
    const current = window.location.pathname.split('/').pop();
    navLinks = `
      <a href="${base}customer/menu.html" class="${current === 'menu.html' ? 'active' : ''}">🛒 สั่งซื้อ</a>
      <a href="${base}customer/orders.html" class="${current === 'orders.html' ? 'active' : ''}">📋 ประวัติ</a>
      <a href="${base}customer/profile.html" class="${current === 'profile.html' ? 'active' : ''}">👤 โปรไฟล์</a>
    `;
    headerEl.innerHTML = `
      <div class="app-header">
        <div class="header-brand">
          <span>🍹 ป้าณาน้ำผลไม้ปั่น</span>
        </div>
        <nav class="header-nav">${navLinks}</nav>
        <div class="header-user">
          <div class="user-dropdown">
            <div class="avatar" style="cursor:pointer">${getInitials(user.name)}</div>
            <div class="user-dropdown-menu">
              <a href="${base}customer/profile.html">👤 แก้ไขโปรไฟล์</a>
              <a href="#" onclick="Auth.logout();return false">🚪 ออกจากระบบ</a>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Owner / Employee — sidebar
  const current = window.location.pathname.split('/').pop();

  if (role === 'owner') {
    navLinks = `
      <div class="nav-label">เมนูหลัก</div>
      <a href="${base}owner/dashboard.html" class="${current === 'dashboard.html' ? 'active' : ''}"><span class="nav-icon">📊</span> ภาพรวม</a>
      <a href="${base}owner/pos.html" class="${current === 'pos.html' ? 'active' : ''}"><span class="nav-icon">🛒</span> ขายสินค้า</a>
      <a href="${base}owner/orders.html" class="${current === 'orders.html' ? 'active' : ''}"><span class="nav-icon">📋</span> ประวัติคำสั่งซื้อ</a>
      <a href="${base}owner/reports.html" class="${current === 'reports.html' ? 'active' : ''}"><span class="nav-icon">📈</span> รายงานยอดขาย</a>
      <div class="nav-label">จัดการ</div>
      <a href="${base}owner/products.html" class="${current === 'products.html' ? 'active' : ''}"><span class="nav-icon">🍹</span> จัดการสินค้า</a>
      <a href="${base}owner/employees.html" class="${current === 'employees.html' ? 'active' : ''}"><span class="nav-icon">👥</span> จัดการพนักงาน</a>
      <a href="${base}owner/customers.html" class="${current === 'customers.html' ? 'active' : ''}"><span class="nav-icon">🤝</span> จัดการลูกค้า</a>
      <div class="nav-label">ตั้งค่า</div>
      <a href="${base}owner/profile.html" class="${current === 'profile.html' ? 'active' : ''}"><span class="nav-icon">👤</span> แก้ไขโปรไฟล์</a>
    `;
  } else {
    navLinks = `
      <div class="nav-label">เมนูหลัก</div>
      <a href="${base}employee/dashboard.html" class="${current === 'dashboard.html' ? 'active' : ''}"><span class="nav-icon">📊</span> ภาพรวม</a>
      <a href="${base}employee/pos.html" class="${current === 'pos.html' ? 'active' : ''}"><span class="nav-icon">🛒</span> ขายสินค้า</a>
      <a href="${base}employee/orders.html" class="${current === 'orders.html' ? 'active' : ''}"><span class="nav-icon">📋</span> ประวัติคำสั่งซื้อ</a>
      <div class="nav-label">จัดการ</div>
      <a href="${base}employee/customers.html" class="${current === 'customers.html' ? 'active' : ''}"><span class="nav-icon">🤝</span> จัดการลูกค้า</a>
      <div class="nav-label">ตั้งค่า</div>
      <a href="${base}employee/profile.html" class="${current === 'profile.html' ? 'active' : ''}"><span class="nav-icon">👤</span> แก้ไขโปรไฟล์</a>
    `;
  }

  headerEl.innerHTML = `
    <div class="mobile-sidebar-header">
      <button class="mobile-toggle" onclick="toggleSidebar()">☰</button>
      <div class="mobile-brand">🍹 ป้าณาน้ำผลไม้ปั่น</div>
    </div>
    <div class="sidebar-overlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="logo">🍹</div>
        <div class="brand-text">ป้าณาน้ำผลไม้ปั่น<small>${role === 'owner' ? 'ระบบเจ้าของร้าน' : 'ระบบพนักงาน'}</small></div>
      </div>
      <nav class="sidebar-nav">${navLinks}</nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">${getInitials(user.name)}</div>
          <div>
            <div class="user-name">${user.name}</div>
            <div class="user-role">${role === 'owner' ? 'เจ้าของร้าน' : 'พนักงาน'}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm w-full" style="margin-top:.5rem" onclick="Auth.logout()">🚪 ออกจากระบบ</button>
      </div>
    </aside>
  `;
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function renderFooter() {
  const footerEl = document.getElementById('footer');
  if (!footerEl) return;
  footerEl.innerHTML = `
    <footer class="app-footer">
      <p>© 2026 <span class="footer-brand">ป้าณาน้ำผลไม้ปั่น</span> — ระบบบริหารจัดการร้าน | พัฒนาด้วย ❤️</p>
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

/* Touch-friendly user dropdown (hover doesn't work on mobile) */
function initMobileDropdown() {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (!isMobile) return;

  const dropdown = document.querySelector('.user-dropdown');
  if (!dropdown) return;

  const avatar = dropdown.querySelector('.avatar');
  const menu = dropdown.querySelector('.user-dropdown-menu');
  if (!avatar || !menu) return;

  avatar.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.style.opacity = menu.style.opacity === '1' ? '0' : '1';
    menu.style.visibility = menu.style.visibility === 'visible' ? 'hidden' : 'visible';
    menu.style.transform = menu.style.transform === 'translateY(0px)' ? 'translateY(-10px)' : 'translateY(0px)';
  });

  // Close when tapping elsewhere
  document.addEventListener('click', function () {
    menu.style.opacity = '0';
    menu.style.visibility = 'hidden';
    menu.style.transform = 'translateY(-10px)';
  });
}

/* Close sidebar when clicking a nav link on mobile */
function initSidebarNavClose() {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (!isMobile) return;

  const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function () {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    });
  });
}

async function initComponents() {
  await renderHeader();
  renderFooter();
  // Init mobile features after DOM is ready
  setTimeout(() => {
    initMobileCart();
    initMobileDropdown();
    initSidebarNavClose();
  }, 100);
}

