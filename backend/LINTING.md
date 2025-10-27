# Code Quality and Linting

This document describes the code quality tools and standards for the python-rag-chatagent backend.

## Linting Tools

The project uses **flake8** for Python code linting with the following standards:
- Maximum line length: 120 characters
- PEP 8 code style guidelines
- Automatic formatting with autopep8

## Installation

Install development tools:

```bash
pip install -r requirements-dev.txt
```

## Running the Linter

### Quick Check

Run the provided lint script:

```bash
python3 lint.py
```

### Manual Flake8

```bash
python3 -m flake8 . --count --statistics
```

### Auto-Fix Formatting Issues

Use autopep8 to automatically fix most formatting issues:

```bash
python3 -m autopep8 --in-place --aggressive --aggressive --recursive .
```

## Configuration

Linting configuration is stored in `.flake8`:
- Line length: 120 characters max
- Excludes: `__pycache__`, `.git`, `venv`, `data/`, etc.
- Some rules are ignored for compatibility (E203, W503)
- Long lines in string literals (E501) are allowed
- Complex functions (C901) warnings are informational only

## Pre-commit Best Practices

Before committing code:
1. Run `python3 lint.py` to check for issues
2. Fix any reported errors
3. Consider running autopep8 if many formatting issues exist
4. Verify your changes don't break existing functionality

## Continuous Improvement

While the current configuration allows some leniency for existing code:
- New code should aim for simpler functions (avoid high complexity)
- Break up long lines where practical
- Follow PEP 8 guidelines for new code
