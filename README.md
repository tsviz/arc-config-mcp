# ARC Config MCP Server

A comprehensive TypeScript MCP (Model Context Protocol) server for GitHub Actions Runner Controller (ARC) management with AI-powered automation for Kubernetes-based GitHub Actions runners.

## 🚀 Features

- **🤖 Natural Language Operations**: "Install ARC", "Scale runners", "Check status"
- **⚡ Automated Installation**: One-command ARC setup with intelligent configuration
- **📊 Real-time Monitoring**: Live status updates and health checks
- **🔒 Security & Compliance**: Built-in policy validation and security assessments
- **💰 Cost Optimization**: Intelligent scaling and resource management
- **🛠️ Advanced Troubleshooting**: Self-healing capabilities and diagnostic tools

## 📋 Prerequisites

- Node.js 18+ 
- Kubernetes cluster access
- GitHub Personal Access Token
- Docker (for local Kubernetes)

## 🛠️ Installation

1. **Clone and Setup**:
   ```bash
   git clone https://github.com/tsviz/arc-config-mcp.git
   cd arc-config-mcp
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your GitHub token and settings
   ```

3. **Build the Project**:
   ```bash
   npm run build
   ```

## 🚀 Usage

### Standalone HTTP Server
```bash
npm start -- --http --port=3000
```

### MCP Client Integration
```bash
# For VS Code with GitHub Copilot
npm start
```

### Natural Language Commands
- "Install ARC in my cluster"
- "Scale runners to 5 replicas"
- "Check ARC status"
- "Show runner health"

## 🔧 Configuration

### VS Code Integration
Add to your VS Code `mcp.json`:
```json
{
  "name": "arc-config-mcp",
  "command": "node",
  "args": ["/path/to/arc-config-mcp/build/index.js"]
}
```

### Environment Variables
See `.env.example` for all configuration options.

## 🛠️ Available Tools

| Tool                           | Description                            |
| ------------------------------ | -------------------------------------- |
| `arc_process_natural_language` | Process natural language ARC commands  |
| `arc_install_controller`       | Install ARC controller in Kubernetes   |
| `arc_get_status`               | Get comprehensive ARC status           |
| `arc_scale_runners`            | Scale GitHub Actions runners           |
| `arc_validate_policies`        | Validate installation against policies |

## 📖 Development

### Scripts
- `npm run dev` - Development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests

### Project Structure
```
src/
├── index.ts              # Main server entry point
├── types/                # TypeScript type definitions
├── services/             # Core business logic
│   ├── kubernetes.ts     # Kubernetes operations
│   ├── github.ts         # GitHub API integration
│   ├── policy.ts         # Policy validation
│   └── arc-installer.ts  # ARC installation logic
└── tools/                # MCP tool implementations
    └── index.ts          # Tool registration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [ARC Config Repo](https://github.com/tsviz/arc-config-repo) - Original ARC configuration
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [GitHub Actions Runner Controller](https://github.com/actions/actions-runner-controller) - ARC project

---

**Transforming ARC operations from manual kubectl commands to conversational AI-powered automation** 🚀