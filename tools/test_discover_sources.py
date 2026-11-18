from datetime import date
from unittest import TestCase
from urllib.error import HTTPError

from tools.discover_sources import ESTYLE, SMOOTH, SOFMAP, decode, discover


class DiscoveryTests(TestCase):
    def test_smooth_uses_visible_week_and_the_matching_model_block(self):
        week = "https://www.smooth-tokyo.jp/schedule/index_1228-0103.html"
        detail = "https://www.smooth-tokyo.jp/schedule/detail/2027-01-02_6.html"
        pages = {
            SMOOTH: """
                <!-- <a href="index_1123-1129.html">2026年11月29日</a> -->
                <a href="index_1228-0103.html">2026年12月28日〜2027年1月3日</a>
                <a href="index_1228-0103.html">2027年1月3日</a>""",
            week: """
                <span>雪餅羽</span>もえ
                <a href="detail/2027-01-02_6.html"><img alt="詳細"></a><hr>
                別の出演者<a href="detail/2027-01-02_7.html">詳細</a><hr>
                <script>雪餅羽もえ</script>
                <a href="detail/2027-01-02_8.html">詳細</a>""",
        }
        result = discover(date(2026, 11, 30), lambda url: pages.get(url, ""))
        self.assertEqual(result["since"], "2026-08-30")
        self.assertEqual(result["candidates"], [
            {"found_at": week, "url": detail, "date_hint": "2027-01-02"}
        ])
        self.assertEqual(sum(row["url"] == week for row in result["coverage"]), 1)

    def test_failed_source_does_not_stop_other_sources_or_confirm_cast(self):
        def read(url):
            if url == SMOOTH:
                raise HTTPError(url, 403, "Forbidden", {}, None)
            if url == SOFMAP:
                return """
                    <a href="https://livepocket.jp/e/sample?utm_source=listing">グラドルあおてんじょ～!!</a>
                    <a href="https://livepocket.jp/e/sample">グラドルあおてんじょ～!!</a>
                    <a href="https://livepocket.jp.example/e/forged">雪餅羽もえ</a>"""
            if url == ESTYLE + "2026/09":
                return '<a href="/calendar/view/1234">のわん もえ 撮影会</a>'
            return ""
        result = discover(date(2026, 11, 18), read)
        self.assertEqual(result["coverage"][0], {"url": SMOOTH, "status": "http_403"})
        self.assertEqual(result["candidates"], [
            {"found_at": SOFMAP, "url": "https://livepocket.jp/e/sample"},
            {"found_at": ESTYLE + "2026/09", "url": ESTYLE + "view/1234"},
        ])

    def test_legacy_charset_preserves_fullwidth_markers_and_name(self):
        page = '<meta http-equiv="Content-Type" content="text/html; charset=Shift_JIS">雪餅羽もえ 受付 ～'
        self.assertEqual(decode(page.encode("cp932")), page)
