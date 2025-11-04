# ARC Hybrid Workflow - Visual Guide

## 🎯 The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HYBRID WORKFLOW OVERVIEW                         │
└─────────────────────────────────────────────────────────────────────────┘

   User                     MCP Tool                Git Repo        K8s Cluster
    │                          │                        │                │
    │  1. Generate Config      │                        │                │
    │─────────────────────────>│                        │                │
    │                          │                        │                │
    │                          │  2. Create YAML        │                │
    │                          │───────────────────────>│                │
    │                          │   configs/             │                │
    │                          │   controller.yaml      │                │
    │                          │                        │                │
    │  3. Review/Edit Config   │                        │                │
    │<─────────────────────────│                        │                │
    │  (Optional)              │                        │                │
    │───────────────────────────────────────────────────>│                │
    │  Edit values: section    │                        │                │
    │                          │                        │                │
    │  4. Apply Config         │                        │                │
    │─────────────────────────>│                        │                │
    │                          │                        │                │
    │                          │  5. Read Config        │                │
    │                          │<───────────────────────│                │
    │                          │                        │                │
    │                          │  6. Build Helm CMD     │                │
    │                          │  + Execute             │                │
    │                          │───────────────────────────────────────>│
    │                          │  helm upgrade          │                │
    │                          │  --install --set ...   │                │
    │                          │                        │                │
    │  7. Success!             │<───────────────────────────────────────│
    │<─────────────────────────│                        │                │
    │  Show status             │                        │                │
    │                          │                        │                │
```

## 📝 Step-by-Step Workflow

### Step 1: Generate Configuration

**Command**: `#arc_install_controller_hybrid --apply false`

```
┌──────────────────────────────────────────────────────────┐
│                    What Happens:                         │
│  1. Tool generates configs/controller.yaml               │
│  2. File contains:                                       │
│     - chart: (where to get Helm chart)                   │
│     - release: (how to install it)                       │
│     - values: {} (empty, ready for customization)        │
│     - metadata: (tracking info)                          │
└──────────────────────────────────────────────────────────┘
```

**Output**: Configuration file created at `configs/controller.yaml`

---

### Step 2: Review & Edit (Optional)

**File**: `configs/controller.yaml`

```yaml
# Before (Generated)
values: {}

# After (Edited by User)
values:
  replicaCount: 2
  resources:
    limits:
      memory: 512Mi
```

```
┌──────────────────────────────────────────────────────────┐
│            Why Edit the Config?                          │
│  ✓ Customize resource limits                             │
│  ✓ Add node selectors/tolerations                        │
│  ✓ Configure high availability                           │
│  ✓ Set up monitoring/logging                             │
│  ✓ Apply security policies                               │
└──────────────────────────────────────────────────────────┘
```

---

### Step 3: Apply Configuration

**Command**: `#arc_apply_config --configType controller`

```
┌─────────────────────────────────────────────────────────────────┐
│                    What Happens:                                │
│                                                                 │
│  1. Tool reads configs/controller.yaml                          │
│                                                                 │
│  2. Extracts configuration:                                     │
│     - Chart URL: oci://ghcr.io/.../gha-runner-scale-set-...    │
│     - Release name: arc-controller                              │
│     - Namespace: arc-systems                                    │
│     - Values: { replicaCount: 2, resources: {...} }             │
│                                                                 │
│  3. Builds Helm command:                                        │
│     helm upgrade arc-controller \                               │
│       oci://... \                                               │
│       --install \                                               │
│       --namespace arc-systems \                                 │
│       --create-namespace \                                      │
│       --set replicaCount=2 \                                    │
│       --set resources.limits.memory=512Mi                       │
│                                                                 │
│  4. Executes command                                            │
│                                                                 │
│  5. Shows status of deployed resources                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Value Transformation

### How `values:` Becomes `--set` Arguments

```
┌─────────────────────────────────────────────────────────────────┐
│                    Config File (YAML)                           │
├─────────────────────────────────────────────────────────────────┤
│  values:                                                        │
│    replicaCount: 2                                              │
│    resources:                                                   │
│      limits:                                                    │
│        cpu: "500m"                                              │
│        memory: "512Mi"                                          │
│      requests:                                                  │
│        cpu: "250m"                                              │
│    nodeSelector:                                                │
│      kubernetes.io/os: linux                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Tool Flattens
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Helm Command Arguments                       │
├─────────────────────────────────────────────────────────────────┤
│  --set replicaCount=2                                           │
│  --set resources.limits.cpu=500m                                │
│  --set resources.limits.memory=512Mi                            │
│  --set resources.requests.cpu=250m                              │
│  --set nodeSelector.kubernetes\.io/os=linux                     │
└─────────────────────────────────────────────────────────────────┘
```

**Flattening Rules**:
- Simple values: `key: value` → `--set key=value`
- Nested objects: `parent.child: value` → `--set parent.child=value`
- Special chars: Escaped automatically (`kubernetes.io/os` → `kubernetes\.io/os`)

---

## 🎭 Two Paths: Config vs Manual

### Path 1: Using the Config (Recommended) ✅

```
#arc_apply_config --configType controller

    │
    ├─> Reads configs/controller.yaml
    ├─> Extracts all values
    ├─> Builds Helm command with --set flags
    ├─> Executes: helm upgrade ... --set key=value ...
    └─> Uses YOUR custom configuration
```

**Benefits**:
- ✅ Uses your custom values
- ✅ Version controlled
- ✅ Repeatable
- ✅ Auditable

---

### Path 2: Manual Installation (Bypasses Config) ⚠️

```
helm install arc-controller \
  oci://ghcr.io/.../gha-runner-scale-set-controller \
  --namespace arc-systems \
  --create-namespace

    │
    ├─> Does NOT read configs/controller.yaml
    ├─> Uses Helm chart defaults only
    └─> Ignores your custom values
```

**Limitations**:
- ⚠️ Ignores your config file
- ⚠️ Uses default values only
- ⚠️ No version control
- ⚠️ Hard to reproduce

---

## 🔍 Config File Anatomy

```yaml
┌─────────────────────────────────────────────────────────────────┐
│                     configs/controller.yaml                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  chart:                     # ← Chart Information               │
│    repository: oci://...    #    Where to get the Helm chart    │
│    name: gha-runner-...     #    Chart name                     │
│    version: latest          #    Chart version                  │
│                                                                 │
│  release:                   # ← Release Configuration           │
│    name: arc-controller     #    Helm release name              │
│    namespace: arc-systems   #    K8s namespace                  │
│    createNamespace: true    #    Create if doesn't exist        │
│                                                                 │
│  values:                    # ← YOUR CUSTOMIZATIONS             │
│    # Add custom Helm        #    Everything here becomes        │
│    # values here            #    a --set argument               │
│    replicaCount: 2          #    --set replicaCount=2           │
│    resources: {...}         #    --set resources.limits.cpu=... │
│                                                                 │
│  metadata:                  # ← Tracking Info (Not used by Helm)│
│    managedBy: arc-config-mcp #   Tool identifier                │
│    mode: hybrid             #    Deployment mode                │
│    generatedAt: 2025-...    #    Timestamp                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Decision Tree: Which Option to Use?

```
                      Need to customize Helm values?
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                YES                         NO
                 │                           │
                 ▼                           ▼
        Use #arc_apply_config      Either option works
        (Option 1)                 (but Option 1 is better
         │                          for version control)
         │
         └─> Edit configs/controller.yaml first
             to add your custom values
```

---

## 💡 Pro Tips

### 1. Always Use Version Control
```bash
# After generating or editing config
git add configs/
git commit -m "chore(arc): Update controller config"
git push
```

### 2. Review Before Applying
```bash
# See what will be executed
cat configs/controller.yaml

# Check current cluster state
kubectl get all -n arc-systems
```

### 3. Test in Dev First
```bash
# Use a dev namespace for testing
#arc_install_controller_hybrid --namespace arc-dev --apply false

# Review, then apply
#arc_apply_config --configType controller
```

### 4. Use Drift Detection
```bash
# Check if cluster matches your config
#arc_detect_drift
```

---

## 🚀 Quick Start Example

```bash
# 1. Generate config (don't apply yet)
#arc_install_controller_hybrid --apply false

# 2. Edit the config to add custom values
# Edit: configs/controller.yaml
# Add:
#   values:
#     replicaCount: 2
#     resources:
#       limits:
#         memory: 512Mi

# 3. Commit your changes
git add configs/controller.yaml
git commit -m "feat: Add HA controller config"

# 4. Apply the configuration
#arc_apply_config --configType controller

# 5. Verify it worked
kubectl get pods -n arc-systems
```

---

## 📚 Related Documentation

- **Main Guide**: `docs/HYBRID_WORKFLOW_CLARITY.md`
- **Examples**: `examples/controller-with-values.yaml.md`
- **Code Documentation**: `src/services/hybrid-deployment.ts`
- **Summary**: `docs/HYBRID_WORKFLOW_IMPROVEMENTS_SUMMARY.md`

---

**Remember**: The hybrid workflow gives you the best of both worlds - the power of Helm customization with the safety and traceability of version-controlled configuration files!
