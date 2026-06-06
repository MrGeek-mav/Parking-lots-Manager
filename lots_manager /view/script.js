// ========== DATA ==========
const slots = [];
const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
let userSelectedSlot = null;
let currentRole = 'admin';
let currentUser = null;

// ========== BASE DE DADOS DE RESERVAS (PERSISTENTE) ==========
let allReservations = [];

// ========== BASE DE DADOS DE UTILIZADORES ==========
let users = [
  { id: 1, nome: "João Amade", email: "joao@ex.mz", senha: "123456", tipo: "user", status: "Ativo", avatar: "JA" },
  { id: 2, nome: "Laurinda Mapunga", email: "laurinda@ex.mz", senha: "123456", tipo: "user", status: "Inativo", avatar: "LM" },
  { id: 3, nome: "Paulo Mavulha", email: "paulo@ex.mz", senha: "123456", tipo: "user", status: "Ativo", avatar: "PM" },
  { id: 4, nome: "Admin Sistema", email: "admin@parksense.mz", senha: "123456", tipo: "admin", status: "Ativo", avatar: "AD" },
  { id: 5, nome: "Amade Xavier", email: "amade@ex.mz", senha: "123456", tipo: "user", status: "Ativo", avatar: "AX" },
  { id: 6, nome: "Elidio Antonio", email: "elidio@ex.mz", senha: "123456", tipo: "user", status: "Ativo", avatar: "EA" },
  { id: 7, nome: "Lindalva Ngazane", email: "lindalva@ex.mz", senha: "123456", tipo: "user", status: "Ativo", avatar: "LN" },
  { id: 8, nome: "Rosy Nhandoro", email: "rosy@ex.mz", senha: "123456", tipo: "user", status: "Inativo", avatar: "RN" }
];

let nextUserId = 9;
let regRole = 'user';

// ========== LOCALSTORAGE ==========
function carregarReservas() {
  const saved = localStorage.getItem('parksense_reservations');
  if (saved) {
    allReservations = JSON.parse(saved);
    console.log(`📋 ${allReservations.length} reservas carregadas`);
  }
}

function salvarReservas() {
  localStorage.setItem('parksense_reservations', JSON.stringify(allReservations));
}

// ========== FUNÇÕES DE RESERVAS ==========
function salvarReserva(userId, slotId, tempo, horaInicio, horaFim, horaInicioFormatada, horaFimFormatada) {
  const novaReserva = {
    id: Date.now(),
    userId: userId,
    slotId: slotId,
    tempo: tempo,
    status: 'ativa',
    horaInicio: horaInicio,
    horaFim: horaFim,
    horaInicioFormatada: horaInicioFormatada,
    horaFimFormatada: horaFimFormatada,
    dataCriacao: new Date().toISOString()
  };
  
  allReservations.push(novaReserva);
  salvarReservas();
  
  const slot = slots.find(s => s.id === slotId);
  if (slot && slot.status === 'livre') {
    slot.status = 'reservada';
    slot.time = `Reservado até ${horaFimFormatada}`;
    slot.reservaId = novaReserva.id;
  }
  
  return novaReserva;
}

function cancelarReserva(reservaId, canceladoPor = 'user') {
  const reserva = allReservations.find(r => r.id === reservaId);
  if (!reserva) return false;
  
  reserva.status = 'cancelada';
  reserva.canceladoPor = canceladoPor;
  reserva.dataCancelamento = new Date().toISOString();
  salvarReservas();
  
  const slot = slots.find(s => s.id === reserva.slotId);
  if (slot && slot.status === 'reservada') {
    slot.status = 'livre';
    slot.time = null;
    slot.reservaId = null;
  }
  
  return true;
}

// ========== SENSORES ==========
function atualizarVagaPorSensor(sensorId, novoStatus, timestamp = null) {
  const slot = slots.find(s => s.id === sensorId);
  if (!slot) return { success: false };
  
  const statusAnterior = slot.status;
  const dataHora = timestamp || new Date().toISOString();
  const reservaAtiva = allReservations.find(r => r.slotId === sensorId && r.status === 'ativa');
  
  if (novoStatus === 'ocupada') {
    if (reservaAtiva) {
      reservaAtiva.status = 'cumprida';
      reservaAtiva.dataChegada = dataHora;
      salvarReservas();
    }
    slot.status = 'ocupada';
    slot.time = `Sensor detectou às ${new Date(dataHora).toLocaleTimeString()}`;
  } else if (novoStatus === 'livre') {
    slot.status = 'livre';
    slot.time = null;
  }
  
  renderAdminGrid();
  renderUserGrid();
  updateCompleteDashboard();
  updateUserDashboard();
  
  return { success: true };
}

// ========== ESTATÍSTICAS ==========
function getEstatisticasUtilizadores() {
  const estatisticas = [];
  const usuariosNormais = users.filter(u => u.tipo !== 'admin' && u.status === 'Ativo');
  
  usuariosNormais.forEach(user => {
    const reservasDoUsuario = allReservations.filter(r => r.userId === user.id);
    const reservasAtivas = reservasDoUsuario.filter(r => r.status === 'ativa').length;
    const reservasCumpridas = reservasDoUsuario.filter(r => r.status === 'cumprida').length;
    const reservasCanceladas = reservasDoUsuario.filter(r => r.status === 'cancelada').length;
    const totalReservas = reservasDoUsuario.length;
    
    estatisticas.push({
      id: user.id,
      nome: user.nome,
      avatar: user.avatar,
      totalReservas: totalReservas,
      reservasAtivas: reservasAtivas,
      reservasCumpridas: reservasCumpridas,
      reservasCanceladas: reservasCanceladas
    });
  });
  
  estatisticas.sort((a, b) => b.totalReservas - a.totalReservas);
  return estatisticas;
}

function atualizarUtilizadoresAtivos() {
  const container = document.getElementById('utilizadores-ativos-container');
  if (!container) return;
  
  const estatisticas = getEstatisticasUtilizadores();
  const topUsuarios = estatisticas.slice(0, 3);
  
  if (topUsuarios.length === 0 || topUsuarios.every(u => u.totalReservas === 0)) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Nenhum utilizador ativo ainda. Faça reservas para aparecer aqui!</div>';
    return;
  }
  
  container.innerHTML = topUsuarios.map((user) => {
    return `
      <div class="user-list-item">
        <div class="user-avatar-sm">${user.avatar}</div>
        <div style="flex:1">
          <div style="font-size:13px; font-weight:600;">${user.nome}</div>
          <div style="font-size:11px; color:var(--text3);">
            ${user.totalReservas} reserva(s) | ${user.reservasCumpridas} cumpridas | ${user.reservasCanceladas} canceladas
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function atualizarVagasMaisUtilizadas() {
  const tabelaBody = document.getElementById('vagas-mais-usadas-body');
  if (!tabelaBody) return;
  
  const estatisticasVagas = {};
  slots.forEach(slot => { estatisticasVagas[slot.id] = { id: slot.id, ocupacoes: 0, horasTotais: 0 }; });
  
  const reservasCumpridas = allReservations.filter(r => r.status === 'cumprida');
  reservasCumpridas.forEach(reserva => {
    if (estatisticasVagas[reserva.slotId]) {
      estatisticasVagas[reserva.slotId].ocupacoes++;
      const duracaoHoras = (reserva.horaFim - reserva.horaInicio);
      estatisticasVagas[reserva.slotId].horasTotais += duracaoHoras;
    }
  });
  
  const vagasArray = Object.values(estatisticasVagas);
  vagasArray.sort((a, b) => b.ocupacoes - a.ocupacoes);
  const topVagas = vagasArray.slice(0, 4);
  
  if (topVagas.length === 0 || topVagas.every(v => v.ocupacoes === 0)) {
    tabelaBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Aguardando dados dos sensores...</td></tr>';
    return;
  }
  
  tabelaBody.innerHTML = topVagas.map(vaga => `
    <tr>
      <td><span class="sensor-chip">${vaga.id}</span></td>
      <td>${vaga.ocupacoes}x</td>
      <td>${Math.round(vaga.horasTotais)}h</td>
    </tr>
  `).join('');
}

function calcularTempoMedioOcupacao() {
  // Buscar todas as reservas cumpridas (que foram realmente usadas)
  const reservasCumpridas = allReservations.filter(r => r.status === 'cumprida' && r.dataChegada);
  
  if (reservasCumpridas.length === 0) {
    return '0h 0min';
  }
  
  let totalMinutos = 0;
  
  reservasCumpridas.forEach(reserva => {
    const dataCriacao = new Date(reserva.dataCriacao);
    const dataChegada = new Date(reserva.dataChegada);
    const diferencaMinutos = Math.abs(dataChegada - dataCriacao) / 60000;
    
    // Limitar a diferença máxima a 4 horas (240 minutos) para evitar outliers
    if (diferencaMinutos > 0 && diferencaMinutos < 240) {
      totalMinutos += diferencaMinutos;
    }
  });
  
  const mediaMinutos = Math.round(totalMinutos / reservasCumpridas.length);
  const horas = Math.floor(mediaMinutos / 60);
  const minutos = mediaMinutos % 60;
  
  return `${horas}h ${minutos}min`;
}

// ========== UI ==========
function notify(msg, type = 'success') {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.className = `notification show ${type}`;
  setTimeout(() => n.classList.remove('show'), 4000);
}

// ========== INICIALIZAR VAGAS ==========
function initSlots() {
  const statusIniciais = ['livre', 'livre', 'livre', 'ocupada', 'ocupada', 'livre', 'livre', 'livre', 'livre', 'ocupada', 'livre', 'livre', 'livre', 'ocupada', 'livre', 'ocupada', 'livre', 'livre', 'livre', 'livre', 'ocupada', 'livre', 'livre', 'livre'];
  const timesIniciais = [null, null, null, 'Em uso', 'Em uso', null, null, null, null, 'Em uso', null, null, null, 'Em uso', null, 'Em uso', null, null, null, null, 'Em uso', null, null, null];
  
  for (let i = 0; i < 24; i++) {
    const row = rows[Math.floor(i / 4)];
    const col = (i % 4) + 1;
    slots.push({ id: `${row}-0${col}`, status: statusIniciais[i], time: timesIniciais[i], reservaId: null });
  }
  
  carregarReservas();
}

function getIcon(s) { return s === 'livre' ? '🟢' : s === 'ocupada' ? '🔴' : '🟡'; }
function getSlotLabel(s) { return s === 'livre' ? 'Livre' : s === 'ocupada' ? 'Ocupada' : 'Reservada'; }

// ========== RENDER GRIDS ==========
function renderAdminGrid(filter = 'all') {
  const g = document.getElementById('admin-parking-grid');
  if (!g) return;
  g.innerHTML = '';
  
  slots.forEach(slot => {
    if (filter !== 'all' && slot.status !== filter) return;
    const d = document.createElement('div');
    d.className = `slot-card ${slot.status}`;
    d.setAttribute('data-id', slot.id);
    d.innerHTML = `
      <div class="slot-id">${slot.id}</div>
      <span class="slot-icon">${getIcon(slot.status)}</span>
      <div class="slot-status-text">${getSlotLabel(slot.status)}</div>
      ${slot.time ? `<div class="slot-time">⏱ ${slot.time}</div>` : ''}
    `;
    d.onclick = () => {
      if (slot.status === 'livre') {
        document.getElementById('reservar-id').value = slot.id;
        openReservarModal();
      } else if (slot.status === 'reservada') {
        document.getElementById('cancelar-id').value = slot.id;
        openCancelarModal();
      }
    };
    g.appendChild(d);
  });
}

function renderUserGrid(filter = 'all') {
  const g = document.getElementById('user-parking-grid');
  if (!g) return;
  g.innerHTML = '';
  
  slots.forEach(slot => {
    if (filter !== 'all' && slot.status !== filter) return;
    const d = document.createElement('div');
    d.className = `slot-card ${slot.status}`;
    d.innerHTML = `
      <div class="slot-id">${slot.id}</div>
      <span class="slot-icon">${getIcon(slot.status)}</span>
      <div class="slot-status-text">${getSlotLabel(slot.status)}</div>
      ${slot.time ? `<div class="slot-time">⏱ ${slot.time}</div>` : ''}
    `;
    
    if (slot.status === 'livre') {
      d.onclick = () => {
        userSelectedSlot = slot;
        document.getElementById('modal-user-title').textContent = `🅿️ Reservar Vaga ${slot.id}`;
        document.getElementById('modal-user-info').textContent = `Vaga ${slot.id} está livre. Confirme a sua reserva.`;
        document.getElementById('modal-reservar-user').classList.add('open');
      };
    }
    g.appendChild(d);
  });
  
  updateUserDashboard();
}

function updateUserDashboard() {
  const livres = slots.filter(s => s.status === 'livre').length;
  const ocupadas = slots.filter(s => s.status === 'ocupada').length;
  const reservadas = slots.filter(s => s.status === 'reservada').length;
  
  const userLivres = document.getElementById('user-livres');
  const userOcupadas = document.getElementById('user-ocupadas');
  const userReservadas = document.getElementById('user-reservadas');
  
  if (userLivres) userLivres.textContent = livres;
  if (userOcupadas) userOcupadas.textContent = ocupadas;
  if (userReservadas) userReservadas.textContent = reservadas;
}

function filterSlots(type, btn, mode = 'admin') {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (mode === 'user') renderUserGrid(type);
  else renderAdminGrid(type);
}

function searchSlot(val) {
  const g = document.getElementById('admin-parking-grid');
  if (!g) return;
  g.querySelectorAll('.slot-card').forEach(c => {
    c.style.display = c.getAttribute('data-id').toLowerCase().includes(val.toLowerCase()) ? '' : 'none';
  });
}

function refreshSlots() {
  notify('Sensores atualizados!', 'success');
  renderAdminGrid();
  renderUserGrid();
  updateCompleteDashboard();
}

// ========== RESERVAS ==========
function confirmarReservaUser() {
  if (!userSelectedSlot) return;
  
  const slot = userSelectedSlot;
  const tempo = document.getElementById('user-reservar-tempo').value;
  
  const agora = new Date();
  const horaInicio = agora.getHours();
  const minutosInicio = agora.getMinutes();
  const horaInicioFormatada = `${horaInicio.toString().padStart(2, '0')}:${minutosInicio.toString().padStart(2, '0')}`;
  
  const duracaoMinutos = tempo === '30 minutos' ? 30 : tempo === '1 hora' ? 60 : 120;
  const dataFim = new Date(agora.getTime() + duracaoMinutos * 60000);
  const horaFim = dataFim.getHours();
  const minutosFim = dataFim.getMinutes();
  const horaFimFormatada = `${horaFim.toString().padStart(2, '0')}:${minutosFim.toString().padStart(2, '0')}`;
  
  const novaReserva = salvarReserva(
    currentUser.id, slot.id, tempo,
    horaInicio + (minutosInicio / 60),
    horaFim + (minutosFim / 60),
    horaInicioFormatada, horaFimFormatada
  );
  
  if (novaReserva) {
    closeModal('modal-reservar-user');
    renderUserGrid();
    updateCompleteDashboard();
    updateUserDashboard();
    updateUserReservas();
    notify(`Vaga ${slot.id} reservada por ${tempo}!`, 'success');
  }
}

function updateUserReservas() {
  const el = document.getElementById('user-reservas-list');
  if (!el) return;
  
  const reservasAtivas = allReservations.filter(r => r.userId === currentUser?.id && r.status === 'ativa');
  
  if (reservasAtivas.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;"><div style="font-size:32px;">🅿️</div><div>Nenhuma reserva ativa.</div><div style="font-size:12px;margin-top:4px;">Vá até "Ver Vagas" para reservar.</div></div>';
    return;
  }
  
  el.innerHTML = reservasAtivas.map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(42,51,82,0.5);">
      <div>
        <div><strong>Vaga ${r.slotId}</strong> <span class="status-badge reservada" style="margin-left:8px;">Ativa</span></div>
        <div style="font-size:12px; margin-top:4px;">📅 ${r.tempo} • ${r.horaInicioFormatada} - ${r.horaFimFormatada}</div>
      </div>
      <button class="btn-action danger" onclick="cancelarMinhaReserva(${r.id})" style="padding:4px 12px;">Cancelar</button>
    </div>
  `).join('');
}

function cancelarMinhaReserva(reservaId) {
  if (confirm('Cancelar reserva?')) {
    cancelarReserva(reservaId, 'user');
    renderUserGrid();
    updateUserReservas();
    updateCompleteDashboard();
    updateUserDashboard();
    notify('Reserva cancelada!', 'success');
  }
}

// ========== ADMIN RESERVAS ==========
function confirmarReserva() {
  const id = document.getElementById('reservar-id').value.toUpperCase();
  const slot = slots.find(s => s.id === id);
  if (!slot || slot.status !== 'livre') { notify('Vaga não disponível!', 'error'); return; }
  
  const tempo = document.getElementById('reservar-tempo').value;
  const agora = new Date();
  const duracaoMinutos = tempo === '30 minutos' ? 30 : tempo === '1 hora' ? 60 : tempo === '2 horas' ? 120 : 240;
  const dataFim = new Date(agora.getTime() + duracaoMinutos * 60000);
  const horaFimFormatada = `${dataFim.getHours().toString().padStart(2, '0')}:${dataFim.getMinutes().toString().padStart(2, '0')}`;
  
  slot.status = 'reservada';
  slot.time = `Reservado até ${horaFimFormatada}`;
  
  closeModal('modal-reservar');
  renderAdminGrid();
  updateCompleteDashboard();
  notify(`Vaga ${id} reservada!`, 'success');
}

function confirmarCancelamento() {
  const id = document.getElementById('cancelar-id').value.toUpperCase();
  const slot = slots.find(s => s.id === id);
  if (!slot || slot.status !== 'reservada') { notify('Reserva não encontrada!', 'error'); return; }
  
  const reserva = allReservations.find(r => r.slotId === id && r.status === 'ativa');
  if (reserva) {
    cancelarReserva(reserva.id, 'admin');
  } else {
    slot.status = 'livre';
    slot.time = null;
  }
  
  closeModal('modal-cancelar');
  renderAdminGrid();
  updateCompleteDashboard();
  updateUserReservas();
  notify(`Reserva da vaga ${id} cancelada!`, 'success');
}

// ========== AUTH ==========
function selectRegRole(r) {
  regRole = r;
  document.getElementById('reg-role-admin').classList.toggle('selected', r === 'admin');
  document.getElementById('reg-role-user').classList.toggle('selected', r === 'user');
}

function doLogin() {
  const email = document.getElementById('login-email').value;
  const senha = document.getElementById('login-pass').value;
  
  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user) { notify('Email ou senha inválidos!', 'error'); return; }
  
  if (user.status !== 'Ativo') { notify('Conta inativa!', 'error'); return; }
  
  const isAdmin = user.tipo === 'admin';
  currentRole = isAdmin ? 'admin' : 'user';
  currentUser = user;
  
  const navContainer = document.getElementById('nav-right-container');
  if (navContainer) {
    navContainer.innerHTML = `
      <div class="user-info">
        <div class="user-avatar-nav">${user.avatar}</div>
        <div>
          <div class="user-name">${user.nome.split(' ')[0]}</div>
          <div class="user-role">${isAdmin ? 'Administrador' : 'Utilizador'}</div>
        </div>
      </div>
      <button class="btn-logout" onclick="doLogout()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sair
      </button>
    `;
  }
  
  document.getElementById('menu-admin').style.display = isAdmin ? '' : 'none';
  document.getElementById('menu-user').style.display = isAdmin ? 'none' : '';
  
  showScreen('app');
  
  if (isAdmin) {
    showPage('dashboard');
    updateCompleteDashboard();
    renderUsersList();
  } else {
    showPage('vagas-user');
    renderUserGrid();
    updateUserReservas();
  }
  
  notify(`Bem-vindo, ${user.nome}!`, 'success');
}

function doLogout() {
  showScreen('login');
  currentUser = null;
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
}

function doRegister() {
  const nome = document.getElementById('reg-nome')?.value;
  const email = document.getElementById('reg-email')?.value;
  const senha = document.getElementById('reg-senha')?.value;
  const confirmar = document.getElementById('reg-confirmar')?.value;
  
  if (!nome || !email || !senha) { notify('Preencha todos os campos!', 'error'); return; }
  if (senha !== confirmar) { notify('Senhas não coincidem!', 'error'); return; }
  if (senha.length < 4) { notify('Senha deve ter 4+ caracteres!', 'error'); return; }
  if (users.some(u => u.email === email)) { notify('Email já registado!', 'error'); return; }
  
  const avatar = nome.substring(0, 2).toUpperCase();
  users.push({ id: nextUserId++, nome, email, senha, tipo: regRole, status: 'Ativo', avatar });
  
  notify('Conta criada! Faça login.', 'success');
  setTimeout(() => showScreen('login'), 1500);
}

// ========== UTILIZADORES ==========
function renderUsersList() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const normalUsers = users.filter(u => u.tipo !== 'admin');
  
  normalUsers.forEach(user => {
    const statusClass = user.status === 'Ativo' ? 'livre' : 'ocupada';
    const statusText = user.status === 'Ativo' ? 'Ativo' : 'Inativo';
    const reservasAtivas = allReservations.filter(r => r.userId === user.id && r.status === 'ativa').length;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><div style="display:flex;align-items:center;gap:8px;"><div class="user-avatar-sm">${user.avatar}</div>${user.nome}</div></td>
      <td style="color:var(--text2);">${user.email}</td>
      <td><span class="status-badge livre">UTILIZADOR</span></td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td style="font-size:11px; color:var(--cyan);">${reservasAtivas} reserva(s)</td>
      <td><button class="btn-action danger" onclick="removerUtilizador(${user.id})">🗑️ Remover</button></td>
    `;
    tbody.appendChild(row);
  });
}

function removerUtilizador(id) {
  const user = users.find(u => u.id === id);
  if (!user) return;
  if (confirm(`Remover "${user.nome}"?`)) {
    const reservasUsuario = allReservations.filter(r => r.userId === id && (r.status === 'ativa' || r.status === 'cumprida'));
    reservasUsuario.forEach(reserva => cancelarReserva(reserva.id, 'admin'));
    users = users.filter(u => u.id !== id);
    renderUsersList();
    renderAdminGrid();
    renderUserGrid();
    updateCompleteDashboard();
    notify(`Utilizador ${user.nome} removido`, 'success');
  }
}

function adicionarUtilizador() {
  const nome = document.getElementById('novo-nome')?.value.trim();
  const email = document.getElementById('novo-email')?.value.trim();
  const senha = document.getElementById('novo-senha')?.value;
  const confirmar = document.getElementById('novo-confirmar')?.value;
  
  if (!nome || !email || !senha) { notify('Preencha todos os campos!', 'error'); return; }
  if (senha !== confirmar) { notify('Senhas não coincidem!', 'error'); return; }
  if (senha.length < 4) { notify('Senha deve ter 4+ caracteres!', 'error'); return; }
  if (users.some(u => u.email === email)) { notify('Email já registado!', 'error'); return; }
  
  const avatar = nome.substring(0, 2).toUpperCase();
  users.push({ id: nextUserId++, nome, email, senha, tipo: 'user', status: 'Ativo', avatar });
  
  document.getElementById('novo-nome').value = '';
  document.getElementById('novo-email').value = '';
  document.getElementById('novo-senha').value = '';
  document.getElementById('novo-confirmar').value = '';
  
  renderUsersList();
  notify(`Utilizador ${nome} criado!`, 'success');
}

// ========== DASHBOARD ==========
function updateDashStats() {
  const livres = slots.filter(s => s.status === 'livre').length;
  const ocupadas = slots.filter(s => s.status === 'ocupada').length;
  const reservadas = slots.filter(s => s.status === 'reservada').length;
  const pct = Math.round(((ocupadas + reservadas) / 24) * 100);
  
  const dashLivres = document.getElementById('dash-livres');
  const dashOcupadas = document.getElementById('dash-ocupadas');
  const dashReservadas = document.getElementById('dash-reservadas');
  const dashPct = document.getElementById('dash-pct');
  const dashBar = document.getElementById('dash-bar');
  
  if (dashLivres) dashLivres.textContent = livres;
  if (dashOcupadas) dashOcupadas.textContent = ocupadas;
  if (dashReservadas) dashReservadas.textContent = reservadas;
  if (dashPct) dashPct.textContent = pct + '%';
  if (dashBar) dashBar.style.width = pct + '%';
}

function updateDonut() {
  const canvas = document.getElementById('donut-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const cx = 70, cy = 70, r = 55, inner = 35;
  const livres = slots.filter(s => s.status === 'livre').length;
  const ocupadas = slots.filter(s => s.status === 'ocupada').length;
  const reservadas = slots.filter(s => s.status === 'reservada').length;
  const total = 24;
  
  const pctLivre = Math.round((livres / total) * 100);
  const pctOcupada = Math.round((ocupadas / total) * 100);
  const pctReservada = Math.round((reservadas / total) * 100);
  
  const legendItens = document.querySelectorAll('.donut-item');
  if (legendItens.length >= 3) {
    legendItens[0].innerHTML = `<div class="donut-swatch" style="background:var(--green)"></div>Livres — ${livres} (${pctLivre}%)`;
    legendItens[1].innerHTML = `<div class="donut-swatch" style="background:var(--red)"></div>Ocupadas — ${ocupadas} (${pctOcupada}%)`;
    legendItens[2].innerHTML = `<div class="donut-swatch" style="background:var(--yellow)"></div>Reservadas — ${reservadas} (${pctReservada}%)`;
  }
  
  const data = [];
  if (livres > 0) data.push({ v: livres, color: '#00ff88' });
  if (ocupadas > 0) data.push({ v: ocupadas, color: '#ff4466' });
  if (reservadas > 0) data.push({ v: reservadas, color: '#ffcc00' });
  
  let angle = -Math.PI / 2;
  ctx.clearRect(0, 0, 140, 140);
  
  data.forEach(d => {
    const slice = (d.v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    angle += slice;
  });
  
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = '#1a2035';
  ctx.fill();
  ctx.fillStyle = '#e8eaf2';
  ctx.font = 'bold 18px Rajdhani';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total.toString(), cx, cy - 6);
  ctx.font = '10px Inter';
  ctx.fillStyle = '#8b95b5';
  ctx.fillText('vagas', cx, cy + 10);
}

function buildBarChart() {
  const data = [{ h: '08h', v: 30 }, { h: '09h', v: 60 }, { h: '10h', v: 80 }, { h: '11h', v: 75 }, { h: '12h', v: 50 }, { h: '13h', v: 40 }, { h: '14h', v: 55 }, { h: '15h', v: 42 }];
  const max = Math.max(...data.map(d => d.v));
  const chart = document.getElementById('bar-chart');
  if (!chart) return;
  chart.innerHTML = '';
  data.forEach(d => {
    const h = Math.round((d.v / max) * 100);
    const wrap = document.createElement('div');
    wrap.className = 'bar-wrap';
    wrap.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;width:100%;"><div class="bar${d.v > 70 ? ' red' : ''}" style="height:${h}%"></div></div><div class="bar-label">${d.h}</div>`;
    chart.appendChild(wrap);
  });
}

function updateCompleteDashboard() {
  updateDashStats();
  updateDonut();
  buildBarChart();
  updateUserDashboard();
  atualizarUtilizadoresAtivos();
  atualizarVagasMaisUtilizadas();
  
  // Atualizar tempo médio de ocupação
  const tempoMedioSpan = document.getElementById('tempo-medio-geral');
  if (tempoMedioSpan) {
    const tempoMedio = calcularTempoMedioOcupacao();
    tempoMedioSpan.textContent = tempoMedio;
  }
}

// ========== UTILIDADES ==========
function showScreen(s) {
  document.querySelectorAll('.screen').forEach(sc => sc.classList.remove('active'));
  document.getElementById(`screen-${s}`).classList.add('active');
}

function showPage(p) {
  document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(ni => ni.classList.remove('active'));
  document.getElementById(`page-${p}`).classList.add('active');
  
  if (p === 'vagas-admin') renderAdminGrid();
  if (p === 'vagas-user') renderUserGrid();
  if (p === 'dashboard') updateCompleteDashboard();
  if (p === 'utilizadores') renderUsersList();
  if (p === 'minhas-reservas') updateUserReservas();
}

function openReservarModal() { document.getElementById('modal-reservar').classList.add('open'); }
function openCancelarModal() { document.getElementById('modal-cancelar').classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-list').style.display = tabId === 'tab-list' ? 'block' : 'none';
  document.getElementById('tab-novo').style.display = tabId === 'tab-novo' ? 'block' : 'none';
}

// ========== EVENT LISTENERS ==========
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
});

// ========== EXPORT ==========
window.atualizarVagaPorSensor = atualizarVagaPorSensor;
window.getVagasStatus = () => slots.map(s => ({ id: s.id, status: s.status }));

// ========== INIT ==========
initSlots();

//novo javascript