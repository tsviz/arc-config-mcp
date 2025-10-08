// ResourceOptimizer: Suggests optimal CPU/memory requests/limits for ARC runners
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export class ResourceOptimizer {
  static suggestResources(filePath: string, nodeCpu: number, nodeMemory: number): {cpu: string, memory: string} {
    const doc = yaml.load(fs.readFileSync(filePath, 'utf8'));
    // Simple logic: suggest 50% of node resources per runner
    const cpu = nodeCpu ? `${(nodeCpu * 0.5).toFixed(1)}` : '2.0';
    const memory = nodeMemory ? `${Math.floor(nodeMemory * 0.5)}Mi` : '1Gi';
    return { cpu, memory };
  }
}
