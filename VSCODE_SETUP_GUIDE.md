# Using ARC MCP Server in VS Code

## Quick Setup Guide

### Prerequisites
- VS Code with GitHub Copilot Chat extension
- Docker Desktop running (recommended) OR Node.js 18+ with kubectl and helm installed locally

---

## Method 1: Docker (Recommended - CLI Tools Included)

### Step 1: Build the Docker Image
```bash
cd /Users/tsvi/git_projects/tsviz/arc-config-mcp
docker build -t arc-mcp-server:latest .
```

### Step 2: Configure VS Code MCP Settings

Create or edit `~/.vscode/mcp-settings.json`:

```json
{
  "mcpServers": {
    "arc-config": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "${env:HOME}/.kube/config:/home/mcp/.kube/config:ro",
        "-e",
        "GITHUB_TOKEN=${env:GITHUB_TOKEN}",
        "arc-mcp-server:latest"
      ]
    }
  }
}
```

### Step 3: Set Environment Variables (Optional)

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export GITHUB_TOKEN="ghp_your_github_personal_access_token"
```

Or set it temporarily:
```bash
export GITHUB_TOKEN="ghp_your_token"
code .
```

### Step 4: Restart VS Code

Restart VS Code to load the new MCP server configuration.

### Step 5: Test in GitHub Copilot Chat

Open Copilot Chat and try:
```
@arc-config Install ARC controller in my cluster
```

or

```
@arc-config Check my cluster status
```

---

## Method 2: NPM (Local Development)

### Step 1: Build the Project
```bash
cd /Users/tsvi/git_projects/tsviz/arc-config-mcp
npm run build
```

### Step 2: Ensure CLI Tools Are Installed

Check prerequisites:
```bash
kubectl version --client
helm version
```

If not installed:
- **kubectl**: https://kubernetes.io/docs/tasks/tools/
- **helm**: https://helm.sh/docs/intro/install/

### Step 3: Configure VS Code MCP Settings

Create or edit `~/.vscode/mcp-settings.json`:

```json
{
  "mcpServers": {
    "arc-config": {
      "command": "node",
      "args": [
        "/Users/tsvi/git_projects/tsviz/arc-config-mcp/build/index.js"
      ],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

### Step 4: Set Environment Variables

Same as Method 1, Step 3.

### Step 5: Restart VS Code and Test

Same as Method 1, Steps 4-5.

---

## Method 3: Project-Specific Configuration

If you want the MCP server only for specific projects:

### Create `.vscode/mcp.json` in your project:

```json
{
  "mcpServers": {
    "arc-config": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v",
        "${env:HOME}/.kube/config:/home/mcp/.kube/config:ro",
        "-v",
        "${workspaceFolder}:/workspace:ro",
        "-e",
        "GITHUB_TOKEN=${env:GITHUB_TOKEN}",
        "arc-mcp-server:latest"
      ]
    }
  }
}
```

This configuration:
- Mounts your kubeconfig (read-only)
- Mounts the workspace folder (read-only)
- Passes GitHub token
- Only active when this project is open

---

## Verification

### Check MCP Server Status

1. Open VS Code
2. Open Copilot Chat
3. Look for `@arc-config` in the mention suggestions
4. Try a simple command:
   ```
   @arc-config Hello
   ```

### Test CLI Tools

Ask Copilot:
```
@arc-config What version of kubectl and helm do you have?
```

Expected response should show:
- kubectl v1.34.1
- helm v3.16.4

---

## Usage Examples

### Check Cluster Status
```
@arc-config Check my Kubernetes cluster status
```

### Install ARC
```
@arc-config Install ARC controller in the arc-systems namespace
```

### List Runners
```
@arc-config Show me all runner deployments
```

### Get Logs
```
@arc-config Get logs from the ARC controller
```

### Troubleshoot
```
@arc-config Why is my runner failing?
```

### Policy Check
```
@arc-config Validate my runner configuration against security policies
```

---

## Configuration Options

### Kubernetes Context

To use a specific Kubernetes context:

```json
{
  "mcpServers": {
    "arc-config": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "${env:HOME}/.kube/config:/home/mcp/.kube/config:ro",
        "-e", "KUBECONFIG=/home/mcp/.kube/config",
        "-e", "KUBE_CONTEXT=my-production-cluster",
        "arc-mcp-server:latest"
      ]
    }
  }
}
```

### GitHub Organization

To default to a specific GitHub organization:

```json
{
  "mcpServers": {
    "arc-config": {
      "command": "docker",
      "args": ["..."],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}",
        "GITHUB_ORG": "my-org"
      }
    }
  }
}
```

### Debug Mode

To enable verbose logging:

```json
{
  "mcpServers": {
    "arc-config": {
      "command": "docker",
      "args": ["..."],
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

---

## Troubleshooting

### MCP Server Not Appearing

1. Check VS Code output panel (View → Output → Select "GitHub Copilot Chat")
2. Look for MCP connection errors
3. Verify Docker is running: `docker ps`
4. Check file permissions: `ls -la ~/.vscode/mcp-settings.json`

### Docker Permission Errors

```bash
# Add your user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# macOS - restart Docker Desktop
```

### Kubeconfig Not Found

```bash
# Verify kubeconfig exists
ls -la ~/.kube/config

# Test with kubectl
kubectl cluster-info
```

### GitHub Token Issues

```bash
# Verify token is set
echo $GITHUB_TOKEN

# Test token
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

### CLI Tools Not Working

```bash
# Verify tools in Docker image
docker run --rm arc-mcp-server:latest kubectl version --client
docker run --rm arc-mcp-server:latest helm version
```

If tools are missing, rebuild the image:
```bash
docker build --no-cache -t arc-mcp-server:latest .
```

---

## Advanced Configuration

### Multi-Cluster Setup

```json
{
  "mcpServers": {
    "arc-config-dev": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "${env:HOME}/.kube/config:/home/mcp/.kube/config:ro",
        "-e", "KUBE_CONTEXT=dev-cluster",
        "arc-mcp-server:latest"
      ]
    },
    "arc-config-prod": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "${env:HOME}/.kube/config:/home/mcp/.kube/config:ro",
        "-e", "KUBE_CONTEXT=prod-cluster",
        "arc-mcp-server:latest"
      ]
    }
  }
}
```

Usage:
```
@arc-config-dev Install ARC controller
@arc-config-prod Check runner status
```

### Custom Policies

Mount custom policy files:

```json
{
  "mcpServers": {
    "arc-config": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "${env:HOME}/.kube/config:/home/mcp/.kube/config:ro",
        "-v", "${workspaceFolder}/policies:/app/policies:ro",
        "arc-mcp-server:latest"
      ]
    }
  }
}
```

---

## Best Practices

### Security
- ✅ Always use read-only mounts for kubeconfig (`:ro`)
- ✅ Never commit GitHub tokens to version control
- ✅ Use environment variables for sensitive data
- ✅ Run as non-root user (Docker image already configured)

### Performance
- ✅ Use Docker method for consistency
- ✅ Build image once, use everywhere
- ✅ Keep kubeconfig file optimized (remove unused contexts)

### Development
- ✅ Use project-specific `.vscode/mcp.json` for team sharing
- ✅ Document custom configurations in project README
- ✅ Test changes with `npm run build` before Docker rebuild

---

## Next Steps

1. ✅ Complete this setup guide
2. Test with your actual Kubernetes cluster
3. Run a full ARC installation
4. Explore all available MCP tools
5. Share feedback and suggestions

---

## Resources

- **ARC Documentation**: https://github.com/actions/actions-runner-controller
- **kubectl Reference**: https://kubernetes.io/docs/reference/kubectl/
- **helm Documentation**: https://helm.sh/docs/
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Project Documentation**: See `LOCAL_TESTING_SUCCESS.md` and `CLI_INTEGRATION_SUMMARY.md`

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the comprehensive documentation in the project
3. Open an issue on GitHub
4. Check MCP server logs in VS Code output panel

---

**Status**: ✅ Ready for Production Use  
**Last Updated**: October 4, 2025  
**Version**: 1.4.0+cli
