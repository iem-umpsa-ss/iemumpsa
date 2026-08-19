(function () {
  const DB_NAME = 'iemUmpsaWebsiteDB';
  const DB_VERSION = 1;
  const EVENT_STORE = 'events';
  const META_STORE = 'meta';

  const defaultEvents = [
    {
      id: 'demo-revit-bim-2026',
      title: 'Revit & BIM Awareness Workshop',
      type: 'Technical Workshop',
      date: '2026-08-25',
      time: '9:00 AM',
      location: 'UMPSA Gambang',
      badge: 'Registration Open',
      description: 'Explore BIM workflows, modelling fundamentals and real-world applications in the built environment.',
      link: '',
      poster: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1000&q=80',
      published: true,
      createdAt: '2026-08-18T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z'
    },
    {
      id: 'demo-site-visit-2026',
      title: 'Engineering Industry Site Visit',
      type: 'Industry Exposure',
      date: '2026-09-02',
      time: '8:00 AM',
      location: 'Selangor',
      badge: 'Upcoming',
      description: 'A practical industry visit designed to connect students with engineers, projects and professional practice.',
      link: '',
      poster: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80',
      published: true,
      createdAt: '2026-08-18T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z'
    },
    {
      id: 'demo-leadership-forum-2026',
      title: 'Future Engineers Leadership Forum',
      type: 'Professional Development',
      date: '2026-09-18',
      time: '8:00 PM',
      location: 'UMPSA',
      badge: 'Coming Soon',
      description: "A conversation on leadership, professional growth and the changing expectations of tomorrow's engineers.",
      link: '',
      poster: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
      published: true,
      createdAt: '2026-08-18T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z'
    },
    {
      id: 'demo-solar-farm-2026',
      title: 'Solar Farm Technical Visit',
      type: 'Industrial Visit',
      date: '2026-05-07',
      time: '',
      location: 'Pekan',
      badge: 'Completed',
      description: 'Students gained exposure to renewable-energy infrastructure, operations and engineering systems.',
      link: '',
      poster: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1000&q=80',
      published: true,
      createdAt: '2026-08-18T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z'
    },
    {
      id: 'demo-ecoes-2026',
      title: 'East Coast Engineering Summit',
      type: 'Engineering Summit',
      date: '2026-04-03',
      time: '',
      location: 'Kuantan',
      badge: 'Completed',
      description: 'A professional gathering connecting students, engineers and industry through technical knowledge and networking.',
      link: '',
      poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
      published: true,
      createdAt: '2026-08-18T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z'
    },
    {
      id: 'demo-stem-explorer-2026',
      title: 'STEM Explorer Day',
      type: 'STEM Outreach',
      date: '2026-04-06',
      time: '',
      location: 'Kuantan',
      badge: 'Completed',
      description: 'An outreach programme introducing school students to engineering ideas through engaging activities and sharing.',
      link: '',
      poster: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80',
      published: true,
      createdAt: '2026-08-18T00:00:00.000Z',
      updatedAt: '2026-08-18T00:00:00.000Z'
    }
  ];

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(EVENT_STORE)) {
          const store = db.createObjectStore(EVENT_STORE, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('published', 'published', { unique: false });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionPromise(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Database transaction aborted.'));
    });
  }

  async function ensureSeedData() {
    const db = await openDB();
    const readTx = db.transaction(META_STORE, 'readonly');
    const metaStore = readTx.objectStore(META_STORE);
    const seeded = await new Promise((resolve, reject) => {
      const request = metaStore.get('seeded');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (seeded) {
      db.close();
      return;
    }

    const writeTx = db.transaction([EVENT_STORE, META_STORE], 'readwrite');
    const eventStore = writeTx.objectStore(EVENT_STORE);
    defaultEvents.forEach(event => eventStore.put(event));
    writeTx.objectStore(META_STORE).put({ key: 'seeded', value: true });
    await transactionPromise(writeTx);
    db.close();
  }

  async function getAllEvents() {
    await ensureSeedData();
    const db = await openDB();
    const tx = db.transaction(EVENT_STORE, 'readonly');
    const store = tx.objectStore(EVENT_STORE);
    const events = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return events;
  }

  async function getEvent(id) {
    await ensureSeedData();
    const db = await openDB();
    const tx = db.transaction(EVENT_STORE, 'readonly');
    const store = tx.objectStore(EVENT_STORE);
    const event = await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return event;
  }

  async function saveEvent(event) {
    const db = await openDB();
    const tx = db.transaction(EVENT_STORE, 'readwrite');
    tx.objectStore(EVENT_STORE).put(event);
    await transactionPromise(tx);
    db.close();
    return event;
  }

  async function deleteEvent(id) {
    const db = await openDB();
    const tx = db.transaction(EVENT_STORE, 'readwrite');
    tx.objectStore(EVENT_STORE).delete(id);
    await transactionPromise(tx);
    db.close();
  }

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function eventBucket(event, today = localDateString()) {
    return event.date < today ? 'past' : 'upcoming';
  }

  function sortEvents(events, bucket) {
    return [...events].sort((a, b) => {
      if (bucket === 'past') return b.date.localeCompare(a.date);
      return a.date.localeCompare(b.date);
    });
  }

  window.IEMEventStore = {
    ensureSeedData,
    getAllEvents,
    getEvent,
    saveEvent,
    deleteEvent,
    eventBucket,
    sortEvents,
    localDateString
  };
})();
