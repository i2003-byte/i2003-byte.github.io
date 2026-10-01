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
    id: 'geography',
    name: 'Geography',
    icon: '🌏',
    color: '#2dd4bf',
    tagline: 'Spin the Earth, chase the seasons and read the clocks of the world.',
    description:
      'Watch the Earth turn and go round the Sun, see why days are long in June ' +
      'and short in December, and find out why India has one clock time.',
    status: 'live',
    branches: [
      { id: 'earth-motions', name: "Earth's Motions" },
      { id: 'climate', name: 'Weather & Climate' },
      { id: 'maps', name: 'Maps' }
    ]
  },
  {
    id: 'economics',
    name: 'Economics',
    icon: '📈',
    color: '#fb923c',
    tagline: 'Prices, markets and money: see how buyers and sellers decide.',
    description:
      'Move prices, change incomes and watch demand and supply respond. ' +
      'Simple models of real Indian markets, with every number in rupees.',
    status: 'live',
    branches: [
      { id: 'markets', name: 'Demand & Supply' },
      { id: 'money', name: 'Money & Interest' }
    ]
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    icon: '💻',
    color: '#f87171',
    tagline: 'Bits, logic and algorithms: see how computers think.',
    description:
      'Count in binary, wire up logic gates and race sorting algorithms. ' +
      'The ideas inside every phone and computer, one step at a time.',
    status: 'live',
    branches: [
      { id: 'data', name: 'Numbers & Data' },
      { id: 'logic', name: 'Logic & Circuits' },
      { id: 'algorithms', name: 'Algorithms' }
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

  {
    id: 'speed-race',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Speed Race: Distance ÷ Time',
    description:
      'Race two vehicles down a straight track. Set their speeds in km/h, convert to m/s and predict who wins using time = distance ÷ speed.',
    level: 'Beginner',
    tags: ['speed', 'distance', 'time', 'km/h', 'm/s', 'uniform motion', 'race', 'stopwatch', 'motion and time', 'class 7'],
    thumbnail: '/assets/img/thumbs/speed-race.svg',
    link: '/physics/speed-race/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['distance-time-graph', 'oscillation-counter']
  },
  {
    id: 'distance-time-graph',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Distance–Time Graph Builder',
    description:
      'Plan a four-leg bus trip and watch its distance–time graph being drawn. Steep lines mean fast, flat lines mean stopped.',
    level: 'Beginner',
    tags: ['distance-time graph', 'graph', 'slope', 'speed', 'average speed', 'uniform motion', 'non-uniform motion', 'bus', 'motion and time', 'class 7'],
    thumbnail: '/assets/img/thumbs/distance-time-graph.svg',
    link: '/physics/distance-time-graph/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['speed-race', 'projectile']
  },
  {
    id: 'pendulum-clock',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Pendulum Clock Lab',
    description:
      'Time a simple pendulum with a stopwatch, find its time period T = time ÷ oscillations, and fill an observation table to test length and bob mass.',
    level: 'Beginner',
    tags: ['pendulum', 'time period', 'oscillation', 'stopwatch', 'seconds pendulum', 'clock', 'periodic motion', 'motion and time', 'class 7'],
    thumbnail: '/assets/img/thumbs/pendulum-clock.svg',
    link: '/physics/pendulum-clock/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['oscillation-counter', 'pendulum', 'speed-race']
  },

  /* ---- MECHANICS: Class 8 'Force and pressure' ------------------------- */
  {
    id: 'pressure-area',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Pressure = Force ÷ Area',
    description:
      'Rest a brick on sand on its largest, long or smallest face and stack more bricks. See how the same force makes more pressure on a smaller area and digs a deeper dent.',
    level: 'Beginner',
    tags: ['pressure', 'force', 'area', 'pascal', 'thrust', 'brick', 'sand', 'force and pressure', 'class 8'],
    thumbnail: '/assets/img/thumbs/pressure-area.svg',
    link: '/physics/pressure-area/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-28',
    prerequisites: ['speed-race']
  },
  {
    id: 'balanced-forces',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Balanced and Unbalanced Forces',
    description:
      'Two teams pull a loaded trolley from opposite sides. Change each pull and see when the forces balance, which way the net force acts and how the trolley speeds up or slows down.',
    level: 'Beginner',
    tags: ['force', 'net force', 'balanced forces', 'unbalanced forces', 'push and pull', 'tug of war', 'newton', 'force and pressure', 'class 8'],
    thumbnail: '/assets/img/thumbs/balanced-forces.svg',
    link: '/physics/balanced-forces/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-28',
    prerequisites: ['speed-race']
  },
  {
    id: 'liquid-pressure',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Pressure in Liquids',
    description:
      'A bottle with three holes at different depths: the deeper the hole, the greater the pressure (P = h ρ g) and the faster the jet. Change the level, the liquid and the stool height.',
    level: 'Beginner',
    tags: ['pressure', 'liquid pressure', 'depth', 'density', 'hydrostatic', 'jets', 'torricelli', 'force and pressure', 'class 8'],
    thumbnail: '/assets/img/thumbs/liquid-pressure.svg',
    link: '/physics/liquid-pressure/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-28',
    prerequisites: ['pressure-area']
  },
  {
    id: 'friction-surfaces',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Friction on Different Surfaces',
    description:
      'Pull a wooden block across glass, tile, wood, cloth and sandpaper with a spring balance. Find the force needed to start it moving and to keep it sliding.',
    level: 'Beginner',
    tags: ['friction', 'static friction', 'sliding friction', 'spring balance', 'surfaces', 'roughness', 'coefficient of friction', 'class 8'],
    thumbnail: '/assets/img/thumbs/friction-surfaces.svg',
    link: '/physics/friction-surfaces/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-28',
    prerequisites: ['balanced-forces']
  },
  {
    id: 'rolling-vs-sliding',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Rolling vs Sliding Friction',
    description:
      'Let a wooden block and a toy car go down the same ramp on to glass, tile, cloth or sand. Compare how far each runs and see why rolling friction is so much smaller.',
    level: 'Beginner',
    tags: ['friction', 'rolling friction', 'sliding friction', 'ramp', 'incline', 'wheels', 'fair test', 'class 8'],
    thumbnail: '/assets/img/thumbs/rolling-vs-sliding.svg',
    link: '/physics/rolling-vs-sliding/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-28',
    prerequisites: ['friction-surfaces']
  },
  {
    id: 'ball-bearings-lubricants',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Ball Bearings and Lubricants',
    description:
      'Spin a potter\'s wheel on a dry pivot, with powder, with oil or on ball bearings. See how long it keeps turning and how much heat friction makes.',
    level: 'Beginner',
    tags: ['friction', 'ball bearings', 'lubricants', 'oil', 'grease', 'heat', 'wear', 'potter\'s wheel', 'class 8'],
    thumbnail: '/assets/img/thumbs/ball-bearings-lubricants.svg',
    link: '/physics/ball-bearings-lubricants/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-29',
    prerequisites: ['friction-surfaces', 'rolling-vs-sliding']
  },

  /* ---- ELECTRICITY: Class 7 'Electric current and its effects' ---------- */
  {
    id: 'electric-circuit',
    subject: 'physics',
    branch: 'electricity',
    title: 'Electric Circuits and Symbols',
    description:
      'Build a battery, switch and bulb circuit, then redraw it with circuit symbols. See why a bulb lights only in a closed circuit.',
    level: 'Beginner',
    tags: ['circuit', 'battery', 'cell', 'switch', 'bulb', 'circuit diagram', 'symbols', 'open circuit', 'closed circuit', 'class 7'],
    thumbnail: '/assets/img/thumbs/electric-circuit.svg',
    link: '/physics/electric-circuit/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['heating-fuse', 'electromagnet']
  },
  {
    id: 'heating-fuse',
    subject: 'physics',
    branch: 'electricity',
    title: 'Heating Effect and the Fuse',
    description:
      'Switch on appliances in a 220 V house circuit and watch the fuse wire heat up. Overload it or cause a short circuit and see the fuse melt to keep the house safe.',
    level: 'Beginner',
    tags: ['heating effect', 'fuse', 'short circuit', 'overload', 'MCB', 'appliances', 'safety', 'current', 'class 7'],
    thumbnail: '/assets/img/thumbs/heating-fuse.svg',
    link: '/physics/heating-fuse/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['electric-circuit', 'electromagnet']
  },
  {
    id: 'electromagnet',
    subject: 'physics',
    branch: 'electricity',
    title: 'Make an Electromagnet',
    description:
      'Wind wire round an iron nail, connect a battery and pick up pins. Change the turns, cells and core, and watch a compass needle turn.',
    level: 'Beginner',
    tags: ['electromagnet', 'magnetic effect', 'coil', 'turns', 'compass', 'iron core', 'crane', 'class 7'],
    thumbnail: '/assets/img/thumbs/electromagnet.svg',
    link: '/physics/electromagnet/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['electric-circuit', 'heating-fuse']
  },
  {
    id: 'charging-by-rubbing',
    subject: 'physics',
    branch: 'electricity',
    title: 'Charging by Rubbing',
    description:
      'Rub a balloon on hair, a comb through dry hair or a glass rod with silk. Watch electrons move, pick up paper bits and push or pull a charged balloon.',
    level: 'Beginner',
    tags: ['static electricity', 'charge', 'electrons', 'rubbing', 'attraction', 'repulsion', 'humidity', 'class 8'],
    thumbnail: '/assets/img/thumbs/charging-by-rubbing.svg',
    link: '/physics/charging-by-rubbing/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-29',
    prerequisites: []
  },
  {
    id: 'electroscope',
    subject: 'physics',
    branch: 'electricity',
    title: 'Gold-Leaf Electroscope',
    description:
      'Bring a charged rod near an electroscope, touch the cap or earth it with your finger. See charges move and the gold leaves open and close.',
    level: 'Beginner',
    tags: ['electroscope', 'charge', 'induction', 'conduction', 'earthing', 'static electricity', 'class 8'],
    thumbnail: '/assets/img/thumbs/electroscope.svg',
    link: '/physics/electroscope/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-29',
    prerequisites: ['charging-by-rubbing']
  },
  {
    id: 'lightning-conductor',
    subject: 'physics',
    branch: 'electricity',
    title: 'Lightning and the Lightning Conductor',
    description:
      'Watch charge build up in a storm cloud until lightning strikes. Fit a lightning conductor, move a person to safety and time the thunder.',
    level: 'Beginner',
    tags: ['lightning', 'thunder', 'lightning conductor', 'earthing', 'storm', 'safety', 'natural phenomena', 'class 8'],
    thumbnail: '/assets/img/thumbs/lightning-conductor.svg',
    link: '/physics/lightning-conductor/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-29',
    prerequisites: ['charging-by-rubbing', 'electroscope']
  },

  /* ---- OPTICS: Class 7 'Light' ------------------------------------------ */
  {
    id: 'pinhole-camera',
    subject: 'physics',
    branch: 'optics',
    title: 'Pinhole Camera',
    description:
      'Make a pinhole camera: see how light travelling in straight lines forms an upside-down image, and how the box length and hole size change its size, sharpness and brightness.',
    level: 'Beginner',
    tags: ['light', 'pinhole camera', 'straight line', 'rectilinear propagation', 'inverted image', 'camera obscura', 'class 7'],
    thumbnail: '/assets/img/thumbs/pinhole-camera.svg',
    link: '/physics/pinhole-camera/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-28',
    prerequisites: ['plane-mirror']
  },
  {
    id: 'plane-mirror',
    subject: 'physics',
    branch: 'optics',
    title: 'Plane Mirror and Lateral Inversion',
    description:
      'Drag an object and your eye in front of a plane mirror. See why the angle of incidence equals the angle of reflection, where the image forms, and why AMBULANCE is written backwards.',
    level: 'Beginner',
    tags: ['light', 'reflection', 'plane mirror', 'angle of incidence', 'angle of reflection', 'virtual image', 'lateral inversion', 'class 7'],
    thumbnail: '/assets/img/thumbs/plane-mirror.svg',
    link: '/physics/plane-mirror/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-28',
    prerequisites: ['pinhole-camera', 'newtons-disc']
  },
  {
    id: 'newtons-disc',
    subject: 'physics',
    branch: 'optics',
    title: "Newton's Colour Disc",
    description:
      'Spin a disc painted with the seven colours of the rainbow and watch them merge into a whitish grey. Try other colour pairs and find out how fast the disc must spin to fool your eye.',
    level: 'Beginner',
    tags: ['light', 'white light', 'colours', 'VIBGYOR', 'newton disc', 'persistence of vision', 'spectrum', 'prism', 'class 7'],
    thumbnail: '/assets/img/thumbs/newtons-disc.svg',
    link: '/physics/newtons-disc/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-28',
    prerequisites: ['plane-mirror', 'pinhole-camera']
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

  /* ---- HEAT: 6 simulations for Class 7 'Heat' ------------------------ */
  {
    id: 'hot-and-cold',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Hot and Cold: Temperature',
    description:
      'Heat water from ice to boiling and watch its particles speed up. Why can’t your hand tell the real temperature?',
    level: 'Beginner',
    tags: ['temperature', 'hot', 'cold', 'celsius', 'fahrenheit', 'particles', 'touch', 'heat', 'class 7'],
    thumbnail: '/assets/img/thumbs/hot-and-cold.svg',
    link: '/physics/hot-and-cold/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-27',
    prerequisites: ['thermometer', 'conduction']
  },
  {
    id: 'thermometer',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Clinical vs Laboratory Thermometer',
    description:
      'Take your temperature, then measure hot and cold water. Discover the kink, the range and why a clinical thermometer must never go in boiling water.',
    level: 'Beginner',
    tags: ['thermometer', 'clinical', 'laboratory', 'kink', 'mercury', 'fever', 'body temperature', 'heat', 'class 7'],
    thumbnail: '/assets/img/thumbs/thermometer.svg',
    link: '/physics/thermometer/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-27',
    prerequisites: ['hot-and-cold', 'conduction']
  },
  {
    id: 'conduction',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Conduction: Heat Through a Rod',
    description:
      'Heat one end of a copper, iron, glass or wood rod and watch wax-stuck pins drop as heat travels along it.',
    level: 'Beginner',
    tags: ['conduction', 'conductor', 'insulator', 'metal', 'copper', 'iron', 'wood', 'heat', 'class 7'],
    thumbnail: '/assets/img/thumbs/conduction.svg',
    link: '/physics/conduction/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['convection', 'radiation']
  },
  {
    id: 'convection',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Convection Currents in Water',
    description:
      'Heat a beaker at one corner and drop in a permanganate crystal. Hot water rises, cool water sinks and a current carries the heat.',
    level: 'Beginner',
    tags: ['convection', 'current', 'hot water rises', 'permanganate', 'liquid', 'fluid', 'heat', 'class 7'],
    thumbnail: '/assets/img/thumbs/convection.svg',
    link: '/physics/convection/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['conduction', 'sea-land-breeze']
  },
  {
    id: 'radiation',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Radiation: Black vs Shiny',
    description:
      'Race black, white and shiny cans in front of a heater. Which colour absorbs heat best, and which cools fastest?',
    level: 'Beginner',
    tags: ['radiation', 'absorb', 'reflect', 'black', 'white', 'shiny', 'sun', 'no medium', 'heat', 'class 7'],
    thumbnail: '/assets/img/thumbs/radiation.svg',
    link: '/physics/radiation/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-27',
    prerequisites: ['convection', 'conduction']
  },
  {
    id: 'sea-land-breeze',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Sea and Land Breezes',
    description:
      'Run a day at the seaside. Land heats and cools faster than water, so the breeze blows from the sea by day and from the land by night.',
    level: 'Beginner',
    tags: ['sea breeze', 'land breeze', 'wind', 'coast', 'convection', 'day', 'night', 'heat', 'class 7'],
    thumbnail: '/assets/img/thumbs/sea-land-breeze.svg',
    link: '/physics/sea-land-breeze/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-27',
    prerequisites: ['convection', 'radiation']
  },

  {
    id: 'day-night-india',
    subject: 'geography',
    branch: 'earth-motions',
    title: 'Day, Night and Sunrise Across India',
    description:
      'Spin the Earth seen from above the North Pole and watch the Sun rise in Dibrugarh almost two hours before Dwarka, all on one IST clock.',
    level: 'Beginner',
    tags: ['rotation', 'day and night', 'sunrise', 'sunset', 'longitude', 'ist', 'india', 'earth', 'class 7'],
    thumbnail: '/assets/img/thumbs/day-night-india.svg',
    link: '/geography/day-night-india/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-29',
    prerequisites: ['seasons-revolution', 'time-zones']
  },
  {
    id: 'seasons-revolution',
    subject: 'geography',
    branch: 'earth-motions',
    title: 'Revolution and the Seasons',
    description:
      'Send the tilted Earth round the Sun. See how high the noon Sun climbs and how long the day lasts in Delhi, Kanyakumari or Sydney through the year.',
    level: 'Beginner',
    tags: ['revolution', 'seasons', 'tilt', 'axis', 'solstice', 'equinox', 'day length', 'tropic of cancer', 'class 7'],
    thumbnail: '/assets/img/thumbs/seasons-revolution.svg',
    link: '/geography/seasons-revolution/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-29',
    prerequisites: ['day-night-india', 'time-zones']
  },
  {
    id: 'time-zones',
    subject: 'geography',
    branch: 'earth-motions',
    title: 'Time Zones: IST and World Clocks',
    description:
      'Move the clock in India and watch day and night sweep across a world map. Why is IST 5 h 30 min ahead of Greenwich, and where is it already tomorrow?',
    level: 'Beginner',
    tags: ['time zones', 'ist', 'utc', 'gmt', 'longitude', 'greenwich', 'date line', 'world clock', 'class 7'],
    thumbnail: '/assets/img/thumbs/time-zones.svg',
    link: '/geography/time-zones/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-29',
    prerequisites: ['day-night-india', 'seasons-revolution']
  },
  {
    id: 'demand-curve',
    subject: 'economics',
    branch: 'markets',
    title: 'The Demand Curve',
    description:
      'Set the price of mangoes and drag along the demand curve. Then change incomes, apple prices or tastes and watch the whole curve shift.',
    level: 'Intermediate',
    tags: ['demand', 'law of demand', 'demand schedule', 'price', 'elasticity', 'substitute', 'normal good', 'market', 'class 11'],
    thumbnail: '/assets/img/thumbs/demand-curve.svg',
    link: '/economics/demand-curve/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-29',
    prerequisites: []
  },

  {
    id: 'supply-equilibrium',
    subject: 'economics',
    branch: 'markets',
    title: 'Supply and Market Equilibrium',
    description:
      'Add sellers to the mango market, find where supply crosses demand, and press Play to watch a shortage or surplus push the price to equilibrium.',
    level: 'Intermediate',
    tags: ['supply', 'law of supply', 'equilibrium', 'shortage', 'surplus', 'excess demand', 'excess supply', 'market', 'class 11', 'class 12'],
    thumbnail: '/assets/img/thumbs/supply-equilibrium.svg',
    link: '/economics/supply-equilibrium/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-30',
    prerequisites: ['demand-curve']
  },
  {
    id: 'price-controls',
    subject: 'economics',
    branch: 'markets',
    title: 'Price Ceiling and Price Floor',
    description:
      'Put a price ceiling or a minimum support price on a wheat market and see the shortage, black market or surplus it creates, and what ration shops and procurement change.',
    level: 'Intermediate',
    tags: ['price ceiling', 'price floor', 'msp', 'minimum support price', 'ration shop', 'pds', 'black market', 'shortage', 'surplus', 'class 12'],
    thumbnail: '/assets/img/thumbs/price-controls.svg',
    link: '/economics/price-controls/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-30',
    prerequisites: ['supply-equilibrium']
  },
  {
    id: 'binary-counter',
    subject: 'computer-science',
    branch: 'data',
    title: 'Binary Counter and Place Values',
    description:
      'Tap lamps to switch bits on and off, count up in binary and watch carries ripple. See every number in decimal, octal and hexadecimal, with the divide-by-2 working.',
    level: 'Beginner',
    tags: ['binary', 'bits', 'byte', 'place value', 'number system', 'octal', 'hexadecimal', 'conversion', 'overflow', 'class 11'],
    thumbnail: '/assets/img/thumbs/binary-counter.svg',
    link: '/computer-science/binary-counter/',
    status: 'live',
    featured: true,
    dateAdded: '2026-09-30',
    prerequisites: []
  },
  {
    id: 'logic-gates',
    subject: 'computer-science',
    branch: 'logic',
    title: 'Logic Gates and Truth Tables',
    description:
      'Flip input switches and light the lamp through AND, OR, NOT, NAND, NOR and XOR gates, join two gates together, and fill in the truth table as you go.',
    level: 'Beginner',
    tags: ['logic gates', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'truth table', 'boolean', 'class 11', 'class 12'],
    thumbnail: '/assets/img/thumbs/logic-gates.svg',
    link: '/computer-science/logic-gates/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-30',
    prerequisites: ['binary-counter']
  },
  {
    id: 'sorting-race',
    subject: 'computer-science',
    branch: 'algorithms',
    title: 'Sorting Race: Bubble, Selection and Merge',
    description:
      'Race bubble sort, selection sort and merge sort on the same bars, step by step, counting comparisons and swaps. See why n log n beats n² as the list grows.',
    level: 'Intermediate',
    tags: ['sorting', 'algorithms', 'bubble sort', 'selection sort', 'merge sort', 'comparisons', 'time complexity', 'big o', 'class 11', 'class 12'],
    thumbnail: '/assets/img/thumbs/sorting-race.svg',
    link: '/computer-science/sorting-race/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-30',
    prerequisites: ['binary-counter']
  },
  {
    id: 'distance-displacement',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Distance and Displacement',
    description:
      'Walk to school, round a park or along a circular track and compare the path length (distance) with the straight arrow from start to finish (displacement). Draw your own path too.',
    level: 'Beginner',
    tags: ['distance', 'displacement', 'scalar', 'vector', 'average speed', 'average velocity', 'motion', 'class 9'],
    thumbnail: '/assets/img/thumbs/distance-displacement.svg',
    link: '/physics/distance-displacement/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-30',
    prerequisites: ['speed-race']
  },
  {
    id: 'velocity-time-graph',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Velocity–Time Graph: Area = Distance',
    description:
      'Drive a metro train or a car through speeding up, steady running and braking. Read acceleration from the slope of the v–t graph and distance from the area under it.',
    level: 'Intermediate',
    tags: ['velocity-time graph', 'acceleration', 'retardation', 'area under graph', 'equations of motion', 'uniform acceleration', 'stopping distance', 'metro', 'motion', 'class 9'],
    thumbnail: '/assets/img/thumbs/velocity-time-graph.svg',
    link: '/physics/velocity-time-graph/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-30',
    prerequisites: ['distance-time-graph', 'distance-displacement']
  },
  {
    id: 'circular-motion',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Uniform Circular Motion',
    description:
      'Whirl a stone on a string: the speed stays the same but the velocity arrow keeps turning along the tangent. Find v = 2πr ÷ T, then cut the string and watch it fly off straight.',
    level: 'Beginner',
    tags: ['uniform circular motion', 'circular motion', 'tangent', 'velocity', 'speed', 'acceleration', 'centripetal', 'motion', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/circular-motion.svg',
    link: '/physics/circular-motion/',
    status: 'live',
    featured: false,
    dateAdded: '2026-09-30',
    prerequisites: ['distance-displacement']
  },

  {
    id: 'inertia-coin-card',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Inertia: Coin on a Card',
    description:
      'Flick a card from under a coin sitting on a glass. A quick flick leaves the coin behind to drop in; a slow pull drags it along. See Newton’s first law in slow motion.',
    level: 'Beginner',
    tags: ['inertia', 'newton first law', 'first law of motion', 'friction', 'coin and card', 'force and laws of motion', 'class 9'],
    thumbnail: '/assets/img/thumbs/inertia-coin-card.svg',
    link: '/physics/inertia-coin-card/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-01',
    prerequisites: ['balanced-forces']
  },
  {
    id: 'newtons-second-law',
    subject: 'physics',
    branch: 'mechanics',
    title: "Newton's Second Law: F = ma Cart Lab",
    description:
      'Pull a cart with a steady force, load it with bricks and change the track. A ticker tape and a speed graph show that acceleration = net force ÷ mass.',
    level: 'Beginner',
    tags: ['newton second law', 'f = ma', 'acceleration', 'net force', 'mass', 'momentum', 'ticker tape', 'friction', 'force and laws of motion', 'class 9'],
    thumbnail: '/assets/img/thumbs/newtons-second-law.svg',
    link: '/physics/newtons-second-law/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-01',
    prerequisites: ['inertia-coin-card', 'velocity-time-graph']
  },
  {
    id: 'balloon-rocket',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Action and Reaction: Balloon Rocket',
    description:
      'Release a balloon on a string: it pushes air back and the air pushes it forward with an equal force. Compare the momentum of the balloon and of the air it throws out.',
    level: 'Beginner',
    tags: ['newton third law', 'action and reaction', 'balloon rocket', 'thrust', 'rocket', 'momentum', 'conservation of momentum', 'force and laws of motion', 'class 9'],
    thumbnail: '/assets/img/thumbs/balloon-rocket.svg',
    link: '/physics/balloon-rocket/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-01',
    prerequisites: ['newtons-second-law']
  },
  {
    id: 'collisions',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Collisions and Momentum',
    description:
      'Crash two carts on a smooth track, bouncy, partly bouncy or sticky. Bars show that total momentum is always conserved, while kinetic energy is kept only in elastic collisions.',
    level: 'Intermediate',
    tags: ['collisions', 'momentum', 'conservation of momentum', 'elastic', 'inelastic', 'impulse', 'kinetic energy', 'force and laws of motion', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/collisions.svg',
    link: '/physics/collisions/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-01',
    prerequisites: ['balloon-rocket']
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
