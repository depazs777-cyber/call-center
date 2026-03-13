// public/js/asesor.js

let ua = null;
let currentSession = null;
let currentCallId = null;
let mediaRecorder = null;
let audioChunks = [];

const renderAsesorDashboard = async () => {
    const appContainer = document.getElementById('app-container');

    appContainer.innerHTML = `
        <div class="w-full flex h-full gap-4">
            <!-- Sidebar / Listado de Prospectos -->
            <div class="w-1/3 bg-white p-4 shadow-md rounded-lg flex flex-col h-full overflow-hidden">
                <h2 class="text-xl font-bold mb-4">Mis Prospectos</h2>
                <div class="mb-4">
                    <select id="asesor_camp_select" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                        <option value="">Todas las campañas</option>
                    </select>
                </div>
                <div class="flex-grow overflow-y-auto">
                    <ul id="prospects-list" class="divide-y divide-gray-200">
                        <!-- Prospect items injected here -->
                    </ul>
                </div>
            </div>

            <!-- Main Panel / Consola de Llamada -->
            <div class="w-2/3 bg-white p-4 shadow-md rounded-lg flex flex-col h-full">
                <div id="call-panel" class="hidden flex-col h-full">
                    <div class="flex justify-between items-center mb-4 pb-4 border-b">
                        <div>
                            <h2 id="call-name" class="text-2xl font-bold">Nombre del Cliente</h2>
                            <p id="call-phone" class="text-gray-600 text-lg">123-456-7890</p>
                            <p id="call-city" class="text-sm text-gray-500">Ciudad</p>
                        </div>
                        <div class="flex gap-2">
                            <button id="btn-call" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full flex items-center shadow-lg transform transition hover:scale-105">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                Llamar
                            </button>
                            <button id="btn-hangup" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full flex items-center shadow-lg transform transition hover:scale-105 hidden">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.284 4.684A1 1 0 008.336 4H5.28A2 2 0 005 3z"></path></svg>
                                Colgar
                            </button>
                        </div>
                    </div>

                    <div class="flex-grow flex gap-4 overflow-hidden mb-4">
                        <!-- Script Container -->
                        <div class="w-1/2 flex flex-col border rounded-lg overflow-hidden bg-blue-50">
                            <div class="bg-blue-100 px-4 py-2 border-b border-blue-200 font-semibold text-blue-800">Script de Llamada</div>
                            <div class="p-4 overflow-y-auto flex-grow text-sm text-gray-800" id="call-script">
                                Cargando script...
                            </div>
                        </div>

                        <!-- Formulario de Finalización -->
                        <div class="w-1/2 flex flex-col border rounded-lg p-4 bg-gray-50 overflow-y-auto" id="tipificacion-panel">
                            <h3 class="font-semibold text-gray-800 mb-3">Tipificación y Cierre</h3>
                            <form id="end-call-form" class="space-y-4 flex flex-col h-full">
                                <div>
                                    <label class="block mb-1 text-sm font-medium text-gray-900">Estado de Llamada</label>
                                    <select id="call-status" class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required disabled>
                                        <option value="">Seleccione estado...</option>
                                        <option value="No contestó">No contestó</option>
                                        <option value="Venta efectiva">Venta efectiva</option>
                                        <option value="Cita agendada">Cita agendada</option>
                                        <option value="Cliente no interesado">Cliente no interesado</option>
                                        <option value="Buzón de voz">Buzón de voz</option>
                                        <option value="Número equivocado">Número equivocado</option>
                                    </select>
                                </div>
                                <div class="flex-grow">
                                    <label class="block mb-1 text-sm font-medium text-gray-900">Comentarios</label>
                                    <textarea id="call-comments" rows="3" class="block p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 h-full resize-none" disabled placeholder="Notas sobre la llamada..."></textarea>
                                </div>
                                <div>
                                    <label class="block mb-1 text-sm font-medium text-gray-900">Adjunto (opcional)</label>
                                    <input type="file" id="call-attachment" class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none p-1" disabled>
                                </div>
                                <button type="submit" id="btn-save-call" class="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed" disabled>Guardar y Siguiente</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div id="no-call-panel" class="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg class="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    <p class="text-xl">Seleccione un prospecto para iniciar</p>
                </div>
            </div>

            <!-- Audio Element for SIP -->
            <audio id="remoteAudio" autoplay hidden></audio>
        </div>
    `;

    // Initialize VoIP connection
    await initVoIP();
    await loadCampaignsForAsesor();
    await loadProspects();

    // Event Listeners
    document.getElementById('asesor_camp_select').addEventListener('change', async (e) => {
        await loadProspects(e.target.value);
    });

    document.getElementById('end-call-form').addEventListener('submit', handleEndCallSubmit);
};

const loadCampaignsForAsesor = async () => {
    try {
        const campaigns = await api.getCampaigns();
        const select = document.getElementById('asesor_camp_select');
        campaigns.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
        });
    } catch (e) {
        console.error("Failed to load campaigns", e);
    }
};

const loadProspects = async (campaignId = null) => {
    try {
        const prospects = await api.getProspects(campaignId);
        const list = document.getElementById('prospects-list');
        list.innerHTML = '';

        if (prospects.length === 0) {
            list.innerHTML = '<li class="p-4 text-gray-500 text-center">No hay prospectos disponibles.</li>';
            return;
        }

        prospects.forEach(p => {
            const li = document.createElement('li');
            li.className = 'py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition p-2 border-b';
            li.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">${p.nombre}</p>
                        <p class="text-sm text-gray-500 truncate">${p.telefono} • ${p.ciudad || 'Sin ciudad'}</p>
                        <p class="text-xs text-blue-500 truncate mt-1">${p.campaña_nombre}</p>
                    </div>
                </div>
            `;
            li.onclick = () => selectProspect(p);
            list.appendChild(li);
        });
    } catch (e) {
        console.error("Failed to load prospects", e);
    }
};

let activeProspect = null;

const selectProspect = async (prospect) => {
    activeProspect = prospect;

    // UI Update
    document.getElementById('no-call-panel').classList.add('hidden');
    document.getElementById('call-panel').classList.remove('hidden');
    document.getElementById('call-panel').classList.add('flex');

    document.getElementById('call-name').textContent = prospect.nombre;
    document.getElementById('call-phone').textContent = prospect.telefono;
    document.getElementById('call-city').textContent = prospect.ciudad || 'Sin ciudad especificada';

    // Reset buttons and form
    document.getElementById('btn-call').classList.remove('hidden');
    document.getElementById('btn-hangup').classList.add('hidden');

    const formInputs = document.querySelectorAll('#end-call-form input, #end-call-form select, #end-call-form textarea, #end-call-form button');
    formInputs.forEach(el => el.disabled = true);
    document.getElementById('end-call-form').reset();

    // Load Script
    const scriptDiv = document.getElementById('call-script');
    scriptDiv.innerHTML = '<span class="text-gray-400">Cargando script...</span>';
    try {
        const script = await api.getScript(prospect.campaign_id);
        if (script && script.contenido) {
            // Reemplazar variables básicas si existen
            let content = script.contenido
                .replace(/\{nombre\}/gi, prospect.nombre)
                .replace(/\{telefono\}/gi, prospect.telefono)
                .replace(/\{ciudad\}/gi, prospect.ciudad || '');

            // Format line breaks
            scriptDiv.innerHTML = content.replace(/\n/g, '<br>');
        } else {
            scriptDiv.innerHTML = '<span class="italic text-gray-500">No hay script asignado a esta campaña.</span>';
        }
    } catch (e) {
        scriptDiv.innerHTML = '<span class="text-red-500">Error al cargar script.</span>';
    }

    // Set Call Button Action
    document.getElementById('btn-call').onclick = () => startCallProcess(prospect);
};

// SIP.js & MediaRecorder Logic

const initVoIP = async () => {
    try {
        const settings = await api.getSettings();
        if (!settings || !settings.servidor) {
            console.warn("Configuración VoIP no encontrada o incompleta.");
            return;
        }

        const uri = SIP.UserAgent.makeURI(`sip:${settings.usuario}@${settings.servidor}`);
        if (!uri) throw new Error("URI SIP inválida");

        const transportOptions = {
            server: `wss://${settings.servidor}:${settings.puerto || '8089'}/ws`,
        };

        ua = new SIP.UserAgent({
            uri: uri,
            transportOptions: transportOptions,
            authorizationUsername: settings.usuario,
            authorizationPassword: settings.contraseña,
            delegate: {
                onConnect: () => console.log("SIP Connected"),
                onDisconnect: (error) => console.log("SIP Disconnected", error),
                onInvite: (invitation) => {
                    // Rechazar llamadas entrantes automáticamente en este flujo básico
                    invitation.reject();
                }
            }
        });

        await ua.start();
        console.log("SIP UA Started successfully");

    } catch (error) {
        console.error("Error inicializando VoIP:", error);
        // Fallback for UI if VoIP fails but we still want to test the flow
        alert("Advertencia: No se pudo conectar al servidor VoIP. Podrás simular el flujo pero sin audio real.");
    }
};

const startCallProcess = async (prospect) => {
    document.getElementById('btn-call').classList.add('hidden');
    document.getElementById('btn-hangup').classList.remove('hidden');

    try {
        // 1. Notify Backend
        const res = await api.startCall(prospect.id);
        currentCallId = res.call_id;

        // 2. Start Local Recording
        await startRecording();

        // 3. Start SIP Session
        if (ua && ua.isConnected()) {
            const targetUri = SIP.UserAgent.makeURI(`sip:${prospect.telefono}@${ua.configuration.uri.host}`);
            if (!targetUri) throw new Error("URI destino inválida");

            currentSession = new SIP.Inviter(ua, targetUri, {
                sessionDescriptionHandlerOptions: {
                    constraints: { audio: true, video: false }
                }
            });

            currentSession.delegate = {
                onTrackAdded: () => {
                    const remoteAudio = document.getElementById('remoteAudio');
                    const pc = currentSession.sessionDescriptionHandler.peerConnection;
                    const remoteStream = new MediaStream();
                    pc.getReceivers().forEach(receiver => {
                        if (receiver.track) remoteStream.addTrack(receiver.track);
                    });
                    remoteAudio.srcObject = remoteStream;
                    remoteAudio.play();
                },
                onSessionDescriptionHandler: (sdh) => {
                    // Here we could try to record the remote stream as well,
                    // but MediaRecorder with getUserMedia captures local.
                    // For a complete recording, WebRTC mixing is needed.
                }
            };

            await currentSession.invite();
        } else {
            console.log("Simulating call (VoIP not connected)");
        }

        // Setup Hangup button
        document.getElementById('btn-hangup').onclick = hangupCall;

    } catch (error) {
        console.error("Error al iniciar llamada:", error);
        alert("Error al iniciar la llamada. Revise la consola.");
        resetCallUI();
    }
};

const hangupCall = async () => {
    // 1. End SIP Session
    if (currentSession) {
        try {
            switch(currentSession.state) {
                case SIP.SessionState.Establishing:
                    await currentSession.cancel();
                    break;
                case SIP.SessionState.Established:
                    await currentSession.bye();
                    break;
            }
        } catch(e) { console.error("Error on SIP hangup", e); }
        currentSession = null;
    }

    // 2. Stop Recording
    stopRecording();

    // 3. Update UI to allow saving details
    document.getElementById('btn-hangup').classList.add('hidden');

    // Enable form to save details
    const formInputs = document.querySelectorAll('#end-call-form input, #end-call-form select, #end-call-form textarea, #end-call-form button');
    formInputs.forEach(el => el.disabled = false);

    document.getElementById('call-status').focus();
};

const resetCallUI = () => {
    document.getElementById('btn-call').classList.remove('hidden');
    document.getElementById('btn-hangup').classList.add('hidden');
    const formInputs = document.querySelectorAll('#end-call-form input, #end-call-form select, #end-call-form textarea, #end-call-form button');
    formInputs.forEach(el => el.disabled = true);
};

// MediaRecorder
const startRecording = async () => {
    audioChunks = [];
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.start();
    } catch (err) {
        console.error("No se pudo iniciar la grabación:", err);
    }
};

const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
};

const handleEndCallSubmit = async (e) => {
    e.preventDefault();
    if (!currentCallId) return alert("No hay una llamada activa para finalizar.");

    const estado = document.getElementById('call-status').value;
    const comentarios = document.getElementById('call-comments').value;
    const adjunto = document.getElementById('call-attachment').files[0];

    const formData = new FormData();
    formData.append('call_id', currentCallId);
    formData.append('estado', estado);
    formData.append('comentarios', comentarios);
    if (adjunto) formData.append('adjunto', adjunto);

    // Prepare audio blob if exists
    if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        formData.append('grabacion', audioBlob, 'grabacion.webm');
    }

    try {
        document.getElementById('btn-save-call').textContent = 'Guardando...';
        document.getElementById('btn-save-call').disabled = true;

        await api.endCall(formData);

        // Success
        activeProspect = null;
        currentCallId = null;
        audioChunks = [];

        document.getElementById('call-panel').classList.add('hidden');
        document.getElementById('call-panel').classList.remove('flex');
        document.getElementById('no-call-panel').classList.remove('hidden');

        document.getElementById('end-call-form').reset();
        document.getElementById('btn-save-call').textContent = 'Guardar y Siguiente';

        // Remove prospect from list (simulating queue processing)
        // In a real app we might just change its status or keep it in history.
        // For now, reload list to reflect fresh state
        const selectedCamp = document.getElementById('asesor_camp_select').value;
        await loadProspects(selectedCamp);

    } catch (err) {
        alert("Error al guardar: " + err.message);
        document.getElementById('btn-save-call').textContent = 'Guardar y Siguiente';
        document.getElementById('btn-save-call').disabled = false;
    }
};
