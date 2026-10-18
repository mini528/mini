#!/usr/bin/env python3
"""Generate a sitemap after the public HTTPS domain is confirmed."""

import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from xml.etree.ElementTree import Element, SubElement, register_namespace, tostring

SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 tools/generate_sitemap.py https://your-confirmed-domain", file=sys.stderr)
        return 2

    parts = urlsplit(sys.argv[1])
    if parts.scheme != "https" or not parts.netloc or parts.query or parts.fragment:
        print("The site URL must be an HTTPS origin or base path without a query or fragment.", file=sys.stderr)
        return 2

    base = urlunsplit((parts.scheme, parts.netloc, parts.path.rstrip("/"), "", ""))
    pages = (
        "/",
        "/professionals/",
        "/programmes/",
        "/events/",
        "/resources/read-and-play-session-cards/",
        "/resources/volunteer-welcome-guide/",
        "/resources/",
        "/about/",
        "/get-involved/",
    )
    register_namespace("", SITEMAP_NAMESPACE)
    sitemap = Element(f"{{{SITEMAP_NAMESPACE}}}urlset")
    for page in pages:
        entry = SubElement(sitemap, f"{{{SITEMAP_NAMESPACE}}}url")
        SubElement(entry, f"{{{SITEMAP_NAMESPACE}}}loc").text = f"{base}{page}"

    destination = ROOT / "sitemap.xml"
    destination.write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n' + tostring(sitemap, encoding="utf-8"))
    print(f"Generated {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
