# Crosschain Hub GitHub Actions Secrets

# Required secrets to configure in GitHub repository settings:

## Container Registry
- GHCR_TOKEN: GitHub Personal Access Token with packages:write scope
- GITHUB_USER: Your GitHub username

## AWS (for ECS deployment)
- AWS_ACCESS_KEY_ID: AWS Access Key for CI/CD
- AWS_SECRET_ACCESS_KEY: AWS Secret Access Key
- AWS_REGION: eu-central-1

## Docker Hub (alternative)
- DOCKER_USERNAME: Docker Hub username
- DOCKER_PASSWORD: Docker Hub password or access token

## Slack Notifications
- SLACK_WEBHOOK: Slack webhook URL for deployment notifications
- DISCORD_WEBHOOK: Discord webhook URL for notifications
- ENTERPRISE_SLACK_WEBHOOK: Slack webhook for enterprise deployments

## Security
- CRATES_IO_TOKEN: crates.io API token for publishing
- GITLEAKS_LICENSE: Gitleaks license key

## Kubernetes (Enterprise)
- KUBECONFIG_ENTERPRISE: Base64 encoded kubeconfig for enterprise cluster

## Optional
- CODECOV_TOKEN: Codecov token for coverage reporting
