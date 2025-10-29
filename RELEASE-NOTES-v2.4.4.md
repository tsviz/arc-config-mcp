# Release Notes - Version 2.4.4

**Release Date:** October 29, 2025

## 🔧 Hotfix: Docker Build Fix

This hotfix resolves the Docker build failures that were blocking releases since v2.4.3.

### Bug Fixes

#### Docker Build Issues
- **Fixed Helm installation in Dockerfile**: Switched from manual Helm download to Alpine package manager installation
  - Previously attempted multiple manual installation methods that failed due to DNS resolution issues with `get.helm.sh`
  - Alpine's `apk add helm` provides reliable installation across all architectures (amd64, arm64)
  - Helm v3.16.3 now installed successfully in Docker container
- **Added OpenSSL dependency**: Added `openssl` to Alpine package installation for future compatibility
- **Verified multi-platform builds**: Confirmed working Docker builds for both linux/amd64 and linux/arm64

### Technical Details

#### Docker Build Process
- **Before**: Manual Helm download from GitHub releases or get-helm-3 script
  - Failed with DNS resolution errors: "Could not resolve host: get.helm.sh"
  - GitHub releases returned 404 errors for expected download URLs
- **After**: Alpine package manager installation
  - Simple `apk add --no-cache helm` command
  - Reliable across all supported architectures
  - Automatically handles dependencies and permissions

#### Local Testing
- Implemented local Docker build testing with `docker build -t arc-config-test .`
- Verified Helm v3.16.3 and kubectl v1.34.1 installations
- Confirmed multi-stage build process completes successfully

### Deployment
- All core MCP functionality remains unchanged
- Docker images now build successfully in GitHub Actions
- Ready for automated release pipeline

### Dependencies
- **Helm**: v3.16.3 (via Alpine packages)
- **kubectl**: v1.34.1 (latest stable)
- **Node.js**: 18-alpine base image
- **Alpine Linux**: v3.21 with required CLI tools

---

**Previous Issues Resolved:**
- v2.4.1: Fixed auto-scaling range parsing and GITHUB_ORG precedence
- v2.4.2: Attempted Helm installation via get-helm-3 script (failed)
- v2.4.3: Attempted Helm installation via GitHub releases (failed)
- v2.4.4: **Successfully resolved Docker build issues** ✅