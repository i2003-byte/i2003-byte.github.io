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
  // Hidden visitor counter (GoatCounter: no cookies, no personal data), approved by the owner.
  // Loaded once for every page by nav.js, only on the live site. Don't remove or duplicate it.
  analytics: 'https://simlab-edu.goatcounter.com/count',
  // Issue links are built from the GitHub URL above:
  get issues() { return this.github + '/issues/new?title=' + encodeURIComponent('Issue: '); },
  get suggest() {
    return this.github + '/issues/new?labels=simulation-request&title=' +
      encodeURIComponent('Simulation idea: ');
  },
  newBadgeDays: 30, // Items added within this many days get a "New" badge
  // "Tap & play" row on the home page: the most exciting simulations first (ids).
  // Featured simulations follow automatically, then the newest ones.
  showcase: ['energy-roller-coaster', 'guitar-string', 'youngs-double-slit', 'sorting-race', 'photosynthesis-leaf', 'balloon-rocket',
    'water-xylophone', 'prism-dispersion', 'logic-gates', 'day-night-india', 'natural-indicators', 'demand-curve']
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
      'and short in December, find out why India has one clock time, follow the monsoon winds, ' +
      'watch clouds and rain form over the Western Ghats and read the climate graphs of Indian cities.',
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
      'See the particles of solids, liquids and gases, melt and boil water, cool it by evaporation, ' +
      'test everyday solutions with indicators and the pH scale, neutralise acids with bases, ' +
      'balance chemical equations, watch the main types of reactions happen and leave iron nails to rust.',
    status: 'live',
    branches: [
      { id: 'matter', name: 'Matter & Its States' },
      { id: 'acids-bases', name: 'Acids, Bases & Salts' },
      { id: 'atoms', name: 'Atoms & Molecules' },
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
      'Turn a transversal across parallel lines, tear the corners off a triangle and slide ' +
      'four triangles around a square to prove Pythagoras. Resize right triangles to discover sin, cos and tan, ' +
      'trace the sine wave round a circle and find the height of the Qutub Minar. Draw histograms, balance data ' +
      'on its mean and toss coins a thousand times to watch probability settle.',
    status: 'live',
    branches: [
      { id: 'geometry', name: 'Lines, Angles & Triangles' },
      { id: 'trigonometry', name: 'Trigonometry' },
      { id: 'coordinate-geometry', name: 'Coordinate Geometry' },
      { id: 'mensuration', name: 'Mensuration' },
      { id: 'functions', name: 'Functions & Graphs' },
      { id: 'calculus', name: 'Calculus' },
      { id: 'probability', name: 'Statistics & Probability' }
    ]
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: '🧬',
    color: '#4ade80',
    tagline: 'Cells, plants and living things, simulated.',
    description:
      'Explore plant, animal and bacterial cells, watch molecules diffuse and water move by osmosis, look inside a leaf as it makes food ' +
      'and test leaves for starch. Change the conditions and see how living things respond.',
    status: 'live',
    branches: [
      { id: 'plants', name: 'Plant Nutrition' },
      { id: 'human-body', name: 'Human Body' },
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
     tags: ['gravity', 'kinematics', 'class 11'],   // search keywords; 'class N' tags drive the Class filter
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
    tags: ['gravity', 'kinematics', 'parabola', 'range', 'trajectory', 'cannon', 'motion', 'class 11'],
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
    tags: ['oscillation', 'harmonic', 'period', 'energy', 'gravity', 'damping', 'swing', 'class 11'],
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
  {
    id: 'compressions-rarefactions',
    subject: 'physics',
    branch: 'sound',
    title: 'Sound Waves: Compressions and Rarefactions',
    description:
      'Switch on a loudspeaker and watch air particles bunch into compressions and spread into rarefactions. Follow one particle, compare a slinky, and check v = fλ in air, water and steel.',
    level: 'Intermediate',
    tags: ['sound', 'longitudinal wave', 'compression', 'rarefaction', 'wavelength', 'frequency', 'speed of sound', 'class 9'],
    thumbnail: '/assets/img/thumbs/compressions-rarefactions.svg',
    link: '/physics/compressions-rarefactions/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-14',
    prerequisites: ['vibration']
  },
  {
    id: 'echo-sonar',
    subject: 'physics',
    branch: 'sound',
    title: 'Echo and SONAR',
    description:
      'Clap in front of a cliff, shout into a well, or let a ship map the sea bed with ultrasound. Time the echo, find the distance with d = vt/2, and see why an echo needs at least 17.2 m.',
    level: 'Intermediate',
    tags: ['sound', 'echo', 'sonar', 'ultrasound', 'reflection of sound', 'speed of sound', 'reverberation', 'class 9'],
    thumbnail: '/assets/img/thumbs/echo-sonar.svg',
    link: '/physics/echo-sonar/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-14',
    prerequisites: ['compressions-rarefactions']
  },
  {
    id: 'sound-reflection',
    subject: 'physics',
    branch: 'sound',
    title: 'Reflection of Sound',
    description:
      'Find the angle where a clock ticks loudest in the two-tube experiment, then see how a curved sound board, a megaphone and a stethoscope use reflections of sound.',
    level: 'Beginner',
    tags: ['sound', 'reflection of sound', 'laws of reflection', 'megaphone', 'stethoscope', 'sound board', 'multiple reflection', 'class 9'],
    thumbnail: '/assets/img/thumbs/sound-reflection.svg',
    link: '/physics/sound-reflection/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-14',
    prerequisites: ['echo-sonar']
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
    id: 'gas-pressure-molecules',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Gas Pressure from Molecules',
    description:
      'Watch gas molecules bounce in a box and measure the pressure from their wall hits. Change the number of molecules, the temperature and the gas, and test the kinetic theory of gases.',
    level: 'Advanced',
    tags: ['kinetic theory', 'gas pressure', 'molecules', 'rms speed', 'temperature', 'ideal gas', 'class 11'],
    thumbnail: '/assets/img/thumbs/gas-pressure-molecules.svg',
    link: '/physics/gas-pressure-molecules/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-10',
    prerequisites: ['states-of-matter']
  },
  {
    id: 'gas-laws-piston',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Gas Laws: Boyle and Charles with a Piston',
    description:
      "Squeeze a gas with a piston, heat it under a load or in a sealed cylinder, and plot Boyle's law, Charles's law and the pressure law. Extend the line to find absolute zero.",
    level: 'Intermediate',
    tags: ["boyle's law", "charles's law", 'pressure law', 'ideal gas equation', 'absolute zero', 'kelvin', 'class 11'],
    thumbnail: '/assets/img/thumbs/gas-laws-piston.svg',
    link: '/physics/gas-laws-piston/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-10',
    prerequisites: ['gas-pressure-molecules']
  },
  {
    id: 'molecular-speeds',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Speeds of Gas Molecules (Maxwell Distribution)',
    description:
      'Give every molecule the same speed and watch collisions spread them into the Maxwell curve. Compare hot and cold gases, light and heavy ones, and find v_p, v̄ and v_rms.',
    level: 'Advanced',
    tags: ['maxwell distribution', 'kinetic theory', 'rms speed', 'most probable speed', 'mean speed', 'molecules', 'class 11'],
    thumbnail: '/assets/img/thumbs/molecular-speeds.svg',
    link: '/physics/molecular-speeds/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-10',
    prerequisites: ['gas-pressure-molecules']
  },
  {
    id: 'thermal-expansion',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Thermal Expansion',
    description:
      'Heat a rod against a dial gauge, watch railway rails close their expansion gaps and buckle, and make a bimetallic strip ring a fire alarm. Check ΔL = αLΔT for steel, aluminium, brass and invar.',
    level: 'Intermediate',
    tags: ['thermal expansion', 'coefficient of linear expansion', 'bimetallic strip', 'railway gaps', 'thermal stress', 'class 11'],
    thumbnail: '/assets/img/thumbs/thermal-expansion.svg',
    link: '/physics/thermal-expansion/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-14',
    prerequisites: ['thermometer']
  },
  {
    id: 'calorimetry',
    subject: 'physics',
    branch: 'thermodynamics',
    title: 'Calorimetry: Method of Mixtures',
    description:
      'Drop a hot copper, aluminium or lead block, hot water or ice into a calorimeter. Watch the temperatures meet, check heat lost = heat gained, and find the specific heat of an unknown metal.',
    level: 'Intermediate',
    tags: ['calorimetry', 'specific heat capacity', 'method of mixtures', 'latent heat', 'thermal equilibrium', 'class 11'],
    thumbnail: '/assets/img/thumbs/calorimetry.svg',
    link: '/physics/calorimetry/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-14',
    prerequisites: ['thermal-expansion']
  },
  {
    id: 'newtons-cooling',
    subject: 'physics',
    branch: 'thermodynamics',
    title: "Newton's Law of Cooling: Why Chai Gets Cold",
    description:
      'Watch two cups of hot chai cool in the same room: steel tumbler, kulhad, mug or flask, with or without a lid or a fan. See the rate of cooling fall in step with the temperature difference.',
    level: 'Intermediate',
    tags: ['newtons law of cooling', 'rate of cooling', 'temperature difference', 'heat loss', 'evaporation', 'vacuum flask', 'class 11'],
    thumbnail: '/assets/img/thumbs/newtons-cooling.svg',
    link: '/physics/newtons-cooling/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['calorimetry']
  },
  {
    id: 'heart-circulation',
    subject: 'biology',
    branch: 'human-body',
    title: 'Heart & Double Circulation',
    description:
      'Follow blood cells from the body to the right side of the heart, through the lungs, back to the left side and out to the body again. The chambers squeeze in turn and the valves open and shut to the lub-dub beat. Compare frog and fish hearts.',
    level: 'Beginner',
    tags: ['life processes', 'heart', 'circulation', 'blood', 'valves', 'pulse', 'transport', 'class 10'],
    thumbnail: '/assets/img/thumbs/heart-circulation.svg',
    link: '/biology/heart-circulation/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-17',
    prerequisites: []
  },
  {
    id: 'digestion-enzymes',
    subject: 'biology',
    branch: 'human-body',
    title: 'Digestion Along the Gut',
    description:
      'Follow a meal from the mouth through the stomach and small intestine to the large intestine. Enzymes cut starch, protein and fat into glucose, amino acids, fatty acids and glycerol, and the villi absorb them. Try it without bile or stomach acid.',
    level: 'Beginner',
    tags: ['life processes', 'digestion', 'enzymes', 'alimentary canal', 'bile', 'nutrition', 'class 10'],
    thumbnail: '/assets/img/thumbs/digestion-enzymes.svg',
    link: '/biology/digestion-enzymes/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-17',
    prerequisites: []
  },
  {
    id: 'kidney-nephron',
    subject: 'biology',
    branch: 'human-body',
    title: 'Kidney & Nephron',
    description:
      'Follow blood into a nephron: the glomerulus filters it, the tubule takes back glucose, salts and most of the water, and what is left trickles out as urine. Drink more or less water, or go out on a hot day, and watch the urine volume and colour change.',
    level: 'Beginner',
    tags: ['life processes', 'excretion', 'kidney', 'nephron', 'urine', 'filtration', 'reabsorption', 'dialysis', 'class 10'],
    thumbnail: '/assets/img/thumbs/kidney-nephron.svg',
    link: '/biology/kidney-nephron/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-18',
    prerequisites: ['heart-circulation']
  },
  {
    id: 'photosynthesis-leaf',
    subject: 'biology',
    branch: 'plants',
    title: 'Photosynthesis in a Leaf',
    description:
      'Look inside a leaf as it makes food. Change sunlight, carbon dioxide, water and chlorophyll, and watch CO₂ and water become glucose and oxygen.',
    level: 'Beginner',
    tags: ['photosynthesis', 'leaf', 'chlorophyll', 'stomata', 'limiting factor', 'nutrition in plants', 'class 7', 'class 10'],
    thumbnail: '/assets/img/thumbs/photosynthesis-leaf.svg',
    link: '/biology/photosynthesis-leaf/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-10',
    prerequisites: []
  },
  {
    id: 'oxygen-bubbles',
    subject: 'biology',
    branch: 'plants',
    title: 'Oxygen Bubbles from a Water Plant',
    description:
      'Move a lamp nearer to a Hydrilla plant and count the oxygen bubbles. Plot bubbles per minute against distance, add baking soda, try coloured light and test the gas.',
    level: 'Beginner',
    tags: ['photosynthesis', 'hydrilla', 'oxygen', 'light intensity', 'inverse square', 'nutrition in plants', 'class 7', 'class 10'],
    thumbnail: '/assets/img/thumbs/oxygen-bubbles.svg',
    link: '/biology/oxygen-bubbles/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-10',
    prerequisites: ['photosynthesis-leaf']
  },
  {
    id: 'starch-test',
    subject: 'biology',
    branch: 'plants',
    title: 'Starch Test on a Leaf',
    description:
      'Cover part of a leaf, use a variegated leaf or take away CO₂, then boil, decolourise and add iodine. See where starch was made.',
    level: 'Beginner',
    tags: ['starch test', 'iodine', 'photosynthesis', 'variegated leaf', 'destarching', 'nutrition in plants', 'class 7', 'class 10'],
    thumbnail: '/assets/img/thumbs/starch-test.svg',
    link: '/biology/starch-test/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-10',
    prerequisites: ['photosynthesis-leaf']
  },

  {
    id: 'cell-explorer',
    subject: 'biology',
    branch: 'cells',
    title: 'Cell Explorer: Plant, Animal and Bacterial Cells',
    description:
      'Tap the parts of a plant cell, an animal cell and a bacterium to see what each organelle does, which cells have it, and how big cells really are. Then quiz yourself.',
    level: 'Beginner',
    tags: ['cell', 'organelles', 'nucleus', 'mitochondria', 'chloroplast', 'prokaryote', 'eukaryote', 'fundamental unit of life', 'class 8', 'class 9'],
    thumbnail: '/assets/img/thumbs/cell-explorer.svg',
    link: '/biology/cell-explorer/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-14',
    prerequisites: []
  },
  {
    id: 'osmosis',
    subject: 'biology',
    branch: 'cells',
    title: 'Osmosis: Potato, Raisins and Plant Cells',
    description:
      'Soak a potato strip, raisins or Rhoeo leaf cells in water, salt or sugar solution. Watch water move by osmosis, graph the change in mass and see plasmolysis under the microscope.',
    level: 'Intermediate',
    tags: ['osmosis', 'plasmolysis', 'turgid', 'hypotonic', 'hypertonic', 'selectively permeable', 'fundamental unit of life', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/osmosis.svg',
    link: '/biology/osmosis/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-14',
    prerequisites: ['diffusion']
  },
  {
    id: 'diffusion',
    subject: 'biology',
    branch: 'cells',
    title: 'Diffusion Across a Membrane',
    description:
      'Watch glucose and starch molecules wander at random in water. See glucose spread through a selectively permeable membrane until both sides are equal, while starch stays behind. Change the temperature.',
    level: 'Beginner',
    tags: ['diffusion', 'concentration gradient', 'brownian motion', 'membrane', 'dynamic equilibrium', 'fundamental unit of life', 'class 9'],
    thumbnail: '/assets/img/thumbs/diffusion.svg',
    link: '/biology/diffusion/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-14',
    prerequisites: ['cell-explorer']
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
    id: 'monsoon-winds',
    subject: 'geography',
    branch: 'climate',
    title: 'Monsoon Winds over India',
    description:
      'Run through a year over India: the land heats up faster than the sea, low pressure pulls in moist south-west monsoon winds and rain, and in winter dry winds blow back from land to sea.',
    level: 'Beginner',
    tags: ['monsoon', 'winds', 'air pressure', 'land and sea', 'rainfall', 'climate', 'weather', 'india', 'rain shadow', 'class 7', 'class 9'],
    thumbnail: '/assets/img/thumbs/monsoon-winds.svg',
    link: '/geography/monsoon-winds/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-11',
    prerequisites: ['seasons-revolution']
  },
  {
    id: 'humidity-clouds-rain',
    subject: 'geography',
    branch: 'climate',
    title: 'Humidity, Clouds and Rain',
    description:
      'Follow a bubble of air from the sea up the Western Ghats: water evaporates, the rising air cools to its dew point, clouds form and it rains, then the air sinks warm and dry into the rain shadow.',
    level: 'Intermediate',
    tags: ['humidity', 'relative humidity', 'dew point', 'evaporation', 'condensation', 'clouds', 'rain', 'water cycle', 'rain shadow', 'western ghats', 'weather', 'class 7', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/humidity-clouds-rain.svg',
    link: '/geography/humidity-clouds-rain/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-12',
    prerequisites: ['monsoon-winds']
  },
  {
    id: 'climate-graphs',
    subject: 'geography',
    branch: 'climate',
    title: 'Climate Graphs of Indian Cities',
    description:
      'Read climate graphs of nine Indian cities: monthly rain as bars and temperature as a line. Compare Mumbai, Delhi, Chennai, Leh, Sohra and more, then guess a mystery city from its graph.',
    level: 'Beginner',
    tags: ['climate', 'climograph', 'climate graph', 'rainfall', 'temperature', 'weather and climate', 'india', 'cities', 'desert', 'monsoon', 'class 7', 'class 9'],
    thumbnail: '/assets/img/thumbs/climate-graphs.svg',
    link: '/geography/climate-graphs/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-12',
    prerequisites: ['monsoon-winds']
  },
  {
    id: 'desert-day-night',
    subject: 'geography',
    branch: 'climate',
    title: 'Why Deserts Are Hot by Day and Cold at Night',
    description:
      'Run a 24-hour day in the Thar desert next to Mumbai and a cloudy night. Dry air, bare sand and clear skies let the ground heat fast in sunshine and lose its heat to space after sunset.',
    level: 'Beginner',
    tags: ['desert', 'thar', 'temperature', 'day and night', 'humidity', 'clouds', 'heat', 'radiation', 'weather and climate', 'class 7', 'class 11'],
    thumbnail: '/assets/img/thumbs/desert-day-night.svg',
    link: '/geography/desert-day-night/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['humidity-clouds-rain']
  },
  {
    id: 'insolation-angle',
    subject: 'geography',
    branch: 'climate',
    title: 'Why a Low Sun Heats Less',
    description:
      'Change latitude, season, time of day and slope and watch a 1 m beam of sunlight spread over more ground and cross more air when the sun is low. See why clear-sky deserts near the tropics get the most sunshine.',
    level: 'Intermediate',
    tags: ['insolation', 'sun angle', 'latitude', 'seasons', 'solar radiation', 'tropic of cancer', 'desert', 'slope', 'weather and climate', 'class 7', 'class 11'],
    thumbnail: '/assets/img/thumbs/insolation-angle.svg',
    link: '/geography/insolation-angle/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-16',
    prerequisites: ['seasons-revolution', 'desert-day-night']
  },
  {
    id: 'wind-shapes-desert',
    subject: 'geography',
    branch: 'climate',
    title: 'How Wind Shapes the Desert',
    description:
      'Sand grains hop low and carve a mushroom rock, crescent barchan dunes march downwind (small ones fastest) towards a road, and dust storms carry fine silt hundreds of kilometres to settle as loess.',
    level: 'Beginner',
    tags: ['wind', 'erosion', 'deposition', 'mushroom rock', 'sand dunes', 'barchan', 'loess', 'desert', 'thar', 'our changing earth', 'class 7'],
    thumbnail: '/assets/img/thumbs/wind-shapes-desert.svg',
    link: '/geography/wind-shapes-desert/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-16',
    prerequisites: ['desert-day-night']
  },
  {
    id: 'contour-hill',
    subject: 'geography',
    branch: 'maps',
    title: 'Contour Lines from a Model Hill',
    description:
      'Pour water into a tank around a model hill and mark its edge every 50 m. Watch the marks become the contour lines of a map: close lines for steep slopes, far apart for gentle ones, rings inside rings for a peak, a saddle and a crater.',
    level: 'Beginner',
    tags: ['contour lines', 'contour interval', 'relief', 'topographic map', 'slope', 'hill', 'plateau', 'saddle', 'maps', 'class 9'],
    thumbnail: '/assets/img/thumbs/contour-hill.svg',
    link: '/geography/contour-hill/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-18',
    prerequisites: []
  },
  {
    id: 'cross-section-map',
    subject: 'geography',
    branch: 'maps',
    title: 'Reading a Contour Map: Cross-Sections',
    description:
      'Drag a line across a contour map of hills, a river valley and a spur, and see the side view (cross-section) drawn below. Tell valleys from spurs by which way the V of the contours points, and check whether one point can see another.',
    level: 'Intermediate',
    tags: ['contour map', 'cross-section', 'profile', 'topographic map', 'toposheet', 'valley', 'spur', 'saddle', 'gradient', 'intervisibility', 'maps', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/cross-section-map.svg',
    link: '/geography/cross-section-map/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-18',
    prerequisites: ['contour-hill']
  },
  {
    id: 'map-scale',
    subject: 'geography',
    branch: 'maps',
    title: 'Map Scale and Distance in India',
    description:
      'Measure routes on a map of India with a ruler and a thread. Switch between the statement, ratio (1 : 1,00,00,000) and line scales, change the scale, and see why the map distance changes but the real distance does not.',
    level: 'Beginner',
    tags: ['map scale', 'representative fraction', 'statement scale', 'line scale', 'distance', 'map of india', 'large scale', 'small scale', 'maps', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/map-scale.svg',
    link: '/geography/map-scale/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-18',
    prerequisites: []
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

  {
    id: 'universal-gravitation',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Universal Law of Gravitation',
    description:
      'Two students, two trucks, the Earth and an apple, the Moon, the Sun: see the equal and opposite pull F = G m₁ m₂ ÷ r² and the inverse-square law.',
    level: 'Beginner',
    tags: ['gravitation', 'universal law of gravitation', 'newton', 'inverse square law', 'force', 'moon', 'g constant', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/universal-gravitation.svg',
    link: '/physics/universal-gravitation/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-01',
    prerequisites: ['collisions']
  },
  {
    id: 'free-fall-planets',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Free Fall and g on Different Worlds',
    description:
      'Drop a heavy ball and a marble on the Moon, Mars, the Earth and Jupiter. Both land together, g changes from world to world, and mass stays the same while weight W = m g changes.',
    level: 'Beginner',
    tags: ['free fall', 'acceleration due to gravity', 'g', 'mass and weight', 'weight', 'moon', 'planets', 'gravitation', 'class 9'],
    thumbnail: '/assets/img/thumbs/free-fall-planets.svg',
    link: '/physics/free-fall-planets/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-01',
    prerequisites: ['universal-gravitation']
  },
  {
    id: 'buoyancy-archimedes',
    subject: 'physics',
    branch: 'mechanics',
    title: "Buoyancy and Archimedes' Principle",
    description:
      'Lower blocks into water, sea water, kerosene, glycerine or mercury. A spring balance and an overflow can show that upthrust equals the weight of liquid displaced, and why things sink or float.',
    level: 'Beginner',
    tags: ['buoyancy', 'upthrust', 'archimedes principle', 'floating', 'sinking', 'density', 'relative density', 'gravitation', 'class 9', 'class 8'],
    thumbnail: '/assets/img/thumbs/buoyancy-archimedes.svg',
    link: '/physics/buoyancy-archimedes/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-01',
    prerequisites: ['free-fall-planets']
  },
  {
    id: 'work-done',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Work Done: W = F s cos θ',
    description:
      'Move a box with a force at any angle. Only the part of the force along the motion does work; see positive, zero and negative work and the area under a force–distance graph.',
    level: 'Beginner',
    tags: ['work', 'work done', 'joule', 'force', 'displacement', 'angle', 'negative work', 'work energy and power', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/work-done.svg',
    link: '/physics/work-done/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-01',
    prerequisites: ['newtons-second-law']
  },

  {
    id: 'energy-roller-coaster',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Roller Coaster: Potential and Kinetic Energy',
    description:
      'Release a cart from any height and watch PE turn into KE and back. Live energy bars show the total staying constant, and friction turning some of it into heat.',
    level: 'Beginner',
    tags: ['energy', 'potential energy', 'kinetic energy', 'conservation of energy', 'roller coaster', 'friction', 'heat', 'work energy and power', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/energy-roller-coaster.svg',
    link: '/physics/energy-roller-coaster/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-02',
    prerequisites: ['work-done']
  },
  {
    id: 'power-race',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Power Race: Same Work, Different Time',
    description:
      'A walker, a runner and a motor lift raise the same mass up the same height. Same work, different power: P = W ÷ t in watts and horsepower, plus kWh and the electricity bill in ₹.',
    level: 'Beginner',
    tags: ['power', 'watt', 'horsepower', 'kilowatt hour', 'kwh', 'electricity bill', 'work', 'work energy and power', 'class 9'],
    thumbnail: '/assets/img/thumbs/power-race.svg',
    link: '/physics/power-race/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-02',
    prerequisites: ['work-done']
  },
  {
    id: 'ray-optics',
    subject: 'physics',
    branch: 'optics',
    title: 'Spherical Mirrors: Ray Diagrams',
    description:
      'Drag an object in front of a concave or convex mirror and watch the standard rays find the image. Check 1/v + 1/u = 1/f, the magnification and the nature of the image.',
    level: 'Intermediate',
    tags: ['light', 'mirror', 'concave mirror', 'convex mirror', 'reflection', 'ray diagram', 'mirror formula', 'magnification', 'focal length', 'class 10'],
    thumbnail: '/assets/img/thumbs/ray-optics.svg',
    link: '/physics/ray-optics/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-02',
    prerequisites: ['plane-mirror']
  },
  {
    id: 'refraction-glass-slab',
    subject: 'physics',
    branch: 'optics',
    title: 'Refraction through a Glass Slab',
    description:
      "Shine a ray into a glass, water, acrylic or diamond slab. Measure i, r and e, see the lateral shift and verify Snell's law on a sin i against sin r graph.",
    level: 'Intermediate',
    tags: ['light', 'refraction', 'snell', "snell's law", 'refractive index', 'glass slab', 'lateral shift', 'class 10'],
    thumbnail: '/assets/img/thumbs/refraction-glass-slab.svg',
    link: '/physics/refraction-glass-slab/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-02',
    prerequisites: ['ray-optics']
  },
  {
    id: 'lens-images',
    subject: 'physics',
    branch: 'optics',
    title: 'Convex and Concave Lenses: Ray Diagrams',
    description:
      'Drag an object in front of a convex or concave lens and watch the standard rays find the image. Check 1/v − 1/u = 1/f, the magnification and the power in dioptres.',
    level: 'Intermediate',
    tags: ['light', 'lens', 'convex lens', 'concave lens', 'refraction', 'ray diagram', 'lens formula', 'magnification', 'power of a lens', 'dioptre', 'class 10'],
    thumbnail: '/assets/img/thumbs/lens-images.svg',
    link: '/physics/lens-images/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-02',
    prerequisites: ['refraction-glass-slab']
  },
  {
    id: 'eye-accommodation',
    subject: 'physics',
    branch: 'optics',
    title: 'Human Eye: Power of Accommodation',
    description:
      'Bring an object closer to a model eye and watch the ciliary muscles thicken the lens to keep the image on the retina, until the near point.',
    level: 'Intermediate',
    tags: ['human eye', 'eye', 'accommodation', 'ciliary muscles', 'near point', 'far point', 'retina', 'presbyopia', 'class 10'],
    thumbnail: '/assets/img/thumbs/eye-accommodation.svg',
    link: '/physics/eye-accommodation/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-02',
    prerequisites: ['lens-images']
  },
  {
    id: 'eye-defects',
    subject: 'physics',
    branch: 'optics',
    title: 'Myopia and Hypermetropia: Correcting Vision',
    description:
      'See why a short-sighted eye blurs the blackboard and a long-sighted eye blurs a book, then add concave or convex glasses and find their power.',
    level: 'Intermediate',
    tags: ['human eye', 'myopia', 'hypermetropia', 'short sight', 'long sight', 'spectacles', 'defects of vision', 'corrective lens', 'dioptre', 'class 10'],
    thumbnail: '/assets/img/thumbs/eye-defects.svg',
    link: '/physics/eye-defects/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-02',
    prerequisites: ['eye-accommodation']
  },
  {
    id: 'prism-dispersion',
    subject: 'physics',
    branch: 'optics',
    title: 'Dispersion by a Prism and the Blue Sky',
    description:
      'Split white light into VIBGYOR with a glass prism, recombine it with a second prism, and see how scattering makes the sky blue and sunsets red.',
    level: 'Intermediate',
    tags: ['light', 'dispersion', 'prism', 'spectrum', 'vibgyor', 'rainbow', 'scattering', 'blue sky', 'sunset', 'tyndall effect', 'class 10'],
    thumbnail: '/assets/img/thumbs/prism-dispersion.svg',
    link: '/physics/prism-dispersion/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-02',
    prerequisites: ['refraction-glass-slab']
  },
  {
    id: 'ohms-law',
    subject: 'physics',
    branch: 'electricity',
    title: "Ohm's Law and Resistivity",
    description:
      'Record voltmeter and ammeter readings for nichrome, constantan and manganin wires, plot the V–I graph and find R. See how length and thickness change resistance, and why a bulb is not Ohmic.',
    level: 'Intermediate',
    tags: ['ohms law', 'resistance', 'resistivity', 'v-i graph', 'ammeter', 'voltmeter', 'nichrome', 'current', 'potential difference', 'class 10'],
    thumbnail: '/assets/img/thumbs/ohms-law.svg',
    link: '/physics/ohms-law/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-03',
    prerequisites: ['electric-circuit']
  },
  {
    id: 'ac-phasors',
    subject: 'physics',
    branch: 'electricity',
    title: 'AC Voltage and Phasors',
    description:
      'A rotating arrow (phasor) draws the sine wave of the 230 V, 50 Hz mains in slow motion. See why the peak is 325 V, what rms means, and how the current keeps step with a resistor but lags behind in an inductor and runs ahead in a capacitor.',
    level: 'Advanced',
    tags: ['alternating current', 'ac', 'phasor', 'rms', 'peak voltage', 'mains', '50 hz', 'reactance', 'inductor', 'capacitor', 'phase difference', 'class 12'],
    thumbnail: '/assets/img/thumbs/ac-phasors.svg',
    link: '/physics/ac-phasors/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-18',
    prerequisites: ['ohms-law', 'motor-generator']
  },  {
    id: 'lcr-resonance',
    subject: 'physics',
    branch: 'electricity',
    title: 'Series LCR Circuit and Resonance',
    description:
      'Sweep the frequency of a resistor, coil and capacitor in series and watch the current peak where XL = XC, at f₀ = 1/(2π√LC). See the phasors, the Q factor and bandwidth, and why the coil can get far more than the supply voltage. Then turn a tuning capacitor to pick one FM station out of five.',
    level: 'Advanced',
    tags: ['lcr circuit', 'resonance', 'resonant frequency', 'impedance', 'reactance', 'q factor', 'bandwidth', 'phasor', 'radio tuning', 'fm', 'alternating current', 'class 12'],
    thumbnail: '/assets/img/thumbs/lcr-resonance.svg',
    link: '/physics/lcr-resonance/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-19',
    prerequisites: ['ac-phasors']
  },
  {
    id: 'lc-oscillations',
    subject: 'physics',
    branch: 'electricity',
    title: 'LC Oscillations',
    description:
      'Close the switch and a charged capacitor and a coil pass energy back and forth: electric field, then magnetic field, then electric again. Charges, field lines, energy bars and a swinging pendulum twin show f = 1/(2π√LC), and resistance damps the swing.',
    level: 'Advanced',
    tags: ['lc circuit', 'lc oscillations', 'tank circuit', 'natural frequency', 'electric energy', 'magnetic energy', 'energy conservation', 'damping', 'pendulum analogy', 'inductor', 'capacitor', 'class 12'],
    thumbnail: '/assets/img/thumbs/lc-oscillations.svg',
    link: '/physics/lc-oscillations/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-19',
    prerequisites: ['ac-phasors', 'lcr-resonance']
  },

  {
    id: 'series-parallel',
    subject: 'physics',
    branch: 'electricity',
    title: 'Resistors in Series and Parallel',
    description:
      'Join two or three resistors in series or in parallel. Watch the current split or stay the same, see the voltage shared, and check R = R₁ + R₂ + R₃ and 1/R = 1/R₁ + 1/R₂ + 1/R₃.',
    level: 'Intermediate',
    tags: ['series', 'parallel', 'resistors', 'equivalent resistance', 'current', 'voltage', 'circuit', 'class 10'],
    thumbnail: '/assets/img/thumbs/series-parallel.svg',
    link: '/physics/series-parallel/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-03',
    prerequisites: ['ohms-law']
  },
  {
    id: 'power-bill',
    subject: 'physics',
    branch: 'electricity',
    title: 'Electric Power and the Electricity Bill',
    description:
      'Set how long your fans, fridge, AC and geyser run each day, watch the meter count units for a month and work out the bill in rupees with P = VI and E = P × t.',
    level: 'Beginner',
    tags: ['electric power', 'energy', 'kilowatt hour', 'unit', 'electricity bill', 'heating effect', 'joule', 'watt', 'class 10'],
    thumbnail: '/assets/img/thumbs/power-bill.svg',
    link: '/physics/power-bill/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-03',
    prerequisites: ['ohms-law', 'heating-fuse']
  },
  {
    id: 'magnetic-field-lines',
    subject: 'physics',
    branch: 'electricity',
    title: 'Magnetic Field Lines: Magnets and a Wire',
    description:
      'See field lines round a bar magnet, two magnets that attract or repel, and a straight wire carrying current. Sprinkle iron filings, drag a compass and test the right-hand thumb rule.',
    level: 'Intermediate',
    tags: ['magnetic field', 'field lines', 'bar magnet', 'compass', 'iron filings', 'right hand thumb rule', 'oersted', 'current', 'class 10'],
    thumbnail: '/assets/img/thumbs/magnetic-field-lines.svg',
    link: '/physics/magnetic-field-lines/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-03',
    prerequisites: ['electromagnet']
  },
  {
    id: 'solenoid-field',
    subject: 'physics',
    branch: 'electricity',
    title: 'Magnetic Field of a Loop and a Solenoid',
    description:
      "See the magnetic field of a current-carrying circular loop and a solenoid in a cut-away view. Change the turns, current and size, find the N and S ends and measure the field with a compass.",
    level: 'Intermediate',
    tags: ['solenoid', 'circular loop', 'magnetic field', 'right hand thumb rule', 'clock rule', 'electromagnet', 'field lines', 'class 10'],
    thumbnail: '/assets/img/thumbs/solenoid-field.svg',
    link: '/physics/solenoid-field/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-03',
    prerequisites: ['magnetic-field-lines']
  },
  {
    id: 'motor-generator',
    subject: 'physics',
    branch: 'electricity',
    title: 'Electric Motor and Generator',
    description:
      "Watch a coil turn between magnets as a DC motor, then turn it yourself as an AC or DC generator. See the split ring and slip rings at work and test Fleming's left- and right-hand rules.",
    level: 'Intermediate',
    tags: ['electric motor', 'generator', 'dynamo', 'electromagnetic induction', 'fleming', 'commutator', 'split ring', 'slip rings', 'ac', 'dc', 'class 10'],
    thumbnail: '/assets/img/thumbs/motor-generator.svg',
    link: '/physics/motor-generator/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-03',
    prerequisites: ['solenoid-field']
  },
  {
    id: 'bernoulli-principle',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Bernoulli\'s Principle',
    description:
      'Water speeds up in a narrow pipe and the pressure tubes above it drop. Faster air over an aeroplane wing gives lift, and a fast train pulls air, paper and people towards it on the platform.',
    level: 'Intermediate',
    tags: ['fluids', 'Bernoulli', 'Venturi meter', 'continuity', 'pressure', 'lift', 'aerofoil', 'train', 'class 11'],
    thumbnail: '/assets/img/thumbs/bernoulli-principle.svg',
    link: '/physics/bernoulli-principle/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-17',
    prerequisites: ['liquid-pressure']
  },
  {
    id: 'viscosity-terminal-velocity',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Viscosity & Terminal Velocity',
    description:
      'Drop steel, glass or plastic balls into glycerine, honey, castor oil or water and watch them reach a steady terminal speed. Test Stokes\' law and v ∝ r², warm the liquid, and see why raindrops fall slowly while cloud droplets float.',
    level: 'Intermediate',
    tags: ['fluids', 'viscosity', 'Stokes law', 'terminal velocity', 'Reynolds number', 'raindrops', 'class 11'],
    thumbnail: '/assets/img/thumbs/viscosity-terminal-velocity.svg',
    link: '/physics/viscosity-terminal-velocity/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-17',
    prerequisites: ['bernoulli-principle', 'buoyancy-archimedes']
  },
  {
    id: 'surface-tension-capillary',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Surface Tension & Capillarity',
    description:
      'Water climbs thin glass tubes while mercury dips below the outside level. A steel needle floats in a dent of the water surface until a drop of soap is added, and a small soap bubble empties into a big one.',
    level: 'Intermediate',
    tags: ['fluids', 'surface tension', 'capillarity', 'meniscus', 'contact angle', 'soap bubble', 'excess pressure', 'class 11'],
    thumbnail: '/assets/img/thumbs/surface-tension-capillary.svg',
    link: '/physics/surface-tension-capillary/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-17',
    prerequisites: ['viscosity-terminal-velocity']
  },
  {
    id: 'spring-mass',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Spring–Mass Oscillator',
    description: "Pull a block on a spring and let it go. Explore Hooke's law, simple harmonic motion, T = 2π√(m/k) and the swap between kinetic and spring energy, with optional damping.",
    level: 'Intermediate',
    tags: ['hooke', 'spring', 'oscillation', 'simple harmonic motion', 'shm', 'period', 'energy', 'damping', 'class 11'],
    thumbnail: '/assets/img/thumbs/spring-mass.svg',
    link: '/physics/spring-mass/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-03',
    prerequisites: ['pendulum']
  },
  {
    id: 'shm-circular',
    subject: 'physics',
    branch: 'mechanics',
    title: 'SHM and Uniform Circular Motion',
    description:
      "Watch the shadow of a point going round a circle move back and forth in simple harmonic motion. Link the amplitude, period and phase to the circle, and compare x, v and a.",
    level: 'Advanced',
    tags: ['shm', 'simple harmonic motion', 'circular motion', 'phase', 'angular frequency', 'oscillation', 'reference circle', 'class 11'],
    thumbnail: '/assets/img/thumbs/shm-circular.svg',
    link: '/physics/shm-circular/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-03',
    prerequisites: ['spring-mass', 'circular-motion']
  },
  {
    id: 'resonance',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Forced Oscillations and Resonance',
    description: 'Shake the top of a spring with a motor and find the frequency where the block swings hugely. Plot the resonance curve and see how damping shapes the peak.',
    level: 'Advanced',
    tags: ['resonance', 'forced oscillation', 'natural frequency', 'damping', 'driving frequency', 'shm', 'spring', 'class 11'],
    thumbnail: '/assets/img/thumbs/resonance.svg',
    link: '/physics/resonance/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-04',
    prerequisites: ['spring-mass']
  },
  {
    id: 'planetary-orbits',
    subject: 'physics',
    branch: 'mechanics',
    title: "Planetary Orbits and Kepler's Laws",
    description: "Launch a planet around a star and see Kepler's three laws: elliptical orbits, equal areas in equal times, and T² ∝ a³. Try Earth, Mars, Mercury and Halley's comet.",
    level: 'Advanced',
    tags: ['gravity', 'orbit', 'kepler', 'planets', 'newton', 'space', 'ellipse', 'equal areas', 'comet', 'class 11'],
    thumbnail: '/assets/img/thumbs/planetary-orbits.svg',
    link: '/physics/planetary-orbits/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-04',
    prerequisites: ['universal-gravitation', 'circular-motion']
  },
  {
    id: 'escape-velocity',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Escape Velocity Launcher',
    description: 'Fire a probe straight up from Earth, the Moon, Mars or Jupiter. Below the escape speed it falls back; at √(2gR) it never returns. Watch kinetic, potential and total energy.',
    level: 'Intermediate',
    tags: ['escape velocity', 'escape speed', 'gravitational potential energy', 'rocket', 'gravity', 'moon', 'mars', 'jupiter', 'class 11'],
    thumbnail: '/assets/img/thumbs/escape-velocity.svg',
    link: '/physics/escape-velocity/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-04',
    prerequisites: ['free-fall-planets', 'universal-gravitation']
  },
  {
    id: 'satellite-orbits',
    subject: 'physics',
    branch: 'mechanics',
    title: 'Satellites and Geostationary Orbit',
    description: 'Put a satellite in orbit around the turning Earth. See how speed and period change with height, and find the geostationary height where it stays above India.',
    level: 'Intermediate',
    tags: ['satellite', 'orbit', 'geostationary', 'orbital speed', 'isro', 'iss', 'gps', 'kepler', 'gravity', 'class 11'],
    thumbnail: '/assets/img/thumbs/satellite-orbits.svg',
    link: '/physics/satellite-orbits/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-04',
    prerequisites: ['planetary-orbits', 'circular-motion']
  },

  /* ---- Placeholders: planned simulations (coming soon) ---------------- */
  {
    id: 'wave-types',
    subject: 'physics',
    branch: 'waves',
    title: 'Transverse and Longitudinal Waves',
    description: 'Watch one vibrator send a transverse wave along a string and a longitudinal wave along a slinky. See crests, troughs, compressions and rarefactions, and check that v = fλ.',
    level: 'Intermediate',
    tags: ['waves', 'transverse', 'longitudinal', 'wavelength', 'frequency', 'wave speed', 'compression', 'rarefaction', 'class 11'],
    thumbnail: '/assets/img/thumbs/wave-types.svg',
    link: '/physics/wave-types/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-05',
    prerequisites: ['vibration']
  },
  {
    id: 'standing-waves',
    subject: 'physics',
    branch: 'waves',
    title: 'Standing Waves on a String',
    description: 'Shake a stretched string with a vibrator and find the frequencies where it swings in 1, 2, 3 or more loops. See nodes, antinodes and the laws of a vibrating string.',
    level: 'Advanced',
    tags: ['waves', 'standing waves', 'harmonics', 'nodes', 'antinodes', 'string', 'sonometer', 'melde', 'resonance', 'class 11'],
    thumbnail: '/assets/img/thumbs/standing-waves.svg',
    link: '/physics/standing-waves/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-05',
    prerequisites: ['wave-types', 'guitar-string']
  },
  {
    id: 'beats',
    subject: 'physics',
    branch: 'waves',
    title: 'Beats',
    description: 'Sound two tuning forks of nearly the same frequency and hear the loudness swell and fade. Count the beats, see why they happen and use them to tune an instrument.',
    level: 'Intermediate',
    tags: ['waves', 'beats', 'superposition', 'tuning fork', 'sound', 'frequency', 'class 11'],
    thumbnail: '/assets/img/thumbs/beats.svg',
    link: '/physics/beats/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-05',
    prerequisites: ['wave-types', 'frequency-pitch']
  },
  {
    id: 'doppler-effect',
    subject: 'physics',
    branch: 'waves',
    title: 'Doppler Effect',
    description: 'Hear the pitch of a siren rise and fall as a vehicle drives past you. See the sound waves bunch up in front of it and spread out behind, and check the Doppler formula.',
    level: 'Advanced',
    tags: ['waves', 'doppler effect', 'sound', 'frequency', 'siren', 'radar', 'shock wave', 'class 11'],
    thumbnail: '/assets/img/thumbs/doppler-effect.svg',
    link: '/physics/doppler-effect/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-05',
    prerequisites: ['wave-types', 'frequency-pitch']
  },
  {
    id: 'wave-interference',
    subject: 'physics',
    branch: 'waves',
    title: 'Wave Interference: Two Sources in a Ripple Tank',
    description:
      'Two dippers make circular ripples in a tank. Watch bright and calm bands form where the waves add and cancel, move a probe to measure the path difference, and see the pattern on a screen.',
    level: 'Intermediate',
    tags: ['waves', 'interference', 'superposition', 'wavelength', 'ripple tank', 'path difference', 'coherent sources', 'wave optics', 'class 11', 'class 12'],
    thumbnail: '/assets/img/thumbs/wave-interference.svg',
    link: '/physics/wave-interference/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-06',
    prerequisites: ['wave-types']
  },
  {
    id: 'coulombs-law',
    subject: 'physics',
    branch: 'electricity',
    title: "Coulomb's Law: Force Between Charges",
    description:
      "Change two charges, the distance between them and the medium, and see the equal and opposite forces with an inverse-square graph. Add a third charge to add forces as vectors.",
    level: 'Intermediate',
    tags: ['coulomb', 'charge', 'electrostatic force', 'inverse square', 'dielectric constant', 'superposition', 'vectors', 'class 12'],
    thumbnail: '/assets/img/thumbs/coulombs-law.svg',
    link: '/physics/coulombs-law/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-06',
    prerequisites: ['charging-by-rubbing', 'universal-gravitation']
  },
  {
    id: 'electric-fields',
    subject: 'physics',
    branch: 'electricity',
    title: 'Electric Fields: Field Lines and Equipotentials',
    description: 'Drag positive and negative charges and watch their electric field lines and equipotential lines change. Add charges, read E and V at a test point and see superposition at work.',
    level: 'Advanced',
    tags: ['charge', 'coulomb', 'field lines', 'potential', 'equipotential', 'electrostatics', 'superposition', 'class 12'],
    thumbnail: '/assets/img/thumbs/electric-fields.svg',
    link: '/physics/electric-fields/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-06',
    prerequisites: ['coulombs-law']
  },
  {
    id: 'electric-dipole',
    subject: 'physics',
    branch: 'electricity',
    title: 'Electric Dipole in a Uniform Field',
    description:
      'A dipole on a pivot swings in a uniform electric field. See the two equal and opposite forces, the torque p × E, the potential energy and the stable and unstable positions.',
    level: 'Advanced',
    tags: ['dipole', 'dipole moment', 'torque', 'uniform field', 'potential energy', 'electrostatics', 'class 12'],
    thumbnail: '/assets/img/thumbs/electric-dipole.svg',
    link: '/physics/electric-dipole/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-06',
    prerequisites: ['electric-fields']
  },
  {
    id: 'youngs-double-slit',
    subject: 'physics',
    branch: 'optics',
    title: "Young's Double-Slit Experiment: Interference Fringes",
    description:
      'Light from two narrow slits overlaps on a screen and makes bright and dark fringes. Change the colour, slit gap and screen distance, measure the fringe width β = λD/d, try white light and cover one slit.',
    level: 'Advanced',
    tags: ['interference', 'young', 'double slit', 'fringe width', 'coherent sources', 'path difference', 'wave optics', 'light', 'class 12'],
    thumbnail: '/assets/img/thumbs/youngs-double-slit.svg',
    link: '/physics/youngs-double-slit/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-07',
    prerequisites: ['wave-interference']
  },
  {
    id: 'single-slit-diffraction',
    subject: 'physics',
    branch: 'optics',
    title: 'Single-Slit Diffraction: Light Spreading Through a Slit',
    description:
      'Light through one narrow slit spreads out into a wide central bright band with faint bands beside it. Change the slit width, colour and screen distance, find the dark bands at a sin θ = nλ and compare with two slits.',
    level: 'Advanced',
    tags: ['diffraction', 'single slit', 'central maximum', 'huygens', 'wave optics', 'light', 'class 12'],
    thumbnail: '/assets/img/thumbs/single-slit-diffraction.svg',
    link: '/physics/single-slit-diffraction/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-07',
    prerequisites: ['youngs-double-slit']
  },
  {
    id: 'total-internal-reflection',
    subject: 'physics',
    branch: 'optics',
    title: 'Total Internal Reflection: Critical Angle, Fibres, Diamonds and Mirages',
    description:
      'Shine a laser through a glass block past the critical angle, trap light in a bent optical fibre, see why a diamond sparkles more than glass, and bend light over a hot road into a mirage.',
    level: 'Intermediate',
    tags: ['total internal reflection', 'critical angle', 'optical fibre', 'diamond', 'mirage', 'refraction', 'snells law', 'class 12'],
    thumbnail: '/assets/img/thumbs/total-internal-reflection.svg',
    link: '/physics/total-internal-reflection/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['refraction-glass-slab']
  },
  {
    id: 'lens-maker',
    subject: 'physics',
    branch: 'optics',
    title: "Refraction at Curved Surfaces and the Lens Maker's Formula",
    description:
      "Trace real rays through one curved glass surface or a lens. Change the radius, refractive index and surrounding liquid, check the lens maker's formula and see spherical aberration.",
    level: 'Advanced',
    tags: ['lens makers formula', 'spherical surface', 'refraction', 'focal length', 'power of a lens', 'spherical aberration', 'class 12'],
    thumbnail: '/assets/img/thumbs/lens-maker.svg',
    link: '/physics/lens-maker/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['lens-images']
  },
  {
    id: 'optical-instruments',
    subject: 'physics',
    branch: 'optics',
    title: 'Compound Microscope and Astronomical Telescope',
    description:
      'Ray diagrams of a compound microscope and an astronomical telescope. Change the focal lengths and see the first image, the final image, the magnifying power and what your eye sees.',
    level: 'Advanced',
    tags: ['compound microscope', 'telescope', 'magnifying power', 'objective', 'eyepiece', 'optical instruments', 'class 12'],
    thumbnail: '/assets/img/thumbs/optical-instruments.svg',
    link: '/physics/optical-instruments/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['lens-maker']
  },
  {
    id: 'natural-indicators',
    subject: 'chemistry',
    branch: 'acids-bases',
    title: 'Natural Indicators: Litmus, Turmeric and China Rose',
    description:
      'Test lemon juice, vinegar, soap water, baking soda and more with litmus paper, turmeric paper and china rose solution. Watch the colours change and work out which solutions are acidic, basic or neutral.',
    level: 'Beginner',
    tags: ['acids', 'bases', 'indicator', 'litmus', 'turmeric', 'china rose', 'hibiscus', 'neutral', 'class 7'],
    thumbnail: '/assets/img/thumbs/natural-indicators.svg',
    link: '/chemistry/natural-indicators/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-07',
    prerequisites: []
  },
  {
    id: 'neutralisation',
    subject: 'chemistry',
    branch: 'acids-bases',
    title: 'Neutralisation: Acid Meets Base',
    description:
      'Add sodium hydroxide drop by drop to hydrochloric acid with phenolphthalein, china rose or turmeric. Watch the colour change at neutralisation, the flask warming up, the salt forming and the pH jumping.',
    level: 'Beginner',
    tags: ['neutralisation', 'neutralization', 'acid', 'base', 'salt', 'phenolphthalein', 'titration', 'burette', 'ph', 'class 7', 'class 10'],
    thumbnail: '/assets/img/thumbs/neutralisation.svg',
    link: '/chemistry/neutralisation/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-07',
    prerequisites: ['natural-indicators']
  },
  {
    id: 'ph-scale',
    subject: 'chemistry',
    branch: 'acids-bases',
    title: 'The pH Scale: How Acidic, How Basic?',
    description:
      'Test stomach acid, lemon juice, vinegar, milk, water, baking soda, soap and lime water with universal indicator. Read their pH from 0 to 14, compare H⁺ ions with pure water and see how adding water moves the pH towards 7.',
    level: 'Beginner',
    tags: ['ph', 'universal indicator', 'acid', 'base', 'neutral', 'strong acid', 'weak acid', 'dilution', 'hydrogen ions', 'class 7', 'class 10'],
    thumbnail: '/assets/img/thumbs/ph-scale.svg',
    link: '/chemistry/ph-scale/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-08',
    prerequisites: ['natural-indicators']
  },
  {
    id: 'balancing-equations',
    subject: 'chemistry',
    branch: 'reactions',
    title: 'Balancing Chemical Equations',
    description:
      'Balance chemical equations by counting atoms: change the number of each molecule, watch coloured atom pictures and a left-versus-right tally, from 2H₂ + O₂ → 2H₂O to burning LPG and photosynthesis.',
    level: 'Intermediate',
    tags: ['chemical equation', 'balancing', 'atoms', 'conservation of mass', 'coefficients', 'reactants', 'products', 'combustion', 'class 9', 'class 10'],
    thumbnail: '/assets/img/thumbs/balancing-equations.svg',
    link: '/chemistry/balancing-equations/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-12',
    prerequisites: []
  },
  {
    id: 'reaction-types',
    subject: 'chemistry',
    branch: 'reactions',
    title: 'Types of Chemical Reactions',
    description:
      'Watch particles react: combination, decomposition with heat or sunlight, displacement of copper by iron and zinc, and a double displacement that forms a white precipitate.',
    level: 'Intermediate',
    tags: ['chemical reactions', 'combination', 'decomposition', 'displacement', 'double displacement', 'precipitate', 'reactivity series', 'exothermic', 'endothermic', 'particles', 'class 10'],
    thumbnail: '/assets/img/thumbs/reaction-types.svg',
    link: '/chemistry/reaction-types/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-12',
    prerequisites: ['balancing-equations']
  },
  {
    id: 'rusting',
    subject: 'chemistry',
    branch: 'reactions',
    title: 'Rusting of Iron',
    description:
      'Leave iron nails in five test tubes for two weeks: air and water, dry air, boiled water under oil, salt water, and a painted, greased or galvanised nail. See why rust needs both oxygen and water.',
    level: 'Beginner',
    tags: ['rusting', 'corrosion', 'oxidation', 'iron', 'galvanisation', 'paint', 'alloy', 'stainless steel', 'rancidity', 'chemical reactions', 'class 7', 'class 10'],
    thumbnail: '/assets/img/thumbs/rusting.svg',
    link: '/chemistry/rusting/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-13',
    prerequisites: ['reaction-types']
  },
  {
    id: 'fire-triangle',
    subject: 'chemistry',
    branch: 'reactions',
    title: 'The Fire Triangle: Fuel, Air and Heat',
    description:
      'Light paper, wood, kerosene or a gas stove and keep it burning only while fuel, oxygen and heat are all there. Put fires out with a lid, sand, water or a CO₂ extinguisher, and see why water is wrong for an oil or electrical fire.',
    level: 'Beginner',
    tags: ['combustion', 'fire', 'fire triangle', 'ignition temperature', 'fire extinguisher', 'inflammable', 'oxygen', 'class 8'],
    thumbnail: '/assets/img/thumbs/fire-triangle.svg',
    link: '/chemistry/fire-triangle/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['rusting']
  },
  {
    id: 'candle-flame',
    subject: 'chemistry',
    branch: 'reactions',
    title: 'Zones of a Candle Flame',
    description:
      'Look inside a candle flame: the dark zone of unburnt wax vapour, the yellow luminous zone and the hot blue outer zone. Probe it with a glass plate, a glass tube, a copper wire and a thermometer, or cover it with a jar.',
    level: 'Beginner',
    tags: ['combustion', 'candle', 'flame', 'luminous zone', 'non-luminous zone', 'wax', 'soot', 'class 8'],
    thumbnail: '/assets/img/thumbs/candle-flame.svg',
    link: '/chemistry/candle-flame/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['fire-triangle']
  },
  {
    id: 'fuel-calorific-value',
    subject: 'chemistry',
    branch: 'reactions',
    title: 'Fuels and Calorific Value',
    description:
      'Boil the same pot of water with cow dung cakes, wood, coal, kerosene, LPG, CNG, biogas or hydrogen. Compare how many grams each fuel needs, its calorific value, the stove’s efficiency and the smoke it makes.',
    level: 'Intermediate',
    tags: ['fuel', 'calorific value', 'combustion', 'lpg', 'cng', 'biogas', 'coal', 'pollution', 'ideal fuel', 'class 8'],
    thumbnail: '/assets/img/thumbs/fuel-calorific-value.svg',
    link: '/chemistry/fuel-calorific-value/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-15',
    prerequisites: ['fire-triangle']
  },
  {
    id: 'conservation-of-mass',
    subject: 'chemistry',
    branch: 'atoms',
    title: 'Conservation of Mass and Fixed Proportions',
    description:
      'Weigh a precipitate forming, baking soda fizzing in vinegar and magnesium burning, in open or closed containers. Then react hydrogen, magnesium or carbon with oxygen in any amounts: they always combine in the same mass ratio.',
    level: 'Beginner',
    tags: ['law of conservation of mass', 'law of constant proportions', 'chemical reaction', 'balance', 'lavoisier', 'dalton', 'atoms and molecules', 'class 9'],
    thumbnail: '/assets/img/thumbs/conservation-of-mass.svg',
    link: '/chemistry/conservation-of-mass/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-16',
    prerequisites: ['balancing-equations']
  },
  {
    id: 'valency-formula',
    subject: 'chemistry',
    branch: 'atoms',
    title: 'Writing Formulae from Valency',
    description:
      'Join positive and negative ion tiles until every valency hand is held, then check with the criss-cross method. Build Al₂O₃, Ca(OH)₂ and (NH₄)₂SO₄ and work out each formula unit mass.',
    level: 'Beginner',
    tags: ['valency', 'chemical formula', 'ions', 'polyatomic ions', 'criss-cross method', 'formula unit mass', 'molecular mass', 'atoms and molecules', 'class 9'],
    thumbnail: '/assets/img/thumbs/valency-formula.svg',
    link: '/chemistry/valency-formula/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-16',
    prerequisites: ['conservation-of-mass']
  },
  {
    id: 'mole-concept',
    subject: 'chemistry',
    branch: 'atoms',
    title: 'The Mole: Counting Atoms by Weighing',
    description:
      'Weigh carbon, water, salt, sugar and metals and turn grams into moles, particles and atoms. Compare one mole of each side by side and solve weighing challenges with 6.022 × 10²³.',
    level: 'Intermediate',
    tags: ['mole concept', 'avogadro number', 'avogadro constant', 'molar mass', 'number of particles', 'atoms and molecules', 'class 9', 'class 11'],
    thumbnail: '/assets/img/thumbs/mole-concept.svg',
    link: '/chemistry/mole-concept/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-16',
    prerequisites: ['valency-formula']
  },
  {
    id: 'states-of-matter',
    subject: 'chemistry',
    branch: 'matter',
    title: 'Solids, Liquids and Gases: The Particle Model',
    description:
      'Watch the particles of a solid, a liquid and a gas side by side. Change the jar\'s shape, push a piston to squeeze them, heat them up and add colour to see diffusion.',
    level: 'Beginner',
    tags: ['states of matter', 'solid', 'liquid', 'gas', 'particles', 'diffusion', 'compressibility', 'kinetic energy', 'class 9'],
    thumbnail: '/assets/img/thumbs/states-of-matter.svg',
    link: '/chemistry/states-of-matter/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-08',
    prerequisites: []
  },
  {
    id: 'evaporation-cooling',
    subject: 'chemistry',
    branch: 'matter',
    title: 'Evaporation and Cooling',
    description:
      'Watch water evaporate from a plate or a glass. Change the air temperature, humidity, fan speed and surface area, and see how evaporation cools the water below the air temperature.',
    level: 'Beginner',
    tags: ['evaporation', 'cooling', 'humidity', 'surface area', 'wind', 'latent heat', 'matka', 'sweating', 'class 9'],
    thumbnail: '/assets/img/thumbs/evaporation-cooling.svg',
    link: '/chemistry/evaporation-cooling/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-08',
    prerequisites: ['states-of-matter']
  },
  {
    id: 'heating-curve',
    subject: 'chemistry',
    branch: 'matter',
    title: 'Heating Curve of Water: Melting and Boiling',
    description:
      'Heat ice from −20 °C until all the water boils away. Plot the heating curve, watch the temperature stay flat while ice melts and water boils, see the particles in a zoom window, and boil water in Shimla or Leh.',
    level: 'Intermediate',
    tags: ['heating curve', 'melting point', 'boiling point', 'latent heat', 'change of state', 'specific heat', 'ice', 'steam', 'class 9'],
    thumbnail: '/assets/img/thumbs/heating-curve.svg',
    link: '/chemistry/heating-curve/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-08',
    prerequisites: ['states-of-matter']
  },
  {
    id: 'parallel-lines-angles',
    subject: 'mathematics',
    branch: 'geometry',
    title: 'Parallel Lines and a Transversal',
    description:
      'Two lines cut by a transversal make eight angles. Pick corresponding, alternate or co-interior angles and see when they are equal or add up to 180°, and how tilting one line breaks the rule.',
    level: 'Beginner',
    tags: ['angles', 'parallel lines', 'transversal', 'corresponding angles', 'alternate angles', 'co-interior angles', 'vertically opposite angles', 'linear pair', 'geometry', 'class 7', 'class 9'],
    thumbnail: '/assets/img/thumbs/parallel-lines-angles.svg',
    link: '/mathematics/parallel-lines-angles/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-09',
    prerequisites: []
  },
  {
    id: 'triangle-angle-sum',
    subject: 'mathematics',
    branch: 'geometry',
    title: 'Angle Sum of a Triangle',
    description:
      'Tear off the three corners of any triangle and line them up: they always make a straight angle of 180°. See why with a parallel line, and find the exterior angle property.',
    level: 'Beginner',
    tags: ['triangle', 'angle sum', '180 degrees', 'exterior angle', 'parallel lines', 'proof', 'geometry', 'class 7', 'class 9'],
    thumbnail: '/assets/img/thumbs/triangle-angle-sum.svg',
    link: '/mathematics/triangle-angle-sum/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-09',
    prerequisites: ['parallel-lines-angles']
  },
  {
    id: 'pythagoras-proof',
    subject: 'mathematics',
    branch: 'geometry',
    title: "Pythagoras' Theorem by Rearrangement",
    description:
      'Watch four copies of a right triangle slide around inside a big square: the empty space changes from c² into a² + b². Draw squares on the sides and see why the theorem needs a right angle.',
    level: 'Intermediate',
    tags: ['pythagoras', 'right triangle', 'hypotenuse', 'pythagorean triples', 'proof', 'area', 'squares', 'geometry', 'class 7', 'class 10'],
    thumbnail: '/assets/img/thumbs/pythagoras-proof.svg',
    link: '/mathematics/pythagoras-proof/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-09',
    prerequisites: ['triangle-angle-sum']
  },
  {
    id: 'trapezium-area',
    subject: 'mathematics',
    branch: 'mensuration',
    title: 'Area of a Trapezium',
    description:
      'Cut a trapezium, copy it and turn it round to make a parallelogram, then see why its area is ½ × (sum of parallel sides) × height. Split a general quadrilateral along a diagonal, and find the area of a trapezium-shaped field.',
    level: 'Beginner',
    tags: ['mensuration', 'area', 'trapezium', 'quadrilateral', 'parallelogram', 'diagonal', 'field', 'class 8'],
    thumbnail: '/assets/img/thumbs/trapezium-area.svg',
    link: '/mathematics/trapezium-area/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-18',
    prerequisites: ['pythagoras-proof']
  },
  {
    id: 'surface-area-nets',
    subject: 'mathematics',
    branch: 'mensuration',
    title: 'Surface Area from Nets',
    description:
      'Unfold a cuboid or a cylinder into its flat net and watch the faces add up to the total surface area. Work out how much paint a room needs (walls and ceiling, minus doors and windows) or how much sheet makes a water tank.',
    level: 'Beginner',
    tags: ['mensuration', 'surface area', 'net', 'cuboid', 'cube', 'cylinder', 'lateral surface', 'paint', 'class 8'],
    thumbnail: '/assets/img/thumbs/surface-area-nets.svg',
    link: '/mathematics/surface-area-nets/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-18',
    prerequisites: ['trapezium-area']
  },
  {
    id: 'volume-capacity',
    subject: 'mathematics',
    branch: 'mensuration',
    title: 'Volume & Capacity',
    description:
      'Fill a cuboid or a cylinder with 1 cm cubes or with water and count the volume layer by layer. See that 1000 cm³ makes 1 litre and 1 m³ makes 1000 L, and find how long a rooftop water tank lasts a family.',
    level: 'Beginner',
    tags: ['mensuration', 'volume', 'capacity', 'litre', 'cuboid', 'cylinder', 'cubic centimetre', 'water tank', 'class 8'],
    thumbnail: '/assets/img/thumbs/volume-capacity.svg',
    link: '/mathematics/volume-capacity/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-18',
    prerequisites: ['surface-area-nets']
  },
  {
    id: 'trig-ratios',
    subject: 'mathematics',
    branch: 'trigonometry',
    title: 'Trigonometric Ratios',
    description:
      'Resize a right triangle and watch sin, cos and tan stay the same for the same angle. See the opposite, adjacent and hypotenuse, all six ratios, exact values for 30°, 45° and 60° and complementary angles.',
    level: 'Intermediate',
    tags: ['trigonometry', 'sine', 'cosine', 'tangent', 'right triangle', 'hypotenuse', 'similar triangles', 'complementary angles', 'standard angles', 'class 10'],
    thumbnail: '/assets/img/thumbs/trig-ratios.svg',
    link: '/mathematics/trig-ratios/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-13',
    prerequisites: ['pythagoras-proof']
  },
  {
    id: 'unit-circle-graphs',
    subject: 'mathematics',
    branch: 'trigonometry',
    title: 'Unit Circle and Trig Graphs',
    description:
      'Send a point round a circle of radius 1 and watch its height trace the sine wave. Compare sin and cos, see why tan is not defined at 90°, and check sin² + cos² = 1.',
    level: 'Intermediate',
    tags: ['trigonometry', 'unit circle', 'sine wave', 'cosine', 'tangent', 'graphs', 'quadrants', 'identity', 'class 10', 'class 11'],
    thumbnail: '/assets/img/thumbs/unit-circle-graphs.svg',
    link: '/mathematics/unit-circle-graphs/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-13',
    prerequisites: ['trig-ratios']
  },
  {
    id: 'heights-distances',
    subject: 'mathematics',
    branch: 'trigonometry',
    title: 'Heights and Distances',
    description:
      'Find the height of the Qutub Minar, a coconut tree and the Charminar from angles of elevation, and how far a boat is from a lighthouse from the angle of depression.',
    level: 'Intermediate',
    tags: ['trigonometry', 'heights and distances', 'angle of elevation', 'angle of depression', 'clinometer', 'tan', 'Qutub Minar', 'line of sight', 'class 10'],
    thumbnail: '/assets/img/thumbs/heights-distances.svg',
    link: '/mathematics/heights-distances/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-13',
    prerequisites: ['trig-ratios']
  },
  {
    id: 'distance-formula',
    subject: 'mathematics',
    branch: 'coordinate-geometry',
    title: 'Distance Formula',
    description:
      'Drag points on a grid and see the distance between them as the long side of a right triangle. Then test three points (right-angled, isosceles or on one line) and four points (square, rectangle, rhombus or parallelogram).',
    level: 'Intermediate',
    tags: ['coordinate geometry', 'distance formula', 'Pythagoras', 'cartesian plane', 'collinear', 'square', 'rhombus', 'parallelogram', 'class 10'],
    thumbnail: '/assets/img/thumbs/distance-formula.svg',
    link: '/mathematics/distance-formula/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-17',
    prerequisites: ['pythagoras-proof']
  },
  {
    id: 'section-formula',
    subject: 'mathematics',
    branch: 'coordinate-geometry',
    title: 'Section Formula',
    description:
      'Find the point that divides a segment in the ratio m : n, and watch the same split appear on both axes. Midpoint, points of trisection and the centroid of a triangle, with exact fractions.',
    level: 'Intermediate',
    tags: ['coordinate geometry', 'section formula', 'ratio', 'midpoint', 'trisection', 'centroid', 'median', 'class 10'],
    thumbnail: '/assets/img/thumbs/section-formula.svg',
    link: '/mathematics/section-formula/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-17',
    prerequisites: ['distance-formula']
  },
  {
    id: 'triangle-area-coordinates',
    subject: 'mathematics',
    branch: 'coordinate-geometry',
    title: 'Area of a Triangle from Coordinates',
    description:
      'Drag the corners of a triangle and get its area from the coordinates. See why the formula works (a box minus right triangles, or trapezia), why area 0 means collinear points, and split a quadrilateral in two.',
    level: 'Intermediate',
    tags: ['coordinate geometry', 'area of triangle', 'shoelace', 'collinear', 'trapezium', 'quadrilateral', 'class 10'],
    thumbnail: '/assets/img/thumbs/triangle-area-coordinates.svg',
    link: '/mathematics/triangle-area-coordinates/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-17',
    prerequisites: ['distance-formula']
  },  {
    id: 'linear-equations-graph',
    subject: 'mathematics',
    branch: 'functions',
    title: 'Pair of Linear Equations: Graphs',
    description:
      'Draw two lines a₁x + b₁y = c₁ and a₂x + b₂y = c₂ and see whether they cross at one point, run parallel or lie on top of each other. The ratio test a₁/a₂, b₁/b₂, c₁/c₂ tells you without drawing, and a test point shows what a solution means.',
    level: 'Intermediate',
    tags: ['linear equations', 'pair of linear equations', 'two variables', 'graphical method', 'consistent', 'inconsistent', 'dependent', 'parallel lines', 'intersection', 'class 10'],
    thumbnail: '/assets/img/thumbs/linear-equations-graph.svg',
    link: '/mathematics/linear-equations-graph/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-19',
    prerequisites: ['distance-formula']
  },
  {
    id: 'linear-word-problems',
    subject: 'mathematics',
    branch: 'functions',
    title: 'Linear Equations in Daily Life',
    description:
      'Turn word problems into a pair of linear equations and solve them by graph: notebooks and pens, a mother and son\'s ages, a boat on the Ganga, an auto fare and a garden fence. Drag a guess until it fits both, and meet a bill that cannot be right.',
    level: 'Intermediate',
    tags: ['linear equations', 'word problems', 'graphical method', 'table of values', 'ages', 'upstream downstream', 'prices', 'class 10'],
    thumbnail: '/assets/img/thumbs/linear-word-problems.svg',
    link: '/mathematics/linear-word-problems/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-19',
    prerequisites: ['linear-equations-graph']
  },

  {
    id: 'histogram-polygon',
    subject: 'mathematics',
    branch: 'probability',
    title: 'Histogram and Frequency Polygon',
    description:
      'Group test marks, heights or temperatures into classes and draw a histogram and a frequency polygon. Change the class width, read the tally table and see why unequal classes need adjusted heights.',
    level: 'Beginner',
    tags: ['statistics', 'histogram', 'frequency polygon', 'class interval', 'class mark', 'frequency distribution', 'tally', 'grouped data', 'class 9'],
    thumbnail: '/assets/img/thumbs/histogram-polygon.svg',
    link: '/mathematics/histogram-polygon/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-11',
    prerequisites: []
  },
  {
    id: 'mean-median-mode',
    subject: 'mathematics',
    branch: 'probability',
    title: 'Mean, Median and Mode',
    description:
      'Drag dots on a number line and watch the mean, median and mode change. The line balances at the mean, the middle of the sorted list is the median, and an outlier shows which average to trust.',
    level: 'Beginner',
    tags: ['statistics', 'mean', 'median', 'mode', 'average', 'range', 'outlier', 'central tendency', 'dot plot', 'class 7', 'class 9', 'class 10'],
    thumbnail: '/assets/img/thumbs/mean-median-mode.svg',
    link: '/mathematics/mean-median-mode/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-11',
    prerequisites: ['histogram-polygon']
  },
  {
    id: 'coin-dice-probability',
    subject: 'mathematics',
    branch: 'probability',
    title: 'Coins and Dice: Experimental Probability',
    description:
      'Toss coins and throw dice ten, a hundred or a thousand times. Watch the experimental probability wobble and then settle close to the theoretical value, for one coin, one die, two coins and two dice.',
    level: 'Beginner',
    tags: ['probability', 'experimental probability', 'theoretical probability', 'coin', 'dice', 'random', 'law of large numbers', 'statistics', 'class 9', 'class 10'],
    thumbnail: '/assets/img/thumbs/coin-dice-probability.svg',
    link: '/mathematics/coin-dice-probability/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-11',
    prerequisites: ['mean-median-mode']
  },
  {
    id: 'drift-velocity',
    subject: 'physics',
    branch: 'electricity',
    title: 'Drift Velocity of Electrons',
    description:
      'See free electrons dart about inside a copper wire and drift slowly against the field. Change the current, wire thickness, metal and temperature, and find the real drift speed: a fraction of a millimetre per second.',
    level: 'Advanced',
    tags: ['drift velocity', 'current', 'free electrons', 'current density', 'relaxation time', 'resistivity', 'mobility', 'class 12'],
    thumbnail: '/assets/img/thumbs/drift-velocity.svg',
    link: '/physics/drift-velocity/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-09',
    prerequisites: ['ohms-law']
  },
  {
    id: 'kirchhoffs-laws',
    subject: 'physics',
    branch: 'electricity',
    title: "Kirchhoff's Laws: Junctions and Loops",
    description:
      'Two cells and three resistors in a two-loop circuit. Find each branch current, then check the junction rule and walk round each loop to see the rises and drops add up to zero.',
    level: 'Advanced',
    tags: ['kirchhoff', 'junction rule', 'loop rule', 'network', 'current', 'emf', 'class 12'],
    thumbnail: '/assets/img/thumbs/kirchhoffs-laws.svg',
    link: '/physics/kirchhoffs-laws/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-10',
    prerequisites: ['series-parallel', 'ohms-law']
  },
  {
    id: 'wheatstone-bridge',
    subject: 'physics',
    branch: 'electricity',
    title: 'Wheatstone Bridge and Metre Bridge',
    description:
      'Balance a Wheatstone bridge until the galvanometer reads zero, then slide the jockey along a metre bridge wire to find the null point and measure an unknown coil.',
    level: 'Advanced',
    tags: ['wheatstone bridge', 'metre bridge', 'meter bridge', 'galvanometer', 'null point', 'resistance', 'practical', 'class 12'],
    thumbnail: '/assets/img/thumbs/wheatstone-bridge.svg',
    link: '/physics/wheatstone-bridge/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-10',
    prerequisites: ['kirchhoffs-laws']
  },
  {
    id: 'faradays-law',
    subject: 'physics',
    branch: 'electricity',
    title: "Faraday's Law of Induction",
    description:
      'Push a bar magnet into a coil and watch the meter kick. Change the speed, the number of turns and the magnet, move the coil instead, and see that the emf equals the rate of change of flux linkage.',
    level: 'Advanced',
    tags: ['electromagnetic induction', 'faraday', 'magnetic flux', 'flux linkage', 'induced emf', 'galvanometer', 'class 10', 'class 12'],
    thumbnail: '/assets/img/thumbs/faradays-law.svg',
    link: '/physics/faradays-law/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-16',
    prerequisites: ['motor-generator']
  },
  {
    id: 'lenz-law',
    subject: 'physics',
    branch: 'electricity',
    title: "Lenz's Law and Eddy Currents",
    description:
      'Race a magnet down a copper pipe against one in a plastic pipe, and swing a metal plate through a magnet. Change the metal, the wall thickness and the magnet, cut a slit, and see eddy currents oppose the motion.',
    level: 'Advanced',
    tags: ['lenz law', 'eddy currents', 'electromagnetic damping', 'magnetic braking', 'terminal velocity', 'electromagnetic induction', 'class 12'],
    thumbnail: '/assets/img/thumbs/lenz-law.svg',
    link: '/physics/lenz-law/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-16',
    prerequisites: ['faradays-law']
  },
  {
    id: 'transformer',
    subject: 'physics',
    branch: 'electricity',
    title: 'Transformers and Power Lines',
    description:
      'Wind a transformer: change the turns, the core and the supply, and see why it steps voltage up or down on AC but not on DC. Then send power to a town and find why grids use very high voltages.',
    level: 'Advanced',
    tags: ['transformer', 'mutual induction', 'self induction', 'step-up', 'step-down', 'turns ratio', 'power transmission', 'i2r loss', 'electromagnetic induction', 'class 10', 'class 12'],
    thumbnail: '/assets/img/thumbs/transformer.svg',
    link: '/physics/transformer/',
    status: 'live',
    featured: false,
    dateAdded: '2026-10-16',
    prerequisites: ['faradays-law', 'lenz-law']
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
