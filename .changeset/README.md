# Floaty Widget Changesets

This project uses [changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation.

## How to Create a Changeset

When you're ready to create a release, run:

```bash
npm exec changeset
```

This will prompt you to:
1. Select which packages changed (just select `floaty-widget`)
2. Choose the version bump (patch, minor, major)
3. Write a summary of changes

Example changesets:
- **Patch**: Bug fixes, small improvements
- **Minor**: New features (backward compatible)
- **Major**: Breaking changes

## How Releases Work

1. Create a changeset with `npm exec changeset`
2. Commit and push to a branch
3. Create a Pull Request
4. The `changesets/action` will automatically:
   - Create a release PR that bumps the version
   - Update CHANGELOG.md
5. Merge the release PR to `main`
6. GitHub Actions will publish to npm and deploy Storybook

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes
