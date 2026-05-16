# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Tagent, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email: **security@tagent.io**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 5 business days
- **Fix timeline:** depends on severity (critical: 7 days, high: 14 days, medium: 30 days)

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes (current development) |

## Security Design Principles

Tagent is built with security as a core requirement:

### Local-Only AI

- All AI processing runs on local models (Ollama)
- No cluster data is ever sent to external APIs
- Works in air-gapped environments

### Kubernetes RBAC

- Tagent uses least-privilege RBAC by default
- Read-only mode is the default
- Destructive actions always require human approval
- Namespace allowlists/denylists are configurable

### Authentication

- JWT-based authentication with rotating secrets
- OIDC provider support (Auth0, Okta, Keycloak, GitHub)
- Service account tokens for automation

### Audit Logging

- Every API call is logged (who, when, what, result)
- Every remediation action is logged immutably
- Every AI decision is logged (input, output, confidence)
- Logs are tamper-evident

### Secrets

- Secrets stored in Kubernetes Secrets (encrypted at rest)
- Enterprise: HashiCorp Vault integration
- Never stored in environment variables, ConfigMaps, or git

### Network

- NetworkPolicies enforce zero-trust between services
- TLS for all inter-service communication
- Ingress with TLS termination

### Container Security

- Non-root containers
- Read-only root filesystem where possible
- No privilege escalation
- Distroless base images
- CVE scanning (Trivy) on every build
- SBOM generated per image

## Dependency Management

- Dependabot enabled for automated updates
- `govulncheck` runs in Go CI
- `pip-audit` runs in Python CI
- `npm audit` runs in Node CI
- Critical CVEs block releases

## Disclosure Policy

We follow coordinated disclosure. Once a fix is available, we will:
1. Release a patched version
2. Publish a security advisory on GitHub
3. Credit the reporter (unless they prefer anonymity)
