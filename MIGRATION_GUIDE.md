# Documentation Migration Guide

## What Changed

The project documentation has been consolidated from 200+ scattered markdown files into a structured, organized system.

## New Structure

```
/
├── DOCUMENTATION.md              # Main documentation (START HERE)
├── README.md                     # Project overview
├── docs-consolidated/            # Organized documentation
│   ├── README.md                # Documentation index
│   ├── architecture/            # System architecture
│   │   └── SYSTEM_OVERVIEW.md
│   ├── features/                # Feature documentation
│   │   ├── AUTHENTICATION.md
│   │   ├── STICKER_SYSTEM.md
│   │   └── OFFLINE_SUPPORT.md
│   ├── guides/                  # How-to guides
│   │   ├── FRONTEND_SETUP.md
│   │   ├── IOS_SETUP.md
│   │   └── TESTING.md
│   ├── fixes/                   # Bug fix documentation
│   └── archive/                 # Historical docs
├── backend/README.md            # Backend-specific docs
├── frontend/README.md           # Frontend-specific docs
└── docs-archive-YYYYMMDD.tar.gz # Archived old docs
```

## Old vs New

### Before
- 200+ scattered .md files
- Duplicate information
- Hard to find relevant docs
- No clear structure
- Mix of current and outdated info

### After
- Single main documentation file
- Organized by category
- Easy navigation
- Clear structure
- Archived historical docs

## Finding Documentation

### Quick Reference

| What you need | Where to look |
|---------------|---------------|
| Getting started | DOCUMENTATION.md |
| Setup instructions | docs-consolidated/guides/ |
| Feature details | docs-consolidated/features/ |
| Architecture | docs-consolidated/architecture/ |
| Bug fixes | docs-consolidated/fixes/ |
| Backend API | backend/README.md |
| Frontend components | frontend/src/components/*/README.md |

### Search Tips

```bash
# Search in consolidated docs
grep -r "search term" docs-consolidated/

# Search in archived docs
tar -xzf docs-archive-*.tar.gz
grep -r "search term" docs-archive-*/
```

## Cleanup Process

### What Was Archived

1. All files from `/docs` folder
2. Scattered .md files from `/frontend` (except README.md)
3. Scattered .md files from `/backend` (except README.md)
4. Root-level fix/analysis documents
5. Historical implementation notes

### What Was Kept

1. Main README.md files
2. Component-specific documentation
3. Spec files in `.kiro/specs/`
4. Service documentation in source folders

### Running Cleanup

```bash
# Review what will be archived
./cleanup-docs.sh --dry-run

# Execute cleanup
./cleanup-docs.sh

# Restore if needed
tar -xzf docs-archive-YYYYMMDD.tar.gz
```

## For Developers

### Adding New Documentation

1. **Feature documentation**: Add to `docs-consolidated/features/`
2. **How-to guides**: Add to `docs-consolidated/guides/`
3. **Architecture changes**: Update `docs-consolidated/architecture/`
4. **Component docs**: Keep with component in `src/components/*/README.md`

### Documentation Standards

- Use clear, descriptive titles
- Include code examples
- Add table of contents for long docs
- Link to related documentation
- Keep examples up-to-date
- Use consistent formatting

### Updating Main Documentation

When making significant changes:

1. Update `DOCUMENTATION.md` if it affects main workflows
2. Update relevant files in `docs-consolidated/`
3. Add entry to changelog (if exists)
4. Update README.md if needed

## For New Team Members

Start here:

1. Read `DOCUMENTATION.md` - Main reference
2. Follow setup guide in `docs-consolidated/guides/`
3. Review architecture in `docs-consolidated/architecture/`
4. Explore feature docs as needed

## Accessing Archived Documentation

If you need to reference old documentation:

```bash
# Extract archive
tar -xzf docs-archive-YYYYMMDD.tar.gz

# Browse
cd docs-archive-YYYYMMDD/

# Search
grep -r "topic" docs-archive-YYYYMMDD/
```

## Benefits

1. **Faster onboarding**: Clear starting point
2. **Better maintenance**: Organized structure
3. **Reduced duplication**: Single source of truth
4. **Easier updates**: Know where to add docs
5. **Better searchability**: Logical organization
6. **Historical reference**: Archived but accessible

## Questions?

- Check `DOCUMENTATION.md` first
- Search `docs-consolidated/`
- Review component README files
- Check archived docs if needed
- Ask team members

## Rollback

If you need to restore the old structure:

```bash
# Extract archive
tar -xzf docs-archive-YYYYMMDD.tar.gz

# Restore docs folder
mv docs-archive-YYYYMMDD/docs ./

# Restore scattered docs
cp -r docs-archive-YYYYMMDD/frontend-docs/* frontend/
cp -r docs-archive-YYYYMMDD/backend-docs/* backend/
```

Note: This will overwrite any new documentation created after the migration.
