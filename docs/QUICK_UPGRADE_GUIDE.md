# Quick Package Upgrade Guide

**Quick reference for future package upgrades**

---

## 🎯 When to Upgrade

### Recommended Frequency
- **Monthly**: Check for security vulnerabilities (`npm audit`)
- **Quarterly**: Full package upgrade review
- **As Needed**: When security advisories are published

### Priority Levels
1. **🔴 Critical**: Security vulnerabilities (fix immediately)
2. **🟡 High**: Major version updates with security fixes
3. **🟢 Medium**: Minor/patch updates for bug fixes
4. **⚪ Low**: Feature updates (can wait)

---

## ⚡ Quick Upgrade Process

### 1. Pre-Upgrade Checklist
```bash
# Create backup branch
git checkout -b backup-before-upgrade-$(date +%Y%m%d)

# Test current build
npm run build

# Check current status
npm outdated
npm audit
```

### 2. Security Fixes (Do First!)
```bash
# Fix all security vulnerabilities
npm audit fix

# Test build
npm run build
```

### 3. Check What's Outdated
```bash
# See all outdated packages
npm outdated
```

### 4. Upgrade in Batches

**Batch 1: Core Framework**
```bash
npm install astro@latest react@latest react-dom@latest typescript@latest
npm run build  # Test after each batch!
```

**Batch 2: Astro Plugins**
```bash
npm install @astrojs/react@latest @astrojs/sitemap@latest @astrojs/mdx@latest @astrojs/rss@latest @astrojs/markdown-remark@latest @astrojs/check@latest
npm run build
```

**Batch 3: Styling & UI**
```bash
npm install tailwindcss@latest @tailwindcss/vite@latest tailwind-merge@latest lucide-react@latest
npm run build
```

**Batch 4: Remaining Packages**
```bash
npm install prettier@latest prettier-plugin-tailwindcss@latest radix-ui@latest remark-emoji@latest
npm run build
```

**Batch 5: Major Version Updates (Be Careful!)**
```bash
# Check changelog first for breaking changes
npm install astro-expressive-code@latest @expressive-code/plugin-collapsible-sections@latest @expressive-code/plugin-line-numbers@latest
npm run build
```

### 5. Final Verification
```bash
# Check everything is up to date
npm outdated  # Should return nothing

# Verify security
npm audit  # Should show 0 vulnerabilities

# Final build test
npm run build

# Verify patch still works
npm run postinstall
```

### 6. Commit & Deploy
```bash
# Stage changes
git add package.json package-lock.json

# Commit with descriptive message
git commit -m "chore: upgrade packages and fix security vulnerabilities

- [List major updates]
- Fix X security vulnerabilities
- All packages now up to date"

# Push to main
git push origin main
```

---

## 🚨 Important Notes

### ⚠️ Never Upgrade These Without Testing
- **rehype-pretty-code**: Has custom patch - test thoroughly
- **Major version jumps**: Check changelogs for breaking changes
- **Core framework**: Astro, React, TypeScript - test extensively

### ✅ Safe to Upgrade
- Patch versions (e.g., 1.2.3 → 1.2.4)
- Minor versions usually safe (e.g., 1.2.3 → 1.3.0)
- Security patches (always upgrade)

### 🔍 Always Test
- Run `npm run build` after each batch
- Check for TypeScript errors
- Verify patch still applies (`npm run postinstall`)
- Test dev server if possible (`npm run dev`)

---

## 📋 Upgrade Checklist

- [ ] Create backup branch
- [ ] Test current build works
- [ ] Run `npm audit fix` for security
- [ ] Test build after security fixes
- [ ] Check `npm outdated` for remaining updates
- [ ] Upgrade in batches (core → plugins → others)
- [ ] Test build after each batch
- [ ] Verify patch still works (`npm run postinstall`)
- [ ] Final `npm outdated` check (should be empty)
- [ ] Final `npm audit` check (should be 0 vulnerabilities)
- [ ] Commit with descriptive message
- [ ] Push to main
- [ ] Verify deployment on Cloudflare Pages

---

## 🐛 Troubleshooting

### Build Fails After Upgrade
```bash
# Rollback to backup branch
git checkout backup-before-upgrade-YYYYMMDD
git checkout main
git reset --hard backup-before-upgrade-YYYYMMDD
```

### Patch Fails to Apply
```bash
# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
npm run postinstall
```

### TypeScript Errors
```bash
# Update type definitions
npm install @types/react@latest @types/react-dom@latest
```

### Security Vulnerabilities Remain
```bash
# Try manual fix
npm audit fix --force  # Use with caution!
# Or update specific package
npm install package-name@latest
```

---

## 📊 Upgrade Frequency Guidelines

| Package Type | Frequency | Priority |
|-------------|-----------|----------|
| Security patches | Immediately | 🔴 Critical |
| Astro core | Quarterly | 🟡 High |
| React/TypeScript | Quarterly | 🟡 High |
| Astro plugins | Monthly | 🟢 Medium |
| UI libraries | Quarterly | 🟢 Medium |
| Dev tools | As needed | ⚪ Low |

---

## 💡 Pro Tips

1. **Read changelogs** for major version updates
2. **Test incrementally** - don't upgrade everything at once
3. **Keep backups** - always create a backup branch first
4. **Monitor security** - set up GitHub Dependabot if possible
5. **Document issues** - note any problems encountered

---

## 🔗 Useful Commands

```bash
# Check outdated packages
npm outdated

# Check security vulnerabilities
npm audit

# Fix security issues automatically
npm audit fix

# Update all packages to latest (use with caution!)
npm update

# Check what changed in package-lock.json
git diff package-lock.json

# View package info
npm info package-name

# Check package versions
npm list --depth=0
```

---

*Last Updated: November 17, 2025*

