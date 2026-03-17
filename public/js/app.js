// public/js/app.js

// Utility to escape HTML and prevent XSS
window.escapeHTML = (str) => {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
};

const initApp = () => {
    const token = localStorage.getItem('jwt_token');
    const userDataStr = localStorage.getItem('user_data');

    if (!token || !userDataStr) {
        window.location.hash = '#login';
        renderLogin();
        return;
    }

    const userData = JSON.parse(userDataStr);
    setupNavbar(userData);

    const hash = window.location.hash || '#dashboard';

    if (hash === '#dashboard') {
        if (userData.rol === 'admin' || userData.rol === 'director') {
            renderAdminDashboard();
        } else if (userData.rol === 'asesor') {
            renderAsesorDashboard();
        }
    } else {
        // Fallback for unknown routes
        renderAdminDashboard();
    }
};

const setupNavbar = (userData) => {
    const navbar = document.getElementById('navbar');
    const navLinks = document.getElementById('nav-links');

    navbar.style.display = 'block';

    let linksHtml = `
        <span class="text-sm mr-4">Hola, ${window.escapeHTML(userData.nombre)} (${window.escapeHTML(userData.rol)})</span>
        <a href="#dashboard" class="text-sm hover:text-blue-200">Panel</a>
        <a href="#historial" class="text-sm hover:text-blue-200" onclick="showHistory()">Historial</a>
    `;

    linksHtml += `
        <button onclick="logout()" class="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded ml-4">
            Cerrar Sesión
        </button>
    `;

    navLinks.innerHTML = linksHtml;
};

window.logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    window.location.hash = '#login';
    initApp();
};

window.showHistory = async () => {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '<h2 class="text-2xl font-bold mb-4">Cargando historial...</h2>';

    try {
        const history = await api.getCallHistory();

        let html = `
            <div class="w-full bg-white p-4 shadow-md rounded-lg">
                <h2 class="text-2xl font-bold mb-4">Historial de Llamadas</h2>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-6 py-3">Fecha</th>
                                <th class="px-6 py-3">Prospecto</th>
                                <th class="px-6 py-3">Asesor</th>
                                <th class="px-6 py-3">Duración (s)</th>
                                <th class="px-6 py-3">Estado</th>
                                <th class="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (history.length === 0) {
            html += `<tr><td colspan="6" class="px-6 py-4 text-center">No hay registros de llamadas.</td></tr>`;
        } else {
            history.forEach(call => {
                html += `
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <td class="px-6 py-4">${window.escapeHTML(new Date(call.fecha_inicio).toLocaleString())}</td>
                        <td class="px-6 py-4">${window.escapeHTML(call.prospecto)} (${window.escapeHTML(call.telefono)})</td>
                        <td class="px-6 py-4">${window.escapeHTML(call.asesor || 'Desconocido')}</td>
                        <td class="px-6 py-4">${window.escapeHTML(call.duracion || 0)}s</td>
                        <td class="px-6 py-4"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">${window.escapeHTML(call.estado)}</span></td>
                        <td class="px-6 py-4 flex gap-2">
                            ${call.grabacion_url ? `<a href="/${window.escapeHTML(call.grabacion_url)}" target="_blank" class="text-blue-600 hover:underline">Audio</a>` : ''}
                            ${call.archivo_adjunto ? `<a href="/${window.escapeHTML(call.archivo_adjunto)}" target="_blank" class="text-green-600 hover:underline">Adjunto</a>` : ''}
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        appContainer.innerHTML = html;

    } catch (e) {
        appContainer.innerHTML = '<p class="text-red-500">Error cargando historial.</p>';
    }
};

// Handle route changes
window.addEventListener('hashchange', () => {
    initApp();
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
