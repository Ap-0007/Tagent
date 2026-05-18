# Tagent — GitHub Actions Workflows

Enterprise-grade CI/CD and repository automation for the Tagent platform.

## Workflow Summary

| # | Workflow | File | Trigger | Purpose |
|---|---------|------|---------|---------|
| 1 | **CI** | `ci.yml` | PR + push to main | Lint Go, Python, TypeScript, Helm. Build frontend. |
| 2 | **Build Images** | `build-images.yml` | Push to main + tags `v*` + manual | Multi-arch Docker builds (amd64/arm64) for all 6 services. Pushes to Docker Hub. |
| 3 | **Nightly** | `nightly.yml` | Daily 2 AM UTC | Builds all images with `:nightly` tag for testing. |
| 4 | **Release** | `release.yml` | Tag `v*` pushed | Full release: GitHub Release + changelog + Helm chart + CLI binaries (6 platforms). |
| 5 | **Security** | `security.yml` | Weekly + push to main | Trivy CVE scan, govulncheck (Go), pip-audit (Python). |
| 6 | **Stale** | `stale.yml` | Daily 4 AM UTC | Marks inactive issues/PRs stale, closes abandoned ones, auto-labels needs-triage. |
| 7 | **Lock Threads** | `lock-threads.yml` | Weekly Sunday | Locks closed issues (90d) and PRs (60d) to prevent necro-posting. |
| 8 | **PR Lifecycle** | `pr-lifecycle.yml` | PR events + comments | Welcomes first-time contributors, auto-labels PR size, slash commands. |
| 9 | **Metrics** | `metrics.yml` | Weekly Monday | Generates repository health dashboard (open issues, stale count, avg age). |
| 10 | **Sync Labels** | `sync-labels.yml` | Push to main (labels.yml) | Syncs label definitions from `.github/labels.yml` to the repo. |
| 11 | **UI · Storybook** | `ui-storybook.yml` | PR + push (frontend paths) | Builds Storybook, publishes to Chromatic, comments PR with visual review links. |
| 12 | **UI · Visual Regression** | `visual-regression.yml` | PR (frontend paths) | Captures screenshots at 3 viewports, uploads artifacts, comments PR. |
| 13 | **UI · Tests** | `frontend-tests.yml` | PR + push (frontend paths) | Unit tests, TypeScript check, ESLint, production build, bundle size. |
| 14 | **UI · Accessibility** | `accessibility.yml` | PR (frontend paths) | axe-core WCAG 2.1 AA scan on key pages, generates a11y report comment. |
| 15 | **UI · Preview** | `preview-deployments.yml` | PR (frontend paths) | Builds app, uploads preview artifact, comments PR with preview info. |

## Trigger Types

| Type | Workflows |
|------|-----------|
| Every PR | CI, Frontend Tests, Visual Regression, Accessibility, Preview, PR Lifecycle |
| Push to main | CI, Build Images, Security, Storybook |
| Tag `v*` | Build Images, Release |
| Scheduled (daily) | Nightly, Stale |
| Scheduled (weekly) | Security, Lock Threads, Metrics |
| Manual (`workflow_dispatch`) | All workflows support manual trigger |

## Required Secrets

| Secret | Used by | How to get |
|--------|---------|-----------|
| `DOCKERHUB_TOKEN` | build-images, nightly | Docker Hub → Account Settings → Security → New Access Token |
| `CHROMATIC_PROJECT_TOKEN` | ui-storybook | Chromatic → Project → Manage → Configure → Project Token |

## Path Filtering

Frontend workflows only trigger when these paths change:
- `frontend/web/src/**`
- `frontend/web/package*.json`
- `frontend/web/.storybook/**`

This prevents expensive UI builds on backend-only changes.

## Release Flow

```
Developer pushes to main
  → CI runs (lint, test, build)
  → Images built with :latest + :dev-SHA tag

Developer tags v0.3.0
  → Release workflow triggers
  → Images tagged :v0.3.0 + :latest
  → GitHub Release created with auto-changelog
  → Helm chart packaged and published to gh-pages
  → CLI binaries built for 6 platforms and uploaded
```

## Slash Commands (in PR/Issue comments)

| Command | Action | Who can use |
|---------|--------|-------------|
| `/close` | Close the issue/PR | Maintainers |
| `/reopen` | Reopen + remove stale labels | Anyone |
| `/priority critical` | Add priority label | Maintainers |
| `/area frontend` | Add area label | Anyone |

## Repository Hygiene

- Issues inactive 30 days → marked `lifecycle/stale`
- Issues inactive 44 days → auto-closed
- PRs inactive 21 days → marked stale
- PRs inactive 28 days → auto-closed
- PRs abandoned 60 days → marked `lifecycle/abandoned`
- Closed issues locked after 90 days
- Closed PRs locked after 60 days
- Unlabeled issues older than 3 days → `needs-triage`

**Protected from stale:** `lifecycle/frozen`, `priority/critical`, `priority/high`, `kind/security`, `kind/roadmap`, `good first issue`, `help wanted`
