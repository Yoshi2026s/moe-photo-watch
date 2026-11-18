"""Read public schedules and emit leads for official verification; never publish."""
import argparse
from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from html.parser import HTMLParser
import json
import re
from unicodedata import normalize
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

SMOOTH = "https://www.smooth-tokyo.jp/schedule/index.html"
SOFMAP = "https://a.sofmap.com/contents/?id=event&sid=schedule"
ESTYLE = "https://estylephoto.grupo.jp/calendar/"
ALIASES = ("雪餅羽もえ", "のわんもえ", "moe_moechan121", "moenowan", "nowanmoe")
SERIES = "グラドルあおてんじょ"
JST = timezone(timedelta(hours=9))


def compact(text):
    return re.sub(r"\s+", "", normalize("NFKC", text)).casefold()


def has_model(text):
    return any(alias in compact(text) for alias in ALIASES)


class Page(HTMLParser):
    """Collect visible text, links and sections separated by horizontal rules."""

    def __init__(self, source):
        super().__init__()
        self.sections = [([], [])]
        self.anchor = None
        self.inert = None
        self.feed(source)
        self.close()

    def handle_starttag(self, tag, attrs):
        if self.inert:
            return
        if tag in {"script", "style", "template"}:
            self.inert = tag
        elif tag == "hr":
            self.anchor = None
            self.sections.append(([], []))
        elif tag == "a":
            attrs = dict(attrs)
            self.anchor = [attrs.get("href") or "", attrs.get("title") or ""]
            self.sections[-1][1].append(self.anchor)

    def handle_endtag(self, tag):
        if tag == self.inert:
            self.inert = None
        elif tag == "a" and not self.inert:
            self.anchor = None

    def handle_data(self, data):
        if not self.inert:
            self.sections[-1][0].append(data)
            if self.anchor is not None:
                self.anchor[1] += " " + data

    def links(self):
        return (link for _, links in self.sections for link in links)


def safe_link(base, href, host, path):
    url = urlsplit(urljoin(base, href))
    if url.scheme == "https" and url.netloc == host and re.fullmatch(path, url.path):
        return url._replace(query="", fragment="").geturl()
    return None


def decode(body, charset=None):
    meta = re.search(rb"""<meta\b[^>]*charset\s*=\s*['"]?([\w-]+)""", body[:8192], re.I)
    declared = charset or (meta[1].decode("ascii") if meta else "utf-8-sig")
    if declared.lower().replace("-", "_") in {"shift_jis", "shiftjis", "sjis", "windows_31j"}:
        declared = "cp932"
    return body.decode(declared, errors="strict")


def fetch(url):
    request = Request(url, headers={"User-Agent": "moe-photo-watch public schedule reader"})
    with urlopen(request, timeout=12) as response:
        if urlsplit(response.url).netloc != urlsplit(url).netloc:
            raise ValueError("unexpected redirect")
        if response.headers.get_content_type() not in {"text/html", "application/xhtml+xml"}:
            raise ValueError("unexpected content type")
        body = response.read(2_000_001)
        if len(body) > 2_000_000:
            raise ValueError("page size limit")
        return decode(body, response.headers.get_content_charset())


def month_start(today, offset):
    year, month = divmod(today.year * 12 + today.month - 1 + offset, 12)
    return date(year, month + 1, 1)


def discover(today, read=fetch):
    month = month_start(today, -3)
    since = month.replace(day=min(today.day, monthrange(month.year, month.month)[1]))
    result = {"since": since.isoformat(), "candidates": [], "coverage": []}

    def scan(url, extract):
        try:
            rows = list(extract(Page(read(url))))
        except HTTPError as error:
            result["coverage"].append({"url": url, "status": f"http_{error.code}"})
        except (OSError, ValueError, LookupError):
            result["coverage"].append({"url": url, "status": "unavailable"})
        else:
            result["coverage"].append({"url": url, "status": "read", "matches": len(rows)})
            return rows
        return []

    def weeks(page):
        for href, label in page.links():
            url = safe_link(SMOOTH, href, "www.smooth-tokyo.jp", r"/schedule/index_\d{4}-\d{4}\.html")
            days = re.findall(r"(\d{4})年(\d{1,2})月(\d{1,2})日", label)
            if url and days and date(*map(int, days[-1])) >= since:
                yield url

    def smooth_details(page):
        for lines, links in page.sections:
            if not has_model(" ".join(lines)):
                continue
            # Multiple model details in one section are ambiguous; leave them to the monitor.
            urls = {url for href, _ in links if (url := safe_link(
                SMOOTH, href, "www.smooth-tokyo.jp",
                r"/schedule/detail/\d{4}-\d{2}-\d{2}_\d+\.html",
            ))}
            if len(urls) == 1:
                url = next(iter(urls))
                day = date.fromisoformat(urlsplit(url).path.rsplit("/", 1)[-1][:10])
                if day >= since:
                    yield {"url": url, "date_hint": day.isoformat()}

    def sofmap_tickets(page):
        for href, label in page.links():
            if has_model(label) or SERIES in compact(label):
                url = safe_link(SOFMAP, href, "livepocket.jp", r"/e/[\w-]+/?")
                if url:
                    yield {"url": url}

    def estyle_details(page):
        for href, label in page.links():
            if has_model(label):
                url = safe_link(ESTYLE, href, "estylephoto.grupo.jp", r"/calendar/view/\d+/?")
                if url:
                    yield {"url": url}

    # No future cutoff for the published Smooth week links.
    scans = [(url, smooth_details) for url in dict.fromkeys(scan(SMOOTH, weeks))]
    scans.append((SOFMAP, sofmap_tickets))
    # Check the rolling history and the next month, plus any later month linked by the organizer
    # through the normal calendar navigation (documented in OPERATIONS.md).
    scans.extend((f"{ESTYLE}{m.year}/{m.month:02}", estyle_details)
                 for offset in range(-3, 2) if (m := month_start(today, offset)))
    seen = set()
    for origin, extract in scans:
        for lead in scan(origin, extract):
            if lead["url"] not in seen:
                seen.add(lead["url"])
                result["candidates"].append({"found_at": origin, **lead})
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--today", type=date.fromisoformat, default=datetime.now(JST).date())
    print(json.dumps(discover(parser.parse_args().today), ensure_ascii=True, indent=2))
