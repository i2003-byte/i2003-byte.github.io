/* =====================================================================
   SimLab — catalog.js
   ---------------------------------------------------------------------
   THE SINGLE SOURCE OF TRUTH for every subject and simulation.

   The header mega-menu, drawer, landing page, subject pages, the
   "All Simulations" page, search, stats counts, prev/next links,
   breadcrumbs and the footer sitemap are ALL generated from this file.
   You should never have to hard-code a link to a simulation anywhere else.

   ▸ TO ADD A SIMULATION
       1. Copy the /_template/ folder to /<subject>/<sim-id>/
       2. Write the simulation logic in its sim.js
       3. Add ONE entry to the SIMULATIONS array below (copy an existing one)

   ▸ TO ADD A SUBJECT
       1. Copy the /physics/ folder's index.html into /<subject-id>/index.html
       2. Change data-subject="physics" to data-subject="<subject-id>"
       3. Add ONE entry to the SUBJECTS array below
       (A subject with status "coming-soon" is shown muted everywhere.
        Flip it to "live" and it becomes clickable automatically.)

   See README.md for the full step-by-step guide.
   ===================================================================== */

var SimLab = window.SimLab = window.SimLab || {};

/* ---------------------------------------------------------------------
   SITE SETTINGS — change these once for your own deployment.
   --------------------------------------------------------------------- */
SimLab.site = {
  name: 'SimLab',
  tagline: 'Interactive science simulations',
  url: 'https://i2003-byte.github.io',
  github: 'https://github.com/i2003-byte/i2003-byte.github.io',
  // Issue links are built from the GitHub URL above:
  get issues() { return this.github + '/issues/new?title=' + encodeURIComponent('Issue: '); },
  get suggest() {
    return this.github + '/issues/new?labels=simulation-request&title=' +
      encodeURIComponent('Simulation idea: ');
  },
  newBadgeDays: 30 // Items added within this many days get a "New" badge
};

/* ---------------------------------------------------------------------
   SUBJECTS
   ---------------------------------------------------------------------
   Copy this block to add a subject:

   {
     id: 'chemistry',               // folder name, lowercase, no spaces
     name: 'Chemistry',             // display name
     icon: '⚗️',                    // emoji (or short text)
     color: '#f472b6',              // accent color (hex)
     tagline: 'One short line.',    // shown on cards
     description: 'A sentence or two shown on the subject page banner.',
     status: 'live',                // 'live' or 'coming-soon'
     branches: [                    // sub-topics; used for filters & menus
       { id: 'reactions', name: 'Reactions' }
     ]
   },
   --------------------------------------------------------------------- */
SimLab.subjects = [
  {
    id: 'physics',
    name: 'Physics',
    icon: '⚛️',
    color: '#38bdf8',
    tagline: 'Forces, motion, waves and light — see the laws of nature in action.',
    description:
      'Launch projectiles, swing pendulums and explore the rules that govern ' +
      'everything from falling apples to orbiting planets. Change the parameters ' +
      'and watch the physics respond instantly.',
    status: 'live',
    branches: [
      { id: 'mechanics', name: 'Mechanics' },
      { id: 'sound', name: 'Sound Lab' },
      { id: 'waves', name: 'Waves' },
      { id: 'optics', name: 'Optics' },
      { id: 'electricity', name: 'Electricity & Magnetism' },
      { id: 'thermodynamics', name: 'Thermodynamics' }
    ]
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: '⚗️',
    color: '#f472b6',
    tagline: 'Atoms, bonds and reactions you can build and break.',
    description:
      'Build molecules, balance reactions and watch gases behave. ' +
      'Chemistry simulations are on the way.',
    status: 'coming-soon',
    branches: [
      { id: 'atoms', name: 'Atomic Structure' },
      { id: 'bonding', name: 'Bonding' },
      { id: 'reactions', name: 'Reactions' },
      { id: 'gases', name: 'Gases' }
    ]
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: '📐',
    color: '#a78bfa',
    tagline: 'Drag, twist and explore the shapes behind the formulas.',
    description:
      'Interactive geometry, graphs you can bend and probability experiments ' +
      'you can run thousands of times. Mathematics simulations are on the way.',
    status: 'coming-soon',
    branches: [
      { id: 'geometry', name: 'Geometry' },
      { id: 'functions', name: 'Functions & Graphs' },
      { id: 'calculus', name: 'Calculus' },
      { id: 'probability', name: 'Probability' }
    ]
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: '🧬',
    color: '#4ade80',
    tagline: 'Cells, genes and ecosystems — life, simulated.',
    description:
      'Model predator–prey populations, cross genes and peek inside cells. ' +
      'Biology simulations are on the way.',
    status: 'coming-soon',
    branches: [
      { id: 'cells', name: 'Cells' },
      { id: 'genetics', name: 'Genetics' },
      { id: 'ecology', name: 'Ecology' },
      { id: 'evolution', name: 'Evolution' }
    ]
  },
  {
    id: 'astronomy',
    name: 'Astronomy',
    icon: '🔭',
    color: '#fbbf24',
    tagline: 'Planets, stars and galaxies at your fingertips.',
    description:
      'Explore the solar system, the life of stars and the scale of the ' +
      'universe. Astronomy simulations are on the way.',
    status: 'coming-soon',
    branches: [
      { id: 'solar-system', name: 'Solar System' },
      { id: 'stars', name: 'Stars' },
      { id: 'cosmology', name: 'Cosmology' }
    ]
  }
];

/* ---------------------------------------------------------------------
   SIMULATIONS
   ---------------------------------------------------------------------
   Copy this block to add a simulation:

   {
     id: 'projectile',                     // unique id (also the folder name)
     subject: 'physics',                   // must match a subject id
     branch: 'mechanics',                  // must match a branch id of that subject
     title: 'Projectile Motion',
     description: 'One or two sentences.', // shown on cards and in search
     level: 'Beginner',                    // 'Beginner' | 'Intermediate' | 'Advanced'
     tags: ['gravity', 'kinematics'],      // extra search keywords
     thumbnail: '/assets/img/thumbs/projectile.svg',
     link: '/physics/projectile/',         // root-relative URL of the page
     status: 'live',                       // 'live' or 'coming-soon'
     featured: true,                       // show in "Featured" on the landing page
     dateAdded: '2026-09-20',              // YYYY-MM-DD, used for "Recently added"
     prerequisites: ['pendulum']           // optional: ids of related simulations
   },
   --------------------------------------------------------------------- */
SimLab.simulations = [
  {
    id: 'projectile',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Projectile Motion',
    description:
      'Launch a ball at any angle and speed. Trace its parabola and measure ' +
      'time of flight, maximum height and range.',
    level: 'Beginner',
    tags: ['gravity', 'kinematics', 'parabola', 'range', 'trajectory', 'cannon', 'motion'],
    thumbnail: '/assets/img/thumbs/projectile.svg',
    link: '/physics/projectile/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-20',
    prerequisites: ['pendulum']
  },
  {
    id: 'pendulum',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Simple Pendulum',
    description:
      'Swing a pendulum, add damping and watch energy flow between kinetic and ' +
      'potential. See how the period depends on length and gravity.',
    level: 'Intermediate',
    tags: ['oscillation', 'harmonic', 'period', 'energy', 'gravity', 'damping', 'swing'],
    thumbnail: '/assets/img/thumbs/pendulum.svg',
    link: '/physics/pendulum/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-24',
    prerequisites: ['projectile', 'spring-mass']
  },

  /* ---- SOUND LAB: 14 simulations for Class 7 'Sound' -------------------- */
  {
    id: 'vibration',
    subject: 'physics',
    branch: 'sound',
    title: 'Vibrating Objects',
    description:
      'Strike a tuning fork, pluck a rubber band or hit a drum. Sound only exists while something vibrates — stop the vibration and the sound stops too.',
    level: 'Beginner',
    tags: ['vibration', 'source of sound', 'tuning fork', 'drum', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/vibration.svg',
    link: '/physics/vibration/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-25',
    prerequisites: ['sound-media']
  },
  {
    id: 'sound-media',
    subject: 'physics',
    branch: 'sound',
    title: 'Sound Through Solids, Liquids & Gases',
    description:
      'Race a sound pulse through steel, water and air. Which medium carries sound fastest, and why?',
    level: 'Beginner',
    tags: ['medium', 'speed of sound', 'solid', 'liquid', 'gas', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/sound-media.svg',
    link: '/physics/sound-media/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-25',
    prerequisites: ['vibration', 'bell-jar']
  },
  {
    id: 'bell-jar',
    subject: 'physics',
    branch: 'sound',
    title: 'Bell Jar: Sound in a Vacuum',
    description:
      'Pump the air out of a jar with a ringing bell inside and listen as the sound fades away. Sound needs a medium to travel.',
    level: 'Beginner',
    tags: ['vacuum', 'medium', 'bell jar', 'air', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/bell-jar.svg',
    link: '/physics/bell-jar/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-25',
    prerequisites: ['sound-media', 'amplitude-loudness']
  },
  {
    id: 'amplitude-loudness',
    subject: 'physics',
    branch: 'sound',
    title: 'Amplitude & Loudness',
    description:
      'Turn the amplitude up and down and watch the wave grow taller. Bigger vibrations make louder sounds.',
    level: 'Beginner',
    tags: ['amplitude', 'loudness', 'volume', 'wave', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/amplitude-loudness.svg',
    link: '/physics/amplitude-loudness/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-25',
    prerequisites: ['bell-jar', 'frequency-pitch']
  },
  {
    id: 'frequency-pitch',
    subject: 'physics',
    branch: 'sound',
    title: 'Frequency & Pitch',
    description:
      'Slide the frequency from a deep rumble to a high whistle. See the wave squeeze together as the pitch rises.',
    level: 'Beginner',
    tags: ['frequency', 'pitch', 'hertz', 'time period', 'wave', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/frequency-pitch.svg',
    link: '/physics/frequency-pitch/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-25',
    prerequisites: ['amplitude-loudness', 'oscillation-counter']
  },
  {
    id: 'oscillation-counter',
    subject: 'physics',
    branch: 'sound',
    title: 'Oscillation Counter',
    description:
      'Swing a pendulum, count its oscillations with a stopwatch and calculate the frequency and time period yourself.',
    level: 'Beginner',
    tags: ['oscillation', 'time period', 'frequency', 'pendulum', 'stopwatch', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/oscillation-counter.svg',
    link: '/physics/oscillation-counter/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-25',
    prerequisites: ['frequency-pitch', 'vocal-cords']
  },
  {
    id: 'vocal-cords',
    subject: 'physics',
    branch: 'sound',
    title: 'Voice Box (Larynx)',
    description:
      'Tighten and loosen virtual vocal cords and push air from the lungs to find out how the larynx makes our voice.',
    level: 'Beginner',
    tags: ['larynx', 'voice box', 'vocal cords', 'voice', 'human body', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/vocal-cords.svg',
    link: '/physics/vocal-cords/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-25',
    prerequisites: ['oscillation-counter', 'human-ear']
  },
  {
    id: 'human-ear',
    subject: 'physics',
    branch: 'sound',
    title: 'Inside the Ear',
    description:
      'Follow a sound wave down the ear canal to the eardrum, the tiny bones and the cochlea, and see how we hear.',
    level: 'Beginner',
    tags: ['ear', 'eardrum', 'hearing', 'cochlea', 'human body', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/human-ear.svg',
    link: '/physics/human-ear/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-25',
    prerequisites: ['vocal-cords', 'who-can-hear']
  },
  {
    id: 'who-can-hear',
    subject: 'physics',
    branch: 'sound',
    title: 'Who Can Hear It?',
    description:
      'Pick a frequency and find out whether humans, dogs, bats and elephants can hear it. Explore infrasonic, audible and ultrasonic sound.',
    level: 'Beginner',
    tags: ['audible', 'infrasonic', 'ultrasonic', 'range of hearing', 'animals', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/who-can-hear.svg',
    link: '/physics/who-can-hear/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-25',
    prerequisites: ['human-ear', 'music-or-noise']
  },
  {
    id: 'music-or-noise',
    subject: 'physics',
    branch: 'sound',
    title: 'Music or Noise?',
    description:
      'Look at the wave pattern of each sound clip and sort it: is it a pleasant musical sound or an irregular noise?',
    level: 'Beginner',
    tags: ['music', 'noise', 'wave pattern', 'regular', 'irregular', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/music-or-noise.svg',
    link: '/physics/music-or-noise/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-25',
    prerequisites: ['who-can-hear', 'decibel-meter']
  },
  {
    id: 'decibel-meter',
    subject: 'physics',
    branch: 'sound',
    title: 'City Decibel Meter',
    description:
      'Point a sound meter at city sounds — from whispers to fireworks — and measure how loud they are in decibels.',
    level: 'Beginner',
    tags: ['decibel', 'loudness', 'db', 'noise', 'city', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/decibel-meter.svg',
    link: '/physics/decibel-meter/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-25',
    prerequisites: ['music-or-noise', 'noise-pollution']
  },
  {
    id: 'noise-pollution',
    subject: 'physics',
    branch: 'sound',
    title: 'Quiet the Neighbourhood',
    description:
      'Add trees, silencers and soundproof walls to cut noise pollution around a school, a hospital and homes.',
    level: 'Beginner',
    tags: ['noise pollution', 'decibel', 'trees', 'silencer', 'environment', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/noise-pollution.svg',
    link: '/physics/noise-pollution/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-25',
    prerequisites: ['decibel-meter', 'water-xylophone']
  },
  {
    id: 'water-xylophone',
    subject: 'physics',
    branch: 'sound',
    title: 'Water Glass Xylophone',
    description:
      'Fill glasses with different amounts of water, tap or blow, and tune your own musical scale.',
    level: 'Beginner',
    tags: ['music', 'instrument', 'pitch', 'water', 'xylophone', 'jaltarang', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/water-xylophone.svg',
    link: '/physics/water-xylophone/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-25',
    prerequisites: ['noise-pollution', 'guitar-string']
  },
  {
    id: 'guitar-string',
    subject: 'physics',
    branch: 'sound',
    title: 'Guitar String',
    description:
      'Change the length, thickness and tightness of a string and pluck it. Discover what makes a note higher or lower.',
    level: 'Beginner',
    tags: ['guitar', 'string', 'pitch', 'tension', 'instrument', 'music', 'class 7', 'sound lab'],
    thumbnail: '/assets/img/thumbs/guitar-string.svg',
    link: '/physics/guitar-string/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-25',
    prerequisites: ['water-xylophone']
  },

  /* ---- Placeholders: planned simulations (coming soon) ---------------- */
  {
    id: 'spring-mass',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Spring–Mass Oscillator',
    description: "Stretch a spring, release the mass and explore Hooke's law and simple harmonic motion.",
    level: 'Beginner',
    tags: ['hooke', 'spring', 'oscillation', 'harmonic', 'energy'],
    thumbnail: '/assets/img/thumbs/spring-mass.svg',
    link: '/physics/spring-mass/',
    status: 'coming-soon',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['pendulum']
  },
  {
    id: 'collisions',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Collisions',
    description: 'Smash carts together and compare elastic and inelastic collisions. Is momentum always conserved?',
    level: 'Intermediate',
    tags: ['momentum', 'energy', 'elastic', 'inelastic', 'impulse'],
    thumbnail: '/assets/img/thumbs/collisions.svg',
    link: '/physics/collisions/',
    status: 'coming-soon',
    featured: false,
    dateAdded: '2026-10-20',
    prerequisites: []
  },
  {
    id: 'wave-interference',
    subject: 'physics',
    branch: 'waves',
    title: 'Wave Interference',
    description: 'Two sources, one pond. See constructive and destructive interference patterns form.',
    level: 'Intermediate',
    tags: ['waves', 'interference', 'superposition', 'wavelength', 'ripple tank'],
    thumbnail: '/assets/img/thumbs/wave-interference.svg',
    link: '/physics/wave-interference/',
    status: 'coming-soon',
    featured: false,
    dateAdded: '2026-10-25',
    prerequisites: []
  },
  {
    id: 'planetary-orbits',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Planetary Orbits',
    description: "Place planets around a star and explore Newton's gravitation and Kepler's laws.",
    level: 'Advanced',
    tags: ['gravity', 'orbit', 'kepler', 'planets', 'newton', 'space'],
    thumbnail: '/assets/img/thumbs/planetary-orbits.svg',
    link: '/physics/planetary-orbits/',
    status: 'coming-soon',
    featured: false,
    dateAdded: '2026-11-01',
    prerequisites: ['projectile']
  },
  {
    id: 'ray-optics',
    subject: 'physics',
    branch: 'optics',
    title: 'Ray Optics',
    description: 'Bend light with lenses and mirrors. Find focal points and form images.',
    level: 'Beginner',
    tags: ['light', 'lens', 'mirror', 'refraction', 'reflection', 'focal length'],
    thumbnail: '/assets/img/thumbs/ray-optics.svg',
    link: '/physics/ray-optics/',
    status: 'coming-soon',
    featured: false,
    dateAdded: '2026-11-05',
    prerequisites: []
  },
  {
    id: 'electric-fields',
    subject: 'physics',
    branch: 'electricity',
    title: 'Electric Fields',
    description: 'Drop positive and negative charges and visualise field lines and equipotentials.',
    level: 'Advanced',
    tags: ['charge', 'coulomb', 'field lines', 'potential', 'electrostatics'],
    thumbnail: '/assets/img/thumbs/electric-fields.svg',
    link: '/physics/electric-fields/',
    status: 'coming-soon',
    featured: false,
    dateAdded: '2026-11-10',
    prerequisites: []
  }
];

/* =====================================================================
   HELPERS — used by every page. You normally don't need to edit below.
   ===================================================================== */
SimLab.LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

/** Find a subject by id. */
SimLab.getSubject = function (id) {
  return SimLab.subjects.find(function (s) { return s.id === id; }) || null;
};

/** Find a simulation by id. */
SimLab.getSim = function (id) {
  return SimLab.simulations.find(function (s) { return s.id === id; }) || null;
};

/** Find a branch object inside a subject. */
SimLab.getBranch = function (subjectId, branchId) {
  var subj = SimLab.getSubject(subjectId);
  if (!subj) return null;
  return subj.branches.find(function (b) { return b.id === branchId; }) || null;
};

/** Is the subject live (clickable)? */
SimLab.isSubjectLive = function (subj) {
  if (typeof subj === 'string') subj = SimLab.getSubject(subj);
  return !!subj && subj.status === 'live';
};

/** A simulation is live only if it AND its subject are live. */
SimLab.isLive = function (sim) {
  if (typeof sim === 'string') sim = SimLab.getSim(sim);
  return !!sim && sim.status === 'live' && SimLab.isSubjectLive(sim.subject);
};

/** All simulations of a subject (optionally only live ones). */
SimLab.simsBySubject = function (subjectId, liveOnly) {
  return SimLab.simulations.filter(function (s) {
    return s.subject === subjectId && (!liveOnly || SimLab.isLive(s));
  });
};

/** All live simulations. */
SimLab.liveSims = function () {
  return SimLab.simulations.filter(SimLab.isLive);
};

/** URL of a subject page, optionally filtered to a branch. */
SimLab.subjectUrl = function (subjectId, branchId) {
  return '/' + subjectId + '/' + (branchId ? '?branch=' + encodeURIComponent(branchId) : '');
};

/** Parse 'YYYY-MM-DD' as a local date. */
SimLab.parseDate = function (str) {
  var p = String(str || '').split('-').map(Number);
  return new Date(p[0] || 1970, (p[1] || 1) - 1, p[2] || 1);
};

/** True when a live simulation was added within the last `newBadgeDays` days. */
SimLab.isNew = function (sim) {
  var days = (Date.now() - SimLab.parseDate(sim.dateAdded).getTime()) / 86400000;
  return SimLab.isLive(sim) && days >= 0 && days <= SimLab.site.newBadgeDays;
};
