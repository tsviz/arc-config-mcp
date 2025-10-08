// CostEstimator: Estimates monthly cost for runner usage
export class CostEstimator {
  static estimateMonthlyCost(cpu: string, memory: string, replicas: number, provider: 'aws' | 'azure' | 'gcp' = 'aws'): number {
    // Example pricing (per month): AWS: $0.0316 per vCPU/hr, $0.0042 per GB/hr
    const cpuVal = parseFloat(cpu);
    const memVal = memory.endsWith('Gi') ? parseFloat(memory) * 1024 : parseFloat(memory);
    const hours = 24 * 30;
    let cost = 0;
    if (provider === 'aws') {
      cost += cpuVal * 0.0316 * hours * replicas;
      cost += (memVal / 1024) * 0.0042 * hours * replicas;
    }
    // Add logic for other providers as needed
    return Math.round(cost * 100) / 100;
  }
}
