const navbar = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const dropdown = document.querySelector('.dropdown');
const dropdownTrigger = document.querySelector('.dropdown-trigger');
const eventTabs = document.querySelectorAll('.event-tab');
const eventGrid = document.getElementById('eventGrid');
const eventCount = document.getElementById('eventCount');

let activeEventTab = 'upcoming';
let allEvents = [];

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
});

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
}

if (dropdownTrigger && dropdown) {
  dropdownTrigger.addEventListener('click', () => {
    if (window.innerWidth <= 760) dropdown.classList.toggle('open');
  });
}

function formatDateParts(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleString('en-MY', { month: 'short' }).toUpperCase()
  };
}

function safeLink(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

function createEventCard(event) {
  const bucket = IEMEventStore.eventBucket(event);
  const { day, month } = formatDateParts(event.date);

  const article = document.createElement('article');
  article.className = 'event-card';
  article.dataset.category = bucket;

  const image = document.createElement('div');
  image.className = 'event-image';
  if (event.poster) {
    image.style.backgroundImage = `linear-gradient(160deg, rgba(3,14,31,.12), rgba(3,14,31,.44)), url("${String(event.poster).replace(/"/g, '%22')}")`;
  }

  const status = document.createElement('span');
  status.className = `status-pill${bucket === 'past' ? ' muted' : ''}`;
  status.textContent = bucket === 'past' ? 'Completed' : (event.badge || 'Upcoming');

  const date = document.createElement('div');
  date.className = 'event-date';
  const dayEl = document.createElement('strong');
  dayEl.textContent = day;
  const monthEl = document.createElement('span');
  monthEl.textContent = month;
  date.append(dayEl, monthEl);
  image.append(status, date);

  const body = document.createElement('div');
  body.className = 'event-card-body';

  const kicker = document.createElement('p');
  kicker.className = 'card-kicker';
  kicker.textContent = event.type || 'IEM UMPSA Event';

  const title = document.createElement('h3');
  title.textContent = event.title;

  const description = document.createElement('p');
  description.textContent = event.description || '';

  const meta = document.createElement('div');
  meta.className = 'event-meta';
  if (event.location) {
    const location = document.createElement('span');
    location.textContent = `📍 ${event.location}`;
    meta.appendChild(location);
  }
  const secondMeta = document.createElement('span');
  secondMeta.textContent = bucket === 'past' ? '✓ Completed' : (event.time ? `🕘 ${event.time}` : 'Upcoming');
  meta.appendChild(secondMeta);

  body.append(kicker, title, description, meta);

  const link = safeLink(event.link);
  if (link) {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = 'text-link';
    anchor.innerHTML = `${bucket === 'past' ? 'View highlight' : 'View event'} <span>→</span>`;
    body.appendChild(anchor);
  }

  article.append(image, body);
  return article;
}

function renderEvents() {
  if (!eventGrid) return;

  const published = allEvents.filter(event => event.published !== false);
  const filtered = published.filter(event => IEMEventStore.eventBucket(event) === activeEventTab);
  const sorted = IEMEventStore.sortEvents(filtered, activeEventTab);

  eventGrid.innerHTML = '';
  sorted.forEach(event => eventGrid.appendChild(createEventCard(event)));

  if (!sorted.length) {
    const empty = document.createElement('div');
    empty.className = 'event-empty';
    empty.innerHTML = `<strong>No ${activeEventTab} events yet.</strong><span>New events published from the Admin Portal will appear here automatically.</span>`;
    eventGrid.appendChild(empty);
  }

  if (eventCount) eventCount.textContent = sorted.length;
}

function switchEventTab(tabName) {
  activeEventTab = tabName;
  eventTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  renderEvents();
}

eventTabs.forEach(tab => {
  tab.addEventListener('click', () => switchEventTab(tab.dataset.tab));
});

document.querySelectorAll('[data-event-tab]').forEach(link => {
  link.addEventListener('click', () => {
    switchEventTab(link.dataset.eventTab);
    if (navLinks) navLinks.classList.remove('open');
    if (dropdown) dropdown.classList.remove('open');
  });
});

document.querySelectorAll('.nav-links > a').forEach(link => {
  link.addEventListener('click', () => navLinks?.classList.remove('open'));
});

async function initEvents() {
  try {
    allEvents = await IEMEventStore.getAllEvents();
    renderEvents();
  } catch (error) {
    console.error('Could not load events:', error);
    if (eventGrid) {
      eventGrid.innerHTML = '<div class="event-empty"><strong>Events could not be loaded.</strong><span>Please refresh the page or open the website through a local/server URL.</span></div>';
    }
  }
}

initEvents();


// Dynamic committee CMS
const managementTeamMount = document.getElementById('managementTeamMount');
const departmentGrid = document.getElementById('departmentGrid');
let committeeMembers = [];

function committeeInitials(name) {
  if (!name) return '';
  const ignored = new Set(['BIN', 'BINTI', 'A/P', 'A/L', 'ANAK', 'MOHD']);
  const words = name.trim().split(/\s+/).filter(word => /^[A-Za-z]/.test(word));
  const candidates = words.filter(word => !ignored.has(word.toUpperCase()));
  const source = candidates.length ? candidates : words;

  if (!source.length) return '';
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();

  return `${source[0][0]}${source[1][0]}`.toUpperCase();
}

function createCommitteeAvatar(member, classNames = '') {
  const avatar = document.createElement('div');
  avatar.className = `committee-avatar ${classNames}`.trim();

  if (member?.photo) {
    const image = document.createElement('img');
    image.src = member.photo;
    image.alt = member.name ? `${member.name} profile photo` : 'Committee profile photo';
    image.className = 'committee-profile-photo';
    avatar.appendChild(image);
  } else {
    avatar.textContent = committeeInitials(member?.name || '');
  }

  return avatar;
}

function createLeadershipCard(member, options = {}) {
  if (!member || !member.name || member.published === false) return null;

  const article = document.createElement('article');
  article.className = `leadership-card${options.chair ? ' leadership-chair' : ''}${options.executive ? ' executive-card' : ''}`;

  const avatarClasses = `${options.chair ? 'chair-avatar' : ''} ${options.executive ? 'small-avatar' : ''}`.trim();
  article.appendChild(createCommitteeAvatar(member, avatarClasses));

  const copy = document.createElement('div');
  copy.className = 'leadership-copy';

  const role = document.createElement('p');
  role.className = 'committee-role';
  role.textContent = member.position;

  const name = document.createElement('h3');
  name.textContent = member.name;

  copy.append(role, name);

  if (options.subtitle) {
    const subtitle = document.createElement('span');
    subtitle.textContent = options.subtitle;
    copy.appendChild(subtitle);
  }

  article.appendChild(copy);
  return article;
}

function renderManagementTeam() {
  if (!managementTeamMount) return;

  managementTeamMount.innerHTML = '';

  const members = committeeMembers.filter(member => member.group === 'management');
  const byPosition = position => members.find(member => member.position === position);

  const chairWrap = document.createElement('div');
  chairWrap.className = 'leadership-chair-wrap';

  const chairCard = createLeadershipCard(byPosition('Chairperson'), {
    chair: true,
    subtitle: 'Executive Leadership'
  });

  if (chairCard) chairWrap.appendChild(chairCard);
  managementTeamMount.appendChild(chairWrap);

  const viceRow = document.createElement('div');
  viceRow.className = 'vice-row';

  const internal = createLeadershipCard(byPosition('Vice Chairperson · Internal'), {
    subtitle: 'Internal Affairs'
  });

  const external = createLeadershipCard(byPosition('Vice Chairperson · External'), {
    subtitle: 'External Affairs'
  });

  if (internal) viceRow.appendChild(internal);
  if (external) viceRow.appendChild(external);

  if (viceRow.childElementCount) {
    managementTeamMount.appendChild(viceRow);
  }

  const executiveRow = document.createElement('div');
  executiveRow.className = 'executive-row';

  ['Treasurer', 'Vice Treasurer', 'Secretary', 'Vice Secretary'].forEach(position => {
    const card = createLeadershipCard(byPosition(position), { executive: true });
    if (card) executiveRow.appendChild(card);
  });

  if (executiveRow.childElementCount) {
    managementTeamMount.appendChild(executiveRow);
  }

  if (!managementTeamMount.querySelector('.leadership-card')) {
    managementTeamMount.innerHTML =
      '<div class="committee-loading">Management team information will appear here.</div>';
  }
}

function createMiniAvatar(member) {
  const avatar = document.createElement('span');
  avatar.className = 'mini-avatar';

  if (member.photo) {
    const image = document.createElement('img');
    image.src = member.photo;
    image.alt = `${member.name} profile photo`;
    image.className = 'committee-profile-photo';
    avatar.appendChild(image);
  } else {
    avatar.textContent = committeeInitials(member.name);
  }

  return avatar;
}

function createDepartmentPerson(member, lead = false) {
  const person = document.createElement('div');
  person.className = `department-person${lead ? ' lead-person' : ''}`;
  person.appendChild(createMiniAvatar(member));

  if (lead) {
    const copy = document.createElement('div');

    const role = document.createElement('small');
    role.textContent = member.position;

    const name = document.createElement('strong');
    name.textContent = member.name;

    copy.append(role, name);
    person.appendChild(copy);
  } else {
    person.classList.add('member-person');

    const name = document.createElement('strong');
    name.textContent = member.name;

    person.appendChild(name);
  }

  return person;
}

function renderDepartments() {
  if (!departmentGrid || !window.IEMCommitteeStore) return;

  departmentGrid.innerHTML = '';

  IEMCommitteeStore.departments.forEach(department => {
    const departmentMembers = committeeMembers
      .filter(member =>
        member.group === 'department' &&
        member.department === department.id &&
        member.published !== false &&
        member.name
      )
      .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

    const card = document.createElement('article');
    card.className = 'department-card glass light-glass';

    if (!departmentMembers.length) {
      card.classList.add('department-card-empty');
    }

    const header = document.createElement('div');
    header.className = 'department-header';

    const icon = document.createElement('div');
    icon.className = 'department-icon';
    icon.textContent = department.icon;

    const heading = document.createElement('div');

    const label = document.createElement('span');
    label.textContent = 'Department';

    const title = document.createElement('h3');
    title.textContent = department.name;

    heading.append(label, title);
    header.append(icon, heading);
    card.appendChild(header);

    if (!departmentMembers.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-department-space';
      empty.setAttribute('aria-label', 'Reserved positions');
      card.appendChild(empty);
      departmentGrid.appendChild(card);
      return;
    }

    const leads = departmentMembers.filter(member =>
      member.position === 'HOD' || member.position === 'Asst HOD'
    );

    const regularMembers = departmentMembers.filter(member =>
      member.position !== 'HOD' && member.position !== 'Asst HOD'
    );

    if (leads.length) {
      const leadGrid = document.createElement('div');
      leadGrid.className = 'department-leads';

      leads.forEach(member => {
        leadGrid.appendChild(createDepartmentPerson(member, true));
      });

      card.appendChild(leadGrid);
    }

    const divider = document.createElement('div');
    divider.className = 'member-divider';

    const dividerText = document.createElement('span');
    dividerText.textContent = 'Members';

    divider.appendChild(dividerText);
    card.appendChild(divider);

    const list = document.createElement('div');
    list.className = `member-list${regularMembers.length ? '' : ' reserved-space'}`;

    regularMembers.forEach(member => {
      list.appendChild(createDepartmentPerson(member, false));
    });

    card.appendChild(list);
    departmentGrid.appendChild(card);
  });
}

async function initCommittee() {
  if (!managementTeamMount && !departmentGrid) return;

  try {
    if (!window.IEMCommitteeStore) {
      throw new Error('Committee data store is unavailable.');
    }

    committeeMembers =
      IEMCommitteeStore.sortMembers(
        await IEMCommitteeStore.getAllMembers()
      );

    renderManagementTeam();
    renderDepartments();
  } catch (error) {
    console.error('Could not load committee:', error);

    if (managementTeamMount) {
      managementTeamMount.innerHTML =
        '<div class="committee-loading">Committee information could not be loaded. Please refresh the page.</div>';
    }

    if (departmentGrid) {
      departmentGrid.innerHTML =
        '<div class="committee-loading">Department information could not be loaded. Please refresh the page.</div>';
    }
  }
}

initCommittee();

// ------------------------------------------------------------
// Live Admin → Public Committee preview bridge
// ------------------------------------------------------------
function applyIncomingCommitteeData(members) {
  if (!Array.isArray(members)) return;

  committeeMembers = IEMCommitteeStore.sortMembers(
    members.map(member => ({ ...member }))
  );

  renderManagementTeam();
  renderDepartments();

  // Also persist when the current environment allows shared storage.
  try {
    localStorage.setItem(
      'iemUmpsaCommitteeDataV1',
      JSON.stringify(committeeMembers)
    );
  } catch (error) {
    // The visual live preview still works even when storage is restricted.
  }
}

window.addEventListener('message', event => {
  const payload = event.data;

  if (
    payload &&
    payload.type === 'IEM_COMMITTEE_PREVIEW' &&
    Array.isArray(payload.members)
  ) {
    applyIncomingCommitteeData(payload.members);
  }
});

window.addEventListener('storage', event => {
  if (
    event.key === 'iemUmpsaCommitteeDataV1' &&
    event.newValue
  ) {
    try {
      applyIncomingCommitteeData(
        JSON.parse(event.newValue)
      );
    } catch (error) {
      console.error('Could not apply committee storage update:', error);
    }
  }
});

try {
  const committeeChannel =
    new BroadcastChannel('iem-umpsa-content');

  committeeChannel.addEventListener('message', event => {
    const payload = event.data;

    if (
      payload &&
      payload.type === 'IEM_COMMITTEE_PREVIEW' &&
      Array.isArray(payload.members)
    ) {
      applyIncomingCommitteeData(payload.members);
    }
  });
} catch (error) {
  // BroadcastChannel is optional; postMessage remains the preview fallback.
}

// ------------------------------------------------------------
// Fallback sync: some browsers (especially over file:// or when
// the "storage" event / BroadcastChannel silently fail between
// tabs) never deliver the live push above. This safety net
// re-reads localStorage on focus/visibility change and on a
// short interval, so the homepage self-heals even if the
// instant push never arrived.
// ------------------------------------------------------------
let lastCommitteeSnapshot = null;

function syncCommitteeFromStorage() {
  if (!window.IEMCommitteeStore) return;

  try {
    const raw = localStorage.getItem('iemUmpsaCommitteeDataV1');
    if (!raw) return;

    if (raw === lastCommitteeSnapshot) return;
    lastCommitteeSnapshot = raw;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    applyIncomingCommitteeData(parsed);
  } catch (error) {
    // Ignore malformed/unavailable storage; live push and the
    // next successful poll will recover on their own.
  }
}

// Prime the snapshot so the very first poll doesn't re-render
// unnecessarily right after initCommittee() already loaded data.
try {
  lastCommitteeSnapshot = localStorage.getItem('iemUmpsaCommitteeDataV1');
} catch (error) {
  // Storage unavailable; polling below will just no-op safely.
}

window.addEventListener('focus', syncCommitteeFromStorage);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncCommitteeFromStorage();
});

setInterval(syncCommitteeFromStorage, 2000);

