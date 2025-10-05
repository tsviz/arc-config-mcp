#!/usr/bin/env node

/**
 * Local CI Test Script
 * 
 * This script replicates the exact tests that run in GitHub Actions CI
 * to verify everything works locally before pushing.
 */

async function runTests() {
    console.log('🧪 Running local CI tests...\n');

    // Test 1: Policy Engine
    console.log('1️⃣ Testing Policy Engine...');
    try {
        const [k8s, policyModule] = await Promise.all([
            import('@kubernetes/client-node'),
            import('./build/engines/policy-engine.js')
        ]);

        const { KubeConfig } = k8s;
        const { ArcPolicyEngine } = policyModule;

        const kc = new KubeConfig();
        // Create minimal config for testing
        kc.loadFromString(JSON.stringify({
            apiVersion: 'v1',
            kind: 'Config',
            clusters: [{ name: 'test-cluster', cluster: { server: 'https://test' } }],
            users: [{ name: 'test-user', user: {} }],
            contexts: [{ name: 'test-context', context: { cluster: 'test-cluster', user: 'test-user' } }],
            'current-context': 'test-context'
        }));

        const engine = new ArcPolicyEngine(kc);
        const rules = engine.getRules();

        if (rules.length < 11) throw new Error(`Expected at least 11 policy rules, got ${rules.length}`);
        console.log(`✅ Policy Engine validated with ${rules.length} rules`);
    } catch (error) {
        console.error('❌ Policy Engine test failed:', error.message);
        process.exit(1);
    }

    // Test 2: NL Intent Parser
    console.log('\n2️⃣ Testing NL Intent Parser...');
    try {
        const { parseArcIntent } = await import('./build/utils/nl-intent.js');

        const testCases = [
            'Install ARC controller',
            'Scale runners to 5',
            'Check ARC compliance',
            'List runner scale sets'
        ];

        testCases.forEach(cmd => {
            const result = parseArcIntent(cmd);
            if (result.intent === 'unknown') {
                throw new Error(`Failed to parse: ${cmd}`);
            }
            console.log(`✅ Parsed: "${cmd}" -> ${result.intent}`);
        });
    } catch (error) {
        console.error('❌ NL Parser test failed:', error.message);
        process.exit(1);
    }

    console.log('\n🎉 All local CI tests passed! Ready for GitHub Actions.');
}

runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});