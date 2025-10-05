# ARC MCP Server - Integration Action Plan

## Current Status

✅ **Completed**: Core enhancements integrated from k8s_mcp reference
- Policy engine with 12 ARC-specific rules
- Natural language intent parser with 16 command patterns
- Enhanced package.json with v1.4.0 features
- Comprehensive documentation

🔴 **Blocked**: TypeScript compilation (45 errors)
- Service method mismatches
- Type safety issues
- API compatibility problems

## Recommended Path Forward: Hybrid Approach

**Goal**: Working MCP server with policy engine and natural language commands in 4-6 hours

### Phase 1: Fix Compilation (2 hours)

#### Step 1.1: Fix Type Safety Issues (30 minutes)
```typescript
// src/services/arc-installer.ts - Add explicit types

// Fix: Parameter 'd' implicitly has an 'any' type
- deployments.find(d => d.name.includes(...))
+ deployments.find((d: any) => d.name.includes(...))

// Fix: 'error' is of type 'unknown'
- catch (error) { throw new Error(error.message); }
+ catch (error) { 
+   const message = error instanceof Error ? error.message : String(error);
+   throw new Error(message);
+ }
```

#### Step 1.2: Add Missing Service Methods (1 hour)
```typescript
// src/services/kubernetes.ts - Add these methods:

async getNamespace(name: string): Promise<any> {
  const response = await this.coreApi.readNamespace(name);
  return response.body;
}

async createNamespace(name: string, labels?: Record<string, string>): Promise<void> {
  await this.coreApi.createNamespace({
    metadata: { name, labels }
  });
}

async waitForDeployment(name: string, namespace: string, timeoutSeconds: number): Promise<void> {
  // Implementation with polling logic
}

async createSecret(namespace: string, name: string, data: Record<string, string>, labels?: Record<string, string>): Promise<void> {
  // Implementation
}

async applyResource(resource: any): Promise<void> {
  // Implementation using dynamic client
}

async listDeployments(namespace: string): Promise<any[]> {
  const response = await this.k8sApi.listNamespacedDeployment(namespace);
  return response.body.items;
}

async getPodLogs(namespace: string, labelSelector: string, lines?: number): Promise<string> {
  // Implementation
}

async listNetworkPolicies(namespace: string): Promise<any[]> {
  // Implementation
}

async getApiVersions(): Promise<string[]> {
  // Implementation
}
```

```typescript
// src/services/github.ts - Add this method:

async getCurrentUser(): Promise<any> {
  const response = await this.octokit.users.getAuthenticated();
  return response.data;
}
```

#### Step 1.3: Fix API Compatibility (30 minutes)
```typescript
// src/services/kubernetes-enhanced.ts

// Fix: patchNamespace signature
- await this.k8sApi.patchNamespace(name, patch, ..., { headers: {...} });
+ // Check @kubernetes/client-node v0.21.0 docs for correct signature
+ await this.k8sApi.patchNamespace(name, patch, ...correctParams);
```

### Phase 2: Integrate Policy Engine (1 hour)

#### Step 2.1: Create Policy Tool
```typescript
// src/tools/policy.ts

import { ArcPolicyEngine } from '../engines/policy-engine.js';
import { z } from 'zod';

export function registerPolicyTools(server: any, policyEngine: ArcPolicyEngine) {
  server.registerTool(
    "arc_evaluate_policies",
    {
      title: "Evaluate ARC Policies",
      description: "Evaluates ARC runner scale set against organizational policies",
      inputSchema: {
        namespace: z.string().describe("Kubernetes namespace"),
        runnerScaleSetName: z.string().describe("Runner scale set name")
      }
    },
    async ({ namespace, runnerScaleSetName }) => {
      try {
        const result = await policyEngine.evaluateRunnerScaleSet(namespace, runnerScaleSetName);
        
        return {
          content: [{
            type: "text",
            text: formatPolicyEvaluation(result)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `❌ Error evaluating policies: ${error}`
          }],
          isError: true
        };
      }
    }
  );

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
      const report = await policyEngine.generateArcComplianceReport(namespace);
      return {
        content: [{
          type: "text",
          text: formatComplianceReport(report)
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

${result.violations.length > 0 ? `
**🚨 Critical Violations:**
${result.violations.map(v => `- ${v.ruleName}: ${v.message}`).join('\n')}
` : '✅ No violations found'}

${result.warnings.length > 0 ? `
**⚠️ Warnings:**
${result.warnings.map(v => `- ${v.ruleName}: ${v.message}`).join('\n')}
` : ''}`;
}

function formatComplianceReport(report: any): string {
  return `📊 **ARC Compliance Report**

**Overall Compliance**: ${report.overallCompliance}% ${report.overallCompliance >= 90 ? '🟢' : report.overallCompliance >= 70 ? '🟡' : '🔴'}

**Violations by Severity:**
${Object.entries(report.results.summary.violationsBySeverity).map(([severity, count]) => 
  `- ${severity}: ${count}`
).join('\n')}

**Recommendations:**
${report.recommendations.map(r => `- ${r}`).join('\n')}`;
}
```

#### Step 2.2: Update Main Index
```typescript
// src/index.ts - Add policy engine initialization

import { ArcPolicyEngine } from './engines/policy-engine.js';
import { registerPolicyTools } from './tools/policy.js';

// In main initialization:
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const policyEngine = new ArcPolicyEngine(kc, process.env.POLICY_CONFIG_PATH);

// Register policy tools
registerPolicyTools(server, policyEngine);
```

### Phase 3: Add Natural Language Router (1 hour)

```typescript
// src/index.ts - Add NL command tool

import { parseArcIntent } from './utils/nl-intent.js';

server.registerTool(
  "arc_natural_language_command",
  {
    title: "Natural Language ARC Command",
    description: "Parse natural language requests for ARC operations",
    inputSchema: {
      query: z.string().describe("Natural language command")
    }
  },
  async ({ query }) => {
    const parsed = parseArcIntent(query);
    
    if (parsed.intent === 'unknown') {
      return {
        content: [{
          type: "text",
          text: `❓ Could not understand command: "${query}"

**Suggestions:**
${parsed.alternatives?.map(a => `- ${a}`).join('\n')}

**Example commands:**
- "Install ARC controller in namespace arc-systems"
- "Create runner scale set named my-runners for repo owner/repo"
- "Scale runner my-runners to 10 replicas"
- "Evaluate policies for runner my-runners"`
        }]
      };
    }

    if (parsed.missing && parsed.missing.length > 0) {
      return {
        content: [{
          type: "text",
          text: `ℹ️ **Intent Detected**: ${parsed.intent}

**Missing Parameters:**
${parsed.missing.map(m => `- ${m}`).join('\n')}

**Example:**
"${query} ${parsed.missing.map(m => `${m}=<value>`).join(' ')}"`
        }]
      };
    }

    return {
      content: [{
        type: "text",
        text: `✅ **Command Understood**

**Intent**: ${parsed.intent}
**Confidence**: ${(parsed.confidence * 100).toFixed(0)}%
**Parameters**: ${JSON.stringify(parsed.params, null, 2)}

You can now invoke the '${parsed.intent}' tool with these parameters.`
      }]
    };
  }
);
```

### Phase 4: Testing & Validation (30 minutes)

```bash
# Build project
npm run build

# Test compilation
npm run lint

# Start server in dev mode
npm run dev

# Test in another terminal (or via VS Code Copilot):
# "Parse natural language: Install ARC controller"
# "Parse natural language: Create runner for repo tsviz/arc-config-repo"
# "Parse natural language: Scale runner my-runners to 5"
```

### Phase 5: Documentation (30 minutes)

Create quick start guide:

````markdown
# Quick Start - ARC MCP Server

## Installation

```bash
npm install
npm run build
```

## Usage

### Natural Language Commands

Ask GitHub Copilot in VS Code:

- "Install ARC controller in my cluster"
- "Create runners for my repository"
- "Check compliance of my ARC setup"
- "Evaluate policies for runner my-runners"

### Direct Tool Calls

```typescript
// Evaluate policies
arc_evaluate_policies({
  namespace: "default",
  runnerScaleSetName: "my-runners"
})

// Generate compliance report
arc_generate_compliance_report({
  namespace: "default"
})
```

## Policy Configuration

Create `config/policies/development.json`:

```json
{
  "organization": {
    "name": "my-org",
    "environment": "development"
  },
  "global": {
    "enforcement": "advisory",
    "autoFix": true
  },
  "categories": {
    "security": { "enabled": true, "enforcement": "strict" },
    "compliance": { "enabled": true, "enforcement": "advisory" }
  }
}
```

Set environment variable:

```bash
export POLICY_CONFIG_PATH=./config/policies/development.json
```
````

## Success Metrics

### After Phase 1 (2 hours)
- [ ] Zero TypeScript compilation errors
- [ ] Project builds successfully
- [ ] All services have required methods

### After Phase 2 (3 hours)
- [ ] Policy evaluation tool working
- [ ] Compliance report generation working
- [ ] Can evaluate a RunnerScaleSet against policies

### After Phase 3 (4 hours)
- [ ] Natural language parser working
- [ ] Can parse common ARC commands
- [ ] Intent detection with confidence scoring

### After Phase 4 (4.5 hours)
- [ ] End-to-end test successful
- [ ] Can run via VS Code Copilot Chat
- [ ] Example workflows documented

### After Phase 5 (5 hours)
- [ ] Quick start guide created
- [ ] Example configurations provided
- [ ] Ready for demo

## Potential Blockers & Solutions

### Blocker 1: Kubernetes API Changes
**Solution**: Check @kubernetes/client-node v0.21.0 changelog
- Use official docs: https://github.com/kubernetes-client/javascript
- Compare with v0.20.0 API if needed

### Blocker 2: Missing RunnerScaleSet CRD
**Solution**: Mock or gracefully handle
```typescript
try {
  const rss = await customApi.getNamespacedCustomObject(...);
  return evaluateResource(rss);
} catch (error) {
  return {
    passed: false,
    violations: [{
      ruleId: 'system',
      message: 'RunnerScaleSet CRD not found. Install ARC first.',
      canAutoFix: false
    }]
  };
}
```

### Blocker 3: Policy Config File Not Found
**Solution**: Use built-in defaults
```typescript
if (configPath && await fs.pathExists(configPath)) {
  // Load from file
} else {
  console.log('Using built-in policy defaults');
  // Use default rules only
}
```

## Alternative Quick Path (If Time Constrained)

### Minimal Integration (1-2 hours)
1. Fix only critical compilation errors (error type guards)
2. Add stub implementations for missing methods that just throw
3. Register only the NL parser tool
4. Demo the NL parsing without execution

**Outcome**: Demonstrate intent, defer execution

## Files to Modify

### Must Modify
1. `src/services/kubernetes.ts` - Add missing methods
2. `src/services/github.ts` - Add getCurrentUser
3. `src/services/arc-installer.ts` - Fix error handling
4. `src/index.ts` - Add policy and NL tools
5. `src/tools/policy.ts` - Create (new file)

### Should Modify
6. `src/services/kubernetes-enhanced.ts` - Fix API calls
7. `README.md` - Update with new features

### Can Defer
8. `src/tools/index.ts` - Full tool reorganization
9. `tests/` - Comprehensive test suite
10. `scripts/` - Policy management scripts
11. `Dockerfile` - Containerization

## Timeline Estimate

| Phase              | Duration | Cumulative |
| ------------------ | -------- | ---------- |
| Fix Compilation    | 2h       | 2h         |
| Policy Integration | 1h       | 3h         |
| NL Router          | 1h       | 4h         |
| Testing            | 0.5h     | 4.5h       |
| Documentation      | 0.5h     | 5h         |
| **Buffer**         | 1h       | **6h**     |

**Total Estimated Time**: 5-6 hours

## Go/No-Go Decision Points

### After 2 hours
**Check**: Does project compile?
- ✅ Yes → Proceed to Phase 2
- ❌ No → Switch to stub implementations

### After 3 hours
**Check**: Can evaluate policies?
- ✅ Yes → Proceed to Phase 3
- ❌ No → Focus on NL parser demo only

### After 4 hours
**Check**: Does NL routing work?
- ✅ Yes → Polish and document
- ❌ No → Create simple demo workflow

## Ready to Start?

```bash
# 1. Create a new branch
git checkout -b integration/k8s-mcp-enhancements

# 2. Start with compilation fixes
cd /Users/tsvi/git_projects/tsviz/arc-config-mcp

# 3. Open files in order:
# - src/services/arc-installer.ts (fix error handling)
# - src/services/kubernetes.ts (add methods)
# - src/services/github.ts (add method)
# - src/index.ts (integrate policy engine)
# - src/tools/policy.ts (create new)

# 4. Build and test after each file
npm run build

# 5. Commit frequently
git add .
git commit -m "feat: fix compilation errors"
git commit -m "feat: add policy engine integration"
git commit -m "feat: add natural language router"

# 6. Test end-to-end
npm run dev
```

---

**Ready to begin? Start with Phase 1, Step 1.1** 🚀

**Questions?** Refer to:
- `INTEGRATION_SUMMARY.md` for architecture details
- `README_ENHANCEMENT.md` for full context
- `context-from-repo/k8s_mcp/` for reference implementation
