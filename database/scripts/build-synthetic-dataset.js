/**
 * database/scripts/build-synthetic-dataset.js
 * Generates 150 realistic Indian campus events and 300 fictional Indian students.
 * Outputs deterministic JSON files to database/data/ for repeatable, safe seeding.
 */

const fs = require("fs");
const path = require("path");

// Fixed Anchor Date: 15 October 2026 (Academic Year 2026-2027)
const ANCHOR_DATE = new Date("2026-10-15T09:00:00.000Z");

// Curated 16 image themes mapped to downloaded files in public/demo/events/
const THEMES = [
  { key: "music", image: "/demo/events/music-concert.jpg", kind: "event" },
  { key: "cultural", image: "/demo/events/cultural-night.jpg", kind: "event" },
  { key: "dance", image: "/demo/events/dance-performance.jpg", kind: "event" },
  { key: "theatre", image: "/demo/events/theatre-drama.jpg", kind: "event" },
  { key: "art", image: "/demo/events/art-exhibition.jpg", kind: "workshop" },
  { key: "hackathon", image: "/demo/events/hackathon.jpg", kind: "event" },
  { key: "workshop", image: "/demo/events/tech-workshop.jpg", kind: "workshop" },
  { key: "robotics", image: "/demo/events/ai-robotics.jpg", kind: "workshop" },
  { key: "cybersecurity", image: "/demo/events/cyber-security.jpg", kind: "workshop" },
  { key: "cricket", image: "/demo/events/cricket-tournament.jpg", kind: "event" },
  { key: "football", image: "/demo/events/football-athletics.jpg", kind: "event" },
  { key: "badminton", image: "/demo/events/badminton-indoor.jpg", kind: "event" },
  { key: "literary", image: "/demo/events/debate-literary.jpg", kind: "event" },
  { key: "entrepreneurship", image: "/demo/events/startup-pitch.jpg", kind: "event" },
  { key: "foodfest", image: "/demo/events/food-fest.jpg", kind: "event" },
  { key: "volunteering", image: "/demo/events/volunteering-tree.jpg", kind: "event" },
];

const VENUES = [
  "Main Campus Auditorium",
  "Open Air Amphitheatre",
  "Student Union Grand Hall",
  "Innovation Sandbox - West Wing",
  "Turing Computing Lab 3",
  "Central Library Seminar Hall B",
  "Skyline Sports Ground - Turf A",
  "Indoor Sports Complex - Court 1",
  "Block C Multi-Purpose Hall",
  "Ramanujan Mathematics Quadrangle",
  "Kalam Innovation & Research Center",
  "Architecture Design Studio 2",
  "Campus Cafeteria Terrace Garden",
  "Mechanical Engineering Workshop Floor",
  "Admin Lawn & Central Flagpost",
];

// Curated 150 Indian Event Titles & Descriptions
const EVENT_DEFINITIONS = [
  // 18 Past Events (Aug 10 - Oct 10, 2026)
  {
    title: "Dhwani Monsoon Acoustic Unplugged",
    theme: "music",
    venue: "Open Air Amphitheatre",
    offsetDays: -62,
    durationHours: 4,
    capacity: 250,
    memberPrice: 0,
    regularPrice: 10000,
    ticketed: true,
    desc: "An acoustic evening featuring student guitarists, classical violinists, and indie vocalists under the monsoon evening sky."
  },
  {
    title: "Fresher Welcome & Talent Gala 2026",
    theme: "cultural",
    venue: "Main Campus Auditorium",
    offsetDays: -58,
    durationHours: 6,
    capacity: 450,
    memberPrice: 0,
    regularPrice: 0,
    ticketed: true,
    desc: "The annual induction gala welcoming the 2026 incoming batch with dance showcases, light comedy, and student council introductions."
  },
  {
    title: "Kavya Sandhya: Hindi & Urdu Poetry Open Mic",
    theme: "literary",
    venue: "Central Library Seminar Hall B",
    offsetDays: -54,
    durationHours: 3,
    capacity: 80,
    memberPrice: 0,
    regularPrice: 5000,
    ticketed: true,
    desc: "A warm evening of heartfelt original Shayari, Ghazals, and modern slam poetry shared by campus wordsmiths."
  },
  {
    title: "Web Dev Kickstart: HTML, Tailwind & Modern CSS",
    theme: "workshop",
    venue: "Turing Computing Lab 3",
    offsetDays: -50,
    durationHours: 5,
    capacity: 60,
    memberPrice: 5000,
    regularPrice: 15000,
    ticketed: true,
    desc: "Hands-on bootcamp covering responsive UI engineering, semantic HTML5, and utility-first styling with Tailwind CSS."
  },
  {
    title: "Independence Day Campus Freedom Marathon (5K)",
    theme: "football",
    venue: "Admin Lawn & Central Flagpost",
    offsetDays: -46,
    durationHours: 3,
    capacity: 300,
    memberPrice: 0,
    regularPrice: 0,
    ticketed: true,
    desc: "Annual 5-kilometer campus perimeter run fostering fitness, national unity, and student community camaraderie."
  },
  {
    title: "Watercolors & Coffee: Campus Sketch Walk",
    theme: "art",
    venue: "Architecture Design Studio 2",
    offsetDays: -42,
    durationHours: 4,
    capacity: 45,
    memberPrice: 5000,
    regularPrice: 12000,
    ticketed: true,
    desc: "Guided outdoor watercolor sketching session capturing iconic brick arches and heritage trees of the Skyline campus."
  },
  {
    title: "Skyline Monsoon Badminton Doubles League",
    theme: "badminton",
    venue: "Indoor Sports Complex - Court 1",
    offsetDays: -38,
    durationHours: 8,
    capacity: 64,
    memberPrice: 10000,
    regularPrice: 20000,
    ticketed: true,
    desc: "Fast-paced knockout badminton doubles tournament across student and faculty divisions with branded trophies."
  },
  {
    title: "Intro to ROS 2 & Autonomous Mobile Robots",
    theme: "robotics",
    venue: "Kalam Innovation & Research Center",
    offsetDays: -35,
    durationHours: 6,
    capacity: 50,
    memberPrice: 15000,
    regularPrice: 30000,
    ticketed: true,
    desc: "Technical deep dive into Robot Operating System (ROS 2), node orchestration, sensors, and Gazebo simulation."
  },
  {
    title: "Git, GitHub & Open Source Contribution Primer",
    theme: "workshop",
    venue: "Turing Computing Lab 3",
    offsetDays: -32,
    durationHours: 4,
    capacity: 70,
    memberPrice: 0,
    regularPrice: 5000,
    ticketed: true,
    desc: "Demystifying version control, branching strategies, rebase workflows, and opening your first Pull Request."
  },
  {
    title: "Campus Green Drive: 500 Native Saplings Drive",
    theme: "volunteering",
    venue: "Admin Lawn & Central Flagpost",
    offsetDays: -28,
    durationHours: 5,
    capacity: 150,
    memberPrice: 0,
    regularPrice: 0,
    ticketed: false,
    desc: "Volunteer ecological drive planting Neem, Peepal, and Gulmohar saplings along the campus lake promenade."
  },
  {
    title: "Rangmanch Street Play Prelims: Social Realities",
    theme: "theatre",
    venue: "Ramanujan Mathematics Quadrangle",
    offsetDays: -25,
    durationHours: 4,
    capacity: 200,
    memberPrice: 0,
    regularPrice: 0,
    ticketed: false,
    desc: "High-energy Nukkad Natak street performances highlighting cyber safety, mental health, and civic consciousness."
  },
  {
    title: "Algorithmic Speed Coding Sprint 1.0",
    theme: "hackathon",
    venue: "Turing Computing Lab 3",
    offsetDays: -21,
    durationHours: 3,
    capacity: 80,
    memberPrice: 0,
    regularPrice: 5000,
    ticketed: true,
    desc: "2-hour competitive programming sprint featuring dynamic programming, graph traversals, and greedy algorithms."
  },
  {
    title: "Founders' Fireside: Bootstrapping in Bangalore",
    theme: "entrepreneurship",
    venue: "Innovation Sandbox - West Wing",
    offsetDays: -18,
    durationHours: 3,
    capacity: 120,
    memberPrice: 0,
    regularPrice: 10000,
    ticketed: true,
    desc: "Intimate conversation with three Skyline alumni who bootstrapped profitable B2B SaaS startups right from their dorms."
  },
  {
    title: "Ganesh Chaturthi Campus Dhol-Tasha Celebrations",
    theme: "cultural",
    venue: "Admin Lawn & Central Flagpost",
    offsetDays: -15,
    durationHours: 4,
    capacity: null,
    memberPrice: 0,
    regularPrice: 0,
    ticketed: false,
    desc: "Traditional campus celebration featuring energetic Dhol-Tasha folk percussion and community Prasad distribution."
  },
  {
    title: "CTF 101: Web App Penetration Testing Fundamentals",
    theme: "cybersecurity",
    venue: "Turing Computing Lab 3",
    offsetDays: -12,
    durationHours: 5,
    capacity: 60,
    memberPrice: 10000,
    regularPrice: 20000,
    ticketed: true,
    desc: "Hands-on walkthrough of SQL injection, cross-site scripting, and authentication bypass challenges in a sandbox lab."
  },
  {
    title: "Raag Sandhya: Sitar & Classical Flute Duet",
    theme: "music",
    venue: "Main Campus Auditorium",
    offsetDays: -9,
    durationHours: 3,
    capacity: 200,
    memberPrice: 5000,
    regularPrice: 15000,
    ticketed: true,
    desc: "Mesmerizing evening of classical Hindustani ragas performed by senior conservatory students and guest artists."
  },
  {
    title: "Inter-Hostel Table Tennis Smash-Off",
    theme: "badminton",
    venue: "Indoor Sports Complex - Court 1",
    offsetDays: -6,
    durationHours: 6,
    capacity: 48,
    memberPrice: 0,
    regularPrice: 5000,
    ticketed: true,
    desc: "Electrifying table tennis tournament between campus hostels featuring singles, doubles, and mixed matches."
  },
  {
    title: "Skyline Blood Donation & Vitals Health Camp",
    theme: "volunteering",
    venue: "Student Union Grand Hall",
    offsetDays: -3,
    durationHours: 6,
    capacity: 200,
    memberPrice: 0,
    regularPrice: 0,
    ticketed: false,
    desc: "Bi-annual community health camp in partnership with Rotary Blood Bank. 180+ units of life-saving blood collected."
  },

  // 7 Ongoing Events (anchored around Oct 13 - Oct 17, 2026)
  {
    title: "Navratri Garba & Dandiya Night 2026",
    theme: "cultural",
    venue: "Open Air Amphitheatre",
    offsetDays: -1,
    durationHours: 72, // 3-day fest
    capacity: 500,
    memberPrice: 10000,
    regularPrice: 25000,
    ticketed: true,
    desc: "The biggest cultural fest of the autumn semester: 3 nights of high-energy Garba, live traditional folk troupe, and festive attire."
  },
  {
    title: "Skyline Autumn HackFest: AI for Campus Utilities",
    theme: "hackathon",
    venue: "Innovation Sandbox - West Wing",
    offsetDays: -1,
    durationHours: 48,
    capacity: 120,
    memberPrice: 0,
    regularPrice: 15000,
    ticketed: true,
    desc: "48-hour sprint building real-world AI copilots for library book search, mess food optimization, and hostel energy analytics."
  },
  {
    title: "Chitra Kala Annual Fine Arts & Photography Expo",
    theme: "art",
    venue: "Block C Multi-Purpose Hall",
    offsetDays: 0,
    durationHours: 48,
    capacity: null,
    memberPrice: 0,
    regularPrice: 0,
    ticketed: false,
    desc: "Three-day multi-gallery exhibition showcasing oil paintings, digital illustrations, and campus architecture photography."
  },
  {
    title: "Skyline Inter-Department Cricket Trophy 2026",
    theme: "cricket",
    venue: "Skyline Sports Ground - Turf A",
    offsetDays: 0,
    durationHours: 96,
    capacity: 350,
    memberPrice: 0,
    regularPrice: 5000,
    ticketed: true,
    desc: "Premier 20-over cricket championship pitting department teams against each other in league and knockout matches."
  },
  {
    title: "Natya Tarang: All-India Classical Dance Fest",
    theme: "dance",
    venue: "Main Campus Auditorium",
    offsetDays: 1,
    durationHours: 24,
    capacity: 300,
    memberPrice: 10000,
    regularPrice: 20000,
    ticketed: true,
    desc: "Captivating showcase of Bharatanatyam, Kathak, Odissi, and Kuchipudi solo and group recitals by visiting student troupes."
  },
  {
    title: "Chatori Gali: Campus Street Food Carnival",
    theme: "foodfest",
    venue: "Campus Cafeteria Terrace Garden",
    offsetDays: 1,
    durationHours: 36,
    capacity: null,
    memberPrice: 0,
    regularPrice: 0,
    ticketed: false,
    desc: "Over 25 student-run food stalls featuring Delhi Chaat, Kathi Rolls, Kerala Parotta, Momos, and artisanal iced brews."
  },
  {
    title: "RoboWars 2026: 15kg Combat Robot Arena",
    theme: "robotics",
    venue: "Mechanical Engineering Workshop Floor",
    offsetDays: 1,
    durationHours: 24,
    capacity: 200,
    memberPrice: 15000,
    regularPrice: 30000,
    ticketed: true,
    desc: "High-octane armored combat robotics showdown inside a reinforced polycarbonate hazard arena with spinning drums and flippers."
  },

  // 125 Upcoming Events (spread across late Oct 2026 through May 2027)
  // Generating diverse, realistic Indian campus events across all 16 domains
];

// Helper to seed the remaining 125 upcoming events systematically
const UPCOMING_THEMES = [
  // Music & Concerts
  { prefix: "Battle of the Campus Rock Bands", theme: "music", venue: "Open Air Amphitheatre", priceM: 15000, priceR: 30000, cap: 400, desc: "Electric showdown of student progressive rock, thrash metal, and indie fusion bands with professional audio backline." },
  { prefix: "Raaga Fusion: Carnatic & Jazz Symphony", theme: "music", venue: "Main Campus Auditorium", priceM: 10000, priceR: 25000, cap: 300, desc: "A confluence of traditional Carnatic ragas and Western saxophone jazz improvisations by talented music society members." },
  { prefix: "Sunset Acoustic Session & Chai", theme: "music", venue: "Campus Cafeteria Terrace Garden", priceM: 0, priceR: 5000, cap: 100, desc: "Relaxing late-afternoon acoustic covers, soulful retro Bollywood harmonies, and complimentary spiced cutting chai." },
  { prefix: "Sufi & Qawwali Mystical Night", theme: "music", venue: "Open Air Amphitheatre", priceM: 12000, priceR: 25000, cap: 350, desc: "A spiritual and uplifting evening of traditional Sufiana poetry, soulful harmonium riffs, and devotional qawwali chants." },
  { prefix: "EDM Beats & Laser Soundscape", theme: "music", venue: "Main Campus Auditorium", priceM: 20000, priceR: 45000, cap: 500, desc: "Pounding basslines, custom synthesized visuals, and energetic electronic dance music sets produced by student DJs." },
  { prefix: "Old Bollywood Retro Golden Hits Gala", theme: "music", venue: "Main Campus Auditorium", priceM: 8000, priceR: 20000, cap: 280, desc: "A nostalgic orchestral tribute to RD Burman, Kishore Kumar, and Lata Mangeshkar classics performed by the campus choir." },

  // Cultural & Festivals
  { prefix: "Diwali Lights Festival & Rangoli Contest", theme: "cultural", venue: "Ramanujan Mathematics Quadrangle", priceM: 0, priceR: 0, cap: null, desc: "Celebrating the festival of lights with 1,000 earthen diyas, intricate flower rangoli competitions, and sweets distribution." },
  { prefix: "Lohri & Pongal Harvest Folk Celebration", theme: "cultural", venue: "Admin Lawn & Central Flagpost", priceM: 0, priceR: 0, cap: null, desc: "Bonfire harvest festival with Bhangra dhol circles, traditional sweet Pongal cooking, and folk storytelling." },
  { prefix: "Holi Milan: Eco-Friendly Herbal Gulal Fest", theme: "cultural", venue: "Skyline Sports Ground - Turf A", priceM: 5000, priceR: 15000, cap: 500, desc: "Safe, 100% organic herbal colors, rain dance sprinkler towers, and Thandai stations for the vibrant festival of colors." },
  { prefix: "Ethnic Attire Walk & Heritage Runway", theme: "cultural", venue: "Student Union Grand Hall", priceM: 5000, priceR: 15000, cap: 250, desc: "Showcasing the diverse cultural clothing traditions of India's states: Silk sarees, Kurtas, Mekhela Sador, and Turbans." },
  { prefix: "Campus Dandiya Raas Extraordinaire", theme: "cultural", venue: "Open Air Amphitheatre", priceM: 10000, priceR: 20000, cap: 400, desc: "Synchronized wooden Dandiya stick dancing, festive Chaniya Cholis, and lively Gujarat folk rhythm percussion." },
  { prefix: "International Students Cultural Pavilion", theme: "cultural", venue: "Student Union Grand Hall", priceM: 0, priceR: 5000, cap: 200, desc: "Exchange students present their home cultures, culinary delights, traditional crafts, and music to the campus community." },

  // Dance & Theatre
  { prefix: "Natraj: Inter-College Choreography Trophy", theme: "dance", venue: "Main Campus Auditorium", priceM: 15000, priceR: 35000, cap: 450, desc: "The ultimate team choreography championship: Western hip-hop, lyrical jazz, and thematic contemporary routines." },
  { prefix: "Mudras: Classical Kathak & Odissi Masterclass", theme: "dance", venue: "Block C Multi-Purpose Hall", priceM: 8000, priceR: 18000, cap: 50, desc: "Three-hour intensive masterclass exploring footwork precision (Tatkar), facial expressions (Abhinaya), and rhythmic cycles." },
  { prefix: "Rangmanch Annual Play: Courtroom Drama", theme: "theatre", venue: "Main Campus Auditorium", priceM: 10000, priceR: 20000, cap: 350, desc: "Gripping student adaptation of Reginald Rose's 'Twelve Angry Men' adapted to contemporary Indian legal and social questions." },
  { prefix: "Improvised Comedy Showdown: No Scripts Allowed", theme: "theatre", venue: "Student Union Grand Hall", priceM: 5000, priceR: 15000, cap: 150, desc: "Unscripted hilarity, audience-driven prompts, and rapid-fire comedic skits delivered by the campus drama troupe." },
  { prefix: "Mime & Physical Theatre Intensive", theme: "theatre", venue: "Architecture Design Studio 2", priceM: 5000, priceR: 12000, cap: 40, desc: "Exploring non-verbal storytelling, body control, illusionary barriers, and emotional nuance through silent physical acting." },
  { prefix: "Bollywood Fusion Dance Workshop", theme: "dance", venue: "Block C Multi-Purpose Hall", priceM: 5000, priceR: 12000, cap: 80, desc: "High-energy 90-minute choreography class to current chartbusters, blending hip-hop isolations with Bollywood flair." },

  // Fine Arts & Design
  { prefix: "Clay Modeling & Ceramic Wheel Pottery", theme: "art", venue: "Architecture Design Studio 2", priceM: 12000, priceR: 25000, cap: 35, desc: "Hands-on pottery wheel workshop where attendees sculpt, shape, and fire their own customized ceramic mugs and bowls." },
  { prefix: "Calligraphy & Devnagari Typography Lab", theme: "art", venue: "Central Library Seminar Hall B", priceM: 6000, priceR: 15000, cap: 40, desc: "Mastering broad-edge nibs, brush pens, and letterform anatomy across Latin scripts and classical Devnagari scripts." },
  { prefix: "Charcoal Portraits & Anatomy Sketching", theme: "art", venue: "Architecture Design Studio 2", priceM: 6000, priceR: 15000, cap: 45, desc: "Working with compressed willow charcoal, blending stumps, and kneaded erasers to render dynamic human facial anatomy." },
  { prefix: "Digital Art & Concept Painting in Procreate", theme: "art", venue: "Turing Computing Lab 3", priceM: 10000, priceR: 20000, cap: 50, desc: "Techniques for perspective grids, brush engines, layer composition, and lighting fundamentals for concept art." },
  { prefix: "Origami & 3D Paper Architecture Workshop", theme: "art", venue: "Architecture Design Studio 2", priceM: 4000, priceR: 10000, cap: 40, desc: "Precision geometric folding, tessellations, and kirigami paper engineering creating intricate sculptural forms." },

  // Hackathons & Tech Sprints
  { prefix: "Skyline DevHacks 2027: 36H National Hackathon", theme: "hackathon", venue: "Innovation Sandbox - West Wing", priceM: 0, priceR: 20000, cap: 200, desc: "36 hours of non-stop building across Web3, FinTech, Healthcare, and Edge AI tracks with ₹1,00,000 in bounties." },
  { prefix: "Algorithmic Arena 2.0: Dynamic Programming Duel", theme: "hackathon", venue: "Turing Computing Lab 3", priceM: 0, priceR: 5000, cap: 90, desc: "Competitive coding battle testing graph algorithms, segment trees, and bitmask optimization with live scoreboards." },
  { prefix: "Game Jam 2027: 48 Hours to Ship in Godot", theme: "hackathon", venue: "Turing Computing Lab 3", priceM: 5000, priceR: 15000, cap: 60, desc: "Create an original indie game from scratch adhering to a secret constraint revealed at the opening ceremony." },
  { prefix: "UI/UX Redesign Sprint: Campus Mobile Experience", theme: "hackathon", venue: "Innovation Sandbox - West Wing", priceM: 0, priceR: 8000, cap: 70, desc: "Rapid Figma sprint restructuring the student hostel portal, mess booking, and campus navigation flows." },
  { prefix: "Kaggle Sprint: Tabular Data Predictive ML", theme: "hackathon", venue: "Turing Computing Lab 3", priceM: 0, priceR: 10000, cap: 80, desc: "Feature engineering, LightGBM ensembling, and cross-validation pipelines on real-world Indian demographic data." },

  // Workshops & Engineering Deep Dives
  { prefix: "Modern Full-Stack with Next.js 15 & Prisma ORM", theme: "workshop", venue: "Turing Computing Lab 3", priceM: 10000, priceR: 25000, cap: 70, desc: "Comprehensive server components architecture, mutation workflows, optimistic UI, and type-safe database queries." },
  { prefix: "Docker, Containers & Microservices Essentials", theme: "workshop", venue: "Turing Computing Lab 3", priceM: 8000, priceR: 20000, cap: 65, desc: "Writing multi-stage Dockerfiles, compose topologies, volume mounts, and container health check paradigms." },
  { prefix: "Rust Systems Programming for Beginners", theme: "workshop", venue: "Turing Computing Lab 3", priceM: 10000, priceR: 25000, cap: 60, desc: "Memory safety without garbage collection: Ownership, borrow checker, lifetimes, and building CLI tools in Rust." },
  { prefix: "Cloud Native Deployments on AWS & Kubernetes", theme: "workshop", venue: "Turing Computing Lab 3", priceM: 12000, priceR: 30000, cap: 60, desc: "Configuring Kubernetes clusters, ingress controllers, Helm charts, and continuous integration pipelines." },
  { prefix: "Intro to Quantitative Finance & Python Backtesting", theme: "workshop", venue: "Central Library Seminar Hall B", priceM: 10000, priceR: 25000, cap: 55, desc: "Analyzing NSE equity data, calculating Sharpe ratios, moving averages, and backtesting trading algorithms in Pandas." },

  // AI & Robotics
  { prefix: "Hands-on Autonomous Drone Build & Flight Lab", theme: "robotics", venue: "Mechanical Engineering Workshop Floor", priceM: 20000, priceR: 45000, cap: 40, desc: "Soldering quadcopter ESCs, configuring Betaflight flight controllers, PID tuning, and outdoor flight trials." },
  { prefix: "Computer Vision with OpenCV & YOLOv11", theme: "robotics", venue: "Kalam Innovation & Research Center", priceM: 12000, priceR: 28000, cap: 50, desc: "Real-time edge object detection, bounding box tracking, and camera calibration for autonomous vehicle guidance." },
  { prefix: "Fine-Tuning Open Source LLMs (Llama 3 & Mistral)", theme: "robotics", venue: "Kalam Innovation & Research Center", priceM: 15000, priceR: 35000, cap: 45, desc: "LoRA, QLoRA, parameter-efficient fine-tuning, synthetic dataset curation, and quantized model deployment." },
  { prefix: "Embedded IoT with ESP32 & FreeRTOS", theme: "robotics", venue: "Mechanical Engineering Workshop Floor", priceM: 10000, priceR: 22000, cap: 45, desc: "Building battery-efficient Wi-Fi sensor nodes, MQTT telemetry messaging, and multi-tasking RTOS loops." },

  // Cybersecurity
  { prefix: "Skyline CyberCon CTF: National Invitational", theme: "cybersecurity", venue: "Turing Computing Lab 3", priceM: 0, priceR: 20000, cap: 120, desc: "Jeopardy-style CTF across Cryptography, Reverse Engineering, Binary Exploitation, Forensics, and Web Security." },
  { prefix: "Reverse Engineering x86_64 Binaries with Ghidra", theme: "cybersecurity", venue: "Turing Computing Lab 3", priceM: 12000, priceR: 25000, cap: 45, desc: "Disassembling stripped binaries, understanding calling conventions, patching executables, and static decompilation." },
  { prefix: "Defensive Security: SIEM Logs & Incident Response", theme: "cybersecurity", venue: "Turing Computing Lab 3", priceM: 8000, priceR: 20000, cap: 50, desc: "Analyzing suspicious network traffic, auth brute force indicators, and writing Sigma rules in open SIEM platforms." },

  // Sports & Athletics
  { prefix: "Skyline Premier League T20 Super Knockouts", theme: "cricket", venue: "Skyline Sports Ground - Turf A", priceM: 0, priceR: 10000, cap: 400, desc: "Quarter-finals and semi-finals of the inter-branch cricket championship with live ball-by-ball campus streaming." },
  { prefix: "Inter-College Football Championship: Golden Boot", theme: "football", venue: "Skyline Sports Ground - Turf A", priceM: 0, priceR: 10000, cap: 350, desc: "90-minute high-tempo football matches featuring 16 invited university squads competing for the collegiate shield." },
  { prefix: "All-Campus Badminton Singles Open Championship", theme: "badminton", venue: "Indoor Sports Complex - Court 1", priceM: 5000, priceR: 12000, cap: 64, desc: "Individual singles knockout tournament across men's and women's seedings with synthetic Yonex feather shuttles." },
  { prefix: "Sunset 3v3 Basketball Showdown", theme: "badminton", venue: "Indoor Sports Complex - Court 1", priceM: 5000, priceR: 15000, cap: 80, desc: "Half-court 3v3 basketball sprint tournament with 12-minute shot clocks and perimeter scoring shootouts." },
  { prefix: "Skyline Grandmaster Rapid Chess Open", theme: "badminton", venue: "Central Library Seminar Hall B", priceM: 5000, priceR: 10000, cap: 64, desc: "FIDE-rated Swiss system 15+10 rapid chess tournament with digital clocks, notation sheets, and prize funds." },

  // Literary & Debates
  { prefix: "Skyline Parliamentary Debate (British Format)", theme: "literary", venue: "Central Library Seminar Hall B", priceM: 5000, priceR: 15000, cap: 90, desc: "Three-day BP debate tournament exploring geopolitical motions, technological ethics, and economic reforms." },
  { prefix: "Model United Nations (MUN): Security Council", theme: "literary", venue: "Student Union Grand Hall", priceM: 15000, priceR: 30000, cap: 120, desc: "Simulated diplomatic deliberation on crisis resolutions, drafting operative clauses, and multilateral negotiations." },
  { prefix: "The Great Campus Trivia Quiz: General & Pop Culture", theme: "literary", venue: "Main Campus Auditorium", priceM: 0, priceR: 5000, cap: 200, desc: "Four rounds of audio-visual trivia, history, science breakthroughs, cinema, and cryptic potluck questions." },
  { prefix: "Creative Fiction & Screenplay Writing Masterclass", theme: "literary", venue: "Central Library Seminar Hall B", priceM: 5000, priceR: 12000, cap: 45, desc: "Plot architecture, three-act pacing, writing realistic subtext in dialogue, and pitching scripts to publishers." },

  // Entrepreneurship & Startups
  { prefix: "E-Cell Demo Day: Seed Pitch to Angel Investors", theme: "entrepreneurship", venue: "Innovation Sandbox - West Wing", priceM: 0, priceR: 15000, cap: 150, desc: "Top 10 student startups present 5-minute pitches followed by live Q&A with venture capitalists and angel operators." },
  { prefix: "Product Teardown: Deconstructing India's Unicorns", theme: "entrepreneurship", venue: "Innovation Sandbox - West Wing", priceM: 0, priceR: 8000, cap: 80, desc: "Case-study dissection of Swiggy, Zerodha, and UPI growth loops, monetization moats, and unit economics." },
  { prefix: "Intellectual Property & Patent Filing for Engineers", theme: "entrepreneurship", venue: "Central Library Seminar Hall B", priceM: 0, priceR: 10000, cap: 60, desc: "Navigating provisional patents, prior art search, design registrations, and commercializing campus inventions." },

  // Food Festivals & Volunteering
  { prefix: "Desi Flavors: Regional Indian Thali Carnival", theme: "foodfest", venue: "Campus Cafeteria Terrace Garden", priceM: 0, priceR: 0, cap: null, desc: "Culinary celebration representing Awadhi Biryani, Rajasthani Dal Baati, Gujarati Dhokla, and Hyderabadi Haleem." },
  { prefix: "Zero-Waste Campus Drive & E-Waste Recycle Rally", theme: "volunteering", venue: "Admin Lawn & Central Flagpost", priceM: 0, priceR: 0, cap: 150, desc: "Collecting broken electronics, laptops, cables, and lithium batteries for authorized ethical recycling." },
  { prefix: "Teach for Skyline: Slum Children Weekend Outreach", theme: "volunteering", venue: "Central Library Seminar Hall B", priceM: 0, priceR: 0, cap: 60, desc: "Student volunteers teach basic mathematics, spoken English, and coding logic to children from nearby communities." },
];

console.log("Generating 150 events...");

const allEvents = [...EVENT_DEFINITIONS];

// Fill up to exactly 150 events
let counter = allEvents.length;
let themeCycle = 0;
while (allEvents.length < 150) {
  counter++;
  const template = UPCOMING_THEMES[themeCycle % UPCOMING_THEMES.length];
  themeCycle++;

  // Offset spread from +6 days to +210 days (May 2027)
  const offset = 6 + Math.floor((allEvents.length - 25) * 1.6);
  const durHours = 3 + (counter % 5);

  allEvents.push({
    title: `${template.prefix} (Edition ${Math.floor(counter / UPCOMING_THEMES.length) + 1})`,
    theme: template.theme,
    venue: template.venue,
    offsetDays: offset,
    durationHours: durHours,
    capacity: template.cap,
    memberPrice: template.priceM,
    regularPrice: template.priceR,
    ticketed: template.priceR > 0 || template.cap !== null,
    desc: template.desc
  });
}

// Convert all 150 events into standardized DB records
const eventImagesMap = {};
const finalEvents = allEvents.map((evt, idx) => {
  const eventId = `synth-event-${String(idx + 1).padStart(3, "0")}`;
  
  const startDate = new Date(ANCHOR_DATE.getTime() + evt.offsetDays * 86400000);
  const endDate = new Date(startDate.getTime() + evt.durationHours * 3600000);

  const themeObj = THEMES.find((t) => t.key === evt.theme) || THEMES[0];
  eventImagesMap[eventId] = themeObj.image;

  return {
    id: eventId,
    kind: themeObj.kind,
    title: evt.title,
    description: evt.desc,
    venue: evt.venue,
    startsAt: startDate.toISOString(),
    endsAt: endDate.toISOString(),
    capacity: evt.capacity,
    memberPricePaise: evt.memberPrice,
    regularPricePaise: evt.regularPrice,
    published: true,
    ticketed: evt.ticketed,
    imagePath: themeObj.image,
  };
});

console.log(`✔ Generated ${finalEvents.length} events with unique titles & dates.`);

// ---------------------------------------------------------------------------
// 300 Indian Students
// ---------------------------------------------------------------------------
console.log("Generating 300 Indian students...");

const FIRST_NAMES = [
  "Aarav", "Diya", "Rohan", "Ananya", "Siddharth", "Priya", "Vikram", "Sneha",
  "Arjun", "Meera", "Kabir", "Riya", "Aditya", "Pooja", "Rahul", "Kavya",
  "Nikhil", "Ishita", "Dev", "Neha", "Shaurya", "Tanvi", "Aryan", "Shreya",
  "Tanmay", "Aditi", "Ayush", "Divya", "Karthik", "Swati", "Harsh", "Bhavya",
  "Vivaan", "Pari", "Advik", "Kiara", "Reyansh", "Fatima", "Aadhya", "Saanvi",
  "Mohammed", "Anvi", "Ayaan", "Prisha", "Dhruv", "Myra", "Yash", "Zoya",
  "Tejas", "Ira", "Varun", "Simran", "Pranav", "Kritika", "Samar", "Tanya",
  "Manan", "Muskan", "Kunal", "Garima", "Chirag", "Radhika", "Akash", "Ritu",
  "Gaurav", "Nisha", "Tushar", "Pallavi", "Alok", "Sunita", "Deepak", "Asha"
];

const LAST_NAMES = [
  "Sharma", "Patel", "Iyer", "Gupta", "Nair", "Reddy", "Malhotra", "Banerjee",
  "Verma", "Joshi", "Choudhury", "Sen", "Rao", "Hegde", "Deshmukh", "Menon",
  "Bhatia", "Chatterjee", "Kapoor", "Mukherjee", "Singh", "Kaur", "Khanna",
  "Arora", "Sethi", "Agarwal", "Jain", "Goel", "Bansal", "Mittal", "Garg",
  "Saxena", "Srivastava", "Mishra", "Pandey", "Tiwari", "Shukla", "Dubey",
  "Tripathi", "Pillai", "Nambiar", "Kurian", "Thomas", "D'Souza", "Fernandes",
  "Ghosh", "Roy", "Das", "Dutta", "Bose", "Chakraborty", "Kulkarni"
];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Science & Engineering",
  "Electronics & Communication Engineering",
  "Artificial Intelligence & Machine Learning",
  "Data Science & Analytics",
  "Mechanical Engineering",
  "Biotechnology",
  "Business Administration",
  "Design & Media Arts",
  "Civil & Environmental Engineering",
];

const BATCHES = ["2023-2027", "2024-2028", "2025-2029", "2026-2030"];

const AVATAR_COLORS = [
  "#0047AB", // Skyline Cobalt
  "#0D9488", // Teal
  "#7C3AED", // Purple
  "#E11D48", // Rose
  "#D97706", // Amber
  "#2563EB", // Royal Blue
  "#059669", // Emerald
  "#4F46E5", // Indigo
  "#DB2777", // Pink
  "#334155", // Slate
];

function generateInitialsAvatar(name, color) {
  const parts = name.split(" ");
  const initials = (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="64" fill="${color}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="46" font-weight="600">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const students = [];
const studentMetadata = [];

let nameIndex = 0;
for (let i = 1; i <= 300; i++) {
  const fName = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
  const lName = LAST_NAMES[(i * 11) % LAST_NAMES.length];
  const fullName = `${fName} ${lName}`;
  
  const id = `synth-student-${String(i).padStart(3, "0")}`;
  const cleanFirst = fName.toLowerCase().replace(/[^a-z]/g, "");
  const cleanLast = lName.toLowerCase().replace(/[^a-z]/g, "");
  const email = `${cleanFirst}.${cleanLast}.${String(i).padStart(3, "0")}@example.test`;
  
  const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
  const avatar = generateInitialsAvatar(fullName, color);

  const dept = DEPARTMENTS[i % DEPARTMENTS.length];
  const batch = BATCHES[i % BATCHES.length];
  const rollNo = `SKY-${batch.substring(2, 4)}-${dept.substring(0, 2).toUpperCase()}-${String(i).padStart(3, "0")}`;

  students.push({
    id,
    name: fullName,
    email,
    image: avatar,
  });

  studentMetadata.push({
    id,
    name: fullName,
    email,
    department: dept,
    batch,
    rollNumber: rollNo,
  });
}

console.log(`✔ Generated ${students.length} students with unique emails and initials avatars.`);

// Write files to database/data/ and database/synthetic-data/
const dataDirs = [
  path.join(__dirname, "..", "data"),
  path.join(__dirname, "..", "synthetic-data"),
];

for (const dir of dataDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dir, "synthetic-events.json"),
    JSON.stringify(finalEvents, null, 2)
  );
  fs.writeFileSync(
    path.join(dir, "event-images.json"),
    JSON.stringify(eventImagesMap, null, 2)
  );
  fs.writeFileSync(
    path.join(dir, "synthetic-students.json"),
    JSON.stringify(students, null, 2)
  );
  fs.writeFileSync(
    path.join(dir, "synthetic-students-metadata.json"),
    JSON.stringify(studentMetadata, null, 2)
  );
}

console.log("✔ Saved synthetic-events.json, event-images.json, synthetic-students.json, synthetic-students-metadata.json to database/synthetic-data/");
