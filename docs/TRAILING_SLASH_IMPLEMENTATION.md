# Trailing Slash Implementation

This document describes the implementation of trailing slash handling to avoid 301 redirects on GitHub Pages, which can cause performance issues (up to 20-60% overhead).

## What Was Implemented

### 1. Astro Configuration
- Added `trailingSlash: 'always'` to `astro.config.ts`
- This ensures Astro generates URLs with trailing slashes

### 2. Helper Function
- Created `ensureTrailingSlash()` function in `src/lib/utils.ts`
- This function:
  - Adds trailing slashes to internal URLs
  - Preserves query strings and hash fragments
  - Doesn't modify external URLs, anchor-only links, or files with extensions
  - Handles edge cases like `/search?q=test#results`

### 3. Component Updates
- **Link.astro**: Automatically applies `ensureTrailingSlash()` to all internal links
- **Breadcrumbs.astro**: Uses `ensureTrailingSlash()` for breadcrumb links
- **consts.ts**: Updated `NAV_LINKS` to have trailing slashes

### 4. Test Suite
- Created `src/lib/utils.test.ts` - Unit tests for the `ensureTrailingSlash()` function
- Created `src/lib/trailing-slash.test.ts` - Integration test that scans all MDX files for hardcoded links without trailing slashes
- Added `vitest.config.ts` for test configuration
- Added test scripts to `package.json`

## Next Steps

### Install Dependencies

You need to install the test dependencies:

```bash
npm install --save-dev vitest @vitest/ui glob
```

### Run Tests

After installing dependencies, you can run the tests:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

The test suite will:
1. Verify that `ensureTrailingSlash()` works correctly for all edge cases
2. Scan all MDX files in `src/content/blog/` and report any hardcoded links without trailing slashes

### Fix Any Test Failures

If the MDX test finds links without trailing slashes, you'll need to update them manually in your MDX files. The test will show you exactly which files and lines need to be fixed.

## How It Works

1. **Automatic Link Processing**: The `Link.astro` component automatically adds trailing slashes to all internal links, so you don't need to manually update every link in your components.

2. **MDX Content**: For links in MDX files (blog posts), the test will catch any hardcoded links that don't have trailing slashes. You'll need to manually fix these.

3. **Performance Impact**: By avoiding 301 redirects, your site will:
   - Load pages 14-60ms faster (depending on network conditions)
   - Eliminate font flicker issues
   - Improve browser prefetching and caching

## Example

Before:
```markdown
[My Article](/blog/my-article)
```

After:
```markdown
[My Article](/blog/my-article/)
```

The `Link` component handles this automatically, but hardcoded links in MDX need to be updated manually.

## References

This implementation is based on the tutorial: "Avoiding the Trailing Slash Tax on Github Pages and Astro" by Can Duruk.
