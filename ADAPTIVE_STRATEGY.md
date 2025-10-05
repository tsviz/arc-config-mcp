# ARC MCP Server - Adaptive Integration Strategy

## Philosophy: Progressive Enhancement

Start with what works, progressively add features, gracefully handle missing capabilities.

## Three-Tier Implementation Strategy

### Tier 1: Immediate Value (Works Now - 1 hour)
**Goal**: Compilable project with core MCP server + new capabilities ready to use

**Approach**: Stub missing methods, expose working features
- ✅ Keep policy engine (compiles perfectly)
- ✅ Keep NL intent parser (compiles perfectly)  
- ✅ Add method stubs to services (throw "Not yet implemented")
- ✅ Register policy and NL tools with graceful degradation
- ✅ Fix type safety issues

**Outcome**: 
- Working MCP server you can start using immediately
- Policy engine works for any valid RunnerScaleSet manifest
- NL parser demonstrates intent recognition
- Clear error messages guide future implementation

### Tier 2: Enhanced Integration (Add as needed - 2-4 hours each)
**Goal**: Implement features as you need them

**Approach**: Feature flags + progressive implementation
- 🎯 Implement methods only when needed
- 🎯 Add feature detection and graceful fallbacks
- 🎯 Test each feature independently
- 🎯 Document what works vs. what's stubbed

**Outcome**:
- Each feature addition is independent
- Can prioritize based on real usage
- No breaking changes to existing functionality

### Tier 3: Production Ready (When ready - 1-2 weeks)
**Goal**: Full enterprise-grade implementation

**Approach**: Comprehensive testing + hardening
- 🚀 Complete all method implementations
- 🚀 Add comprehensive test suite
- 🚀 Performance optimization
- 🚀 Production deployment

## Adaptive Implementation Plan

### Phase 1: Core Compilation Fix (30-60 minutes)

#### 1.1: Add Service Method Stubs with Feature Detection

```typescript
// src/services/kubernetes.ts

export class KubernetesService {
  // ... existing code ...

  /**
   * Get namespace with feature detection
   * @tier1 - Stub that throws with helpful message
   * @tier2 - Full implementation when needed
   */
  async getNamespace(name: string): Promise<any> {
    try {
      const response = await this.coreApi.readNamespace(name);
      return response.body;
    } catch (error) {
      throw new Error(`getNamespace not fully implemented. To implement: add readNamespace call. Error: ${error}`);
    }
  }

  /**
   * Create namespace with progressive enhancement
   * @tier1 - Basic implementation
   * @tier2 - Add labels and annotations support
   */
  async createNamespace(name: string, labels?: Record<string, string>): Promise<void> {
    await this.coreApi.createNamespace({
      metadata: { 
        name,
        labels: labels || {}
      }
    });
  }

  /**
   * Wait for deployment readiness
   * @tier1 - Stub with timeout
   * @tier2 - Implement with polling
   * @tier3 - Add watch-based implementation
   */
  async waitForDeployment(name: string, namespace: string, timeoutSeconds: number): Promise<void> {
    // Tier 1: Simple delay (works but not optimal)
    console.warn(`waitForDeployment: Using simple delay. Implement polling for production.`);
    await new Promise(resolve => setTimeout(resolve, Math.min(timeoutSeconds * 1000, 30000)));
    
    // TODO Tier 2: Add polling logic
    // const startTime = Date.now();
    // while (Date.now() - startTime < timeoutSeconds * 1000) {
    //   const status = await this.getDeploymentStatus(name, namespace);
    //   if (status.ready) return;
    //   await new Promise(resolve => setTimeout(resolve, 2000));
    // }
  }

  /**
   * Create Kubernetes secret
   * @tier1 - Basic implementation
   * @tier2 - Add encryption and validation
   */
  async createSecret(
    namespace: string, 
    name: string, 
    data: Record<string, string>, 
    labels?: Record<string, string>
  ): Promise<void> {
    // Convert data to base64
    const stringData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = Buffer.from(value).toString('base64');
      return acc;
    }, {} as Record<string, string>);

    await this.coreApi.createNamespacedSecret(namespace, {
      metadata: { name, labels },
      type: 'Opaque',
      data: stringData
    });
  }

  /**
   * Apply Kubernetes resource
   * @tier1 - Stub that returns success
   * @tier2 - Implement with kubectl apply logic
   */
  async applyResource(resource: any): Promise<void> {
    console.warn(`applyResource: Stub implementation. Resource: ${resource.kind}/${resource.metadata?.name}`);
    console.warn(`To implement: Use KubernetesObjectApi or kubectl apply`);
    // TODO: Implement using @kubernetes/client-node dynamic client
    // const client = k8s.KubernetesObjectApi.makeApiClient(this.kc);
    // await client.patch(resource);
  }

  /**
   * List deployments
   * @tier1 - Full implementation (already works)
   */
  async listDeployments(namespace: string): Promise<any[]> {
    const response = await this.k8sApi.listNamespacedDeployment(namespace);
    return response.body.items.map((item: any) => ({
      name: item.metadata?.name,
      namespace: item.metadata?.namespace,
      replicas: item.spec?.replicas,
      readyReplicas: item.status?.readyReplicas,
      resources: item.spec?.template?.spec?.containers?.[0]?.resources,
      securityContext: item.spec?.template?.spec?.securityContext,
      labels: item.metadata?.labels
    }));
  }

  /**
   * Get pod logs
   * @tier1 - Basic implementation
   * @tier2 - Add streaming and filtering
   */
  async getPodLogs(
    namespace: string, 
    labelSelector: string, 
    options?: { lines?: number; container?: string }
  ): Promise<string> {
    try {
      // Find pods by label
      const pods = await this.coreApi.listNamespacedPod(
        namespace,
        undefined, undefined, undefined, undefined,
        labelSelector
      );

      if (pods.body.items.length === 0) {
        return `No pods found with selector: ${labelSelector}`;
      }

      // Get logs from first pod
      const podName = pods.body.items[0].metadata?.name || '';
      const response = await this.coreApi.readNamespacedPodLog(
        podName,
        namespace,
        options?.container,
        false, // follow
        undefined, // limitBytes
        undefined, // pretty
        false, // previous
        undefined, // sinceSeconds
        options?.lines || 100 // tailLines
      );

      return response.body;
    } catch (error) {
      throw new Error(`Failed to get pod logs: ${error}`);
    }
  }

  /**
   * List network policies
   * @tier1 - Stub that returns empty array
   * @tier2 - Implement when needed
   */
  async listNetworkPolicies(namespace: string): Promise<any[]> {
    console.warn(`listNetworkPolicies: Stub implementation`);
    return [];
    // TODO: Implement
    // const networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);
    // const response = await networkingApi.listNamespacedNetworkPolicy(namespace);
    // return response.body.items;
  }

  /**
   * Get API versions
   * @tier1 - Return common versions
   * @tier2 - Query cluster
   */
  async getApiVersions(): Promise<string[]> {
    console.warn(`getApiVersions: Returning common versions. Implement cluster query for production.`);
    return ['v1', 'apps/v1', 'batch/v1', 'networking.k8s.io/v1', 'policy/v1'];
    // TODO: Implement actual API version detection
  }

  /**
   * Get custom resources
   * @tier1 - Stub
   * @tier2 - Implement when using custom resources
   */
  async getCustomResources(apiVersion: string, kind: string, namespace: string): Promise<any[]> {
    console.warn(`getCustomResources: Stub. Implement when ${kind} is needed.`);
    return [];
  }

  /**
   * Delete namespace
   * @tier1 - Stub with warning
   * @tier2 - Implement with safeguards
   */
  async deleteNamespace(name: string): Promise<void> {
    console.warn(`deleteNamespace: Stub. Implement with proper safeguards and confirmation.`);
    throw new Error('deleteNamespace: Not implemented for safety. Add explicit implementation when needed.');
  }
}
```

#### 1.2: Fix GitHub Service

```typescript
// src/services/github.ts

export class GitHubService {
  // ... existing code ...

  /**
   * Get current authenticated user
   * @tier1 - Full implementation
   */
  async getCurrentUser(): Promise<any> {
    const response = await this.octokit.users.getAuthenticated();
    return response.data;
  }
}
```

#### 1.3: Fix Error Handling in ArcInstaller

```typescript
// src/services/arc-installer.ts

// Replace all catch blocks like this:
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  this.updatePhaseStatus('prereq_check', 'failed', errorMessage);
  throw error;
}

// And fix implicit any types:
deployments.find((d: any) => d.name.includes('actions-runner-controller'))
logs.split('\n').filter((line: string) => ...)
```

### Phase 2: Smart Tool Registration (30 minutes)

```typescript
// src/tools/policy.ts (NEW)

import { ArcPolicyEngine } from '../engines/policy-engine.js';
import { z } from 'zod';

/**
 * Feature detection for policy tools
 */
async function detectPolicyFeatures(k8sService: any): Promise<{
  hasRunnerScaleSetCRD: boolean;
  hasNetworkPolicies: boolean;
  hasPodSecurityStandards: boolean;
}> {
  try {
    // Check for ARC CRDs
    const customApi = k8sService.getCustomObjectsApi();
    const hasRunnerScaleSetCRD = await customApi
      .listClusterCustomObject('actions.sumologic.com', 'v1alpha1', 'runnerscalesets')
      .then(() => true)
      .catch(() => false);

    return {
      hasRunnerScaleSetCRD,
      hasNetworkPolicies: true, // Assume available
      hasPodSecurityStandards: true // Assume available
    };
  } catch {
    return {
      hasRunnerScaleSetCRD: false,
      hasNetworkPolicies: false,
      hasPodSecurityStandards: false
    };
  }
}

export function registerPolicyTools(server: any, policyEngine: ArcPolicyEngine, k8sService: any) {
  
  // Tool 1: Evaluate Policies (works with any manifest)
  server.registerTool(
    "arc_evaluate_policies",
    {
      title: "Evaluate ARC Policies",
      description: "Evaluates ARC runner configurations against organizational policies. Works with live resources or YAML manifests.",
      inputSchema: {
        namespace: z.string().optional().describe("Kubernetes namespace (for live resources)"),
        runnerScaleSetName: z.string().optional().describe("Runner scale set name (for live resources)"),
        manifestYaml: z.string().optional().describe("YAML manifest to evaluate (alternative to live resources)")
      }
    },
    async ({ namespace, runnerScaleSetName, manifestYaml }) => {
      try {
        let resource: any;

        if (manifestYaml) {
          // Evaluate provided manifest (Tier 1 - always works)
          const yaml = require('yaml');
          resource = yaml.parse(manifestYaml);
        } else if (namespace && runnerScaleSetName) {
          // Evaluate live resource (Tier 2 - requires CRD)
          const features = await detectPolicyFeatures(k8sService);
          
          if (!features.hasRunnerScaleSetCRD) {
            return {
              content: [{
                type: "text",
                text: `⚠️ **RunnerScaleSet CRD not detected**

**Alternative**: Provide YAML manifest to evaluate:
\`\`\`
arc_evaluate_policies({
  manifestYaml: "apiVersion: actions.sumologic.com/v1alpha1\\nkind: RunnerScaleSet\\n..."
})
\`\`\`

**Or**: Install ARC first:
- Run: \`arc_install_controller\`
- Then retry evaluation`
              }]
            };
          }

          resource = await policyEngine.evaluateRunnerScaleSet(namespace, runnerScaleSetName);
        } else {
          return {
            content: [{
              type: "text",
              text: `❌ **Missing Parameters**

Provide either:
1. **Live resource**: \`namespace\` + \`runnerScaleSetName\`
2. **Manifest**: \`manifestYaml\`

Example:
\`\`\`
arc_evaluate_policies({
  namespace: "default",
  runnerScaleSetName: "my-runners"
})
\`\`\``
              }]
            };
        }

        const result = policyEngine.evaluateResource(resource, 'runnerscaleset');
        return {
          content: [{
            type: "text",
            text: formatPolicyEvaluation(result)
          }]
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ **Error evaluating policies**: ${errorMessage}

**Troubleshooting**:
- Verify namespace and resource name
- Check if ARC is installed
- Ensure proper RBAC permissions
- Try with YAML manifest instead`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 2: Generate Compliance Report
  server.registerTool(
    "arc_generate_compliance_report",
    {
      title: "Generate ARC Compliance Report",
      description: "Generates comprehensive compliance report for ARC resources",
      inputSchema: {
        namespace: z.string().optional().describe("Optional namespace filter")
      }
    },
    async ({ namespace }) => {
      try {
        const features = await detectPolicyFeatures(k8sService);
        
        if (!features.hasRunnerScaleSetCRD) {
          return {
            content: [{
              type: "text",
              text: `ℹ️ **ARC Not Detected**

**Status**: No RunnerScaleSet resources found in cluster.

**Next Steps**:
1. Install ARC controller: \`arc_install_controller\`
2. Create runner scale sets
3. Run compliance report again

**Alternative**: Evaluate individual YAML manifests with \`arc_evaluate_policies\``
            }]
          };
        }

        const report = await policyEngine.generateArcComplianceReport(namespace);
        return {
          content: [{
            type: "text",
            text: formatComplianceReport(report)
          }]
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `❌ Error generating report: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Tool 3: List Policy Rules
  server.registerTool(
    "arc_list_policy_rules",
    {
      title: "List ARC Policy Rules",
      description: "Lists all available policy rules with their configuration",
      inputSchema: {
        category: z.string().optional().describe("Filter by category: security, compliance, performance, cost, operations")
      }
    },
    async ({ category }) => {
      const rules = category 
        ? policyEngine.getRulesByCategory(category)
        : policyEngine.getRules();

      return {
        content: [{
          type: "text",
          text: formatPolicyRules(rules, category)
        }]
      };
    }
  );
}

function formatPolicyEvaluation(result: any): string {
  return `📋 **Policy Evaluation Results**

**Overall Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}

**Summary:**
- Total Rules: ${result.summary.totalRules}
- Passed: ${result.summary.passedRules} ✅
- Failed: ${result.summary.failedRules} ❌

**Violations by Severity:**
${Object.entries(result.summary.violationsBySeverity).map(([sev, count]) => 
  `- ${sev}: ${count}`
).join('\n')}

${result.violations.length > 0 ? `
**🚨 Critical Violations (Must Fix):**
${result.violations.map((v: any) => `
- **${v.ruleName}** (${v.severity})
  - Issue: ${v.message}
  - Field: ${v.field}
  - Current: ${v.currentValue}
  ${v.suggestedValue ? `- Suggested: ${v.suggestedValue}` : ''}
  - Auto-fix: ${v.canAutoFix ? '✅ Available' : '❌ Manual required'}
`).join('\n')}
` : '✅ No critical violations'}

${result.warnings.length > 0 ? `
**⚠️ Warnings (Recommended):**
${result.warnings.map((v: any) => `- ${v.ruleName}: ${v.message}`).join('\n')}
` : ''}

${result.violations.some((v: any) => v.canAutoFix) ? `
💡 **Tip**: Use \`arc_auto_fix_violations\` to automatically fix ${result.violations.filter((v: any) => v.canAutoFix).length} violations
` : ''}`;
}

function formatComplianceReport(report: any): string {
  return `📊 **ARC Compliance Report**

**Generated**: ${report.timestamp}
**Cluster**: ${report.cluster}
${report.namespace ? `**Namespace**: ${report.namespace}` : '**Scope**: Cluster-wide'}

**Overall Compliance**: ${report.overallCompliance}% ${
  report.overallCompliance >= 90 ? '🟢 Excellent' : 
  report.overallCompliance >= 70 ? '🟡 Good' : 
  '🔴 Needs Improvement'
}

**Violations by Severity:**
${Object.entries(report.results.summary.violationsBySeverity).map(([sev, count]) => {
  const emoji = sev === 'critical' ? '🚨' : sev === 'high' ? '🔴' : sev === 'medium' ? '🟠' : '🟡';
  return `${emoji} ${sev}: ${count}`;
}).join('\n')}

**Violations by Category:**
${Object.entries(report.results.summary.violationsByCategory).map(([cat, count]) => 
  `- ${cat}: ${count}`
).join('\n')}

**📋 Recommendations:**
${report.recommendations.map((r: string) => `- ${r}`).join('\n')}

**Next Steps:**
1. Address critical violations immediately
2. Plan remediation for high-severity issues
3. Schedule fixes for medium/low severity
4. Re-run report after fixes to track progress`;
}

function formatPolicyRules(rules: any[], category?: string): string {
  const header = category 
    ? `📋 **ARC Policy Rules - ${category.toUpperCase()} Category**`
    : `📋 **All ARC Policy Rules**`;

  return `${header}

**Total Rules**: ${rules.length}

${rules.map(rule => `
**${rule.id}**: ${rule.name} ${rule.enabled ? '✅' : '❌'}
- Category: ${rule.category}
- Severity: ${rule.severity}
- Description: ${rule.description}
- Scope: ${rule.scope}
- Auto-fix: ${rule.actions.some((a: any) => a.autoFix) ? 'Available' : 'Not available'}
`).join('\n')}

💡 Use \`arc_evaluate_policies\` to check resources against these rules`;
}
```

### Phase 3: Natural Language Integration (20 minutes)

```typescript
// src/index.ts - Add NL router

import { parseArcIntent } from './utils/nl-intent.js';

server.registerTool(
  "arc_natural_language",
  {
    title: "Natural Language ARC Command",
    description: "Parse and execute natural language ARC operations. Try: 'Install ARC controller', 'Create runners for my repo', 'Check compliance'",
    inputSchema: {
      command: z.string().describe("Natural language command for ARC operations")
    }
  },
  async ({ command }) => {
    const parsed = parseArcIntent(command);
    
    if (parsed.intent === 'unknown') {
      return {
        content: [{
          type: "text",
          text: `❓ **Command Not Recognized**: "${command}"

**Did you mean?**
${parsed.alternatives?.map(a => `- ${a}`).join('\n') || '- arc_install_controller\n- arc_list_runner_scale_sets\n- arc_evaluate_policies'}

**Example Commands:**
- "Install ARC controller in namespace arc-systems"
- "Create runner scale set for repo owner/repo"
- "Scale runner my-runners to 5 replicas"
- "Evaluate policies for runner my-runners"
- "Generate compliance report"
- "List all runners"

**Confidence Threshold**: Commands need >60% confidence to execute.
**Your command**: ${(parsed.confidence * 100).toFixed(0)}% confidence`
        }]
      };
    }

    if (parsed.missing && parsed.missing.length > 0) {
      return {
        content: [{
          type: "text",
          text: `ℹ️ **Intent Understood**: ${parsed.intent}
**Confidence**: ${(parsed.confidence * 100).toFixed(0)}%

**Missing Information:**
${parsed.missing.map(m => `- ${m}`).join('\n')}

**Please provide:**
"${command} ${parsed.missing.map(m => `with ${m}=<value>`).join(' ')}"

**Example:**
"${command} in namespace default"`
        }]
      };
    }

    // Success - ready to execute
    return {
      content: [{
        type: "text",
        text: `✅ **Command Parsed Successfully**

**Intent**: ${parsed.intent}
**Confidence**: ${(parsed.confidence * 100).toFixed(0)}%
**Parameters Extracted:**
${JSON.stringify(parsed.params, null, 2)}

**Next Step**: Execute the corresponding tool:
\`\`\`typescript
${parsed.intent}(${JSON.stringify(parsed.params, null, 2)})
\`\`\`

💡 **Note**: Currently in "parse-only" mode. To enable automatic execution, update the tool implementation.`
      }]
    };
  }
);
```

## Deployment Strategy

### Immediate (Tier 1)
```bash
# 1. Fix compilation
npm run build

# 2. Start server
npm run dev

# 3. Test policy engine (works with YAML)
# Via Copilot: "Evaluate this ARC manifest: <paste YAML>"

# 4. Test NL parsing (works immediately)
# Via Copilot: "Parse: Install ARC controller"
```

### Progressive Enhancement (Tier 2)
```bash
# Implement features as needed:

# Need actual cluster interaction?
# → Implement waitForDeployment with polling

# Need CRD support?
# → Implement getCustomResources

# Need network policies?
# → Implement listNetworkPolicies

# Track what works:
git commit -m "feat(tier2): implement waitForDeployment"
```

### Production Hardening (Tier 3)
```bash
# When ready for production:

# 1. Complete test suite
npm run test:coverage  # Target >80%

# 2. Add monitoring
# 3. Security audit
# 4. Performance testing
# 5. Documentation
# 6. Deploy
```

## Feature Matrix

| Feature                  | Tier 1 (Now)    | Tier 2 (Soon) | Tier 3 (Later) |
| ------------------------ | --------------- | ------------- | -------------- |
| Policy Engine            | ✅ Full          | ✅ Full        | ✅ Full         |
| NL Parser                | ✅ Full          | ✅ Full        | ✅ Full         |
| Policy Evaluation (YAML) | ✅ Works         | ✅ Works       | ✅ Works        |
| Policy Evaluation (Live) | ⚠️ Stub          | ✅ Implement   | ✅ Tested       |
| Compliance Report        | ⚠️ Graceful fail | ✅ Implement   | ✅ Tested       |
| Auto-fix                 | ⚠️ Stub          | ✅ Implement   | ✅ Tested       |
| ARC Installation         | ⚠️ Partial       | ✅ Implement   | ✅ Tested       |
| Namespace Management     | ⚠️ Basic         | ✅ Full        | ✅ Tested       |
| Secret Management        | ✅ Basic         | ✅ Full        | ✅ Encrypted    |
| Network Policies         | ⚠️ Stub          | ✅ Implement   | ✅ Tested       |
| Custom Resources         | ⚠️ Stub          | ✅ Implement   | ✅ Tested       |

## Success Criteria by Tier

### Tier 1 Success (Today)
- [ ] Project compiles
- [ ] MCP server starts
- [ ] Can evaluate YAML manifests
- [ ] NL parser demonstrates intent recognition
- [ ] Policy rules list accessible
- [ ] Clear error messages for unimplemented features

### Tier 2 Success (This Week)
- [ ] Live resource evaluation works
- [ ] Compliance reports generate
- [ ] At least 5 key methods implemented
- [ ] Can manage basic ARC lifecycle
- [ ] Integration tests passing

### Tier 3 Success (Production)
- [ ] All methods implemented
- [ ] >80% test coverage
- [ ] Production deployment successful
- [ ] Monitoring configured
- [ ] Documentation complete

---

**Current Priority**: Achieve Tier 1 in next 60 minutes 🚀

**Adaptive Philosophy**: Ship early, enhance continuously, never break existing functionality
