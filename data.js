// =====================================================================
// AMY GRINDAU, PORTFOLIO
// All content lives here. Change texts, order or images without touching
// layout code. Web images live in assets/web/<project>/ (originals untouched).
//
// Each project: a short text (what it is) and an optional `process`
// (how and why) that readers can unfold.
// Videos: a local file ("assets/web/…mp4") or a YouTube / Vimeo link.
// Extra films (trailer, interview…) go into `extras`, web links into `links`.
// `hidden: true` keeps a project out of the magazine without deleting it.
// =====================================================================

const W = "assets/web";
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const p2 = (n) => String(n).padStart(2, "0");
const A4 = 1 / Math.SQRT2; // page ratio of all printed pieces

// Florilegium: specimen N° → postcard front (PDF page), its back (next page) + transparent sheet
const SPECIMENS = [
  [1, "Petunia", "Busan", "17.08.23", "13:13", 5],
  [2, "Camellia", "Tokyo", "09.03.24", "17:55", 9],
  [3, "Magnolia", "Tokyo", "11.03.24", "14:44", 11],
  [4, "Pink Camellia", "Tokyo", "12.03.24", "13:18", 13],
  [5, "Orchid", "Okinawa", "13.03.24", "13:24", 15],
  [6, "Cape Leadwort", "Okinawa", "13.03.24", "17:09", 17],
  [7, "Chinese Hibiscus", "Okinawa", "14.03.24", "12:39", 3],
  [8, "Peregrina", "Okinawa", "14.03.24", "14:25", 19],
  [9, "Tulip Tree", "Okinawa", "17.03.24", "10:38", 21],
  [10, "Lotus", "Seoul", "08.09.25", "12:22", 7],
  [11, "Rose of Sharon", "Seoul", "10.09.25", "11:48", 23],
  [12, "Cockscomb", "Seoul", "14.10.25", "14:46", 25],
  [13, "Aster", "Jeju", "25.10.25", "13:19", 27],
  [14, "Pampas Grass", "Jeju", "26.10.25", "12:35", 29],
  [15, "Narcissus", "Seoul", "02.04.26", "15:50", 31],
  [16, "Cherry Blossom", "Seoul", "08.04.26", "14:50", 33],
  [17, "Peony", "Seoul", "19.04.26", "14:45", 35],
  [18, "Azalea", "Seoul", "22.04.26", "13:45", 37],
].map(([no, name, city, date, time, page]) => ({
  no, name, city, date, time,
  src: `${W}/florilegium/cards/ff-${p2(page)}.jpg`,      // front: original artwork
  back: `${W}/florilegium/cards/ff-${p2(page + 1)}.jpg`, // back: the real postcard backside
  overlay: `${W}/florilegium/overlays/ov-${p2(no + 1)}.jpg`,
}));

window.PORTFOLIO = {
  // Cover: put your own cover design here (3:4, e.g. 1500 × 2000 px). null = plain pink page.
  images: { cover: null, face: `${W}/face.jpg` },

  mission:
    "I work at the intersection of creative direction, media, technology and culture, exploring how visual storytelling shapes the way we experience ideas, brands and society.",

  letter: [
    // continues the title "Hi, I'm Amy,"
    "an interdisciplinary creative, studying Art & Multimedia at LMU Munich, back from a year on exchange at Seoul National University.",
    "I like turning ideas into things you can hold, watch or walk through: magazines, films, artist books, brands and installations. Most of my work lives in two places at once, between image and text, analogue and digital, Munich and Seoul.",
  ],

  timeline: [
    ["2021/23", "Head Student Representative, 1,200+ students"],
    ["2022", "UNTITLED, 1st Prize Photography & Layout"],
    ["2023", "ELLA, B.A. Art & Multimedia at LMU Munich"],
    ["2024", "NEXUS (2 LMU Oscars), PULSE, 6th Man"],
    ["2025", "SmartScan with Digitale Hilfe München"],
    ["2025/26", "Exchange at Seoul National University"],
    ["2026", "Florilegium, Printed Matter, The One I Want, SNU 80th"],
  ],

  credits: [
    ["Editor & art direction", "Amy Grindau"],
    ["Based in", "Munich & Seoul"],
    ["Contact", "amiiryyy@gmail.com"],
  ],

  contact: {
    email: "amiiryyy@gmail.com",
    linkedin: "https://www.linkedin.com/in/amy-grindau/",
    instagram: "", // add your Instagram link
    cv: "cv.pdf",  // put your CV as prototype/cv.pdf
  },

  // The magazine follows this order of sections.
  sections: ["Print", "Identity", "Film", "Interaction"],

  // "On my desk": the page before the back cover
  current: {
    title: "Current Projects",
    kind: "On my desk",
    hook: "What I'm working on right now.",
    image: `${W}/current/collage.jpg`, // fills the whole right page
    text: [
      "A few projects in progress, from AI-generated imagery to a perfume brand.",
    ],
    // the pinboard below the spread: one pin per project. Add an image as `src` when you have one.
    projects: [
      // `detail` = the overlay that opens when you click the pin (leave it out and the pin is not clickable)
      { title: "Botanical Bodies", src: `${W}/current/botanical-bodies.jpg`,
        note: "Human and nature through surreal, AI-generated imagery.",
        detail: {
          kind: "Visual research, AI-generated imagery, 2026",
          image: `${W}/current/botanical-bodies.jpg`,
          intro: "Exploring the relationship between humans and nature through surreal, AI-generated imagery.",
          points: [
            { text: "Three visual phases:", sub: ["Aesthetic Decoration", "Symbiotic Transformation", "Assimilation"] },
            "Output: ultra-short loop videos (5 to 10 seconds) and a visual booklet",
            "Focus on aesthetics, ecological questions and posthuman perspectives",
          ],
        } },
      { title: "Perfume Brand", note: "" },
      { title: "Brewinsight", src: `${W}/current/brewinsight.jpg`,
        note: "Instagram content and community strategy for a coffee platform.",
        detail: {
          kind: "Creative direction, content strategy, community growth, creator acquisition, 2026",
          image: `${W}/current/brewinsight.jpg`,
          intro: "Brewinsight is a coffee intelligence platform: data, trends and insights for the coffee world. I developed its Instagram content and community strategy, turning a data-driven feed into a social ecosystem around coffee, creators and cafés.",
          points: [
            "Positioning: “coffee magazine meets local culture platform”, editorial, local, human and curious, while keeping the existing identity",
            { text: "Five content pillars:", sub: ["Coffee culture", "Creator culture", "Café × creator collaborations", "Coffee intelligence", "Community engagement"] },
            "A content toolkit and posting rhythm that alternates data, cafés, creators, collaborations and community",
            "A short-form video framework: hook, value, call to action",
            "Creator acquisition on Threads and X: find creators, start conversations, drive sign-ups",
            "A growth loop: every collaboration creates content, every piece of content creates discovery",
          ],
        } },
      { title: "Magazine Creation", note: "" },
    ],
  },

  projects: [
    /* ------------------------------- PRINT ------------------------------- */
    {
      id: "florilegium", section: "Print", title: "Florilegium", kind: "Artist Book", year: "2026",
      hook: "18 flowers. Five cities. Three years.",
      context: "Design Studio 21, Seoul National University",
      role: "Concept, photography, TouchDesigner, editorial design",
      award: "Pages, Fukuoka Art Book Fair 2026",
      key: { src: `${W}/florilegium/cards/ff-01.jpg`, fit: "contain", bg: "pink" },
      links: [{ label: "Featured by SNU Design on Instagram", url: "https://www.instagram.com/p/DYd146jEo72/" }],
      text: [
        "An artist book that turns my personal flower photography into a metadata-based archive, where the invisible data becomes the narrative. 18 flowers, photographed across Seoul, Busan, Jeju, Tokyo and Okinawa over three years.",
      ],
      process: [
        "Every photograph already carries data it never shows: the coordinates of where I stood, the hour the shutter opened. I wanted that invisible layer to decide what the image becomes, so the transformation follows a rule instead of my taste.",
        "Each postcard has two layers: the dissolved image, and a transparent sheet that keeps the facts. Together they hold documentation and abstraction, data and memory, presence and disappearance.",
      ],
      quote: "What remains is not documentation, but echo.",
      blocks: [
        { type: "concept", title: "The rule",
          statement: "Each flower follows the same process.",
          steps: ["Image capture", "Metadata extraction, through a webpage", "Visual transformation through a defined rule, resulting in an abstract artwork"],
          influences: "The data decides composition, density and structure of the generated image.",
          table: [
            ["flow", "Latitude (26 to 37)", "noise2 period"],
            ["seed", "Longitude × 10", "noise3 seed"],
            ["density", "Day of year (1 to 365)", "displace1 / displace2 weight"],
            ["sat", "Hour of day (0 to 23)", "level TOP gamma, added at the end"],
          ] },
        { type: "specimens", title: "The 18 specimens, and one for you", items: SPECIMENS },
        { type: "pairs", title: "Document → echo", items: [
          { a: `${W}/florilegium/orchid.jpg`, b: `${W}/florilegium/orchid-echo.jpg`, caption: "N°5 Orchid, photograph and transformation" },
          { a: `${W}/florilegium/aster.jpg`, b: `${W}/florilegium/aster-echo.jpg`, caption: "N°13 Aster, photograph and transformation" },
        ] },
        { type: "posters", title: "Poster, front & back", items: [`${W}/florilegium/poster-01.jpg`, `${W}/florilegium/poster-02.jpg`] },
        { type: "gallery", title: "Pages, Fukuoka Art Book Fair 2026", items: [
          { src: `${W}/florilegium/fukuoka-sign.jpg` }, { src: `${W}/florilegium/fukuoka-1.jpg` },
          { src: `${W}/florilegium/fukuoka-2.jpg` }, { src: `${W}/florilegium/prints-3.jpg` },
          { src: `${W}/florilegium/prints-1.jpg` }, { src: `${W}/florilegium/prints-2.jpg` },
        ] },
      ],
    },
    {
      id: "printedmatter", section: "Print", title: "Printed Matter", kind: "Publisher Index", year: "2026",
      hook: "Half the page for the artist, half for the publisher.",
      context: "Design Studio 21, Seoul National University",
      role: "Concept, editorial design, print production, solo",
      key: { src: `${W}/printedmatter/form.jpg`, fit: "contain", bg: "hotpink", blend: "multiply" }, // white → pink
      text: [
        "A publisher index for Printed Matter, the New York non-profit that has published and distributed artist books since 1976. Every page is cut in half and printed on transparent sheets that layer into one another.",
      ],
      process: [
        "Printed Matter stands for accessibility, artist control and alternative distribution. The index makes one of those ideas visible: halved pages for the 50/50 split between artist and publisher.",
        "Printed on transparent paper, each spread lets the next one shine through, the way a single publication only ever shows a fragment of the archive.",
      ],
      quote: "What remains visible is not the archive itself, but a subjective fragment of it.",
      blocks: [
        { type: "magazine", title: "Flip through the index", ratio: A4, pages: {
          cover: `${W}/printedmatter/page-1.jpg`,
          spreads: range(2, 8).map((n) => `${W}/printedmatter/page-${n}.jpg`),
          back: `${W}/printedmatter/page-9.jpg`,
        } },
        { type: "gallery", title: "The printed object", items: [
          { src: `${W}/printedmatter/photo-1.jpg` }, { src: `${W}/printedmatter/photo-2.jpg` }, { src: `${W}/printedmatter/photo-4.jpg` },
        ] },
      ],
    },
    {
      id: "ella", section: "Print", title: "Ella", kind: "Magazine", year: "2023",
      hook: "A homage to the First Lady of Jazz.",
      context: "Editorial project",
      role: "Concept, layout, typography, solo",
      key: { src: `${W}/ella/mockup.jpg`, fit: "cover" },
      text: [
        "Ella Fitzgerald's voice, rhythm and legacy translated into contemporary editorial design, with typography and layout that echo the elegance and swing of jazz.",
      ],
      process: [
        "Ella is timeless, so I wanted to immortalise her in a format everyone knows: the cover of TIME.",
        "Inside, the spreads follow key moments of her life and career in red, black and white, with halftone portraits and cut-outs, and typography that moves like a melody.",
      ],
      blocks: [
        { type: "magazine", title: "Flip through Ella", ratio: A4, pages: {
          cover: `${W}/ella/ella-01.jpg`,
          spreads: range(2, 5).map((n) => `${W}/ella/ella-${p2(n)}.jpg`),
          back: `${W}/ella/ella-06.jpg`,
        } },
      ],
    },
    {
      id: "untitled", section: "Print", title: "Untitled", kind: "Magazine", year: "2022",
      hook: "A magazine for young adults.",
      context: "W-Seminar, Korbinian-Aigner-Gymnasium",
      role: "Art direction, layout, photography, branding, solo",
      award: "1st Prize, Photography & Layout, Crossmedia",
      key: { src: `${W}/untitled/page-01.jpg`, fit: "contain", bg: "black" },
      links: [{ label: "Interview, Münchner Merkur", url: "https://www.merkur.de/lokales/erding/oberding-ort29189/aussergewoehnlich-kreativ-amy-grindau-korbinian-aigner-gymnasium-92067353.html" }],
      text: [
        "My very first magazine: bilingual, for young adults, and built around the prefix UN-. Every chapter shows two sides of the same coin, so that the negative is never the only thing you see.",
        "Awarded 1st Prize in Photography & Layout at the Bavarian state media competition, and featured by Bayerischer Rundfunk and Münchner Merkur.",
      ],
      process: [
        "My role model was David Carson, who dared to break the rules of graphic design. I wanted to design without limits, and to imitate the everyday language of young people, in English and German.",
        "Six terms beginning with UN- are paired under three themes: reality (unclear, uncanny), society (uncommon, uncivil) and yin & yang (unceasing, uncool). Two transparent sheets sit between the chapters.",
        "I worked digitally and by hand at the same time: layout in Affinity Publisher, drawings in Procreate, scanned and photographed materials, and self-portraits. Everything, from concept to print, is my own.",
      ],
      blocks: [
        { type: "magazine", title: "Flip through Untitled", ratio: A4, pages: {
          cover: `${W}/untitled/page-01.jpg`,
          // a transparent sheet sits between pages 14/15 and between 30/31
          pairs: range(0, 18).map((i) => {
            const l = 4 + i * 2;
            const pair = [`${W}/untitled/page-${p2(l)}.jpg`, `${W}/untitled/page-${p2(l + 1)}.jpg`];
            if (l === 14) pair.push(`${W}/untitled/transparent-01.jpg`);
            if (l === 30) pair.push(`${W}/untitled/transparent-02.jpg`);
            return pair;
          }),
          back: `${W}/untitled/page-44.jpg`,
        } },
        { type: "gallery", title: "Crossmedia award, 2022", portrait: true, items: [
          { src: `${W}/untitled/award-4.jpg`, caption: "With the certificate, Bayerischer Rundfunk" },
          { src: `${W}/untitled/award-3.jpg`, caption: "1st place, Graphic & Layout" },
          { src: `${W}/untitled/award-2.jpg`, caption: "On stage" },
        ] },
      ],
    },

    /* ------------------------------ IDENTITY ----------------------------- */
    {
      id: "sixthman", section: "Identity", title: "6th Man", kind: "Brand Identity", year: "2024 until today",
      hook: "Making basketball more accessible, one identity at a time.",
      context: "Munich basketball community & events",
      role: "Name, logo, identity, pitch deck, flyers, stickers, social",
      key: { src: `${W}/sixthman/6th-man-01.jpg`, fit: "small", bg: "orange" },
      text: [
        "The complete visual identity for a Munich-based basketball community focused on inclusive, community-driven events, developed closely with the people behind it.",
      ],
      process: [
        "The mark had to work as a sticker, on a jersey and as a tiny profile picture, so I designed it from the smallest size up: colour, consistency, scalability and print functionality first.",
        "6th Man showed me branding as both a creative and a strategic discipline.",
      ],
      blocks: [
        { type: "logos", title: "Logo iterations", items: [
          `${W}/sixthman/6th-man-01.jpg`, `${W}/sixthman/6th-man-02.jpg`, `${W}/sixthman/6th-man-03.jpg`, `${W}/sixthman/6th-man-04.jpg`,
        ], scale: `${W}/sixthman/6th-man-04.jpg` },
        { type: "gallery", title: "6th Woman", centered: true, items: [
          { src: `${W}/sixthman/logo-women.jpg`, caption: "Logo" }, { src: `${W}/sixthman/savethedate-women.jpg`, caption: "Save the date" },
        ] },
        { type: "flip", title: "What is 6th Man? The flyer", note: "Click to turn the flyer over.",
          front: `${W}/sixthman/story-de.jpg`, back: `${W}/sixthman/story-en.jpg` },
        { type: "gallery", title: "Social media, an example", portrait: true, centered: true, items: [
          { src: `${W}/sixthman/savethedate-01.jpg`, caption: "Save the date, 4 vs 4 basketball festival" },
          { src: `${W}/sixthman/collage.jpg`, caption: "Collage" },
        ] },
      ],
    },
    {
      id: "graphic", section: "Identity", title: "Graphic Projects", kind: "Graphic Design", year: "2021 until today",
      hook: "Posters, flyers and booklets, made along the way.",
      context: "Exhibitions, events and non-profit organisations",
      role: "Concept, illustration, layout",
      key: { src: `${W}/loose/graphic-design-projects.jpg`, fit: "fill", bg: "pink" },
      text: [
        "Visual communication for exhibitions, events and non-profit organisations, drawn in Procreate and set in InDesign and Illustrator.",
      ],
      blocks: [
        { type: "loose", items: [
          { title: "Nostalgia", kind: "Exhibition design", src: `${W}/loose/work-4.jpg`,
            text: "Our P-Seminar exhibition explored nostalgia, a constant longing for something or someone in the past. I designed the visual identity and the poster for the show." },
          { title: "Rockin' & Rolling", kind: "Poster & invitations", src: `${W}/loose/work-6.jpg`,
            text: "Poster and invitations for the New Year's Eve party of the local Burschenverein." },
          { title: "Sundae", kind: "Foldable booklet", front: `${W}/loose/sundae-2 front.jpg`, back: `${W}/loose/sundae-01 back.jpg`,
            text: "A small booklet you fold yourself, step by step to the perfect sundae. The pink SUNDAE side is the back. Click to turn it over." },
          { title: "Yap to Vote", kind: "Poster, non-profit", src: `${W}/loose/work-1.jpg`,
            text: "A poster for a podcast on political education for young people, introducing its guests." },
          { title: "Net g'schimpft is aa scho g'lobt", kind: "Theatre flyer", front: `${W}/loose/work-3 front.jpg`, back: `${W}/loose/work-2 back.jpg`,
            text: "The flyer for the Burschenverein's theatre play, with cast, content and sponsors. Click to turn it over." },
          { title: "Solidarität für Lorenz", kind: "Instagram post", front: `${W}/loose/work-5.jpg`, back: `${W}/loose/work-5-back.jpg`,
            text: "An Instagram post for a benefit concert, with the details on the second slide. Click to turn it over." },
        ] },
      ],
    },

    /* -------------------------------- FILM ------------------------------- */
    {
      id: "theoneiwant", section: "Film", title: "The One I Want", kind: "Short Film", year: "2026",
      hook: "Attraction, routine, and the feeling of being watched.",
      context: "Introduction to Popular Art, Seoul National University",
      role: "Direction & production, screenplay, storyboard",
      team: "With Fujii Midori, Goh See Min, Paulina Temborius & Kim Woosung",
      poster: `${W}/poster-theoneiwant.jpg`,
      video: `${W}/theoneiwant/film.mp4`,
      text: [
        "A romantic thriller in contemporary Seoul: Mia's carefully structured routine unravels as harmless attention turns into the experience of being watched.",
      ],
      process: [
        "We started from the conventions of the romantic thriller, inspired by Decision to Leave and Gone Girl, and asked how attraction, routine and surveillance can slowly turn into fear.",
        "On set I worked on atmosphere, pacing and framing, so that the unease stays quiet and close.",
      ],
      blocks: [
        { type: "origin", title: "From storyboard to screen", stack: true, framesFirst: true,
          paper: [`${W}/theoneiwant/storyboard-detail.jpg`],
          frames: [`${W}/theoneiwant/still-1.jpg`, `${W}/theoneiwant/still-2.jpg`, `${W}/theoneiwant/still-3.jpg`] },
        { type: "gallery", title: "Behind the scenes", small: true, items: [
          { src: `${W}/theoneiwant/bts-1.jpg` }, { src: `${W}/theoneiwant/bts-2.jpg` },
          { src: `${W}/theoneiwant/bts-3.jpg` }, { src: `${W}/theoneiwant/bts-4.jpg` },
        ] },
      ],
    },
    {
      id: "snu80", section: "Film", title: "SNU 80th", kind: "Congratulatory Video", year: "2026",
      hook: "Sixteen seconds from eight to infinity.",
      context: "SNU 80th Anniversary Video Contest",
      role: "Concept, hand-drawn storyboards, animation, solo",
      award: "Excellence Award (Idea Award)",
      still: `${W}/still-snu80-cover.jpg`,
      pageBg: "#21325e", // the navy of the still
      video: `${W}/snu80.mp4`,
      text: [
        "The film transforms SNU's 80th anniversary into a visual journey. Beginning with a congratulatory letter, the number 8 becomes infinity, symbolizing boundless knowledge and endless possibility.",
        "It unfolds into DNA and mathematical forms, reflecting science and discovery, before taking flight as a butterfly, a symbol of growth, transformation and new generations. Its journey ends among hibiscus blossoms in a traditional Korean ink landscape, where art, nature and heritage converge.",
        "Together, these symbols celebrate SNU as a place where disciplines intertwine, honoring 80 years of learning while looking toward an infinite future.",
      ],
      process: [
        "Every transition started as a hand-drawn storyboard. Black and white ink painting keeps the symbols calm; Bach's Violin Concerto in A minor gives them energy.",
      ],
      blocks: [
        // placeholders: add your symbol images as `src`, they appear in this order
        { type: "symbols", title: "The symbols", items: [
          { label: "Mathematics" }, { label: "DNA" }, { label: "Butterfly" }, { label: "Scroll painting" }, { label: "Choice of music" },
        ] },
      ],
    },
    {
      id: "pulse", section: "Film", title: "Pulse", kind: "Short Film", year: "2024",
      hook: "A speculative film about AI, ethics and identity.",
      context: "Seminar, LMU Munich",
      role: "Cinematography, co-direction, screenplay, acting, edit, sound design",
      award: "Shown at the 4th Int. TU Kenya Conference on AI",
      team: "Directed by Pamela Brzoza, Julie Flemming, Amy Grindau, Nina Menzl, Lara Remmelberger, Josefine T. Schmid & Louis Zimmermann",
      poster: `${W}/poster-pulse.jpg`,
      video: "https://youtu.be/fbkOTVymdUk?si=jB_2hSNOJC_Msvlh",
      extras: [
        { label: "Trailer", url: "https://youtu.be/BLfj2PR6qgk?si=MgnFHE9vKI9ZQE-k" },
        { label: "Interview", url: "https://youtu.be/IM1rYukr6NM?si=sLRuh9wA5csErwQd" },
      ],
      text: [
        "Set in a fictional future scenario, PULSE delves into the profound implications of artificial intelligence on society, ethics and human identity. This artistic work, created by students of LMU Munich, reflects on the evolving relationship between humanity and technology.",
        "Produced as part of an academic seminar, PULSE was first showcased during the 4th International Technical University of Kenya, Exploring Visual Cultures Conference of Artificial Intelligence.",
        "A compelling exploration of themes like AI ethics, futurism and the human condition, this project bridges art and technology, inviting critical reflection on the impact of artificial intelligence in a rapidly changing world.",
      ],
      process: [
        "My focus was cinematography: shaping atmosphere through camera work and pacing, and in post-production through sound design.",
      ],
      blocks: [
        { type: "gallery", title: "Stills", wide: true, items: [
          { src: `${W}/pulse/still-1.jpg` }, { src: `${W}/pulse/still-2.jpg` }, { src: `${W}/pulse/still-3.jpg` },
        ] },
      ],
    },
    {
      id: "nexus", section: "Film", title: "Nexus", kind: "Short Film", year: "2024",
      hook: "A film about a gap, that breaks into genres.",
      context: "Media Technology, LMU Munich",
      role: "Co-direction, main camera, edit, light, sound, acting",
      award: "2 LMU Oscars, Best Movie & Best Screenplay",
      team: "Directed by Amy Grindau, Pamela Brzoza, Lara Remmelberger, Josefine T. Schmid & Louis Zimmermann",
      poster: `${W}/poster-nexus.jpg`,
      video: "https://youtu.be/xfQ1zUqHuC0?si=J0dy-uHJvYWVRujS",
      extras: [
        { label: "Trailer", url: "https://youtu.be/uDQLkw234cw?si=t2ypc60g2U4b28MC" },
        { label: "Interview", url: "https://youtu.be/JktdeEeUYTc?si=NvPtuuooIjZ4mPyg" },
      ],
      text: [
        "My first major film. Around the theme of a 'Spalt', a gap, we broke the film itself apart.",
      ],
      process: [
        "We focused entirely on the narrative level and created a gap within the genre itself. The result is a cinematic conglomerate that parodies typical film genres within one overarching story.",
        "We were awarded two LMU Oscars, for Best Screenplay and Best Movie. Thank you to everyone involved!",
      ],
      blocks: [
        { type: "gallery", title: "On set", items: [
          { src: `${W}/nexus/bw-1.jpg` }, { src: `${W}/nexus/bts-5.jpg` }, { src: `${W}/nexus/bw-2.jpg` },
          { src: `${W}/still-nexus.jpg` }, { src: `${W}/nexus/bw-3.jpg` }, { src: `${W}/nexus/bts-4.jpg` },
        ] },
        { type: "gallery", title: "Premiere, two LMU Oscars", items: [
          { src: `${W}/nexus/premiere-1.jpg` }, { src: `${W}/nexus/premiere-2.jpg` }, { src: `${W}/nexus/premiere-3.jpg` },
        ] },
      ],
    },

    /* ----------------------------- INTERACTION --------------------------- */
    {
      id: "smartscan", section: "Interaction", title: "SmartScan", kind: "AI Prototype", year: "2025",
      hook: "AI that lowers barriers instead of building new ones.",
      context: "Design Workshop 2, LMU × Digitale Hilfe München",
      role: "Craftsmanship, aesthetics, visual communication, hi-fi prototype",
      team: "Group project with Lisa Deschler, Gaman Thach & Louis Zimmermann",
      key: { src: `${W}/smartscan/final-08.jpg`, fit: "contain", bg: "black" },
      video: `${W}/smartscan/film.mp4`,
      links: [
        { label: "LMU Newsroom article", url: "https://www.lmu.de/de/newsroom/newsuebersicht/news/digitale-hilfen-fuer-aeltere-ki-ist-fuer-alle-da-86caa9b1.html" },
        { label: "Paper (ACM format, unpublished)", url: `${W}/smartscan/smartscan-paper.pdf`, download: true },
      ],
      text: [
        "An AI-supported scanning device for older adults: it simplifies difficult texts, enlarges content and reads it aloud.",
      ],
      process: [
        "Interviews with older adults about technology, usability worries and scepticism towards AI shaped both the interaction and the physical form: accessible, simple, familiar.",
        "I focused on the craftsmanship and aesthetics of the final prototype, so that it feels like a familiar object rather than a piece of technology.",
      ],
      blocks: [
        { type: "video", title: "Video presentation" },
        { type: "imageText", title: "The presentation", src: `${W}/smartscan/presentation.jpg`, text: [
          "Our group had the opportunity to present SmartScan at LMU, and it became one of the most applauded projects of the evening: a scanner with haptic buttons that scans complicated documents and explains them clearly, from instruction manuals to letters from the authorities.",
          "Social media marketing would not reach our target group, so we shot a teleshopping video instead, with a special price and charming hosts.",
          "The audience reacted right away. An older woman asked: “Can you already buy it?”",
        ] },
        { type: "image", title: "From lo-fi to hi-fi", src: `${W}/smartscan/final-06.jpg`, wide: true },
      ],
    },
    {
      id: "treasurechest", hidden: true, // removed for now, until there are better photos and video
      section: "Interaction", title: "AI Treasure Chest", kind: "Installation", year: "2025",
      hook: "A chest that closes when you come closer.",
      context: "Practical Interactive Media, LMU × Deutsches Museum",
      role: "Concept, interaction design, hardware, exhibit",
      team: "Group project with Louis Zimmermann",
      key: { src: `${W}/treasurechest/photo-2.jpg`, fit: "cover" },
      video: `${W}/treasurechest/film.mp4`,
      text: [
        "An antique-style chest that shuts as visitors approach, a tangible metaphor for the black box of artificial intelligence.",
      ],
      blocks: [],
    },
  ],
};
