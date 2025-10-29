# Release Notes - v2.4.1

## 🚀 What's New

### 🔧 Bug Fixes & Improvements

- **Fixed Auto-scaling Range Parsing**: Properly parse user inputs like "deploy runners min 25 max 40" and "20-40 range"
- **Fixed Scaling Tool**: The `arc_scale_runners` tool now actually performs Kubernetes operations instead of returning fake success messages
- **Improved GitHub Copilot Integration**: Enhanced tool descriptions and parameter schemas for better tool selection
- **Enhanced GITHUB_ORG Override**: Environment variable `GITHUB_ORG` now takes absolute precedence over all other organization detection methods

### 📝 Enhanced User Experience

- **Cleaner Tool Descriptions**: Removed internal AI instructions from user-facing tool descriptions
- **Better Error Handling**: More informative error messages with recovery suggestions for common issues
- **Real-time Scaling Feedback**: Scaling operations now show actual before/after configurations and current pod counts

### 🛠️ Technical Improvements

- **Added GitRepositoryDetector**: New utility for robust GitHub organization detection with 4-level precedence
- **Improved Parameter Validation**: Better detection and correction of common parameter misinterpretations
- **Enhanced Logging**: More detailed logging for troubleshooting organization resolution and parameter processing

## 🔄 Migration Notes

- No breaking changes - fully backward compatible
- Existing deployments will continue to work without modification
- MCP client configuration (`mcp.json`) may need to be updated to use the new Docker image

## 🐛 Bug Fixes

- Fixed issue where scaling tool reported success but didn't actually scale runners
- Fixed auto-scaling range parsing not recognizing "X-Y" syntax
- Fixed GITHUB_ORG environment variable being ignored in favor of repo context
- Fixed tool selection issues where GitHub Copilot chose natural language processing over specific deployment tools

## 🏗️ Technical Details

**Docker Image**: `ghcr.io/tsviz/arc-config-mcp:v2.4.1`

**Key Changes**:
- Enhanced `deploy_github_runners` tool with better parameter interpretation
- Functional `arc_scale_runners` tool with real Kubernetes operations
- New `GitRepositoryDetector` utility for organization resolution
- Improved MCP tool schema formatting for better Copilot compatibility

---

**Full Changelog**: https://github.com/tsviz/arc-config-mcp/compare/v2.4.0...v2.4.1