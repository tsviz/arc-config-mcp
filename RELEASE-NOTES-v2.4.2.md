# Release Notes - v2.4.2

## 🔧 Hotfix Release

### 🐛 Bug Fixes

- **Fixed Docker Build Failure**: Updated Helm version from v3.16.4 to v3.14.2 to resolve Docker build issues
- **Improved Multi-architecture Support**: Fixed Helm installation for both amd64 and arm64 platforms
- **Enhanced Build Reliability**: Parameterized Helm version for easier future updates

### 📦 Technical Changes

- Updated Dockerfile to use ARG for Helm version configuration
- Changed from hardcoded v3.16.4 to stable v3.14.2
- Maintained compatibility with existing ARC workflows

## 🔄 Migration Notes

- No functional changes - purely a build fix
- Existing deployments continue to work without modification
- New Docker builds will now succeed in CI/CD pipelines

---

**Docker Image**: `ghcr.io/tsviz/arc-config-mcp:v2.4.2`

**Previous Release**: v2.4.1 (scaling and Copilot integration improvements)