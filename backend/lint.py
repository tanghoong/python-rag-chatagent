#!/usr/bin/env python3
"""
Lint all Python files in the backend directory.
Runs flake8 with project configuration.
"""
import subprocess
import sys
from pathlib import Path


def main():
    """Run flake8 linting on the backend directory."""
    backend_dir = Path(__file__).parent

    print("🔍 Running flake8 linter...")
    print(f"📂 Directory: {backend_dir}")
    print("-" * 60)

    result = subprocess.run(
        ["python3", "-m", "flake8", ".", "--count", "--statistics"],
        cwd=backend_dir,
        capture_output=False
    )

    print("-" * 60)
    if result.returncode == 0:
        print("✅ No linting errors found!")
    else:
        print(f"⚠️  Found linting issues (exit code: {result.returncode})")
        print("\nTo auto-fix formatting issues, run:")
        print("  python3 -m autopep8 --in-place --aggressive --aggressive --recursive .")

    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
