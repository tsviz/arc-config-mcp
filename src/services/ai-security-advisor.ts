/**
 * AI Security Advisor for ARC Policy Management
 * Provides intelligent security recommendations based on patterns and threats
 */

import { ArcPolicyEngine, PolicyViolation, PolicyEvaluationResult } from '../engines/policy-engine.js';

export interface SecurityThreat {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    indicators: string[];
    recommendations: string[];
    cveIds?: string[];
    mitreTechniques?: string[];
}

export interface SecurityAssessment {
    overallRisk: 'critical' | 'high' | 'medium' | 'low';
    threats: SecurityThreat[];
    recommendations: string[];
    complianceGaps: string[];
    automatedFixes: string[];
}

export class AiSecurityAdvisor {
    private threatDatabase: SecurityThreat[] = [
        {
            id: 'supply-chain-attack',
            severity: 'critical',
            category: 'supply-chain',
            description: 'Potential supply chain attack via untrusted GitHub Actions',
            indicators: [
                'unpinned action versions',
                'actions from unverified publishers',
                'suspicious action behavior patterns'
            ],
            recommendations: [
                'Pin all actions to specific SHA commits',
                'Use only verified marketplace actions',
                'Implement action allow-listing',
                'Enable dependency review'
            ],
            mitreTechniques: ['T1195.001', 'T1195.002']
        },
        {
            id: 'privilege-escalation',
            severity: 'high',
            category: 'access-control',
            description: 'Runner configuration allows privilege escalation',
            indicators: [
                'privileged containers',
                'host path mounts',
                'excessive RBAC permissions'
            ],
            recommendations: [
                'Remove privileged flag from containers',
                'Use security contexts with dropped capabilities',
                'Implement least privilege RBAC',
                'Use Pod Security Standards'
            ],
            mitreTechniques: ['T1068', 'T1548']
        },
        {
            id: 'secrets-exposure',
            severity: 'critical',
            category: 'secrets',
            description: 'Secrets may be exposed through insecure practices',
            indicators: [
                'secrets in environment variables',
                'secrets in logs',
                'long-lived tokens'
            ],
            recommendations: [
                'Use Kubernetes secrets with proper RBAC',
                'Implement secret rotation policies',
                'Use OIDC for GitHub authentication',
                'Enable secret scanning'
            ],
            mitreTechniques: ['T1552.001', 'T1552.004']
        },
        {
            id: 'lateral-movement',
            severity: 'high',
            category: 'network-security',
            description: 'Network configuration allows potential lateral movement',
            indicators: [
                'missing network policies',
                'overly permissive egress rules',
                'shared network namespaces'
            ],
            recommendations: [
                'Implement strict network policies',
                'Use deny-all default policies',
                'Segment runner networks by environment',
                'Monitor network traffic for anomalies'
            ],
            mitreTechniques: ['T1021', 'T1210']
        },
        {
            id: 'data-exfiltration',
            severity: 'medium',
            category: 'data-protection',
            description: 'Configuration may allow unauthorized data access',
            indicators: [
                'unrestricted file system access',
                'missing data classification',
                'insufficient audit logging'
            ],
            recommendations: [
                'Implement file system restrictions',
                'Use data classification labels',
                'Enable comprehensive audit logging',
                'Monitor for unusual data access patterns'
            ],
            mitreTechniques: ['T1041', 'T1567']
        }
    ];

    /**
     * Analyze security posture based on policy evaluation results
     */
    analyzeSecurityPosture(
        evaluationResults: PolicyEvaluationResult[],
        runnerConfigs: any[]
    ): SecurityAssessment {
        const threats: SecurityThreat[] = [];
        const recommendations: string[] = [];
        const complianceGaps: string[] = [];
        const automatedFixes: string[] = [];

        // Analyze violations for threat indicators
        for (const result of evaluationResults) {
            for (const violation of result.violations) {
                const matchingThreats = this.identifyThreats(violation);
                threats.push(...matchingThreats);
            }
        }

        // Generate AI-powered recommendations
        const aiRecommendations = this.generateAiRecommendations(threats, runnerConfigs);
        recommendations.push(...aiRecommendations);

        // Identify compliance gaps
        const gaps = this.identifyComplianceGaps(evaluationResults);
        complianceGaps.push(...gaps);

        // Suggest automated fixes
        const fixes = this.suggestAutomatedFixes(evaluationResults);
        automatedFixes.push(...fixes);

        const overallRisk = this.calculateOverallRisk(threats);

        return {
            overallRisk,
            threats: this.deduplicateThreats(threats),
            recommendations,
            complianceGaps,
            automatedFixes
        };
    }

    /**
     * Identify potential threats based on policy violations
     */
    private identifyThreats(violation: PolicyViolation): SecurityThreat[] {
        const matchingThreats: SecurityThreat[] = [];

        for (const threat of this.threatDatabase) {
            // Check if violation indicators match threat patterns
            const indicators = threat.indicators.some(indicator => 
                violation.message.toLowerCase().includes(indicator.toLowerCase()) ||
                (violation.field && violation.field.toLowerCase().includes(indicator.toLowerCase()))
            );

            if (indicators) {
                matchingThreats.push(threat);
            }
        }

        return matchingThreats;
    }

    /**
     * Generate AI-powered security recommendations
     */
    private generateAiRecommendations(
        threats: SecurityThreat[], 
        runnerConfigs: any[]
    ): string[] {
        const recommendations: string[] = [];

        // Pattern-based recommendations
        if (threats.some(t => t.category === 'supply-chain')) {
            recommendations.push(
                '🔒 Implement GitHub Actions security hardening with pinned dependencies',
                '📋 Create an approved actions catalog for your organization',
                '🛡️ Enable dependency review and Dependabot security updates'
            );
        }

        if (threats.some(t => t.category === 'access-control')) {
            recommendations.push(
                '🎯 Implement zero-trust architecture for runner access',
                '⏰ Enable just-in-time access with automatic expiration',
                '🔐 Use OIDC instead of long-lived GitHub tokens'
            );
        }

        if (threats.some(t => t.category === 'network-security')) {
            recommendations.push(
                '🌐 Implement micro-segmentation with Kubernetes Network Policies',
                '🔍 Deploy service mesh for encrypted inter-service communication',
                '📊 Enable network traffic monitoring and anomaly detection'
            );
        }

        // Configuration-specific recommendations
        const hasPrivilegedContainers = runnerConfigs.some(config => 
            config.spec?.template?.spec?.containers?.some((c: any) => 
                c.securityContext?.privileged === true
            )
        );

        if (hasPrivilegedContainers) {
            recommendations.push(
                '⚠️ Remove privileged flag from all runner containers',
                '🛡️ Use Pod Security Standards to prevent privileged escalation'
            );
        }

        return recommendations;
    }

    /**
     * Identify compliance framework gaps
     */
    private identifyComplianceGaps(evaluationResults: PolicyEvaluationResult[]): string[] {
        const gaps: string[] = [];

        // SOC2 compliance checks
        const hasSecurityContextViolations = evaluationResults.some(result =>
            result.violations.some(v => v.category === 'security')
        );

        if (hasSecurityContextViolations) {
            gaps.push('SOC2 CC6.1: Security context violations detected');
        }

        // ISO27001 compliance checks
        const hasAccessControlViolations = evaluationResults.some(result =>
            result.violations.some(v => v.category === 'access-control')
        );

        if (hasAccessControlViolations) {
            gaps.push('ISO27001 A.9.1.1: Access control policy violations');
        }

        return gaps;
    }

    /**
     * Suggest automated fixes for common security issues
     */
    private suggestAutomatedFixes(evaluationResults: PolicyEvaluationResult[]): string[] {
        const fixes: string[] = [];

        for (const result of evaluationResults) {
            for (const violation of result.violations) {
                if (violation.canAutoFix) {
                    switch (violation.ruleId) {
                        case 'arc-sec-001':
                            fixes.push('Add security context with non-root user');
                            break;
                        case 'arc-sec-002':
                            fixes.push('Remove privileged flag from container');
                            break;
                        case 'arc-res-001':
                            fixes.push('Add resource limits to prevent resource exhaustion');
                            break;
                    }
                }
            }
        }

        return fixes;
    }

    /**
     * Calculate overall risk level based on threat severity
     */
    private calculateOverallRisk(threats: SecurityThreat[]): 'critical' | 'high' | 'medium' | 'low' {
        if (threats.some(t => t.severity === 'critical')) {
            return 'critical';
        }
        if (threats.some(t => t.severity === 'high')) {
            return 'high';
        }
        if (threats.some(t => t.severity === 'medium')) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Remove duplicate threats
     */
    private deduplicateThreats(threats: SecurityThreat[]): SecurityThreat[] {
        const seen = new Set<string>();
        return threats.filter(threat => {
            if (seen.has(threat.id)) {
                return false;
            }
            seen.add(threat.id);
            return true;
        });
    }

    /**
     * Generate security remediation plan
     */
    generateRemediationPlan(assessment: SecurityAssessment): {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    } {
        const immediate: string[] = [];
        const shortTerm: string[] = [];
        const longTerm: string[] = [];

        // Categorize actions by urgency
        for (const threat of assessment.threats) {
            if (threat.severity === 'critical') {
                immediate.push(...threat.recommendations);
            } else if (threat.severity === 'high') {
                shortTerm.push(...threat.recommendations);
            } else {
                longTerm.push(...threat.recommendations);
            }
        }

        return {
            immediate: [...new Set(immediate)],
            shortTerm: [...new Set(shortTerm)],
            longTerm: [...new Set(longTerm)]
        };
    }
}