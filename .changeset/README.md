# Floaty Widget Changesets

This project uses [changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation.

## How to Create a Changeset

Every user-visible change should include a changeset. When you're ready to
describe a change, run:

```bash
npm run changeset
```

This will prompt you to:
1. Select which packages changed (just select `floaty-widget`)
2. Choose the version bump (patch, minor, major)
3. Write a summary of changes

Example changesets:
- **Patch**: Bug fixes, small improvements
- **Minor**: New features (backward compatible)
- **Major**: Breaking changes

## Semantic Versioning Rules

This package follows [Semantic Versioning](https://semver.org/):

- **Patch** (`0.1.0` -> `0.1.1`): bug fixes, visual polish, docs, internal refactors with no API or behavior break.
- **Minor** (`0.1.0` -> `0.2.0`): backward-compatible features, new props, new manager methods, new styling tokens.
- **Major** (`0.1.0` -> `1.0.0`): breaking API changes, removed props/methods, changed defaults that can break existing consumers.

For `0.x` releases, minor bumps may still include breaking changes before the
first stable `1.0.0`, but prefer using **major** in the changeset whenever a
consumer must change their code.

## How Releases Work

1. Create a changeset with `npm run changeset`
2. Commit and push to a branch
3. Create a Pull Request
4. The `changesets/action` will automatically:
   - Create a release PR that bumps the version
   - Update CHANGELOG.md
5. Merge the release PR to `main`
6. GitHub Actions will publish to npm and deploy Storybook

## Local Release Commands

```bash
npm run version-packages
npm run publish-packages
```

`version-packages` consumes pending changesets and updates `package.json`,
`package-lock.json`, and `CHANGELOG.md`. `publish-packages` builds the package
and publishes the generated version.
