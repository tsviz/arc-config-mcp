# ARC Cleanup/Uninstall Functionality

## Overview

The ARC MCP server includes comprehensive cleanup and uninstall functionality with AI-guided safety checks and real-time progress updates. This feature is **disabled by default** for safety and must be explicitly enabled.

## Safety Configuration

### Default Behavior (CLEANUP_ARC=false)
- Cleanup functionality is **disabled by default**
- Prevents accidental removal of ARC installations
- Shows informative message when cleanup is attempted
- Provides instructions on how to enable cleanup

### Enabling Cleanup (CLEANUP_ARC=true)
To enable cleanup functionality, you have two options:

#### Option 1: Environment Variable
Set the environment variable in your MCP configuration:
```json
{
    "servers": {
        "arc-config": {
            "command": "docker",
            "args": [
                // ... other args ...
                "-e",
                "CLEANUP_ARC=true",
                // ... rest of args ...
            ]
        }
    }
}
```

#### Option 2: Runtime Parameter
Pass the cleanup parameter when calling the tool:
```javascript
// Via natural language
"Cleanup ARC installation with cleanup=true"

// Via direct tool call
{
    "cleanup": true,
    "namespace": "arc-systems"
}
```

## Features

### 🧹 Comprehensive Cleanup
- **Runner Resources**: AutoscalingRunnerSets, RunnerDeployments, HorizontalRunnerAutoscalers
- **ARC Controller**: Helm releases, deployments, services
- **Secrets & Configs**: GitHub tokens, configuration data
- **Namespace**: Optional namespace removal with safety checks
- **Custom Resources**: Intelligent handling of CRDs

### 🤖 AI-Guided Safety Checks
- **Pre-cleanup Validation**: Analyzes cluster state before proceeding
- **Resource Discovery**: Intelligent detection of ARC components
- **Safety Warnings**: Alerts for large installations or critical resources
- **Impact Analysis**: Predicts cleanup effects before execution

### 📊 Real-Time Progress Updates
- **Live Status**: Streaming progress updates in VS Code chat
- **Phase Tracking**: Six distinct cleanup phases with individual status
- **Visual Feedback**: Progress bars and status indicators
- **AI Insights**: Contextual recommendations throughout the process

### 🛡️ Preservation Options
- **Data Preservation**: Option to backup secrets before removal
- **Selective Cleanup**: Choose which components to remove
- **Dry Run Mode**: Preview changes without executing them
- **Namespace Protection**: Preserves namespaces containing other resources

## Usage Examples

### Natural Language Commands
```text
"Cleanup ARC installation"
"Uninstall ARC with dry run"
"Remove ARC but preserve data"
"Force cleanup ARC installation"
```

### Tool Parameters
```javascript
{
    "cleanup": true,
    "namespace": "arc-systems",
    "preserveData": false,
    "dryRun": false,
    "force": false,
    "forceNamespaceRemoval": false
}
```

## Cleanup Phases

### Phase 1: Pre-cleanup Validation
- ✅ Cluster connectivity check
- 🔍 ARC component discovery
- 📊 Resource inventory analysis
- 🧠 AI safety assessment

### Phase 2: Runner Resources Cleanup
- 🏃‍♂️ AutoscalingRunnerSets removal
- 📦 RunnerDeployments cleanup
- ⚖️ HorizontalRunnerAutoscalers deletion
- ⏳ Graceful runner shutdown

### Phase 3: Controller Cleanup
- 🤖 ARC controller Helm release removal
- 🚫 Pod termination monitoring
- 🔧 Service cleanup
- 📡 Webhook removal

### Phase 4: Secrets and Configs Cleanup
- 🔐 GitHub token removal
- 📋 Configuration cleanup
- 💾 Optional data preservation
- 🗃️ ConfigMap removal

### Phase 5: Namespace Cleanup
- 📁 Namespace content analysis
- 🛡️ Safety checks for other resources
- 🗑️ Conditional namespace removal
- 🏷️ Label and annotation cleanup

### Phase 6: Cleanup Verification
- ✅ Component removal verification
- 🔍 Remaining resource detection
- 📊 Cleanup completeness report
- 🎯 Final status validation

## Safety Features

### Intelligent Resource Detection
- Automatically discovers all ARC-related components
- Identifies dependencies and relationships
- Provides comprehensive inventory before cleanup
- Warns about potential impacts

### Force Protection
- Requires explicit `force` flag for large installations
- Prevents accidental removal of complex setups
- Provides detailed warnings and confirmations
- Offers granular control over cleanup scope

### Data Preservation
- Optional backup of secrets before removal
- Preserves namespaces with non-ARC resources
- Maintains CRDs for future installations
- Selective component preservation

### Dry Run Mode
- Preview all cleanup operations
- Show what would be removed without executing
- Detailed impact analysis
- Safe exploration of cleanup effects

## Error Handling

### Graceful Failure Handling
- Continues cleanup even if individual phases fail
- Provides detailed error reporting
- Offers remediation suggestions
- Maintains audit trail of all operations

### Partial Cleanup Recovery
- Handles partially failed installations
- Cleans up orphaned resources
- Provides manual cleanup instructions
- Supports resumable cleanup operations

## Monitoring and Reporting

### Real-Time Updates
- Live progress updates in VS Code chat
- Detailed phase status tracking
- AI insights and recommendations
- Visual progress indicators

### Comprehensive Reporting
- Complete cleanup summary
- Components removed vs. preserved
- Performance metrics (timing, efficiency)
- AI-generated recommendations

### Audit Trail
- Detailed log of all operations
- Component-level tracking
- Error and warning accumulation
- Timestamped progress history

## Best Practices

### Before Cleanup
1. **Review Installation**: Use `arc_get_status` to understand current state
2. **Backup Data**: Consider setting `preserveData: true` for important secrets
3. **Dry Run**: Always test with `dryRun: true` first
4. **Check Dependencies**: Ensure no other systems depend on ARC

### During Cleanup
1. **Monitor Progress**: Watch real-time updates in VS Code chat
2. **Review Warnings**: Pay attention to AI safety recommendations
3. **Be Patient**: Allow graceful shutdown of running workflows
4. **Check Phase Status**: Monitor each cleanup phase for issues

### After Cleanup
1. **Verify Removal**: Check the final verification report
2. **Review Logs**: Examine any warnings or errors
3. **Clean Manual Resources**: Remove any remaining manual configurations
4. **Update Documentation**: Record cleanup for future reference

## Troubleshooting

### Common Issues

#### Cleanup Disabled Error
**Problem**: "Cleanup functionality is disabled by default for safety"
**Solution**: Set `CLEANUP_ARC=true` in environment variables or pass `cleanup=true` parameter

#### Stuck Resources
**Problem**: Some resources fail to delete
**Solution**: Use `force=true` parameter or manual kubectl cleanup

#### Namespace Preservation
**Problem**: Namespace not removed despite cleanup
**Solution**: This is intentional if other resources exist. Use `forceNamespaceRemoval=true` if needed

#### Partial Cleanup
**Problem**: Cleanup stops mid-process
**Solution**: Re-run cleanup - it's designed to handle partial states

### Manual Cleanup Commands
If automated cleanup fails, use these manual commands:

```bash
# Remove Helm releases
helm uninstall arc -n arc-systems

# Remove custom resources
kubectl delete autoscalingrunnersets --all -n arc-systems
kubectl delete runnerdeployments --all -n arc-systems
kubectl delete horizontalrunnerautoscalers --all -n arc-systems

# Remove secrets
kubectl delete secret controller-manager -n arc-systems

# Remove namespace (if empty)
kubectl delete namespace arc-systems
```

## Configuration Reference

### Environment Variables
- `CLEANUP_ARC`: Enable/disable cleanup functionality (default: false)
- `LOG_LEVEL`: Logging verbosity for cleanup operations
- `GITHUB_TOKEN`: Required for some cleanup operations
- `GITHUB_ORG`: Organization context for cleanup

### Tool Parameters
```typescript
interface CleanupOptions {
    cleanup?: boolean;           // Enable cleanup (overrides CLEANUP_ARC)
    namespace?: string;          // Target namespace (default: "arc-systems")
    preserveData?: boolean;      // Backup secrets before removal (default: false)
    dryRun?: boolean;           // Preview mode without execution (default: false)
    force?: boolean;            // Force cleanup of large installations (default: false)
    forceNamespaceRemoval?: boolean; // Force namespace removal even with other resources (default: false)
}
```

## Security Considerations

### Access Control
- Requires appropriate Kubernetes RBAC permissions
- Needs access to Helm and kubectl commands
- May require cluster-admin for some operations
- GitHub token access for some cleanup operations

### Data Protection
- Secrets are removed permanently unless `preserveData=true`
- GitHub tokens are deleted from cluster
- No automatic backup of custom configurations
- CRDs are preserved by default for safety

### Audit Trail
- All cleanup operations are logged
- Component-level tracking maintained
- Error conditions documented
- AI insights recorded for analysis

## Integration with VS Code

### Copilot Chat Integration
The cleanup functionality is fully integrated with GitHub Copilot in VS Code:

```text
# Natural language commands
@workspace cleanup ARC installation
@workspace uninstall ARC with dry run
@workspace remove ARC but preserve secrets
```

### Real-Time Progress
- Live updates appear in Copilot chat
- Visual progress bars and status indicators
- AI insights and recommendations
- Interactive progress monitoring

### Error Reporting
- Detailed error messages in chat
- Suggested remediation actions
- Links to relevant documentation
- Manual cleanup instructions when needed

This comprehensive cleanup functionality ensures safe, controlled, and transparent removal of ARC installations while maintaining the flexibility needed for various operational scenarios.