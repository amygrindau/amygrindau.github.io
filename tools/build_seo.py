#!/usr/bin/env python3
"""
SEO build: run after changing data.js or index.html.

    python3 tools/build_seo.py

Writes (all from data.js + index.html, nothing to edit by hand):
  - index.html            head of the start page (title, description, link preview, structured data)
  - work/<id>/index.html  one page per project, so Google can find and show each project
  - sitemap.xml, robots.txt, 404.html

The pages look exactly like the start page; they only open on the project's spread.
"""
import html, json, os, re, subprocess, datetime, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://amygrindau.github.io"
TODAY = datetime.date.today().isoformat()
SITE_TITLE = "Amy Grindau, Creative Direction, Film & Creative Technology"
SITE_DESC = ("Portfolio of Amy Grindau, Munich-based multidisciplinary creative working internationally: "
             "creative direction, film, branding and creative technology.")

# Relevant topics per project, only what the project really is (for structured data, not visible text)
KEYWORDS = {
    "florilegium": ["Artist book", "Generative art", "TouchDesigner", "Editorial design", "Photography"],
    "printedmatter": ["Editorial design", "Publication design", "Artist books"],
    "ella": ["Editorial design", "Magazine design", "Typography"],
    "untitled": ["Magazine design", "Art direction", "Editorial design", "Photography"],
    "sixthman": ["Branding", "Visual identity", "Logo design", "Social media design"],
    "graphic": ["Graphic design", "Poster design", "Illustration"],
    "theoneiwant": ["Short film", "Film direction", "Visual storytelling", "Video production"],
    "snu80": ["Animation", "Motion design", "Visual storytelling"],
    "pulse": ["Experimental filmmaking", "Artificial intelligence", "Cinematography", "Speculative design"],
    "nexus": ["Short film", "Experimental filmmaking", "Cinematography", "Film editing"],
    "smartscan": ["Creative technology", "AI prototype", "Accessibility", "User-centered design"],
    "brewinsight": ["Content strategy", "Community growth", "Creator acquisition", "Social media strategy", "Brand strategy"],
    "treasurechest": ["Interactive installation", "Artificial intelligence", "Physical computing", "Museum exhibit", "Generative AI"],
}


# Search result text per project (about 150 characters; shown under the title in Google)
DESCRIPTIONS = {
    "florilegium": "Artist book turning 18 flower photographs from five cities into a metadata archive, with generative TouchDesigner visuals. Shown at Fukuoka Art Book Fair.",
    "printedmatter": "Publisher index for Printed Matter, New York: every page split between artist and publisher, printed on transparent sheets that layer into one another.",
    "ella": "Editorial magazine design in homage to Ella Fitzgerald: typography and layout that translate the rhythm, swing and elegance of jazz to the page.",
    "untitled": "UNTITLED, a bilingual magazine for young adults built around the prefix UN-. Art direction, layout and photography. 1st Prize, Photography & Layout.",
    "sixthman": "Brand identity for 6th Man, a Munich basketball community: name, logo, flyers, stickers and social media for inclusive, community-driven events.",
    "graphic": "Posters, flyers and booklets for exhibitions, events and non-profit organisations, illustrated in Procreate and designed in InDesign and Illustrator.",
    "theoneiwant": "Short film directed and produced at Seoul National University: a romantic thriller in which a routine unravels as attention turns into being watched.",
    "snu80": "Hand-animated congratulatory film for Seoul National University's 80th anniversary, where the number 8 becomes infinity. Excellence Award (Idea Award).",
    "pulse": "Speculative short film about artificial intelligence, ethics and identity, made at LMU Munich and screened at the 4th International TU Kenya Conference on AI.",
    "nexus": "Experimental short film about a gap that breaks the film itself into genres. Co-directed at LMU Munich, winner of two LMU Oscars incl. Best Movie.",
    "brewinsight": "Instagram content and community strategy for Brewinsight, a coffee intelligence platform: content pillars, creator acquisition and a growth loop.",
    "treasurechest": "Interactive exhibit for the Deutsches Museum: an antique-style chest labelled AI that closes as you approach, a tangible metaphor for the AI black box.",
    "smartscan": "AI prototype with Digitale Hilfe München: a scanner that simplifies, enlarges and reads documents aloud, designed with older adults for accessibility.",
}


def load_data():
    """Evaluate data.js exactly like the browser does (macOS JavaScript), return it as Python data."""
    js = r'''
ObjC.import("Foundation");
var src = $.NSString.stringWithContentsOfFileEncodingError("data.js", $.NSUTF8StringEncoding, null).js;
var window = {}; eval(src); JSON.stringify(window.PORTFOLIO);'''
    out = subprocess.run(["osascript", "-l", "JavaScript", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def e(t):  # escape for HTML attributes and text
    return html.escape(str(t or ""), quote=True)


def abs_url(path):
    return f"{SITE}/{urllib.parse.quote(path)}" if path else f"{SITE}/og-image.jpg"


def first_sentence(text):
    m = re.match(r"(.+?[.!?])(\s|$)", text or "")
    return m.group(1) if m else (text or "")


def description(p):
    if p["id"] in DESCRIPTIONS:
        return DESCRIPTIONS[p["id"]]
    text = (p.get("text") or [""])[0]
    d = text if len(text) <= 158 else first_sentence(text)
    if len(d) > 158:
        d = d[:155].rsplit(" ", 1)[0] + "…"
    award = p.get("award")
    if award and len(d) + len(award) + 2 <= 158:
        d += f" {award}."
    return d


def key_image(p):
    if p.get("poster"):
        return p["poster"]
    if p.get("still"):
        return p["still"]
    key = p.get("key") or {}
    if key.get("src"):
        return key["src"]
    if key.get("collage"):
        return key["collage"][0]
    return None


PERSON_ID = f"{SITE}/#person"
WEBSITE_ID = f"{SITE}/#website"


def person(data):
    return {
        "@type": "Person", "@id": PERSON_ID, "name": "Amy Grindau", "url": f"{SITE}/",
        "image": abs_url(data["images"]["face"]),
        "jobTitle": "Multidisciplinary Creative",
        "description": SITE_DESC,
        "email": f"mailto:{data['contact']['email']}",
        "sameAs": [data["contact"]["linkedin"]] + ([data["contact"]["instagram"]] if data["contact"].get("instagram") else []),
        "homeLocation": {"@type": "Place", "name": "Munich, Germany"},
        "affiliation": {"@type": "CollegeOrUniversity", "name": "Ludwig-Maximilians-Universität München (LMU Munich)"},
        "alumniOf": {"@type": "CollegeOrUniversity", "name": "Seoul National University"},
        "knowsAbout": ["Creative Direction", "Art Direction", "Creative Strategy", "Visual Storytelling",
                       "Video Production", "Experimental Filmmaking", "Editorial Design", "Branding and Visual Identity",
                       "Creative Technology", "Generative Art", "TouchDesigner", "AI and Digital Culture"],
        "award": ["Excellence Award (Idea Award), SNU 80th Anniversary Video Contest, 2026",
                  "Two LMU Oscars for NEXUS, Best Movie and Best Screenplay, 2024",
                  "1st Prize, Photography & Layout, Crossmedia Competition, 2022"],
    }


def website():
    return {"@type": "WebSite", "@id": WEBSITE_ID, "url": f"{SITE}/", "name": "Amy Grindau",
            "inLanguage": "en", "author": {"@id": PERSON_ID}}


def work(p, url):
    t = "Movie" if p["kind"] == "Short Film" else "Book" if p["kind"] == "Artist Book" else "CreativeWork"
    w = {"@type": t, "@id": f"{url}#work", "name": p["title"], "url": url, "description": description(p),
         "genre": p["kind"], "creator": {"@id": PERSON_ID}, "inLanguage": "en", "isPartOf": {"@id": WEBSITE_ID},
         "image": abs_url(key_image(p))}
    year = re.match(r"\d{4}", p.get("year", ""))
    if year:
        w["dateCreated"] = year.group(0)
    if p.get("award"):
        w["award"] = p["award"]
    if KEYWORDS.get(p["id"]):
        w["keywords"] = ", ".join(KEYWORDS[p["id"]])
    crumbs = {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Amy Grindau", "item": f"{SITE}/"},
        {"@type": "ListItem", "position": 2, "name": p["title"], "item": url}]}
    return [w, crumbs]


def head(title, desc, url, image, image_alt, graph, base=False, og_type="website", big_image=True):
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)
    lines = []
    if base:
        lines.append('<base href="/">')
    lines += [
        f"<title>{e(title)}</title>",
        f'<meta name="description" content="{e(desc)}">',
        f'<link rel="canonical" href="{url}">',
        '<meta name="author" content="Amy Grindau">',
        "<!-- link previews (WhatsApp, iMessage, LinkedIn, Slack, X …) -->",
        f'<meta property="og:type" content="{og_type}">',
        '<meta property="og:site_name" content="Amy Grindau">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{image}">',
        f'<meta property="og:image:alt" content="{e(image_alt)}">',
    ]
    if big_image:
        lines += ['<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">']
    lines += ['<meta name="twitter:card" content="summary_large_image">',
              f'<script type="application/ld+json">\n{ld}\n  </script>']
    return "\n  ".join(lines)


def noscript_project(p, others):
    meta = "".join(f"<dt>{k}</dt><dd>{e(v)}</dd>" for k, v in
                   [("Year", p.get("year")), ("Format", p.get("kind")), ("Context", p.get("context")),
                    ("Role", p.get("role")), ("Award", p.get("award"))] if v)
    text = "".join(f"<p>{e(t)}</p>" for t in p.get("text") or [])
    links = "".join(f'<li><a href="/work/{o["id"]}/">{e(o["title"])}</a></li>' for o in others)
    return (f'<noscript><article class="seo-fallback"><h1>{e(p["title"])}</h1><p>{e(p.get("hook"))}</p>{text}'
            f'<dl>{meta}</dl><p><a href="/">Amy Grindau, Portfolio</a></p><ul>{links}</ul></article></noscript>')


def noscript_home(data, projects):
    links = "".join(f'<li><a href="/work/{p["id"]}/">{e(p["title"])}</a>, {e(p["kind"])}, {e(p["year"])}</li>' for p in projects)
    return (f'<noscript><article class="seo-fallback"><p>{e(data["mission"])}</p>'
            f'<p><a href="/about/">About Amy Grindau</a></p><h2>Projects</h2><ul>{links}</ul></article></noscript>')


def fill(template, marker, content):
    pat = re.compile(rf"(<!-- seo:{marker}[^>]*-->)(.*?)(\s*<!-- /seo:{marker} -->)", re.S)
    assert pat.search(template), f"marker seo:{marker} missing in index.html"
    return pat.sub(lambda m: f"{m.group(1)}\n  {content}{m.group(3)}", template)


def main():
    data = load_data()
    order = data.get("order", [])
    rank = lambda p: order.index(p["id"]) if p["id"] in order else 999
    projects = [p for sec in data["sections"] for p in sorted(
        (q for q in data["projects"] if q["section"] == sec and not q.get("hidden")), key=rank)]
    path = os.path.join(ROOT, "index.html")
    template = open(path, encoding="utf-8").read()

    # start page
    home = fill(template, "head", head(SITE_TITLE, SITE_DESC, f"{SITE}/", f"{SITE}/og-image.jpg",
                                       "Amy Grindau, Portfolio: name in serif type next to a portrait on pink",
                                       [person(data), website()]))
    home = fill(home, "noscript", noscript_home(data, projects))
    open(path, "w", encoding="utf-8").write(home)

    # one page per project
    for p in projects:
        url = f"{SITE}/work/{p['id']}/"
        title = f"{p['title']}, {p['kind']} by Amy Grindau"
        img = key_image(p)
        page = fill(template, "head", head(title, description(p), url, abs_url(img),
                                           f"{p['title']}, {p['kind'].lower()} by Amy Grindau",
                                           [person(data), website()] + work(p, url),
                                           base=True, og_type="article", big_image=not img))
        page = fill(page, "noscript", noscript_project(p, [o for o in projects if o is not p]))
        # on a project page the project title is the H1, the name in the header is not
        page = page.replace('<h1 class="bar__h1">', '<p class="bar__h1">', 1).replace("</a></h1>", "</a></p>", 1)
        out = os.path.join(ROOT, "work", p["id"])
        os.makedirs(out, exist_ok=True)
        open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)

    # about page = the editor's letter, for people searching the name
    about_url = f"{SITE}/about/"
    about_desc = ("Amy Grindau is a multidisciplinary creative studying Art & Multimedia at LMU Munich, "
                  "working across creative direction, film, editorial design and creative technology.")
    profile = {"@type": "ProfilePage", "@id": f"{about_url}#page", "url": about_url, "name": "About Amy Grindau",
               "mainEntity": {"@id": PERSON_ID}, "isPartOf": {"@id": WEBSITE_ID}}
    page = fill(template, "head", head("About Amy Grindau, Multidisciplinary Creative", about_desc, about_url,
                                       f"{SITE}/og-image.jpg", "Amy Grindau, Portfolio: name in serif type next to a portrait on pink",
                                       [person(data), website(), profile], base=True, og_type="profile"))
    letter = "".join(f"<p>{e(t)}</p>" for t in data["letter"])
    timeline = "".join(f"<li>{e(y)}: {e(w)}</li>" for y, w in data["timeline"])
    page = fill(page, "noscript", f'<noscript><article class="seo-fallback"><h1>Hi, I\'m Amy Grindau</h1>{letter}'
                                  f'<p>{e(data["mission"])}</p><ul>{timeline}</ul><p><a href="/">Portfolio</a></p></article></noscript>')
    page = page.replace('<h1 class="bar__h1">', '<p class="bar__h1">', 1).replace("</a></h1>", "</a></p>", 1)
    os.makedirs(os.path.join(ROOT, "about"), exist_ok=True)
    open(os.path.join(ROOT, "about", "index.html"), "w", encoding="utf-8").write(page)

    # remove pages of projects that no longer exist or are hidden
    work_dir = os.path.join(ROOT, "work")
    for d in os.listdir(work_dir):
        if d not in {p["id"] for p in projects} and os.path.isdir(os.path.join(work_dir, d)):
            for f in os.listdir(os.path.join(work_dir, d)):
                os.remove(os.path.join(work_dir, d, f))
            os.rmdir(os.path.join(work_dir, d))

    urls = [f"{SITE}/", f"{SITE}/about/"] + [f"{SITE}/work/{p['id']}/" for p in projects]
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(
        f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
    open(os.path.join(ROOT, "404.html"), "w", encoding="utf-8").write(
        '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Page not found, Amy Grindau</title>'
        '<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=/">'
        '<script>location.replace("/")</script></head>'
        '<body><p>This page does not exist. <a href="/">Go to the portfolio</a>.</p></body></html>\n')
    for p in projects:
        n = len(description(p))
        if n > 160:
            print(f"note: description of {p['id']} is {n} characters (Google shows about 155)")
    print(f"ok: start page + {len(projects)} project pages, sitemap with {len(urls)} addresses")


if __name__ == "__main__":
    main()
