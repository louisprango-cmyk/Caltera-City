const $ = (s) => document.querySelector(s);
const roles = ['Spieler', 'Leiter einer Orga', 'Moderator', 'Administrator', 'Adminleitung', 'Inhaber'];
const availableTags = ['Frage', 'Diskussion', 'Ankündigung', 'Bewerbung', 'Beschwerde', 'Hilfe', 'Roleplay', 'Gelöst'];
const ownerCode = 'CALTERA-OWNER-7F3K-9Q2M';
let toastTimer;
let currentThreadId = null;
let selectedForum = localStorage.getItem('caltera-selected-forum') || '';
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const currentName = () => localStorage.getItem('caltera-player-name') || '';
const currentRole = () => read('caltera-roles', {})[currentName()] || 'Spieler';
const rolePermissions = {Moderator:['adminPanel','closeTopics','changePrefix'],Administrator:['adminPanel','closeTopics','changePrefix','assignRanks'],Adminleitung:['adminPanel','closeTopics','changePrefix','assignRanks'],Inhaber:['adminPanel','closeTopics','changePrefix','assignRanks','manageRanks']};
const hasPermission = permission => rolePermissions[currentRole()]?.includes(permission) || !!read('caltera-custom-ranks', []).find(item => item.name === currentRole())?.permissions?.[permission];
const isAdmin = () => hasPermission('adminPanel');
function ensureGuestPlayer() {
  if (currentName()) return;
  let guestName = localStorage.getItem('caltera-guest-name');
  if (!guestName) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    guestName = `Spieler-${suffix}`;
    localStorage.setItem('caltera-guest-name', guestName);
  }
  localStorage.setItem('caltera-player-name', guestName);
  const roleMap = read('caltera-roles', {}); roleMap[guestName] = 'Spieler'; write('caltera-roles', roleMap);
}

function notify(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function timeAgo(time) { const mins = Math.max(0, Math.floor((Date.now() - time) / 60000)); return mins < 1 ? 'gerade eben' : mins < 60 ? `vor ${mins} Min.` : `vor ${Math.floor(mins / 60)} Std.`; }

function updateProfile() {
  $('#profileName').textContent = currentName() || 'Gast';
  const role = currentRole();
  $('#profileButton').title = role;
  $('#profileButton').classList.toggle('has-role', role !== 'Spieler');
  $('#adminPanelButton').hidden = !isAdmin();
  $('#settingsAccount').textContent = localStorage.getItem('caltera-player-email') ? localStorage.getItem('caltera-player-email') : 'Gastkonto auf diesem Browser';
  $('#settingsRank').textContent = `Dein Rang: ${currentRole()}`;
  $('#settingsUsername').value = currentName();
  $('#profileVisibility').value = localStorage.getItem('caltera-profile-visibility') || 'public';
  $('#mentionNotifications').checked = localStorage.getItem('caltera-mention-notifications') !== 'off';
  const badges = read('caltera-achievements', {})[currentName()] || [];
  $('#playerAchievements').innerHTML = badges.length ? badges.map(badge => `<span class="achievement-badge">🏅 ${escapeHtml(badge.label)}</span>`).join('') : '<span class="field-hint">Noch keine Auszeichnungen erhalten.</span>';
  $('#topicAuthor').value = currentName();
  updateForumPath();
}
function showJoin(mode = 'register') { setAuthMode(mode); $('#joinDialog').showModal(); }
$('#newTopic').addEventListener('click', () => {
  if (!currentName()) { showJoin(); notify('Wähle zuerst deinen Spielernamen.'); return; }
  if (!selectedForum) { notify('Öffne zuerst ein Forum in der Liste.'); document.querySelector('.forum-list').scrollIntoView({behavior:'smooth'}); return; }
  $('#selectedForumLabel').textContent = selectedForum;
  $('#topicPrefix').textContent = 'Wartet auf Bearbeitung';
  $('#adminPrefixSelect').value = 'Wartet auf Bearbeitung';
  $('#adminPrefixSelect').hidden = !hasPermission('changePrefix');
  $('#topicDialog').querySelector('[name="author"]').value = currentName();
  $('#topicDialog').showModal();
});
$('#joinButton').addEventListener('click', showJoin);
$('#profileButton').addEventListener('click', () => $('#settingsDialog').showModal());
$('#adminPanelButton').addEventListener('click', openAdmin);
$('#settingsButton').addEventListener('click', () => $('#settingsDialog').showModal());
$('#logoutButton').addEventListener('click', () => { localStorage.removeItem('caltera-player-name'); localStorage.removeItem('caltera-player-email'); localStorage.removeItem('caltera-guest-name'); ensureGuestPlayer(); updateProfile(); $('#settingsDialog').close(); notify('Abgemeldet. Du nutzt jetzt einen neuen Spieler-Gastnamen.'); });
$('#settingsAuthButton').addEventListener('click', () => { $('#settingsDialog').close(); showJoin('register'); });
$('#saveSettingsButton').addEventListener('click', () => {
  const oldName = currentName(); const newName = $('#settingsUsername').value.trim();
  if (!newName) return notify('Username darf nicht leer sein.');
  const accounts = read('caltera-accounts', []);
  if (accounts.some(account => account.username.toLowerCase() === newName.toLowerCase() && account.username !== oldName)) return notify('Dieser Username ist bereits vergeben.');
  const rolesMap = read('caltera-roles', {}); const role = rolesMap[oldName] || 'Spieler'; delete rolesMap[oldName]; rolesMap[newName] = role; write('caltera-roles', rolesMap);
  const account = accounts.find(item => item.username === oldName); if (account) { account.username = newName; write('caltera-accounts', accounts); }
  localStorage.setItem('caltera-player-name', newName); localStorage.setItem('caltera-guest-name', newName);
  localStorage.setItem('caltera-profile-visibility', $('#profileVisibility').value);
  localStorage.setItem('caltera-mention-notifications', $('#mentionNotifications').checked ? 'on' : 'off');
  updateProfile(); $('#settingsDialog').close(); notify('Spieler-Einstellungen gespeichert.');
});
$('#applyOwnerCode').addEventListener('click', () => {
  if ($('#ownerCodeInput').value.trim().toUpperCase() !== ownerCode) return notify('Der Inhabercode ist ungültig.');
  const roleMap = read('caltera-roles', {}); roleMap[currentName()] = 'Inhaber'; write('caltera-roles', roleMap);
  localStorage.setItem('caltera-owner-setup', 'true'); $('#ownerCodeInput').value = ''; updateProfile(); notify('Inhaber-Rang freigeschaltet.');
});
$('#menuToggle').addEventListener('click', () => $('.topnav').classList.toggle('open'));
$('.topnav').addEventListener('click', (event) => { if (event.target.closest('a')) $('.topnav').classList.remove('open'); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(`#${button.dataset.close}`).close()));

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLocaleLowerCase('de');
  document.querySelectorAll('.forum-row').forEach(row => { row.hidden = !`${row.dataset.search} ${row.innerText}`.toLocaleLowerCase('de').includes(query); });
  renderPosts();
});

function setAuthMode(mode) {
  const register = mode === 'register';
  $('#joinForm').dataset.mode = mode;
  $('#authTitle').textContent = register ? 'Konto erstellen' : 'Anmelden';
  $('#authSubmit').textContent = register ? 'Konto erstellen' : 'Anmelden';
  document.querySelectorAll('.auth-register-only').forEach(node => { node.hidden = !register; node.querySelector('input').required = register && node.querySelector('input').name === 'username'; });
  document.querySelectorAll('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
  const username = $('#joinForm [name="username"]'); username.required = register;
  $('#joinForm [name="password"]').autocomplete = register ? 'new-password' : 'current-password';
}
document.querySelectorAll('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
async function passwordDigest(password) {
  const bytes = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2,'0')).join('');
}
$('#joinForm').addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget); const mode = event.currentTarget.dataset.mode;
  const email = data.get('email').trim().toLowerCase(); const password = data.get('password');
  const accounts = read('caltera-accounts', []);
  if (mode === 'register') {
    const username = data.get('username').trim();
    if (password.length < 8) return notify('Das Passwort braucht mindestens 8 Zeichen.');
    if (accounts.some(account => account.email === email || account.username.toLowerCase() === username.toLowerCase())) return notify('E-Mail oder Username ist bereits registriert.');
    const owner = data.get('ownerCode').trim().toUpperCase() === ownerCode;
    accounts.push({username, email, passwordHash: await passwordDigest(password)}); write('caltera-accounts', accounts);
    const roleMap = read('caltera-roles', {}); roleMap[username] = owner ? 'Inhaber' : 'Spieler'; write('caltera-roles', roleMap);
    if (owner) localStorage.setItem('caltera-owner-setup', 'true');
    localStorage.setItem('caltera-player-name', username); localStorage.setItem('caltera-player-email', email);
    $('#joinDialog').close(); event.currentTarget.reset(); setAuthMode('register'); updateProfile(); notify(owner ? `Konto erstellt — willkommen, Inhaber ${username}!` : `Willkommen in Caltera, ${username}!`);
  } else {
    const account = accounts.find(item => item.email === email);
    if (!account || account.passwordHash !== await passwordDigest(password)) return notify('E-Mail oder Passwort ist falsch.');
    localStorage.setItem('caltera-player-name', account.username); localStorage.setItem('caltera-player-email', account.email);
    $('#joinDialog').close(); event.currentTarget.reset(); setAuthMode('register'); updateProfile(); notify(`Willkommen zurück, ${account.username}!`);
  }
});

function updateForumPath() {
  const crumb = $('#breadcrumbs');
  crumb.innerHTML = selectedForum ? `Home <span>›</span> Forums <span>›</span> DE <span>›</span> ${escapeHtml(selectedForum)}` : 'Home <span>›</span> Forums <span>›</span> Forum auswählen';
  document.querySelectorAll('.forum-row').forEach(row => row.classList.toggle('forum-selected', row.dataset.forumName === selectedForum));
}
document.querySelectorAll('.forum-row').forEach(row => {
  row.dataset.forumName = row.querySelector('.forum-info a').textContent.trim();
  row.tabIndex = 0; row.setAttribute('role','button');
  const choose = event => {
    if (event.target.closest('a')) event.preventDefault();
    selectedForum = row.dataset.forumName; localStorage.setItem('caltera-selected-forum', selectedForum); updateForumPath(); renderPosts();
    notify(`Forum geöffnet: ${selectedForum}`);
  };
  row.addEventListener('click', choose);
  row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(event); } });
});

function initTopicForm() {
  $('#tagPicker').innerHTML = availableTags.map(tag => `<label class="tag-option"><input type="checkbox" name="tags" value="${escapeHtml(tag)}"><span>${escapeHtml(tag)}</span></label>`).join('');
}
$('#tagPicker').addEventListener('change', () => {
  const checked = [...$('#tagPicker').querySelectorAll('input:checked')];
  if (checked.length > 3) { checked.at(-1).checked = false; notify('Wähle höchstens 3 Tags.'); }
});
$('#adminPrefixSelect').addEventListener('change', event => { $('#topicPrefix').textContent = event.target.value; });
document.querySelectorAll('.editor-toolbar [data-format]').forEach(button => button.addEventListener('click', () => {
  const editor = $('#postEditor'); editor.focus();
  const command = button.dataset.format;
  if (command === 'createLink') {
    const url = prompt('Link-Adresse eingeben (https://…)');
    if (url && /^https?:\/\//i.test(url)) document.execCommand(command, false, url);
    return;
  }
  document.execCommand(command, false, command === 'formatBlock' ? button.dataset.value : null);
}));
$('#topicForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const posts = read('caltera-forum-posts', []);
  const author = data.get('author').trim();
  const body = $('#postEditor').innerText.trim();
  if (!selectedForum) return notify('Öffne zuerst ein Forum.');
  const post = { id: crypto.randomUUID(), author, playerId: data.get('playerId').trim(), organization: data.get('organization').trim(), title: data.get('title').trim(), body, category: selectedForum, prefix: hasPermission('changePrefix') ? $('#adminPrefixSelect').value : 'Wartet auf Bearbeitung', tags: data.getAll('tags'), replies: [], closed: false, created: Date.now(), achievements: ['First Steps'] };
  if (!post.title || !post.body) return;
  posts.unshift(post); write('caltera-forum-posts', posts);
  recordOutcome(post, post.prefix);
  localStorage.setItem('caltera-player-name', author);
  const roleMap = read('caltera-roles', {}); roleMap[author] ||= 'Spieler'; write('caltera-roles', roleMap); updateProfile();
  const stats = read('caltera-player-stats', {}); stats[post.author] = (stats[post.author] || 0) + 1; write('caltera-player-stats', stats);
  $('#topicDialog').close(); event.currentTarget.reset(); $('#postEditor').innerHTML = ''; initTopicForm(); renderPosts(); openThread(post.id);
  notify('Thema erstellt · Auszeichnung „First Steps“ erhalten!');
});

function roleBadge(role) { return role && role !== 'Spieler' ? `<span class="role-badge role-${role.toLowerCase().replaceAll(/[^a-z]/g,'')}">${escapeHtml(role)}</span>` : ''; }
function tagMarkup(tags = []) { return tags.map(tag => `<span class="topic-tag">${escapeHtml(tag)}</span>`).join(''); }
function renderPosts() {
  const posts = read('caltera-forum-posts', []);
  const container = $('#recentPosts');
  const sample = [
    {title:'EMS sucht Verstärkung', author:'DrVega', category:'Bewerbung als Leiter einer Orga', tags:['Bewerbung'], created:Date.now()-2600000},
    {title:'Ein Neuanfang in Caltera', author:'JaxMiller', category:'Community & Support', tags:['Roleplay'], created:Date.now()-4500000},
    {title:'Neu in der Stadt ✨', author:'MiaRose', category:'Community & Support', tags:['Frage'], created:Date.now()-1900000}
  ];
  const entries = [...posts, ...sample].filter(post => {
    const q = searchInput.value.trim().toLocaleLowerCase('de'); return !q || `${post.title} ${post.author} ${post.category} ${(post.tags||[]).join(' ')} ${post.body||''}`.toLocaleLowerCase('de').includes(q);
  }).slice(0, 8);
  container.replaceChildren();
  entries.forEach(post => {
    const article = document.createElement('article'); article.className = 'recent';
    const avatar = document.createElement('span'); avatar.className = 'mini-avatar pink'; avatar.textContent = post.author.slice(0,1).toUpperCase();
    const details = document.createElement('div');
    const title = document.createElement('a'); title.href = '#beitraege'; title.textContent = post.title;
    if (post.id) title.addEventListener('click', event => { event.preventDefault(); openThread(post.id); });
    const meta = document.createElement('small'); meta.textContent = `${post.author} · ${post.created ? timeAgo(post.created) : 'heute'}`;
    details.append(title, meta); article.append(avatar, details); container.append(article);
  });
  const threadList = document.getElementById('communityThreads');
  if (threadList) {
    const visiblePosts = selectedForum ? posts.filter(post => post.category === selectedForum) : posts;
    threadList.innerHTML = visiblePosts.map(post => `<article class="community-thread"><div class="thread-main"><a href="#beitraege" data-thread="${escapeHtml(post.id)}">${escapeHtml(post.title)}</a><div class="thread-meta">${escapeHtml(post.category)} · ${escapeHtml(post.author)} ${roleBadge(read('caltera-roles', {})[post.author])}</div><div class="thread-tags"><span class="prefix-pill">${escapeHtml(post.prefix || 'Wartet auf Bearbeitung')}</span>${tagMarkup(post.tags)} ${post.closed ? '<span class="topic-tag closed-tag">Geschlossen</span>' : ''}</div></div><span class="thread-reply-count">${post.replies.length} Antworten</span></article>`).join('') || '<p class="empty-threads">In diesem Forum gibt es noch keine selbst erstellten Themen.</p>';
    threadList.querySelectorAll('[data-thread]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); openThread(link.dataset.thread); }));
  }
}

function openThread(id) {
  const post = read('caltera-forum-posts', []).find(item => item.id === id); if (!post) return;
  currentThreadId = id;
  const rolesMap = read('caltera-roles', {});
  const mayReply = !post.closed || hasPermission('closeTopics');
  const replies = post.replies.map(reply => `<article class="reply"><div class="reply-head"><b>${escapeHtml(reply.author)}</b> ${roleBadge(rolesMap[reply.author])}<small>${timeAgo(reply.created)}</small></div><p>${escapeHtml(reply.body)}</p></article>`).join('');
  const closeButton = hasPermission('closeTopics') ? `<button class="button outline" id="toggleClose">${post.closed ? 'Thema wieder öffnen' : 'Thema schließen'}</button>` : '';
  const prefixControl = hasPermission('changePrefix') ? `<label class="thread-prefix-label">Präfix ändern<select id="threadPrefix">${['Wartet auf Bearbeitung','Angenommen','Abgelehnt','In Bearbeitung','Wichtig','Gelöst'].map(prefix => `<option ${prefix === (post.prefix || 'Wartet auf Bearbeitung') ? 'selected' : ''}>${prefix}</option>`).join('')}</select></label>` : '';
  $('#threadContent').innerHTML = `<p class="eyebrow">${escapeHtml(post.category)}</p><h2>${escapeHtml(post.title)}</h2><div class="thread-tags"><span class="prefix-pill">${escapeHtml(post.prefix || 'Wartet auf Bearbeitung')}</span>${tagMarkup(post.tags)} ${post.closed ? '<span class="topic-tag closed-tag">Geschlossen</span>' : ''}</div><article class="reply original-post"><div class="reply-head"><b>${escapeHtml(post.author)}</b> ${roleBadge(rolesMap[post.author])}<small>${timeAgo(post.created)}</small></div><div class="thread-player-details">Spieler-ID: ${escapeHtml(post.playerId || '—')} ${post.organization ? `· Organisation: ${escapeHtml(post.organization)}` : ''}</div><p>${escapeHtml(post.body)}</p><div class="achievement-list">${(post.achievements || ['First Steps']).map(badge => `🏅 ${escapeHtml(badge)}`).join(' · ')}${post.replies.length >= 5 ? ' · 🏅 Gesprächsstarter' : ''}</div></article><h3 class="reply-heading">Antworten (${post.replies.length})</h3><div class="reply-list">${replies || '<p class="empty-threads">Noch keine Antworten.</p>'}</div>${mayReply ? '<form id="replyForm"><label>Antwort schreiben<textarea name="reply" rows="3" maxlength="600" required placeholder="Deine Antwort …"></textarea></label><button class="button primary" type="submit">Antwort senden</button></form>' : '<p class="closed-note">Dieses Thema ist geschlossen. Nur Teammitglieder mit passendem Recht können noch schreiben.</p>'}<div class="thread-admin-actions">${closeButton}${prefixControl}</div>`;
  $('#threadDialog').showModal();
  $('#replyForm')?.addEventListener('submit', event => {
    event.preventDefault(); const reply = new FormData(event.currentTarget).get('reply').trim(); if (!reply) return;
    const all = read('caltera-forum-posts', []); const target = all.find(item => item.id === currentThreadId);
    if (!target || (target.closed && !hasPermission('closeTopics'))) return notify('Du darfst in diesem geschlossenen Thema nicht antworten.');
    target.replies.push({author:currentName(), body:reply, created:Date.now()}); write('caltera-forum-posts', all); openThread(currentThreadId); renderPosts();
  });
  $('#toggleClose')?.addEventListener('click', () => {
    const all = read('caltera-forum-posts', []); const target = all.find(item => item.id === currentThreadId); target.closed = !target.closed; write('caltera-forum-posts', all); openThread(currentThreadId); renderPosts(); notify(target.closed ? 'Thema geschlossen.' : 'Thema wieder geöffnet.');
  });
  $('#threadPrefix')?.addEventListener('change', event => {
    const all = read('caltera-forum-posts', []); const target = all.find(item => item.id === currentThreadId); target.prefix = event.target.value; recordOutcome(target, target.prefix); write('caltera-forum-posts', all); openThread(currentThreadId); renderPosts(); updateProfile(); notify('Themenpräfix geändert.');
  });
}

function recordOutcome(post, prefix) {
  if (!['Angenommen', 'Abgelehnt'].includes(prefix)) return;
  const label = prefix === 'Angenommen' ? 'Thema angenommen' : 'Thema abgelehnt';
  post.achievements ||= ['First Steps'];
  post.achievements = post.achievements.filter(item => !['Thema angenommen', 'Thema abgelehnt'].includes(item));
  post.achievements.push(label);
  const all = read('caltera-achievements', {}); const user = all[post.author] || [];
  const existing = user.find(item => item.postId === post.id);
  if (existing) existing.label = label;
  else user.push({label, postId:post.id, earned:Date.now()});
  all[post.author] = user; write('caltera-achievements', all);
}

function openAdmin() {
  if (!isAdmin()) return notify('Nur angemeldete Teammitglieder haben Zugriff auf die Admin-Einstellungen.');
  const setup = $('#adminSetup'); const roleLabel = $('#roleLabel'); const roleSelectLabel = $('#roleSelectLabel'); const tools = $('#adminTools'); const action = $('#adminAction');
  setup.innerHTML = `<p class="dialog-copy">Angemeldet als <b>${escapeHtml(currentName())}</b> · Rang: ${roleBadge(currentRole())}. Hier kannst du einem registrierten Username einen Rang geben.</p>`;
  roleLabel.hidden = roleSelectLabel.hidden = !hasPermission('assignRanks');
  action.hidden = !hasPermission('assignRanks');
  roleSelectLabel.querySelector('select').innerHTML = [...roles, ...read('caltera-custom-ranks', []).map(role => role.name)].map(role => `<option>${escapeHtml(role)}</option>`).join('');
  roleLabel.querySelector('input').value = '';
  action.textContent = 'Rang speichern';
  tools.innerHTML = `<p class="field-hint">Ränge: ${[...roles, ...read('caltera-custom-ranks', []).map(role => role.name)].map(escapeHtml).join(' · ')}</p>`;
  $('#ownerRankTools').hidden = !hasPermission('manageRanks');
  renderCustomRoles();
  $('#adminDialog').showModal();
}
$('#adminForm').addEventListener('submit', event => {
  event.preventDefault(); const data = new FormData(event.currentTarget);
  if (!hasPermission('assignRanks')) return notify('Dein Rang darf keine Ränge vergeben.');
  if (data.get('player')?.trim()) {
    const player = data.get('player').trim();
    const accounts = read('caltera-accounts', []);
    if (!accounts.some(account => account.username.toLowerCase() === player.toLowerCase())) return notify('Diesen Username gibt es noch nicht.');
    const map = read('caltera-roles', {}); map[player] = data.get('role'); write('caltera-roles', map); notify(`Rang „${data.get('role')}“ an ${player} vergeben.`); updateProfile();
  } else return notify('Gib den registrierten Username ein.');
  $('#adminDialog').close();
});
function renderCustomRoles() {
  const rolesList = read('caltera-custom-ranks', []);
  $('#customRoleList').innerHTML = rolesList.map(role => `<div class="custom-role-row"><b>${escapeHtml(role.name)}</b><small>${Object.keys(role.permissions).filter(key => role.permissions[key]).map(escapeHtml).join(' · ') || 'Keine Rechte'}</small></div>`).join('');
}
$('#createRoleButton').addEventListener('click', () => {
  if (!hasPermission('manageRanks')) return notify('Nur Inhaber oder Ränge mit Rangverwaltungsrecht können Ränge erstellen.');
  const name = $('#customRoleName').value.trim();
  if (!name) return notify('Gib einen Namen für den Rang ein.');
  if (roles.includes(name) || read('caltera-custom-ranks', []).some(role => role.name.toLowerCase() === name.toLowerCase())) return notify('Diesen Rang gibt es bereits.');
  const permissions = {};
  document.querySelectorAll('#ownerRankTools [data-permission]').forEach(input => { permissions[input.dataset.permission] = input.checked; });
  const custom = read('caltera-custom-ranks', []); custom.push({name, permissions}); write('caltera-custom-ranks', custom);
  $('#customRoleName').value = ''; document.querySelectorAll('#ownerRankTools [data-permission]').forEach(input => { input.checked = false; });
  const select = $('#roleSelectLabel select'); select.innerHTML = [...roles, ...custom.map(role => role.name)].map(role => `<option>${escapeHtml(role)}</option>`).join('');
  renderCustomRoles(); notify(`Rang „${name}“ wurde erstellt.`);
});
$('#adminDialog').addEventListener('close', () => { $('#adminForm').reset(); });

function injectCommunityThreads() {
  const section = document.createElement('section'); section.className = 'thread-board'; section.innerHTML = `<div class="thread-board-head"><div><p class="eyebrow">DISKUSSIONEN DER COMMUNITY</p><h2>Aktuelle Themen</h2></div><div class="thread-board-tools"><span class="field-hint">Themen, Tags & Auszeichnungen</span><button type="button" class="button outline" id="allTopicsButton">Alle Themen</button></div></div><div id="communityThreads"></div>`;
  $('#foren').prepend(section);
  $('#allTopicsButton').addEventListener('click', () => { selectedForum = ''; localStorage.removeItem('caltera-selected-forum'); updateForumPath(); renderPosts(); });
}
injectCommunityThreads(); initTopicForm(); ensureGuestPlayer(); updateProfile(); renderPosts();
