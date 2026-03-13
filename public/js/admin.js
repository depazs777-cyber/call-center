// public/js/admin.js

const renderAdminDashboard = async () => {
    const appContainer = document.getElementById('app-container');

    appContainer.innerHTML = `
        <div class="w-full">
            <h1 class="text-3xl font-bold mb-6">Panel de Administración</h1>

            <div class="mb-4 border-b border-gray-200">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="admin-tabs" data-tabs-toggle="#admin-tab-content" role="tablist">
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 rounded-t-lg hover:text-blue-600 hover:border-blue-300" id="users-tab" data-tabs-target="#users" type="button" role="tab" aria-controls="users" aria-selected="true">Usuarios</button>
                    </li>
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300" id="voip-tab" data-tabs-target="#voip" type="button" role="tab" aria-controls="voip" aria-selected="false">Configuración VoIP</button>
                    </li>
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300" id="campaigns-tab" data-tabs-target="#campaigns" type="button" role="tab" aria-controls="campaigns" aria-selected="false">Campañas & Scripts</button>
                    </li>
                    <li role="presentation">
                        <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300" id="csv-tab" data-tabs-target="#csv" type="button" role="tab" aria-controls="csv" aria-selected="false">Subir Prospectos (CSV)</button>
                    </li>
                </ul>
            </div>
            <div id="admin-tab-content">
                <div class="p-4 rounded-lg bg-white shadow-md hidden" id="users" role="tabpanel" aria-labelledby="users-tab">
                    <h2 class="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
                    <button class="bg-green-500 text-white px-4 py-2 rounded mb-4" onclick="document.getElementById('user-modal').classList.remove('hidden')">Nuevo Usuario</button>
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3">Nombre</th>
                                <th scope="col" class="px-6 py-3">Email</th>
                                <th scope="col" class="px-6 py-3">Rol</th>
                                <th scope="col" class="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="users-table-body">
                            <!-- Injected rows -->
                        </tbody>
                    </table>
                </div>

                <div class="p-4 rounded-lg bg-white shadow-md hidden" id="voip" role="tabpanel" aria-labelledby="voip-tab">
                    <h2 class="text-2xl font-bold mb-4">Configuración VoIP</h2>
                    <form id="voip-form">
                        <div class="grid gap-6 mb-6 md:grid-cols-2">
                            <div>
                                <label for="voip_server" class="block mb-2 text-sm font-medium text-gray-900">Servidor SIP (Domain)</label>
                                <input type="text" id="voip_server" placeholder="ej: srv2.recargavoip.com" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            </div>
                            <div>
                                <label for="voip_port" class="block mb-2 text-sm font-medium text-gray-900">Puerto WebSocket</label>
                                <input type="number" id="voip_port" placeholder="ej: 8088" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            </div>
                            <div>
                                <label for="voip_transport" class="block mb-2 text-sm font-medium text-gray-900">Protocolo WebSocket</label>
                                <select id="voip_transport" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                                    <option value="ws">ws (Sin cifrar)</option>
                                    <option value="wss">wss (Cifrado)</option>
                                </select>
                            </div>
                            <div>
                                <label for="voip_display_name" class="block mb-2 text-sm font-medium text-gray-900">Display Name (Opcional)</label>
                                <input type="text" id="voip_display_name" placeholder="ej: SENDEROS2" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                            </div>
                            <div>
                                <label for="voip_username" class="block mb-2 text-sm font-medium text-gray-900">Nombre de Usuario (User name)</label>
                                <input type="text" id="voip_username" placeholder="ej: SENDEROS2" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            </div>
                            <div>
                                <label for="voip_auth_user" class="block mb-2 text-sm font-medium text-gray-900">Usuario de autorización</label>
                                <input type="text" id="voip_auth_user" placeholder="ej: SENDEROS2" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            </div>
                            <div>
                                <label for="voip_password" class="block mb-2 text-sm font-medium text-gray-900">Contraseña SIP</label>
                                <input type="password" id="voip_password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            </div>
                            <div>
                                <label for="voip_domain" class="block mb-2 text-sm font-medium text-gray-900">Dominio de destino (Opcional)</label>
                                <input type="text" id="voip_domain" placeholder="ej: srv2.recargavoip.com (Dejar vacío para usar servidor SIP)" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                            </div>
                        </div>
                        <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Guardar Configuración</button>
                    </form>
                </div>

                <div class="p-4 rounded-lg bg-white shadow-md hidden" id="campaigns" role="tabpanel" aria-labelledby="campaigns-tab">
                    <h2 class="text-2xl font-bold mb-4">Campañas & Scripts</h2>

                    <div class="mb-8">
                        <h3 class="text-xl font-semibold mb-2">Crear Campaña</h3>
                        <form id="campaign-form" class="flex gap-4 items-end">
                            <div>
                                <label class="block text-sm">Nombre de Campaña</label>
                                <input type="text" id="camp_name" class="border p-2 rounded w-full" required>
                            </div>
                            <button type="submit" class="bg-blue-500 text-white p-2 rounded">Crear</button>
                        </form>
                    </div>

                    <div class="mb-4 border-t pt-4">
                        <h3 class="text-xl font-semibold mb-2">Gestionar Script por Campaña</h3>
                        <select id="script_camp_select" class="border p-2 rounded mb-2 block w-full max-w-sm">
                            <option value="">Seleccione campaña...</option>
                        </select>
                        <textarea id="script_content" rows="6" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300" placeholder="Escriba el script de ventas aquí..."></textarea>
                        <button id="save_script_btn" class="mt-2 bg-green-500 text-white px-4 py-2 rounded">Guardar Script</button>
                    </div>
                </div>

                <div class="p-4 rounded-lg bg-white shadow-md hidden" id="csv" role="tabpanel" aria-labelledby="csv-tab">
                    <h2 class="text-2xl font-bold mb-4">Subir Prospectos (CSV)</h2>
                    <form id="csv-form" class="max-w-md">
                        <div class="mb-4">
                            <label class="block mb-2 text-sm font-medium text-gray-900" for="csv_camp_select">Campaña</label>
                            <select id="csv_camp_select" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                                <option value="">Seleccione campaña...</option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="block mb-2 text-sm font-medium text-gray-900" for="csv_file">Archivo CSV</label>
                            <input class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" id="csv_file" type="file" accept=".csv" required>
                            <p class="mt-1 text-sm text-gray-500">Columnas requeridas: nombre, telefono</p>
                        </div>
                        <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Subir Archivo</button>
                    </form>
                    <p id="csv-result" class="mt-4 font-bold text-green-600 hidden"></p>
                </div>
            </div>
        </div>

        <!-- User Modal -->
        <div id="user-modal" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full flex bg-black bg-opacity-50">
            <div class="relative p-4 w-full max-w-md max-h-full m-auto">
                <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                    <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Nuevo Usuario</h3>
                        <button type="button" class="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center" onclick="document.getElementById('user-modal').classList.add('hidden')">
                            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
                        </button>
                    </div>
                    <div class="p-4 md:p-5">
                        <form class="space-y-4" id="new-user-form">
                            <div>
                                <label for="new_nombre" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre</label>
                                <input type="text" name="nombre" id="new_nombre" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                            </div>
                            <div>
                                <label for="new_email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                                <input type="email" name="email" id="new_email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                            </div>
                            <div>
                                <label for="new_password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contraseña</label>
                                <input type="password" name="password" id="new_password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required />
                            </div>
                            <div>
                                <label for="new_rol" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Rol</label>
                                <select id="new_rol" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                                    <option value="asesor">Asesor</option>
                                    <option value="director">Director</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Crear Usuario</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Simple tab logic
    const tabs = document.querySelectorAll('[data-tabs-target]');
    const tabContents = document.querySelectorAll('[role="tabpanel"]');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('text-blue-600', 'border-blue-300');
                t.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            });
            tab.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            tab.classList.add('text-blue-600', 'border-blue-300');

            tabContents.forEach(c => c.classList.add('hidden'));
            document.querySelector(tab.dataset.tabsTarget).classList.remove('hidden');
        });
    });

    // Default tab
    document.getElementById('users-tab').click();

    // Load data
    await loadUsers();
    await loadSettings();
    await loadCampaignsForAdmin();

    // Event Listeners
    document.getElementById('new-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = {
            nombre: document.getElementById('new_nombre').value,
            email: document.getElementById('new_email').value,
            password: document.getElementById('new_password').value,
            rol: document.getElementById('new_rol').value,
        };
        try {
            await api.createUser(user);
            document.getElementById('user-modal').classList.add('hidden');
            document.getElementById('new-user-form').reset();
            alert('Usuario creado');
            await loadUsers();
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('voip-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const settings = {
            voip_server: document.getElementById('voip_server').value,
            voip_port: document.getElementById('voip_port').value,
            voip_transport: document.getElementById('voip_transport').value,
            voip_display_name: document.getElementById('voip_display_name').value,
            voip_username: document.getElementById('voip_username').value,
            voip_auth_user: document.getElementById('voip_auth_user').value,
            voip_password: document.getElementById('voip_password').value,
            voip_domain: document.getElementById('voip_domain').value,
        };
        try {
            await api.updateSettings(settings);
            alert('Configuración guardada');
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('campaign-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api.createCampaign({ nombre: document.getElementById('camp_name').value });
            document.getElementById('camp_name').value = '';
            alert('Campaña creada');
            await loadCampaignsForAdmin();
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('script_camp_select').addEventListener('change', async (e) => {
        const campId = e.target.value;
        if (!campId) {
            document.getElementById('script_content').value = '';
            return;
        }
        try {
            const script = await api.getScript(campId);
            document.getElementById('script_content').value = script.contenido || '';
        } catch (err) {
            console.error(err);
        }
    });

    document.getElementById('save_script_btn').addEventListener('click', async () => {
        const campId = document.getElementById('script_camp_select').value;
        const contenido = document.getElementById('script_content').value;
        if (!campId) return alert('Seleccione una campaña');
        try {
            await api.saveScript({ campaign_id: campId, contenido });
            alert('Script guardado');
        } catch (err) {
            alert(err.message);
        }
    });

    document.getElementById('csv-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('csv_file');
        const campId = document.getElementById('csv_camp_select').value;

        if (!fileInput.files[0] || !campId) return;

        const formData = new FormData();
        formData.append('csv', fileInput.files[0]);
        formData.append('campaign_id', campId);

        try {
            const result = await api.uploadCSV(formData);
            const resEl = document.getElementById('csv-result');
            resEl.textContent = `Éxito: ${result.registros_insertados} prospectos importados.`;
            resEl.classList.remove('hidden');
            fileInput.value = '';
        } catch (err) {
            alert(err.message);
        }
    });
};

// Utility to escape HTML and prevent XSS (if not available globally yet)
const escapeHTMLAdmin = (str) => {
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

const loadUsers = async () => {
    try {
        const users = await api.getUsers();
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b';
            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900">${escapeHTMLAdmin(u.nombre)}</td>
                <td class="px-6 py-4">${escapeHTMLAdmin(u.email)}</td>
                <td class="px-6 py-4 capitalize">${escapeHTMLAdmin(u.rol)}</td>
                <td class="px-6 py-4">
                    <button onclick="deleteUser(${u.id})" class="font-medium text-red-600 hover:underline">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Failed to load users", error);
    }
};

const loadSettings = async () => {
    try {
        const s = await api.getSettings();
        if (s) {
            document.getElementById('voip_server').value = s.voip_server || '';
            document.getElementById('voip_port').value = s.voip_port || '';
            document.getElementById('voip_transport').value = s.voip_transport || 'ws';
            document.getElementById('voip_display_name').value = s.voip_display_name || '';
            document.getElementById('voip_username').value = s.voip_username || '';
            document.getElementById('voip_auth_user').value = s.voip_auth_user || '';
            document.getElementById('voip_password').value = s.voip_password || '';
            document.getElementById('voip_domain').value = s.voip_domain || '';
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
};

const loadCampaignsForAdmin = async () => {
    try {
        const campaigns = await api.getCampaigns();
        const scriptSel = document.getElementById('script_camp_select');
        const csvSel = document.getElementById('csv_camp_select');

        const opts = '<option value="">Seleccione campaña...</option>' +
            campaigns.map(c => `<option value="${c.id}">${escapeHTMLAdmin(c.nombre)}</option>`).join('');

        scriptSel.innerHTML = opts;
        csvSel.innerHTML = opts;
    } catch (e) {
        console.error("Failed to load campaigns", e);
    }
};

window.deleteUser = async (id) => {
    if (!confirm('¿Seguro que desea eliminar a este usuario?')) return;
    try {
        await api.deleteUser(id);
        await loadUsers();
    } catch (err) {
        alert(err.message);
    }
};
