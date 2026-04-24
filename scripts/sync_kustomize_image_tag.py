#!/usr/bin/env python3
import sys
from pathlib import Path


def fail(message: str) -> None:
    raise SystemExit(message)


def normalize_image_name(value: str) -> str:
    return value.strip().strip('"').strip("'")


def main() -> None:
    if len(sys.argv) != 4:
        fail("usage: sync_kustomize_image_tag.py <kustomization.yaml> <image-name> <new-tag>")

    kustomization_path = Path(sys.argv[1])
    image_name = sys.argv[2]
    new_tag = sys.argv[3]

    if not kustomization_path.exists():
        fail(f"kustomization file not found: {kustomization_path}")

    lines = kustomization_path.read_text().splitlines()
    current_image = None
    updated = False

    for index, line in enumerate(lines):
        stripped = line.strip()

        if stripped.startswith("- name:"):
            current_image = normalize_image_name(stripped.split(":", 1)[1])
            continue

        if stripped.startswith("name:"):
            current_image = normalize_image_name(stripped.split(":", 1)[1])
            continue

        if current_image == image_name and stripped.startswith("newTag:"):
            indent = line[: len(line) - len(line.lstrip())]
            lines[index] = f"{indent}newTag: {new_tag}"
            updated = True
            break

    if not updated:
        fail(f"image '{image_name}' not found in {kustomization_path}")

    kustomization_path.write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
