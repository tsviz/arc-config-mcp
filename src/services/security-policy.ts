// SecurityPolicyService: Validates RBAC, secrets, and network policies for ARC resources
import * as fs from 'fs';
import * as yaml from 'js-yaml';

interface K8sManifest {
  kind?: string;
  roleRef?: { name?: string };
  data?: Record<string, unknown>;
}

export class SecurityPolicyService {
  static validateManifest(filePath: string): string[] {
    const warnings: string[] = [];
    const raw = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.load(raw) as K8sManifest | undefined;

    // RBAC check
    if (doc && (doc.kind === 'RoleBinding' || doc.kind === 'ClusterRoleBinding')) {
      if (doc.roleRef?.name === 'cluster-admin') {
        warnings.push('Avoid using cluster-admin in RoleBinding/ClusterRoleBinding');
      }
    }
    // Secret check
    if (doc && doc.kind === 'Secret') {
      if (doc.data) {
        warnings.push('Check for plain text secrets; use Kubernetes secrets best practices');
      }
    }
    // NetworkPolicy check
    if (doc && doc.kind === 'NetworkPolicy') {
      // Could add more checks here
    } else if (doc && doc.kind && doc.kind !== 'NetworkPolicy') {
      warnings.push('No NetworkPolicy found; consider adding one for security');
    }
    return warnings;
  }
}
