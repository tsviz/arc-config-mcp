// LiveStatusService: Provides real-time runner/controller status and troubleshooting tips
import { KubernetesService } from './kubernetes.js';

export class LiveStatusService {
  constructor(private k8s: KubernetesService) {}

  async getArcStatus(namespace: string): Promise<any> {
    const k8sAny = this.k8s as any;
    let pods: any[] = [];

    if (typeof k8sAny.listPods === 'function') {
      pods = await k8sAny.listPods(namespace);
    } else if (k8sAny.core?.listNamespacedPod) {
      const resp = await k8sAny.core.listNamespacedPod(namespace);
      pods = resp.body.items;
    } else {
      throw new Error('KubernetesService does not expose listPods or core.listNamespacedPod; cannot retrieve pod status.');
    }

    const status = pods.map((pod: any) => ({
      name: pod.metadata?.name,
      phase: pod.status?.phase,
      ready: pod.status?.containerStatuses?.every((cs: any) => cs.ready) ?? false,
      restarts: pod.status?.containerStatuses?.reduce((sum: number, cs: any) => sum + (cs.restartCount ?? 0), 0) ?? 0
    }));
    return status;
  }

  getTroubleshootingTips(podStatus: any[]): string[] {
    const tips: string[] = [];
    podStatus.forEach(pod => {
      if (pod.phase !== 'Running') {
        tips.push(`Pod ${pod.name} is not running. Check events and logs.`);
      }
      if (pod.restarts > 3) {
        tips.push(`Pod ${pod.name} has restarted ${pod.restarts} times. Investigate crash loops.`);
      }
    });
    return tips;
  }
}
