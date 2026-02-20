# RivicQ Crosschain Hub - CI/CD Infrastructure

This directory contains the complete production-ready CI/CD infrastructure for the RivicQ Crosschain Hub.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Repository                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │    CI       │  │     CD      │  │     Security        │   │
│  │  Pipeline   │  │  Pipeline   │  │     Pipeline        │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │
└─────────┼────────────────┼────────────────────┼───────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Container Registry                           │
│              (ghcr.io/rivicq/crosschain-hub)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    Staging      │  │   Production    │  │   Enterprise    │
│    (ECS)        │  │   (ECS/EKS)     │  │   (EKS)         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Components

### Docker
- `Dockerfile` - Multi-stage build for OSS version
- `Dockerfile.enterprise` - Optimized build for enterprise version
- `docker-compose.yml` - Local development and testing

### GitHub Actions
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/cd.yml` - Continuous Deployment
- `.github/workflows/security.yml` - Security scanning
- `.github/workflows/release.yml` - Release management

### Terraform
- `terraform/main.tf` - Complete AWS infrastructure

### Helm
- `helm/crosschain-hub/` - Kubernetes deployment charts

## Getting Started

### Prerequisites
- Docker
- Terraform >= 1.6.0
- kubectl
- Helm 3
- AWS CLI
- GitHub CLI (gh)

### Local Development
```bash
# Build Docker image
docker build -t rivicq/crosschain-hub:latest .

# Run with docker-compose
docker-compose up -d

# Deploy to Kubernetes
helm install crosschain-hub ./helm/crosschain-hub
```

### Deploy Infrastructure
```bash
# Initialize Terraform
cd terraform
terraform init

# Plan deployment
terraform plan -var-file=environments/staging.tfvars

# Apply
terraform apply -var-file=environments/staging.tfvars
```

## Environments

| Environment | Type | Replicas | Resources |
|-------------|------|----------|-----------|
| Staging | ECS | 3 | 2CPU/4GB |
| Production | ECS/EKS | 3 | 2CPU/4GB |
| Enterprise | EKS | 5+ | 4CPU/8GB |

## Security Features

- Container vulnerability scanning (Trivy)
- Dependency vulnerability scanning (cargo-audit)
- CodeQL analysis
- Secret scanning (Gitleaks)
- Infrastructure scanning (checkov)
- Network policies
- Pod security policies
- TLS/SSL encryption

## Enterprise Features

- HashiCorp Vault integration
- Audit logging (S3 backend)
- Key rotation
- Rate limiting
- Multi-signature support
- Hardware wallet integration
- Advanced monitoring

## License

Copyright (c) 2024-2026 RivicQ Inc. All rights reserved.
