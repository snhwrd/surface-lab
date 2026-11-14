"""Build the static site from tracked web sources using the Python standard library."""

from pathlib import Path
from shutil import copytree, rmtree

root = Path(__file__).resolve().parent.parent
output = root / "dist"
if output.exists():
    rmtree(output)
copytree(root / "web", output)
print(f"Built {output}")
