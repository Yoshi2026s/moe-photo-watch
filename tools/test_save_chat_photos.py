from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory
import unittest

from PIL import Image, ImageDraw

from tools.save_chat_photos import REPO, intake, refresh_imports


class ChatPhotoTests(unittest.TestCase):
    def setUp(self):
        workspace = TemporaryDirectory()
        self.addCleanup(workspace.cleanup)
        self.root = Path(workspace.name)
        self.site = self.root / "site"
        self.archive = self.root / "private"
        (self.site / "photos").mkdir(parents=True)
        for name in ["photo-library.mjs", "poster-photos.mjs", "announcement-ui.mjs", "app.js", "index.html"]:
            shutil.copyfile(REPO / name, self.site / name)
        refresh_imports(self.site)

    def photo(self, name, color):
        path = self.root / name
        image = Image.new("RGB", (1200, 600), color)
        exif = image.getexif()
        exif[274] = 6
        exif[270] = "private caption"
        image.save(path, exif=exif)
        return {"source": str(path), "name": "添付.jpg", "label": "白い壁", "outfits": ["casual"]}

    def save(self, *photos, private=False):
        return intake(self.site, self.archive, list(photos), private)

    def test_batch_retry_and_collision(self):
        red, blue = self.photo("red.jpg", "red"), self.photo("blue.jpg", "blue")
        before = (self.site / "index.html").read_bytes()
        result = self.save(red, blue, red)
        self.assertEqual(len(result["added"]), 2)
        self.assertEqual([Path(p).name for p in result["originals"]], ["添付.jpg", "添付 (2).jpg"])
        for original, item in zip(result["originals"], [red, blue]):
            self.assertEqual(Path(original).read_bytes(), Path(item["source"]).read_bytes())
        for url in result["photos"]:
            with Image.open(self.site / url) as image:
                self.assertEqual((image.format, image.size), ("WEBP", (450, 900)))
                self.assertFalse({"exif", "xmp", "icc_profile"} & image.info.keys())
        library = (self.site / "photo-library.mjs").read_text(encoding="utf8")
        rows = json.loads(library.removeprefix("export default ").strip()[:-1])
        self.assertEqual([row[1] for row in rows[-2:]], ["白い壁", "白い壁（2）"])
        self.assertNotIn("添付.jpg", library)
        released = (self.site / "index.html").read_bytes()
        self.assertNotEqual(before, released)
        retry = self.save({**red, "name": "別名.jpg"}, blue)
        self.assertEqual(retry, {**result, "added": []})
        self.assertEqual(released, (self.site / "index.html").read_bytes())

    def test_hold_then_release_only_the_requested_photo(self):
        red, blue = self.photo("red.jpg", "red"), self.photo("blue.jpg", "blue")
        before = (self.site / "photo-library.mjs").read_bytes()
        held = self.save(red, blue, private=True)
        self.assertEqual(held["photos"], [])
        self.assertEqual(list((self.site / "photos").iterdir()), [])
        self.assertEqual((self.site / "photo-library.mjs").read_bytes(), before)
        self.assertEqual(len(self.save(red)["added"]), 1)

    def test_existing_legacy_mapping(self):
        red = self.photo("red.jpg", "red")
        original = Path(self.save(red, private=True)["originals"][0])
        (self.archive / "素材台帳.md").write_text(
            f"| garden.webp | [元写真](<./チャット添付/{original.name}>) |\n", encoding="utf8")
        shutil.copyfile(REPO / "photos/garden.webp", self.site / "photos/garden.webp")
        self.assertEqual(self.save(red)["photos"], ["photos/garden.webp"])
        self.assertEqual(self.save(red)["added"], [])

    def test_reattached_smaller_jpeg_matches_published_photo(self):
        original = REPO / "photos/garden.webp"
        shutil.copyfile(original, self.site / "photos/garden.webp")
        attachment = self.root / "smaller.jpg"
        with Image.open(original) as image:
            image.thumbnail((640, 640), Image.Resampling.LANCZOS)
            image.save(attachment, quality=84)
        result = self.save({"source": str(attachment)})
        self.assertEqual(result["photos"], ["photos/garden.webp"])
        self.assertEqual(result["added"], [])
        self.assertEqual(Path(result["originals"][0]).read_bytes(), attachment.read_bytes())
        self.assertFalse((self.archive / "素材台帳.md").exists())

    def test_two_encodings_in_one_batch_share_one_public_photo(self):
        original = REPO / "photos/garden.webp"
        attachment = self.root / "same-photo.png"
        with Image.open(original) as image:
            image.save(attachment)
        result = self.save({"source": str(original), "label": "新しい写真"}, {"source": str(attachment)})
        self.assertEqual(len(result["originals"]), 2)
        self.assertEqual(len(result["added"]), 1)
        self.assertEqual(result["photos"], result["added"] * 2)

    def test_small_but_distinct_change_in_same_composition_stays_separate(self):
        image = Image.new("RGB", (900, 600), "#71878c")
        first = self.root / "first.png"
        image.save(first)
        ImageDraw.Draw(image).rectangle((400, 320, 415, 335), fill="white")
        second = self.root / "second.png"
        image.save(second)
        result = self.save({"source": str(first), "label": "1枚目"}, {"source": str(second), "label": "2枚目"})
        self.assertEqual(len(result["added"]), 2)

    def test_invalid_image_keeps_originals_and_can_retry(self):
        red, blue = self.photo("red.jpg", "red"), self.photo("blue.jpg", "blue")
        Path(blue["source"]).write_bytes(b"invalid")
        before = (self.site / "photo-library.mjs").read_bytes()
        with self.assertRaises(OSError):
            self.save(red, blue)
        self.assertEqual(len(list((self.archive / "チャット添付").iterdir())), 2)
        self.assertEqual(list((self.site / "photos").iterdir()), [])
        self.assertEqual((self.site / "photo-library.mjs").read_bytes(), before)
        blue = self.photo("blue.jpg", "blue")
        self.assertEqual(len(self.save(red, blue)["added"]), 2)

    def test_concurrent_duplicate(self):
        red = self.photo("red.jpg", "red")
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(self.save, [red, red]))
        self.assertEqual(sum(len(result["added"]) for result in results), 1)
        self.assertEqual(len(list((self.archive / "チャット添付").iterdir())), 1)

    def test_reject_public_archive_and_unsafe_name(self):
        red = self.photo("red.jpg", "red")
        with self.assertRaises(ValueError):
            intake(self.site, self.site / "originals", [red], True)
        with self.assertRaises(ValueError):
            self.save({**red, "name": "../unsafe.jpg"}, private=True)
