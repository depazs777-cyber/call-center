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
    } else if (hash === '#historial') {
        showHistory();
    } else if (hash === '#crm') {
        showCrmSearch();
    } else {
        // Enforce dashboard as default fallback for valid logged in users instead of admin dashboard
        window.location.hash = '#dashboard';
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
        <a href="#crm" class="text-sm hover:text-blue-200" onclick="showCrmSearch()">CRM</a>
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
                            ${call.grabacion_url ? (() => {
                                let basePath = window.location.pathname.replace(/\/index\.php.*$/, '').replace(/\/+$/, '');
                                // If basePath is empty or /, we just prepend /
                                if (basePath === '') {
                                    basePath = '';
                                }
                                const url = call.grabacion_url.startsWith('/') ? call.grabacion_url : basePath + '/' + call.grabacion_url;
                                return `<a href="${window.escapeHTML(url)}" target="_blank" class="text-blue-600 hover:underline">Audio</a>`;
                            })() : ''}
                            ${call.archivo_adjunto ? (() => {
                                let basePath = window.location.pathname.replace(/\/index\.php.*$/, '').replace(/\/+$/, '');
                                // If basePath is empty or /, we just prepend /
                                if (basePath === '') {
                                    basePath = '';
                                }
                                const url = call.archivo_adjunto.startsWith('/') ? call.archivo_adjunto : basePath + '/' + call.archivo_adjunto;
                                return `<a href="${window.escapeHTML(url)}" target="_blank" class="text-green-600 hover:underline">Adjunto</a>`;
                            })() : ''}
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

let currentCrmProspectId = null;

window.viewProspectCRM = async (prospectId) => {
    currentCrmProspectId = prospectId;
    try {
        const prospect = await apiFetch(`/prospects?id=${prospectId}`);

        document.getElementById('crm-name').textContent = prospect.nombre;
        document.getElementById('crm-phone').textContent = prospect.telefono;
        document.getElementById('crm-email').textContent = prospect.email || '-';
        document.getElementById('crm-city').textContent = prospect.ciudad || '-';
        document.getElementById('crm-campaign').textContent = prospect.campaña_nombre || '-';
        document.getElementById('crm-assigned').textContent = prospect.asignado_a_nombre || 'Sin asignar';
        document.getElementById('crm-notes').value = prospect.notas_internas || '';

        let otrosHtml = '';
        if (prospect.otros) {
            try {
                const otrosData = JSON.parse(prospect.otros);
                if(otrosData.length > 0) {
                    otrosHtml = '<strong>Otros datos:</strong><br>' + otrosData.map(v => window.escapeHTML(v)).join('<br>');
                }
            } catch(e) {}
        }
        document.getElementById('crm-otros').innerHTML = otrosHtml;

        const historyList = document.getElementById('crm-history-list');
        historyList.innerHTML = '';

        if (!prospect.historial || prospect.historial.length === 0) {
            historyList.innerHTML = '<p class="text-sm text-gray-500 italic mt-2 ml-4">No hay interacciones registradas.</p>';
        } else {
            prospect.historial.forEach(h => {
                const li = document.createElement('li');
                li.className = 'mb-4 ml-6';
                li.innerHTML = `
                    <span class="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                        <svg class="w-3 h-3 text-blue-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                        </svg>
                    </span>
                    <div class="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div class="flex justify-between items-center mb-1">
                            <time class="mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0">${h.fecha_inicio}</time>
                            <div class="text-sm font-normal text-gray-500">
                                Llamada por <span class="font-semibold text-gray-900">${window.escapeHTML(h.asesor_nombre || 'Desconocido')}</span>
                            </div>
                        </div>
                        <div class="p-2 text-xs font-normal text-gray-500 border border-gray-200 rounded-lg bg-gray-50 mt-2">
                            <p><strong>Estado:</strong> ${window.escapeHTML(h.estado)}</p>
                            ${h.medio_contacto ? `<p><strong>Medio:</strong> ${window.escapeHTML(h.medio_contacto)}</p>` : ''}
                            <p><strong>Duración:</strong> ${h.duracion} seg</p>
                            ${h.comentarios ? `<p class="mt-1 border-t pt-1"><strong>Comentarios:</strong> ${window.escapeHTML(h.comentarios)}</p>` : ''}
                            ${h.archivo_adjunto ? `<a href="${h.archivo_adjunto}" target="_blank" class="inline-flex items-center mt-2 text-blue-600 hover:underline"><i class="fas fa-paperclip mr-1"></i> Adjunto</a>` : ''}
                            ${h.grabacion_url ? `<a href="${h.grabacion_url}" target="_blank" class="inline-flex items-center mt-2 ml-3 text-green-600 hover:underline"><i class="fas fa-play mr-1"></i> Grabación</a>` : ''}
                        </div>
                    </div>
                `;
                historyList.appendChild(li);
            });
        }

        document.getElementById('crm-modal').classList.remove('hidden');
    } catch (e) {
        alert(e.message);
    }
};

window.closeCrmModal = () => {
    document.getElementById('crm-modal').classList.add('hidden');
    currentCrmProspectId = null;
};

window.showCrmSearch = async () => {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="w-full">
            <h1 class="text-3xl font-bold mb-6">Búsqueda CRM</h1>
            <div class="bg-white p-4 rounded-lg shadow-md mb-6">
                <form id="crm-search-form" class="flex gap-4 items-end">
                    <div class="w-full max-w-md">
                        <label class="block mb-2 text-sm font-medium text-gray-900">Buscar Prospecto</label>
                        <input type="text" id="crm-search-input" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Nombre o Teléfono..." required>
                    </div>
                    <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Buscar</button>
                </form>
            </div>

            <div id="crm-search-results" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div class="col-span-full text-center text-gray-500 py-8">Ingrese un término de búsqueda para comenzar</div>
            </div>
        </div>
    `;

    const loadAllCrmProspects = async () => {
        const resultsContainer = document.getElementById('crm-search-results');
        resultsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">Cargando prospectos...</div>';

        try {
            const prospects = await apiFetch(`/prospects`);

            if (prospects.length === 0) {
                resultsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No se encontraron prospectos</div>';
                return;
            }

            renderCrmResults(prospects, resultsContainer);
        } catch (err) {
            resultsContainer.innerHTML = `<div class="col-span-full text-center text-red-500 py-8">Error: ${window.escapeHTML(err.message)}</div>`;
        }
    };

    const renderCrmResults = (prospects, container) => {
        let html = '';
        prospects.forEach(p => {
            let borderColor = 'border-gray-100';

            if (!p.ultimo_estado) {
                borderColor = 'border-red-500 border-2';
            } else if (['No contestó', 'Buzón de voz'].includes(p.ultimo_estado)) {
                borderColor = 'border-yellow-400 border-2';
            } else if (['Venta efectiva', 'Cita agendada'].includes(p.ultimo_estado)) {
                borderColor = 'border-green-500 border-2';
            } else if (['Cliente no interesado', 'Equivocado'].includes(p.ultimo_estado)) {
                borderColor = 'border-purple-500 border-2';
            }

            html += `
                <div class="bg-white p-4 rounded-lg shadow ${borderColor} flex flex-col justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">${window.escapeHTML(p.nombre)}</h3>
                        <p class="text-sm text-gray-600 mb-1"><i class="fas fa-phone mr-1"></i> ${window.escapeHTML(p.telefono)}</p>
                        <p class="text-xs text-blue-600 font-semibold mb-2">${window.escapeHTML(p.campaña_nombre)}</p>
                        <p class="text-xs text-gray-500 font-medium mb-2">Estado: ${window.escapeHTML(p.ultimo_estado || 'No gestionado')}</p>
                    </div>
                    <button onclick="window.viewProspectCRM(${p.id})" class="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded border border-blue-200 transition">Ver CRM Completo</button>
                </div>
            `;
        });

        container.innerHTML = html;
    };

    document.getElementById('crm-search-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchInput = document.getElementById('crm-search-input').value;
        const resultsContainer = document.getElementById('crm-search-results');

        resultsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">Buscando...</div>';

        try {
            const url = searchInput.trim() ? `/prospects?search=${encodeURIComponent(searchInput)}` : '/prospects';
            const prospects = await apiFetch(url);

            if (prospects.length === 0) {
                resultsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No se encontraron resultados</div>';
                return;
            }

            renderCrmResults(prospects, resultsContainer);
        } catch (err) {
            resultsContainer.innerHTML = `<div class="col-span-full text-center text-red-500 py-8">Error: ${window.escapeHTML(err.message)}</div>`;
        }
    });

    // Load all on init
    document.getElementById('crm-search-input').required = false; // Allow empty search to get all
    loadAllCrmProspects();
};

window.saveCrmNotes = async () => {
    if (!currentCrmProspectId) return;
    const notes = document.getElementById('crm-notes').value;

    try {
        await apiFetch('/prospects', {
            method: 'PUT',
            body: JSON.stringify({ id: currentCrmProspectId, notas_internas: notes })
        });

        alert('Notas guardadas correctamente');
    } catch (e) {
        alert(e.message);
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
