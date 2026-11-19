"""Save one explicitly requested chat batch. The project's release procedure follows."""

import argparse
from contextlib import contextmanager
import hashlib
from io import BytesIO
import json
import os
from pathlib import Path
import re
import tempfile

from PIL import Image, ImageCms, ImageOps


REPO = Path(__file__).resolve().parents[1]
OUTFITS = {"animal", "casual", "costume", "dress", "kimono", "swim", "uniform"}
SCENES = {"flower", "light", "luxury", "monochrome", "night", "outdoor", "pool", "retro", "school"}


def atomic_write(path, data):
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temp:
        staged = Path(temp.name)
    try:
        staged.write_bytes(data)
        staged.replace(path)
    finally:
        staged.unlink(missing_ok=True)


@contextmanager
def archive_lock(archive):
    # A process exit releases the OS lock, including after an interrupted batch.
    with (archive / ".photo-intake.lock").open("a+b") as lock:
        if os.name == "nt":
            import msvcrt
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_LOCK, 1)
        else:
            import fcntl
            fcntl.flock(lock, fcntl.LOCK_EX)
        yield


def save_original(folder, name, data, digest):
    if (not name or name in {".", ".."} or name.rstrip(" .") != name
            or re.search(r'[<>:"/\\|?*\x00-\x1f]', name)
            or re.fullmatch(r"(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?", name, re.I)):
        raise ValueError(f"無効な原本名: {name!r}")
    # Prefer the requested name, including when an older archive has duplicate files.
    first = folder / name
    for other in [first, *sorted(folder.iterdir())]:
        if other.is_file() and other.stat().st_size == len(data):
            if hashlib.sha256(other.read_bytes()).digest() == digest:
                return other
    target = first
    n = 2
    while target.exists():
        target = first.with_name(f"{first.stem} ({n}){first.suffix}")
        n += 1
    atomic_write(target, data)
    return target


def legacy_sources(archive, sizes):
    ledger = archive / "素材台帳.md"
    result = {}
    if ledger.exists():
        links = re.findall(r"^\| ([a-z0-9-]+)\.webp \| \[[^\]]+\]\(<?\./(.+?)>?\) \|$",
                           ledger.read_text(encoding="utf-8-sig"), re.M)
        for slug, link in links:
            original = (archive / link).resolve()
            if original.is_relative_to(archive) and original.is_file() and original.stat().st_size in sizes:
                result[hashlib.sha256(original.read_bytes()).digest()] = slug
    return result


def make_webp(data):
    with Image.open(BytesIO(data)) as original:
        image = ImageOps.exif_transpose(original)
        profile = image.info.get("icc_profile")
        rgba = image.convert("RGBA")
        color = rgba.convert("RGB")
        if profile:
            color_input = image if image.mode in {"RGB", "L", "CMYK", "LAB"} else color
            color = ImageCms.profileToProfile(color_input, ImageCms.ImageCmsProfile(BytesIO(profile)),
                                              ImageCms.createProfile("sRGB"), outputMode="RGB")
        rgb = Image.new("RGB", image.size, "white")
        rgb.paste(color, mask=rgba.getchannel("A"))
        rgb.thumbnail((900, 900), Image.Resampling.LANCZOS)
        rgb.info.clear()
        output = BytesIO()
        rgb.save(output, "WEBP", quality=84, method=6)
        return output.getvalue()


def refresh_imports(repo):
    for source, parent in [("photo-library.mjs", "poster-photos.mjs"), ("poster-photos.mjs", "announcement-ui.mjs"),
                           ("announcement-ui.mjs", "app.js"), ("app.js", "index.html")]:
        content = (repo / source).read_text(encoding="utf8").encode("utf8")
        version = hashlib.sha256(content).hexdigest()[:16]
        path = repo / parent
        before = path.read_text(encoding="utf8")
        after, count = re.subn(re.escape(source) + r"\?v=[\w-]+", f"{source}?v={version}", before)
        if count != 1:
            raise ValueError(f"{parent}: {source} の参照が特定できません")
        if after != before:
            atomic_write(path, after.encode("utf8"))


def intake(repo, archive, items, private_only=False):
    repo, archive = repo.resolve(), archive.resolve()
    if archive.is_relative_to(repo) or not isinstance(items, list) or not items:
        raise ValueError("公開リポジトリ外の保存先と、1件以上の添付を指定してください")
    folder = archive / "チャット添付"
    if folder.resolve().is_relative_to(repo):
        raise ValueError("原本の保存先が公開リポジトリ内です")
    folder.mkdir(parents=True, exist_ok=True)
    with archive_lock(archive):
        batch = {}
        for item in items:
            source = Path(item["source"])
            data = source.read_bytes()
            digest = hashlib.sha256(data).digest()
            saved = save_original(folder, item.get("name", source.name), data, digest)
            batch.setdefault(digest, (saved, item))
        result = {"originals": [str(saved) for saved, _ in batch.values()], "photos": [], "added": []}
        if private_only:
            return result
        path = repo / "photo-library.mjs"
        library = path.read_text(encoding="utf8")
        if not (library.startswith("export default ") and library.rstrip().endswith(";")):
            raise ValueError("素材一覧の形式を確認してください")
        rows = json.loads(library.removeprefix("export default ").rstrip()[:-1])
        slugs = {row[0] for row in rows}
        labels = {row[1] for row in rows}
        existing = legacy_sources(archive, {saved.stat().st_size for saved, _ in batch.values()})
        images = {}
        for digest, (saved, item) in batch.items():
            slug = existing.get(digest) or "chat-" + hashlib.sha256(b"gallery-v1" + digest).hexdigest()[:32]
            target = repo / "photos" / (slug + ".webp")
            result["photos"].append("photos/" + target.name)
            if slug in slugs:
                if not target.is_file():
                    raise ValueError(f"登録済み画像がありません: {slug}")
                continue
            label = item["label"].strip()
            outfits, scenes = item.get("outfits", []), item.get("scenes", [])
            if not label or not set(outfits) <= OUTFITS or not set(scenes) <= SCENES:
                raise ValueError(f"表示名・衣装・背景を確認してください: {saved.name}")
            title = label
            n = 2
            while title in labels:
                title = f"{label}（{n}）"
                n += 1
            images[target] = make_webp(saved.read_bytes())
            rows.append([slug, title, outfits, scenes])
            labels.add(title)
            slugs.add(slug)
            result["added"].append("photos/" + target.name)
        # Finish decoding the full batch first. Publish the index after its images.
        if images:
            for target, data in images.items():
                atomic_write(target, data)
            listing = ",\n".join("  " + json.dumps(row, ensure_ascii=False) for row in rows)
            atomic_write(path, ("export default [\n" + listing + "\n];\n").encode("utf8"))
        refresh_imports(repo)
        return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="チャットで素材保存を依頼された添付だけを処理する")
    parser.add_argument("batch", type=Path, help="対象添付のJSON（非公開の一時ファイル）")
    parser.add_argument("--private-only", action="store_true", help="非公開または公開保留の依頼")
    args = parser.parse_args()
    result = intake(REPO, REPO.parent / "verification/素材確認・非公開",
                    json.loads(args.batch.read_text(encoding="utf-8-sig")), args.private_only)
    print(json.dumps(result, ensure_ascii=False, indent=2))
