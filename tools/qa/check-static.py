#!/usr/bin/env python3
"""
BLOK — pemeriksaan statis semua halaman HTML (tanpa browser).

Memeriksa per halaman: id ganda, kelas nb-* tanpa CSS (kecuali dipakai JS
sebagai selektor), referensi aria/for yang menggantung, dan tautan/aset rusak
(termasuk #fragmen ke halaman lain). Juga melaporkan <title> ganda.

Pemakaian (dari folder neo-brutal-html/):
    python3 tools/qa/check-static.py
Keluar dengan kode 1 bila ada halaman bermasalah.
"""
import collections
import glob
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
css = "".join(open(f, encoding="utf-8").read() for f in glob.glob(ROOT + "/assets/css/*.css"))
defined = set(re.findall(r"\.(nb-[a-zA-Z0-9_-]+)", css))
js = "".join(open(f, encoding="utf-8").read() for f in glob.glob(ROOT + "/assets/js/**/*.js", recursive=True))


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.cls, self.links, self.refs = [], set(), [], []
        self.title, self._in_title = None, False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        self.cls.update((a.get("class") or "").split())
        for k in ("href", "src"):
            if a.get(k):
                self.links.append(a[k])
        for k in ("aria-controls", "aria-labelledby", "aria-describedby", "for"):
            if a.get(k):
                self.refs += a[k].split()
        if tag == "title":
            self._in_title = True

    def handle_data(self, d):
        if self._in_title:
            self.title = (self.title or "") + d

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False


def parse(path):
    p = Page()
    p.feed(open(path, encoding="utf-8").read())
    return p


pages = sorted(glob.glob(ROOT + "/*.html")) + sorted(
    f for d in ("components", "pages", "auth", "errors", "documentation") for f in glob.glob("%s/%s/*.html" % (ROOT, d))
)
titles = collections.Counter()
bad = 0
hooks = set()
for path in pages:
    x = parse(path)
    titles[x.title] += 1
    ids = set(x.ids)
    dup = [i for i, c in collections.Counter(x.ids).items() if c > 1]
    nocss = sorted(c for c in x.cls if c.startswith("nb-") and c not in defined and c not in js)
    hooks.update(c for c in x.cls if c.startswith("nb-") and c not in defined and c in js)
    dangling = [r for r in x.refs if r not in ids and r not in js]
    broken = []
    for link in x.links:
        if link.startswith("javascript:") or link == "#":
            broken.append(link)
            continue
        if re.match(r"(https?:|mailto:|tel:|data:)", link):
            continue
        if link.startswith("#"):
            if not link.startswith("#i-") and link[1:] not in ids:
                broken.append(link)
            continue
        target, _, frag = link.partition("#")
        target = os.path.normpath(os.path.join(os.path.dirname(path), target.split("?")[0]))
        if not os.path.exists(target):
            broken.append(link)
        elif frag and target.endswith(".html") and frag not in parse(target).ids:
            broken.append(link)
    rel = os.path.relpath(path, ROOT)
    if dup or nocss or dangling or broken:
        bad += 1
        print("FAIL", rel, "| id ganda:", dup, "| kelas tanpa CSS:", nocss, "| aria/for menggantung:", dangling, "| tautan rusak:", broken)
    else:
        print("ok  ", rel, "—", (x.title or "").strip())

dups = [t for t, c in titles.items() if c > 1]
print("\nhalaman diperiksa:", len(pages))
print("<title> ganda:", dups)
print("kelas hook JS (tanpa CSS, wajar):", sorted(hooks))
print("halaman bermasalah:", bad)
sys.exit(1 if bad or dups else 0)
