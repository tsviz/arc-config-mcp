/**/**// For ES module compatibility (if you need __dirname in future):

 * ARC White Glove Helper Tool - Simplified

 */ * ARC White Glove Helper Tool - Simplified// import { fileURLToPath } from 'url';



export function registerWhiteGloveHelper(server: any) { */// import path from 'path';

    server.registerTool(

        'arc_white_glove_onboarding',// const __dirname = path.dirname(fileURLToPath(import.meta.url));

        {

            title: 'ARC White Glove Onboarding',export function registerWhiteGloveHelper(server: any) {/**

            description: 'Step-by-step onboarding, personalized config recommendations, and interactive help for new users.'

        },    server.registerTool( * ARC White Glove Helper Tool

        async (params: any) => {

            return {        'arc_white_glove_onboarding', *

                content: [

                    {        { * Provides step-by-step onboarding, personalized recommendations, and interactive guidance for new users.

                        type: 'text',

                        text: '# 🎯 ARC White Glove Onboarding\n\nWelcome to ARC! Here\'s your personalized onboarding guide:\n\n## 📋 Quick Start Steps\n\n1. **Setup**: Ensure you have kubectl and helm installed\n2. **Install**: Use the ARC installation tool\n3. **Configure**: Set up your runner scale sets\n4. **Monitor**: Check status and logs\n5. **Scale**: Adjust based on your needs\n\n## 💡 Pro Tips\n\n• Start small with 1-2 runners and scale up\n• Use namespace separation for different environments\n• Monitor resource usage and costs\n• Set up proper RBAC and security policies\n\n## 🚀 Ready to Start?\n\nUse the installation tool to get your ARC cluster running!'            title: 'ARC White Glove Onboarding', */

                    }

                ]            description: 'Step-by-step onboarding, personalized config recommendations, and interactive help for new users.'

            };

        }        },export function registerWhiteGloveHelper(server: any) {

    );

}        async (params: any) => {    server.registerTool(

            return {        'arc_white_glove_onboarding',

                content: [        {

                    {            title: 'ARC White Glove Onboarding',

                        type: 'text',            description: 'Step-by-step onboarding, personalized config recommendations, and interactive help for new users.',

                        text: `# 🎯 ARC White Glove Onboarding                    goal: {

                        type: 'string',

Welcome to ARC! Here's your personalized onboarding guide:                        description: 'What the user wants to achieve'

                    }

## 📋 Quick Start Steps                }

            }

1. **Setup**: Ensure you have kubectl and helm installed        },

2. **Install**: Use the ARC installation tool        async (params: { userLevel?: string, goal?: string }) => {

3. **Configure**: Set up your runner scale sets            // Determine user level and goal

4. **Monitor**: Check status and logs            const level = params.userLevel || 'beginner';

5. **Scale**: Adjust based on your needs            const goal = params.goal || 'setup ARC runners';

            let steps: string[] = [];

## 💡 Pro Tips            let tips: string[] = [];

            if (level === 'beginner') {

• Start small with 1-2 runners and scale up                steps = [

• Use namespace separation for different environments                      '1. Clone or fork the arc-config-repo template.',

• Monitor resource usage and costs                    '2. Use the example config tool to generate runner, autoscaler, and policy YAMLs.',

• Set up proper RBAC and security policies                    '3. Replace placeholders with your organization, namespace, and resource values.',

                    '4. Apply the configs using kubectl or MCP server tools.',

## 🚀 Ready to Start?                    '5. Ask Copilot Chat for live status, troubleshooting, or compliance checks.'

                ];

Use the installation tool to get your ARC cluster running!`                tips = [

                    }                    'Use natural language in Copilot Chat for any operation (e.g., "Install ARC", "Show runner status").',

                ]                    'Review the README and quickstart guides for best practices.',

            };                    'Enable policy validation for security and compliance.'

        }                ];

    );            } else {

}                steps = [
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
                        text:
`# ARC White Glove Onboarding\n\n## Personalized Steps\n${steps.join('\n')}\n\n## Pro Tips\n${tips.join('\n')}\n\n---\nNeed more help? Just ask Copilot Chat for guidance, troubleshooting, or best practices!`
                    }
                ],
                structuredContent: { steps, tips }
            };
        }
    );
}
