const form = document.getElementById('eventForm');
const formTitle = document.getElementById('formTitle');
const eventId = document.getElementById('eventId');
const eventTitle = document.getElementById('eventTitle');
const eventType = document.getElementById('eventType');
const eventBadge = document.getElementById('eventBadge');
const eventDate = document.getElementById('eventDate');
const eventTime = document.getElementById('eventTime');
const eventLocation = document.getElementById('eventLocation');
const eventDescription = document.getElementById('eventDescription');
const eventLink = document.getElementById('eventLink');
const eventPoster = document.getElementById('eventPoster');
const eventPublished = document.getElementById('eventPublished');
const posterPreview = document.getElementById('posterPreview');
const removePoster = document.getElementById('removePoster');
const saveEventButton = document.getElementById('saveEvent');
const clearFormButton = document.getElementById('clearForm');
const cancelEditButton = document.getElementById('cancelEdit');
const descriptionCount = document.getElementById('descriptionCount');
const formMessage = document.getElementById('formMessage');
const adminEventList = document.getElementById('adminEventList');
const toast = document.getElementById('toast');
const filterButtons = document.querySelectorAll('[data-filter]');

let events = [];
let activeFilter = 'all';
let currentPoster = '';
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function timeToInput(displayTime) {
  if (!displayTime) return '';
  if (/^\d{2}:\d{2}$/.test(displayTime)) return displayTime;
  const match = displayTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function timeToDisplay(inputTime) {
  if (!inputTime) return '';
  const [hourString, minute] = inputTime.split(':');
  let hour = Number(hourString);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

function setPosterPreview(source) {
  currentPoster = source || '';
  if (currentPoster) {
    posterPreview.style.backgroundImage = `linear-gradient(160deg, rgba(3,14,31,.06), rgba(3,14,31,.20)), url("${String(currentPoster).replace(/"/g, '%22')}")`;
    posterPreview.classList.add('has-image');
    removePoster.classList.remove('hidden');
  } else {
    posterPreview.style.backgroundImage = '';
    posterPreview.classList.remove('has-image');
    removePoster.classList.add('hidden');
  }
}

function resizeImage(file, maxWidth = 1400, maxHeight = 1800, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('This image format could not be processed.'));
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePosterSelection() {
  const file = eventPoster.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file.');
    eventPoster.value = '';
    return;
  }
  formMessage.textContent = 'Optimising poster image...';
  try {
    const dataUrl = await resizeImage(file);
    setPosterPreview(dataUrl);
    formMessage.textContent = `Poster ready: ${file.name}`;
  } catch (error) {
    formMessage.textContent = error.message;
  }
}

function updateStats() {
  const upcoming = events.filter(event => IEMEventStore.eventBucket(event) === 'upcoming').length;
  const past = events.filter(event => IEMEventStore.eventBucket(event) === 'past').length;
  const published = events.filter(event => event.published !== false).length;
  document.getElementById('totalEvents').textContent = events.length;
  document.getElementById('upcomingEvents').textContent = upcoming;
  document.getElementById('pastEvents').textContent = past;
  document.getElementById('publishedEvents').textContent = published;
}

function getVisibleEvents() {
  const filtered = events.filter(event => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'draft') return event.published === false;
    return IEMEventStore.eventBucket(event) === activeFilter;
  });
  return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
}

function createAdminEventItem(event) {
  const bucket = IEMEventStore.eventBucket(event);
  const item = document.createElement('article');
  item.className = 'admin-event-item';

  const thumb = document.createElement('div');
  thumb.className = 'admin-event-thumb';
  if (event.poster) thumb.style.backgroundImage = `url("${String(event.poster).replace(/"/g, '%22')}")`;

  const info = document.createElement('div');
  info.className = 'admin-event-info';

  const topline = document.createElement('div');
  topline.className = 'admin-event-topline';
  const bucketBadge = document.createElement('span');
  bucketBadge.className = `list-status ${bucket}`;
  bucketBadge.textContent = bucket === 'past' ? 'Past' : 'Upcoming';
  topline.appendChild(bucketBadge);
  if (event.published === false) {
    const draftBadge = document.createElement('span');
    draftBadge.className = 'list-status draft';
    draftBadge.textContent = 'Draft';
    topline.appendChild(draftBadge);
  }

  const title = document.createElement('h3');
  title.textContent = event.title;

  const meta = document.createElement('div');
  meta.className = 'admin-event-meta';
  const date = document.createElement('span');
  date.textContent = `📅 ${formatDate(event.date)}`;
  meta.appendChild(date);
  if (event.location) {
    const location = document.createElement('span');
    location.textContent = `📍 ${event.location}`;
    meta.appendChild(location);
  }
  if (event.type) {
    const type = document.createElement('span');
    type.textContent = event.type;
    meta.appendChild(type);
  }

  info.append(topline, title, meta);

  const actions = document.createElement('div');
  actions.className = 'admin-event-actions';
  const edit = document.createElement('button');
  edit.className = 'small-action edit';
  edit.type = 'button';
  edit.dataset.action = 'edit';
  edit.dataset.id = event.id;
  edit.textContent = 'Edit';
  const del = document.createElement('button');
  del.className = 'small-action delete';
  del.type = 'button';
  del.dataset.action = 'delete';
  del.dataset.id = event.id;
  del.textContent = 'Delete';
  actions.append(edit, del);

  item.append(thumb, info, actions);
  return item;
}

function renderEventList() {
  const visible = getVisibleEvents();
  adminEventList.innerHTML = '';
  if (!visible.length) {
    adminEventList.innerHTML = '<div class="list-empty">No events in this category yet.</div>';
    return;
  }
  visible.forEach(event => adminEventList.appendChild(createAdminEventItem(event)));
}

async function refreshEvents() {
  events = await IEMEventStore.getAllEvents();
  updateStats();
  renderEventList();
}

function resetForm() {
  form.reset();
  eventId.value = '';
  eventBadge.value = 'Registration Open';
  eventPublished.checked = true;
  formTitle.textContent = 'Add New Event';
  saveEventButton.textContent = 'Publish Event';
  cancelEditButton.classList.add('hidden');
  descriptionCount.textContent = '0';
  formMessage.textContent = '';
  eventPoster.value = '';
  setPosterPreview('');
}

function beginEdit(event) {
  eventId.value = event.id;
  eventTitle.value = event.title || '';
  eventType.value = event.type || '';
  eventBadge.value = event.badge || 'Upcoming';
  eventDate.value = event.date || '';
  eventTime.value = timeToInput(event.time || '');
  eventLocation.value = event.location || '';
  eventDescription.value = event.description || '';
  eventLink.value = event.link || '';
  eventPublished.checked = event.published !== false;
  descriptionCount.textContent = String((event.description || '').length);
  setPosterPreview(event.poster || '');
  formTitle.textContent = 'Edit Event';
  saveEventButton.textContent = event.published === false ? 'Save Event' : 'Update Event';
  cancelEditButton.classList.remove('hidden');
  document.getElementById('editorCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function saveForm(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const editingId = eventId.value;
  const existing = editingId ? events.find(item => item.id === editingId) : null;
  const now = new Date().toISOString();
  const record = {
    id: editingId || makeId(),
    title: eventTitle.value.trim(),
    type: eventType.value.trim() || 'IEM UMPSA Event',
    badge: eventBadge.value,
    date: eventDate.value,
    time: timeToDisplay(eventTime.value),
    location: eventLocation.value.trim(),
    description: eventDescription.value.trim(),
    link: eventLink.value.trim(),
    poster: currentPoster,
    published: eventPublished.checked,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  saveEventButton.disabled = true;
  saveEventButton.textContent = 'Saving...';
  try {
    await IEMEventStore.saveEvent(record);
    await refreshEvents();
    resetForm();
    showToast(record.published ? 'Event published to the website.' : 'Event saved as a draft.');
  } catch (error) {
    console.error(error);
    formMessage.textContent = 'Could not save the event. Please try again.';
  } finally {
    saveEventButton.disabled = false;
    if (!eventId.value) saveEventButton.textContent = 'Publish Event';
  }
}

async function handleListAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const id = button.dataset.id;
  const record = events.find(item => item.id === id);
  if (!record) return;

  if (button.dataset.action === 'edit') {
    beginEdit(record);
    return;
  }

  if (button.dataset.action === 'delete') {
    const confirmed = window.confirm(`Delete “${record.title}”? This removes it from the public website too.`);
    if (!confirmed) return;
    await IEMEventStore.deleteEvent(id);
    if (eventId.value === id) resetForm();
    await refreshEvents();
    showToast('Event deleted.');
  }
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle('active', item === button));
    renderEventList();
  });
});

eventDescription.addEventListener('input', () => {
  descriptionCount.textContent = String(eventDescription.value.length);
});
eventPoster.addEventListener('change', handlePosterSelection);
removePoster.addEventListener('click', () => {
  eventPoster.value = '';
  setPosterPreview('');
  formMessage.textContent = 'Poster removed from this event.';
});
clearFormButton.addEventListener('click', resetForm);
cancelEditButton.addEventListener('click', resetForm);
adminEventList.addEventListener('click', handleListAction);
form.addEventListener('submit', saveForm);

refreshEvents().catch(error => {
  console.error(error);
  adminEventList.innerHTML = '<div class="list-empty">Could not open browser storage. Try serving the site through Vercel or a local web server.</div>';
});


// ------------------------------------------------------------
// Admin section navigation
// ------------------------------------------------------------
const adminViewButtons = document.querySelectorAll('[data-admin-view]');
const adminViewPanels = document.querySelectorAll('[data-view-panel]');
const adminPageTitle = document.getElementById('adminPageTitle');
const viewLiveLink = document.getElementById('viewLiveLink');
const logoutButton = document.getElementById('logoutButton');
let publicPreviewWindow = null;

function sendCommitteePreview(targetWindow = null) {
  if (!Array.isArray(committeeRecords) || !committeeRecords.length) return;

  const payload = {
    type: 'IEM_COMMITTEE_PREVIEW',
    members: committeeRecords.map(member => ({ ...member }))
  };

  const targets = [];

  if (targetWindow && !targetWindow.closed) {
    targets.push(targetWindow);
  }

  if (publicPreviewWindow && !publicPreviewWindow.closed) {
    targets.push(publicPreviewWindow);
  }

  if (window.opener && !window.opener.closed) {
    targets.push(window.opener);
  }

  [...new Set(targets)].forEach(target => {
    try {
      target.postMessage(payload, '*');
    } catch (error) {
      console.warn('Could not send committee preview to a website tab.', error);
    }
  });

  try {
    const channel = new BroadcastChannel('iem-umpsa-content');
    channel.postMessage(payload);
    channel.close();
  } catch (error) {
    // Optional fallback for same-origin hosted versions.
  }
}

function sendCommitteePreviewWithRetries(targetWindow) {
  [250, 700, 1400, 2400].forEach(delay => {
    setTimeout(() => sendCommitteePreview(targetWindow), delay);
  });
}

function switchAdminView(view) {
  adminViewButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.adminView === view);
  });

  adminViewPanels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.viewPanel === view);
  });

  if (view === 'committee') {
    adminPageTitle.textContent = 'Committee Dashboard';
    viewLiveLink.href = 'index.html#committee';
    refreshCommittee().catch(console.error);
  } else {
    adminPageTitle.textContent = 'Events Dashboard';
    viewLiveLink.href = 'index.html#events';
  }
}

adminViewButtons.forEach(button => {
  button.addEventListener('click', () => switchAdminView(button.dataset.adminView));
});

viewLiveLink?.addEventListener('click', event => {
  if (adminPageTitle.textContent !== 'Committee Dashboard') return;

  event.preventDefault();

  publicPreviewWindow = window.open(
    'index.html#committee',
    'iemUmpsaPublicPreview'
  );

  if (publicPreviewWindow) {
    sendCommitteePreviewWithRetries(publicPreviewWindow);
  } else {
    showToast('Allow pop-ups to open the live website preview.');
  }
});

logoutButton?.addEventListener('click', () => IEMAdminAuth.logout());

// ------------------------------------------------------------
// Committee CMS
// ------------------------------------------------------------
const committeeForm = document.getElementById('committeeForm');
const committeeEditorPlaceholder = document.getElementById('committeeEditorPlaceholder');
const committeeFormTitle = document.getElementById('committeeFormTitle');
const committeeMemberId = document.getElementById('committeeMemberId');
const committeeMemberFixed = document.getElementById('committeeMemberFixed');
const committeeMemberName = document.getElementById('committeeMemberName');
const committeeMemberGroup = document.getElementById('committeeMemberGroup');
const committeeDepartmentField = document.getElementById('committeeDepartmentField');
const committeeMemberDepartment = document.getElementById('committeeMemberDepartment');
const committeeMemberPosition = document.getElementById('committeeMemberPosition');
const committeeMemberOrder = document.getElementById('committeeMemberOrder');
const committeePhoto = document.getElementById('committeePhoto');
const committeePhotoPreview = document.getElementById('committeePhotoPreview');
const removeCommitteePhoto = document.getElementById('removeCommitteePhoto');
const committeeMemberPublished = document.getElementById('committeeMemberPublished');
const saveCommitteeMember = document.getElementById('saveCommitteeMember');
const clearCommitteeOccupant = document.getElementById('clearCommitteeOccupant');
const cancelCommitteeEdit = document.getElementById('cancelCommitteeEdit');
const committeeFormMessage = document.getElementById('committeeFormMessage');
const committeeSlotList = document.getElementById('committeeSlotList');
const committeeViewButtons = document.querySelectorAll('[data-committee-view]');
const departmentFilterWrap = document.getElementById('departmentFilterWrap');
const committeeDepartmentFilter = document.getElementById('committeeDepartmentFilter');
const addCommitteeMember = document.getElementById('addCommitteeMember');

let committeeRecords = [];
let committeeViewMode = 'management';
let activeCommitteeDepartment = 'civil';
let currentCommitteePhoto = '';

const managementPositions = [
  'Chairperson',
  'Vice Chairperson · Internal',
  'Vice Chairperson · External',
  'Treasurer',
  'Vice Treasurer',
  'Secretary',
  'Vice Secretary'
];

const departmentPositions = ['HOD', 'Asst HOD', 'Member'];

function committeeInitials(name) {
  if (!name) return '—';

  const ignored = new Set(['BIN', 'BINTI', 'A/P', 'A/L', 'ANAK', 'MOHD']);
  const words = name.trim().split(/\s+/).filter(word => /^[A-Za-z]/.test(word));
  const candidates = words.filter(word => !ignored.has(word.toUpperCase()));
  const source = candidates.length ? candidates : words;

  if (!source.length) return '—';
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();

  return `${source[0][0]}${source[1][0]}`.toUpperCase();
}

function fillDepartmentSelects() {
  const options = IEMCommitteeStore.departments
    .map(department => `<option value="${department.id}">${department.name}</option>`)
    .join('');

  committeeMemberDepartment.innerHTML = options;
  committeeDepartmentFilter.innerHTML = options;

  committeeMemberDepartment.value = activeCommitteeDepartment;
  committeeDepartmentFilter.value = activeCommitteeDepartment;
}

function updateCommitteePositionOptions(group, selected = '') {
  const positions = group === 'management'
    ? managementPositions
    : departmentPositions;

  committeeMemberPosition.innerHTML = '';

  positions.forEach(position => {
    const option = document.createElement('option');
    option.value = position;
    option.textContent = position;
    committeeMemberPosition.appendChild(option);
  });

  if (selected && positions.includes(selected)) {
    committeeMemberPosition.value = selected;
  }
}

function syncCommitteeStructureFields() {
  const management = committeeMemberGroup.value === 'management';

  committeeDepartmentField.classList.toggle('hidden', management);

  updateCommitteePositionOptions(
    committeeMemberGroup.value,
    committeeMemberPosition.value
  );
}

function setCommitteePhotoPreview(source, name = '') {
  currentCommitteePhoto = source || '';

  committeePhotoPreview.style.backgroundImage = currentCommitteePhoto
    ? `url("${String(currentCommitteePhoto).replace(/"/g, '%22')}")`
    : '';

  committeePhotoPreview.classList.toggle(
    'has-image',
    Boolean(currentCommitteePhoto)
  );

  committeePhotoPreview.querySelector('span').textContent =
    committeeInitials(name || committeeMemberName.value);

  removeCommitteePhoto.classList.toggle(
    'hidden',
    !currentCommitteePhoto
  );
}

async function handleCommitteePhotoSelection() {
  const file = committeePhoto.files?.[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file.');
    committeePhoto.value = '';
    return;
  }

  committeeFormMessage.textContent = 'Optimising profile photo...';

  try {
    const dataUrl = await resizeImage(file, 520, 520, 0.78);

    setCommitteePhotoPreview(
      dataUrl,
      committeeMemberName.value
    );

    committeeFormMessage.textContent = `Photo ready: ${file.name}`;
  } catch (error) {
    committeeFormMessage.textContent = error.message;
  }
}

function updateCommitteeStats() {
  const filled = committeeRecords.filter(
    member => member.name?.trim()
  ).length;

  const vacant = committeeRecords.filter(
    member => !member.name?.trim()
  ).length;

  document.getElementById('filledCommitteePositions').textContent =
    filled;

  document.getElementById('vacantCommitteePositions').textContent =
    vacant;

  document.getElementById('committeeDepartments').textContent =
    IEMCommitteeStore.departments.length;
}

function resetCommitteeEditor() {
  committeeForm.reset();

  committeeForm.classList.add('hidden');
  committeeEditorPlaceholder.classList.remove('hidden');

  committeeMemberId.value = '';
  committeeMemberFixed.value = '';

  currentCommitteePhoto = '';
  committeePhoto.value = '';

  committeePhotoPreview.style.backgroundImage = '';
  committeePhotoPreview.classList.remove('has-image');
  committeePhotoPreview.querySelector('span').textContent = 'Initials';

  removeCommitteePhoto.classList.add('hidden');
  clearCommitteeOccupant.classList.add('hidden');
  cancelCommitteeEdit.classList.add('hidden');

  committeeFormMessage.textContent = '';

  committeeMemberGroup.disabled = false;
  committeeMemberDepartment.disabled = false;
  committeeMemberPosition.disabled = false;
  committeeMemberOrder.disabled = false;
}

function beginCommitteeEdit(record) {
  committeeEditorPlaceholder.classList.add('hidden');
  committeeForm.classList.remove('hidden');
  cancelCommitteeEdit.classList.remove('hidden');

  committeeMemberId.value = record.id;
  committeeMemberFixed.value = record.fixed ? 'true' : 'false';

  committeeMemberName.value = record.name || '';
  committeeMemberGroup.value = record.group || 'department';
  committeeMemberDepartment.value =
    record.department || activeCommitteeDepartment;

  updateCommitteePositionOptions(
    record.group || 'department',
    record.position
  );

  committeeMemberPosition.value = record.position;
  committeeMemberOrder.value = Number(record.order) || 1;

  committeeMemberPublished.checked =
    record.published !== false;

  committeeFormTitle.textContent = record.name
    ? 'Edit Committee Member'
    : 'Fill Reserved Position';

  saveCommitteeMember.textContent = record.name
    ? 'Save Changes'
    : 'Fill Position';

  clearCommitteeOccupant.classList.toggle(
    'hidden',
    !record.name
  );

  committeeFormMessage.textContent = '';
  committeePhoto.value = '';

  setCommitteePhotoPreview(
    record.photo || '',
    record.name || ''
  );

  const lockStructure = Boolean(record.fixed);

  committeeMemberGroup.disabled = lockStructure;
  committeeMemberDepartment.disabled = lockStructure;
  committeeMemberPosition.disabled = lockStructure;
  committeeMemberOrder.disabled = lockStructure;

  committeeDepartmentField.classList.toggle(
    'hidden',
    record.group === 'management'
  );

  document.getElementById('committeeEditorCard').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function beginAddCommitteeMember() {
  committeeEditorPlaceholder.classList.add('hidden');
  committeeForm.classList.remove('hidden');
  cancelCommitteeEdit.classList.remove('hidden');

  committeeForm.reset();

  committeeMemberId.value = '';
  committeeMemberFixed.value = 'false';

  committeeMemberGroup.value = 'department';
  committeeMemberGroup.disabled = true;

  committeeMemberDepartment.disabled = false;
  committeeMemberPosition.disabled = false;
  committeeMemberOrder.disabled = false;

  committeeMemberDepartment.value =
    activeCommitteeDepartment;

  updateCommitteePositionOptions(
    'department',
    'Member'
  );

  committeeMemberPosition.value = 'Member';

  const existing = committeeRecords.filter(member =>
    member.group === 'department' &&
    member.department === activeCommitteeDepartment
  );

  committeeMemberOrder.value =
    Math.max(
      0,
      ...existing.map(member => Number(member.order) || 0)
    ) + 1;

  committeeMemberPublished.checked = true;
  committeeDepartmentField.classList.remove('hidden');

  committeeFormTitle.textContent =
    'Add Department Member';

  saveCommitteeMember.textContent =
    'Add Member';

  clearCommitteeOccupant.classList.add('hidden');
  committeeFormMessage.textContent = '';

  committeePhoto.value = '';
  setCommitteePhotoPreview('', '');
}

function committeeStatus(record) {
  if (!record.name?.trim()) {
    return {
      label: 'Vacant',
      className: 'vacant'
    };
  }

  if (record.published === false) {
    return {
      label: 'Hidden',
      className: 'hidden-site'
    };
  }

  return {
    label: 'Live',
    className: ''
  };
}

function createCommitteeSlotItem(record) {
  const item = document.createElement('article');
  item.className = 'committee-slot-item';

  const avatar = document.createElement('div');
  avatar.className = 'committee-slot-avatar';

  if (record.photo && record.name) {
    const image = document.createElement('img');
    image.src = record.photo;
    image.alt = `${record.name} profile photo`;
    avatar.appendChild(image);
  } else {
    avatar.textContent =
      committeeInitials(record.name);
  }

  const copy = document.createElement('div');
  copy.className = 'committee-slot-copy';

  const topline = document.createElement('div');
  topline.className = 'committee-slot-topline';

  const role = document.createElement('span');
  role.className = 'committee-slot-role';
  role.textContent = record.position;

  const statusInfo = committeeStatus(record);

  const status = document.createElement('span');
  status.className =
    `slot-status ${statusInfo.className}`.trim();
  status.textContent = statusInfo.label;

  topline.append(role, status);

  const name = document.createElement('h3');
  name.textContent =
    record.name || 'Vacant / Reserved';

  if (!record.name) {
    name.classList.add('vacant');
  }

  copy.append(topline, name);

  if (record.group === 'department') {
    const department = document.createElement('small');

    department.textContent =
      IEMCommitteeStore.departmentInfo(record.department)?.name ||
      'Department';

    copy.appendChild(department);
  }

  const actions = document.createElement('div');
  actions.className = 'committee-slot-actions';

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'small-action edit';
  edit.dataset.committeeAction = 'edit';
  edit.dataset.id = record.id;
  edit.textContent = record.name ? 'Edit' : 'Fill';

  actions.appendChild(edit);

  if (!record.fixed) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'small-action remove';
    remove.dataset.committeeAction = 'delete';
    remove.dataset.id = record.id;
    remove.textContent = 'Delete';

    actions.appendChild(remove);
  }

  item.append(
    avatar,
    copy,
    actions
  );

  return item;
}

function renderCommitteeList() {
  committeeSlotList.innerHTML = '';

  let visible = [];

  if (committeeViewMode === 'management') {
    visible = committeeRecords
      .filter(member => member.group === 'management')
      .sort((a, b) =>
        (Number(a.order) || 999) -
        (Number(b.order) || 999)
      );
  } else {
    visible = committeeRecords
      .filter(member =>
        member.group === 'department' &&
        member.department === activeCommitteeDepartment
      )
      .sort((a, b) =>
        (Number(a.order) || 999) -
        (Number(b.order) || 999)
      );
  }

  if (!visible.length) {
    committeeSlotList.innerHTML =
      '<div class="list-empty">No positions are configured here yet.</div>';
    return;
  }

  visible.forEach(record => {
    committeeSlotList.appendChild(
      createCommitteeSlotItem(record)
    );
  });
}

async function refreshCommittee() {
  committeeRecords =
    IEMCommitteeStore.sortMembers(
      await IEMCommitteeStore.getAllMembers()
    );

  updateCommitteeStats();
  renderCommitteeList();

  // Keep an already-open homepage/preview synced.
  sendCommitteePreview();
}

async function saveCommitteeForm(event) {
  event.preventDefault();

  const editingId =
    committeeMemberId.value;

  const existing = editingId
    ? committeeRecords.find(
        member => member.id === editingId
      )
    : null;

  const isFixed =
    existing?.fixed === true ||
    committeeMemberFixed.value === 'true';

  const group = isFixed
    ? existing.group
    : committeeMemberGroup.value;

  const department =
    group === 'department'
      ? (
          isFixed
            ? existing.department
            : committeeMemberDepartment.value
        )
      : '';

  const position = isFixed
    ? existing.position
    : committeeMemberPosition.value;

  const order = isFixed
    ? existing.order
    : Number(committeeMemberOrder.value) || 1;

  const name =
    committeeMemberName.value.trim();

  if (!editingId && !name) {
    committeeFormMessage.textContent =
      'Enter a name before adding a new member.';
    return;
  }

  const now =
    new Date().toISOString();

  const record = {
    id:
      editingId ||
      IEMCommitteeStore.makeId(
        department || 'committee'
      ),
    group,
    department,
    position,
    name,
    photo:
      name
        ? currentCommitteePhoto
        : '',
    order,
    published:
      committeeMemberPublished.checked,
    fixed:
      isFixed,
    createdAt:
      existing?.createdAt || now,
    updatedAt:
      now
  };

  saveCommitteeMember.disabled = true;
  saveCommitteeMember.textContent = 'Saving...';

  try {
    await IEMCommitteeStore.saveMember(record);
    await refreshCommittee();
    sendCommitteePreview();

    beginCommitteeEdit(record);

    showToast(
      name
        ? 'Committee member updated on the website.'
        : 'Position cleared and kept reserved.'
    );
  } catch (error) {
    console.error(error);

    committeeFormMessage.textContent =
      'Could not save this committee position. Please try again.';
  } finally {
    saveCommitteeMember.disabled = false;

    saveCommitteeMember.textContent =
      record.name
        ? 'Save Changes'
        : 'Fill Position';
  }
}

async function clearCommitteePosition() {
  const id =
    committeeMemberId.value;

  const existing =
    committeeRecords.find(
      member => member.id === id
    );

  if (!existing) return;

  const confirmed = window.confirm(
    `Clear ${existing.name || 'this position'}? The position will remain reserved and can be filled again later.`
  );

  if (!confirmed) return;

  const record = {
    ...existing,
    name: '',
    photo: '',
    published: true,
    updatedAt:
      new Date().toISOString()
  };

  await IEMCommitteeStore.saveMember(record);
  await refreshCommittee();
  sendCommitteePreview();
  beginCommitteeEdit(record);

  showToast(
    'Position is now vacant / reserved.'
  );
}

async function handleCommitteeListAction(event) {
  const button =
    event.target.closest(
      '[data-committee-action]'
    );

  if (!button) return;

  const record =
    committeeRecords.find(
      member =>
        member.id === button.dataset.id
    );

  if (!record) return;

  if (
    button.dataset.committeeAction === 'edit'
  ) {
    beginCommitteeEdit(record);
    return;
  }

  if (
    button.dataset.committeeAction === 'delete' &&
    !record.fixed
  ) {
    const confirmed = window.confirm(
      `Delete ${record.name || 'this extra member slot'}?`
    );

    if (!confirmed) return;

    await IEMCommitteeStore.deleteMember(
      record.id
    );

    if (
      committeeMemberId.value === record.id
    ) {
      resetCommitteeEditor();
    }

    await refreshCommittee();
    sendCommitteePreview();

    showToast(
      'Extra committee member removed.'
    );
  }
}

committeeViewButtons.forEach(button => {
  button.addEventListener('click', () => {
    committeeViewMode =
      button.dataset.committeeView;

    committeeViewButtons.forEach(item => {
      item.classList.toggle(
        'active',
        item === button
      );
    });

    const departmentsMode =
      committeeViewMode === 'departments';

    departmentFilterWrap.classList.toggle(
      'hidden',
      !departmentsMode
    );

    addCommitteeMember.classList.toggle(
      'hidden',
      !departmentsMode
    );

    resetCommitteeEditor();
    renderCommitteeList();
  });
});

committeeDepartmentFilter.addEventListener(
  'change',
  () => {
    activeCommitteeDepartment =
      committeeDepartmentFilter.value;

    resetCommitteeEditor();
    renderCommitteeList();
  }
);

committeeMemberGroup.addEventListener(
  'change',
  syncCommitteeStructureFields
);

committeeMemberName.addEventListener(
  'input',
  () => {
    if (!currentCommitteePhoto) {
      committeePhotoPreview
        .querySelector('span')
        .textContent =
          committeeInitials(
            committeeMemberName.value
          );
    }
  }
);

committeePhoto.addEventListener(
  'change',
  handleCommitteePhotoSelection
);

removeCommitteePhoto.addEventListener(
  'click',
  () => {
    committeePhoto.value = '';

    setCommitteePhotoPreview(
      '',
      committeeMemberName.value
    );

    committeeFormMessage.textContent =
      'Profile photo removed.';
  }
);

addCommitteeMember.addEventListener(
  'click',
  beginAddCommitteeMember
);

cancelCommitteeEdit.addEventListener(
  'click',
  resetCommitteeEditor
);

clearCommitteeOccupant.addEventListener(
  'click',
  clearCommitteePosition
);

committeeSlotList.addEventListener(
  'click',
  handleCommitteeListAction
);

committeeForm.addEventListener(
  'submit',
  saveCommitteeForm
);

fillDepartmentSelects();
updateCommitteePositionOptions(
  'management',
  'Chairperson'
);

refreshCommittee().catch(error => {
  console.error(error);

  committeeSlotList.innerHTML =
    '<div class="list-empty">Could not open committee browser storage.</div>';
});
