# CORS Configuration Parsing Fix

## Problem
The Streamlit UI was failing to start with the error:
```
Configuration Error: error parsing value for field "cors_allow_origins" from source "EnvSettingsSource"
```

## Root Cause

The issue was caused by Pydantic-settings' automatic JSON parsing behavior for list-type fields when loading from environment variables.

### Why This Happened

1. **Field Type Declaration**: The `cors_allow_origins` field was declared as `list[str]`
2. **Environment Variable Format**: The `.env` file had:
   ```bash
   CORS_ALLOW_ORIGINS=["http://localhost:3000","http://localhost:8501","http://localhost:8000"]
   ```
3. **Pydantic Behavior**: Pydantic-settings attempts to parse list fields as JSON automatically before any custom validators run
4. **Parsing Failure**: When the JSON parsing fails (e.g., with comma-separated values or other formats), it raises a `SettingsError`

## Solution Implemented

### 1. Changed Field Type to Union
Changed the field declarations to accept both string and list:
```python
cors_allow_origins: Union[str, list[str]] = Field(...)
tavily_include_domains: Union[str, list[str]] = Field(...)
tavily_exclude_domains: Union[str, list[str]] = Field(...)
```

This tells Pydantic to accept the value as-is without automatic JSON parsing, then our validator handles the conversion.

### 2. Added Custom Validator
Created a flexible validator that handles multiple formats:
```python
@field_validator(
    "cors_allow_origins",
    "tavily_include_domains",
    "tavily_exclude_domains",
    mode="before"
)
@classmethod
def parse_string_lists(cls, v):
    """Parse list fields from environment variables.
    
    Supports:
    - List objects (from code): ["item1", "item2"]
    - JSON strings: '["item1","item2"]'
    - Comma-separated: "item1,item2"
    - Single string: "*" or "item1"
    - Empty string: returns empty list
    """
```

### 3. Updated Environment Variable Format
Changed the `.env` file to use comma-separated format (simpler and more standard):
```bash
# Old (problematic in some cases)
CORS_ALLOW_ORIGINS=["http://localhost:3000","http://localhost:8501","http://localhost:8000"]

# New (recommended)
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:8501,http://localhost:8000
```

## Supported Formats

The validator now supports multiple formats for list environment variables:

### 1. Comma-Separated (Recommended)
```bash
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:8501,http://localhost:8000
```

### 2. JSON Array
```bash
CORS_ALLOW_ORIGINS=["http://localhost:3000","http://localhost:8501","http://localhost:8000"]
```

### 3. Single Value
```bash
CORS_ALLOW_ORIGINS=http://localhost:3000
```

### 4. Wildcard
```bash
CORS_ALLOW_ORIGINS=*
```

### 5. Empty (uses defaults from code)
```bash
# CORS_ALLOW_ORIGINS=
```

## Testing

The fix was validated with multiple format tests:
```bash
✅ Comma-separated: ['http://example.com', 'http://test.com']
✅ Wildcard: ['*']
✅ JSON format: ['http://json1.com', 'http://json2.com']
```

## Files Changed

1. **src/config/settings.py**
   - Added `Union` import
   - Changed field types to `Union[str, list[str]]`
   - Added `parse_string_lists()` validator

2. **.env**
   - Changed CORS_ALLOW_ORIGINS to comma-separated format
   - Added documentation comments

3. **docs/CORS_CONFIG_FIX.md** (this file)
   - Documentation of the fix

## Deployment Notes

### For Render
No changes needed to `render.yaml` since CORS_ALLOW_ORIGINS isn't set there. The defaults from the code will be used.

If you need to set it on Render's dashboard:
- Use comma-separated format: `http://yourapp.com,http://localhost:3000`
- Or use wildcard for development: `*`

### For Docker
The fix works automatically with any environment variable format in `docker-compose.yml` or `.env` files.

### For Local Development
Use the updated `.env` file format (comma-separated).

## Prevention

To prevent similar issues in the future:

1. **For new list fields**: Always use `Union[str, list[str]]` type and add to the validator
2. **Environment variables**: Prefer comma-separated format for lists
3. **Documentation**: Document supported formats in `.env.example`
4. **Testing**: Test environment variable parsing in CI/CD

## References

- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Field Validators](https://docs.pydantic.dev/latest/concepts/validators/)
- [Environment Variable Parsing](https://docs.pydantic.dev/latest/concepts/pydantic_settings/#parsing-environment-variable-values)
