async function setupUserInterface() {
    const response = await fetch('/get_user_role');
    const data = await response.json();
    const userRole = data.rol;
    
    // Desktop navigation elements
    const adminSection = document.getElementById('adminSection');
    const userSection = document.getElementById('userSection');
    const loginSection = document.getElementById('loginSection');
    const closeSession = document.getElementById('closeSession');
    
    // Mobile navigation elements
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const mobileAdminBtn = document.getElementById('mobile-admin-btn');

    // Mostrar/ocultar secciones según el rol
    if (userRole === 'admin') {
        // Desktop navigation updates
        document.querySelector('.navbar__nav').style.gridColumn = '6/6';
        adminSection.style.display = 'block';
        userSection.style.display = 'block';
        loginSection.style.display = 'none';
        closeSession.style.display = 'block'; // Mostrar cerrar sesión
        
        // Mobile navigation updates
        mobileLoginBtn.href = '/user';
        mobileLogoutBtn.style.display = 'block';
        mobileAdminBtn.style.display = 'block';
    } else if (userRole === 'usuario') {
        // Desktop navigation updates
        adminSection.style.display = 'none';
        userSection.style.display = 'block';
        loginSection.style.display = 'none';
        closeSession.style.display = 'block'; // Mostrar cerrar sesión
        
        // Mobile navigation updates
        mobileLoginBtn.href = '/user';
        mobileLogoutBtn.style.display = 'block';
        mobileAdminBtn.style.display = 'none';
    } else {
        // Desktop navigation updates
        adminSection.style.display = 'none';
        userSection.style.display = 'none';
        loginSection.style.display = 'block';
        closeSession.style.display = 'none'; 
        
        // Mobile navigation updates
        mobileLoginBtn.href = '/login';
        mobileLogoutBtn.style.display = 'none';
        mobileAdminBtn.style.display = 'none';
    }

    return userRole;
}
