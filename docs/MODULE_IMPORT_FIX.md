# Module Import Error Fix - Root Cause Analysis

## Problem
The Streamlit UI deployed on Render was failing with:
```
ModuleNotFoundError: No module named 'src'
```

When trying to import:
```python
from src.agent.graph import F1AgentGraph
```

## Root Cause

The fundamental issue is that **Python cannot find the `src` module** because it's not in the Python module search path (`sys.path`).

### Why This Happens

1. **Project Structure**: The project uses a `src/` layout where all Python code is under the `src` directory:
   ```
   f1-agent/
   ├── src/
   │   ├── __init__.py
   │   ├── agent/
   │   ├── api/
   │   └── ui/
   └── pyproject.toml
   ```

2. **Import Style**: The code uses absolute imports like `from src.agent.graph import ...`, which requires `src` to be a discoverable Python package.

3. **Deployment Issue**: When deploying to Render (or Docker), the Poetry installation command was:
   ```bash
   poetry install --only main --no-interaction --no-ansi
   ```
   
   However, with `pyproject.toml` containing:
   ```toml
   packages = [{include = "src"}]
   ```
   
   Poetry installs dependencies but doesn't automatically add the project root to `PYTHONPATH`.

4. **Missing PYTHONPATH**: Without `PYTHONPATH` set, Python looks for modules in:
   - The script's directory
   - Standard library locations
   - Site-packages
   
   But **NOT** in the project root where `src/` resides.

## Solutions Implemented

### Solution 1: Set PYTHONPATH Environment Variable (Render)

Updated `render.yaml` to add `PYTHONPATH` to environment variables:

```yaml
envVars:
  - key: PYTHONPATH
    value: /opt/render/project
```

This tells Python to look in the project root directory, where it can find the `src` module.

### Solution 2: Set PYTHONPATH in Dockerfile

Updated `Dockerfile` to set `PYTHONPATH` in the production stage:

```dockerfile
ENV PYTHONPATH=/app \
    ENVIRONMENT=production
```

This ensures Docker containers can resolve `src` imports.

### Solution 3: Alternative Approach (Not Used)

Could also use Poetry's editable install by removing `--no-root` flag:
```bash
poetry install --only main --no-interaction --no-ansi
```

However, this requires the project source to be available during install, which may not work with Poetry's virtual environment settings on Render.

## Why This Fix is Better Than Alternatives

### ❌ Bad Approach: Relative Imports
```python
from ..agent.graph import F1AgentGraph  # Bad!
```
- Makes code less maintainable
- Breaks when files are moved
- Doesn't work from different entry points

### ❌ Bad Approach: Sys.path Manipulation
```python
import sys
sys.path.insert(0, '/app')  # Bad!
```
- Needs to be added to every entry point
- Hardcodes paths
- Not portable across environments

### ✅ Good Approach: PYTHONPATH Environment Variable
```bash
PYTHONPATH=/app streamlit run src/ui/app.py
```
- Set once at deployment level
- Works for all imports project-wide
- Portable and standard practice
- No code changes needed

## Testing the Fix

### Locally
```bash
# Works because Poetry installs the package in development
poetry run streamlit run src/ui/app.py
```

### Docker
```bash
# Build and run with updated Dockerfile
docker-compose up ui

# Should now work because PYTHONPATH=/app is set
```

### Render
After pushing changes:
1. Render rebuilds with updated `render.yaml`
2. `PYTHONPATH` environment variable is set
3. Streamlit can now import from `src` module

## Verification

To verify the fix works, check that Python can import the module:
```python
import sys
print(sys.path)  # Should include the project root or src directory

from src.agent.graph import F1AgentGraph  # Should work now
```

## Related Files Changed

1. **render.yaml** - Added `PYTHONPATH` environment variable
2. **Dockerfile** - Added `PYTHONPATH` to ENV in production stage
3. This documentation file

## Prevention

To prevent similar issues in the future:

1. **Always test deployment locally** using the same commands as production:
   ```bash
   # Simulate Render's build and start
   poetry config virtualenvs.create false
   poetry install --only main --no-interaction --no-ansi
   PYTHONPATH=. streamlit run src/ui/app.py
   ```

2. **Use Docker for local testing** to match production environment exactly:
   ```bash
   docker-compose -f docker-compose.prod.yml up
   ```

3. **Document deployment requirements** clearly in README

4. **Consider CI/CD smoke tests** that verify imports work after deployment

## References

- [Python Module Search Path Documentation](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)
- [Poetry Package Configuration](https://python-poetry.org/docs/pyproject/#packages)
- [PYTHONPATH Environment Variable](https://docs.python.org/3/using/cmdline.html#envvar-PYTHONPATH)
