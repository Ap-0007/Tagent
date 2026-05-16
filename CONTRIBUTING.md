# Contributing to Tagent

Thank you for your interest in contributing to Tagent. This document explains how to get involved.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Run tests and linting
6. Commit with a clear message
7. Push and open a Pull Request

## Development Setup

```bash
# Clone
git clone https://github.com/YOUR-USER/Tagent.git
cd Tagent

# Start local infrastructure
docker compose -f docker-compose.dev.yml up -d

# Frontend
cd frontend/web
npm install
npm run dev

# API Gateway (Go)
cd backend/services/api-gateway
go mod tidy
go run cmd/server/main.go

# AI Engine (Python)
cd backend/services/ai-engine
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --port 8083
```

## Project Structure

```
backend/services/       Go + Python microservices
frontend/web/           Next.js dashboard
helm-charts/tagent/     Helm chart for Kubernetes deployment
deployment/             Dockerfiles and infrastructure configs
doc/                    Project documentation
scripts/                Build and setup scripts
```

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add blast radius visualization to incident detail
fix: resolve connection pool timeout in discovery service
docs: update Helm installation guide
chore: bump Go dependencies
```

Prefixes: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what and why
- Add tests for new functionality
- Ensure CI passes before requesting review
- Link related issues

## Code Style

**Go:**
- Run `gofmt` and `golangci-lint`
- Follow standard Go project layout

**Python:**
- Run `ruff` for linting
- Type hints required for public functions

**TypeScript/React:**
- Run `eslint` and `tsc --noEmit`
- Functional components only
- Tailwind CSS for styling

## Architecture Decisions

Major decisions are documented in `doc/DEVELOPMENT_ROADMAP.md` (Appendix B — Decision Log). If your contribution introduces a new dependency, framework, or architectural pattern, discuss it in an issue first.

## Hard Constraints

- **Local models only** — No cloud LLM APIs (OpenAI, Anthropic, etc.). See `doc/AI_REQUIREMENTS.md`.
- **Kubernetes-first** — All features must work in a K8s environment.
- **Safety-first** — Destructive actions always require human approval.

## Reporting Bugs

Open a GitHub Issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, K8s version, Helm version)

## Requesting Features

Open a GitHub Issue with:
- Problem description
- Proposed solution
- Alternatives considered

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.

## Questions?

Open a Discussion on GitHub or reach out on our community Discord.
