# Release Notes - v2.4.3

## 🐛 Hotfix

### Docker Build Fix
- **Fixed Helm Installation**: Replaced unreliable manual Helm installation with the official Helm installation script
- **Improved Reliability**: Uses `curl` and the official `get-helm-3` script from Helm's GitHub repository
- **Multi-Architecture Support**: Maintains support for both amd64 and arm64 architectures

### Technical Details
- Switched from manual tarball extraction to official Helm installation script
- Resolves Docker build failures in GitHub Actions
- Ensures consistent Helm v3.15.4 installation across all platforms

## 🔧 Bug Fixes
- Fixed Docker build step that was failing during Helm installation
- Resolved exit code 4 error in GitHub Actions release workflow

---

**Full Changelog**: https://github.com/tsviz/arc-config-mcp/compare/v2.4.2...v2.4.3