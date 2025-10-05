<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# ARC MCP Server - GitHub Copilot Instructions

## Project Overview
This is a comprehensive TypeScript MCP (Model Context Protocol) server for GitHub Actions Runner Controller (ARC) management. The server provides AI-powered automation for Kubernetes-based GitHub Actions runners with enterprise-grade tooling.

## Key Features
- 🤖 Natural language ARC operations ("Install ARC", "Scale runners", "Check status")
- 🚀 Automated installation and configuration
- 📊 Intelligent monitoring and health checks
- 🔒 Built-in security policies and compliance
- 💰 Cost optimization and resource management
- 🛠️ Advanced troubleshooting and self-healing

## Development Guidelines

### Architecture Principles
- **Tool-based design**: Each major operation is a separate MCP tool
- **Service layer**: Reusable services for Kubernetes, GitHub, policies
- **Template-driven**: Configuration templates for consistency
- **AI-enhanced**: Natural language processing for user interactions

### Code Organization
- `src/tools/`: MCP tool implementations
- `src/services/`: Core business logic services
- `src/templates/`: Configuration templates
- `src/utils/`: Shared utilities

### Naming Conventions
- Tools: `arc_[operation]` (e.g., `arc_install_controller`)
- Services: PascalCase classes (e.g., `KubernetesService`)
- Files: kebab-case (e.g., `arc-installer.ts`)

### Error Handling
- Always provide helpful error messages
- Include remediation suggestions
- Log structured data for debugging

### Testing
- Unit tests for all services
- Integration tests for tool workflows
- Mock external dependencies

## Progress Tracking

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [ ] Clarify Project Requirements
- [ ] Scaffold the Project  
- [ ] Customize the Project
- [ ] Install Required Extensions
- [ ] Compile the Project
- [ ] Create and Run Task
- [ ] Launch the Project
- [ ] Ensure Documentation is Complete