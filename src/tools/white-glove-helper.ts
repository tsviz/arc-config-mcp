/**
 * ARC White Glove Helper Tool
 * 
 * Provides step-by-step onboarding, personalized recommendations, and interactive guidance for new users.
 */

export function registerWhiteGloveHelper(server: any) {
    server.registerTool(
        'arc_white_glove_onboarding',
        {
            title: 'ARC White Glove Onboarding',
            description: 'Step-by-step onboarding, personalized config recommendations, and interactive help for new users.',
            inputSchema: {
                type: 'object',
                properties: {
                    userLevel: {
                        type: 'string',
                        enum: ['beginner', 'intermediate', 'advanced'],
                        description: 'User experience level with ARC and Kubernetes'
                    },
                    goal: {
                        type: 'string',
                        description: 'What the user wants to achieve'
                    }
                }
            }
        },
        async (params: { userLevel?: string, goal?: string }) => {
            // Determine user level and goal
            const level = params.userLevel || 'beginner';
            const goal = params.goal || 'setup ARC runners';

            let steps: string[] = [];
            let tips: string[] = [];

            if (level === 'beginner') {
                steps = [
                    '1. Clone or fork the arc-config-repo template.',
                    '2. Use the example config tool to generate runner, autoscaler, and policy YAMLs.',
                    '3. Replace placeholders with your organization, namespace, and resource values.',
                    '4. Apply the configs using kubectl or MCP server tools.',
                    '5. Ask Copilot Chat for live status, troubleshooting, or compliance checks.'
                ];
                tips = [
                    'Use natural language in Copilot Chat for any operation (e.g., "Install ARC", "Show runner status").',
                    'Review the README and quickstart guides for best practices.',
                    'Enable policy validation for security and compliance.'
                ];
            } else if (level === 'intermediate') {
                steps = [
                    '1. Review existing ARC setup and identify optimization opportunities.',
                    '2. Configure advanced scaling policies and resource limits.',
                    '3. Set up monitoring and alerting for your runners.',
                    '4. Implement security policies and compliance checks.',
                    '5. Optimize costs using intelligent scaling features.'
                ];
                tips = [
                    'Use the cost estimator tool to optimize resource allocation.',
                    'Implement horizontal pod autoscaling for better efficiency.',
                    'Set up proper RBAC and network policies.'
                ];
            } else {
                steps = [
                    '1. Review advanced configuration options in the arc-config-repo.',
                    '2. Customize runner sets, autoscalers, and policies for your workload.',
                    '3. Integrate with CI/CD pipelines and monitoring tools.',
                    '4. Use MCP server tools for scaling, cost optimization, and advanced troubleshooting.'
                ];
                tips = [
                    'Leverage autoscaling and cost optimization features for efficiency.',
                    'Use policy templates to enforce governance and security.',
                    'Automate maintenance and monitoring with MCP server integrations.'
                ];
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `# 🎯 ARC White Glove Onboarding

Welcome to ARC! Here's your personalized onboarding guide for ${level} users.

## 📋 Personalized Steps
${steps.map(step => step).join('\n')}

## 💡 Pro Tips
${tips.map(tip => `• ${tip}`).join('\n')}

## 🚀 Ready to Start?
${goal ? `Your goal: ${goal}` : 'Use the installation tool to get your ARC cluster running!'}

---
Need more help? Just ask Copilot Chat for guidance, troubleshooting, or best practices!`
                    }
                ],
                structuredContent: { steps, tips, level, goal }
            };
        }
    );
}
