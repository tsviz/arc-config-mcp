/**
 * Natural language intent parser for ARC MCP server operations.
 * Lightweight (regex + heuristics) to avoid model round-trips.
 *
 * Responsibilities:
 *  - Classify user utterance into a known ARC intent
 *  - Extract parameters (namespace, runner-scale-set, image, replicas, etc.)
 *  - Return structured object suitable for invoking existing MCP tools
 */

// Primitive value types we expect to extract from utterances
type ParamValue = string | number | boolean | undefined;
type Params = Record<string, ParamValue>;

export interface ParsedIntent<P extends Params = Params> {
    intent: string;              // canonical tool name or meta action
    confidence: number;          // 0..1 heuristic
    params: P;                   // extracted parameters
    missing?: string[];          // required params not found
    notes?: string;              // explanation for the mapping
    alternatives?: string[];     // suggested alternative intents when ambiguous
}

interface IntentPattern<P extends Params = Params> {
    name: string;
    tool: string; // underlying tool name
    description: string;
    required?: string[]; // required param keys
    regexes: RegExp[];   // matching patterns
    paramExtractors?: ((utterance: string) => Partial<P>)[];
    confidenceBoost?: number;
}

// Basic helpers
const toNumber = (s: string | undefined) => {
    if (!s) return undefined;
    const n = parseInt(s, 10);
    return isNaN(n) ? undefined : n;
};

// ARC-specific patterns definition
const arcPatterns: IntentPattern[] = [
    {
        name: 'arc_deploy_runners_hybrid',
        tool: 'arc_deploy_runners_hybrid',
        description: 'Deploy ARC runners with hybrid GitOps approach',
        regexes: [
            /install.*arc.*(runner|with|using)/i,  // "Install ARC with/using runners" or "Install ARC runners"
            /(setup|deploy|create).*runners?/i, 
            /add.*runners?.*(repo|repository|org|organization)/i,
            /install.*arc.*(container.*mode|novolume|ephemeral|storage)/i  // "Install ARC with container mode"
        ],
        paramExtractors: [utter => {
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            const org = utter.match(/(org|organization)[:\s]+([a-z0-9-]+)/i)?.[2];
            const minReplicas = toNumber(utter.match(/min(imum)? (\d+)/i)?.[2]);
            const maxReplicas = toNumber(utter.match(/max(imum)? (\d+)/i)?.[2]);
            // Extract container mode
            let containerMode: string | undefined;
            if (/dind|docker.?in.?docker|container.*mode.*dind|eliminate.*storage/i.test(utter)) {
                containerMode = 'dind';
            } else if (/novolume|no.?volume|ephemeral.*storage|kubernetes-novolume/i.test(utter)) {
                containerMode = 'kubernetes-novolume';
            } else if (/with.*volume|persistent.*storage|kubernetes.*mode/i.test(utter)) {
                containerMode = 'kubernetes';
            }
            return {
                namespace: ns,
                organization: org,
                minRunners: minReplicas,
                maxRunners: maxReplicas,
                containerMode,
                apply: true  // Default to applying when user says "install"
            };
        }]
    },
    {
        name: 'arc_install_controller',
        tool: 'arc_install_controller',
        description: 'Install ARC controller only (without runners)',
        regexes: [
            /install.*arc.*controller/i, 
            /^(setup|deploy).*arc$/i,  // Only match "setup ARC" or "deploy ARC" without additional context
            /install.*github.*actions.*runner.*controller/i,
            /install.*arc.*only/i  // "Install ARC only" (no runners)
        ],
        paramExtractors: [utter => {
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2] || 'arc-systems';
            const version = utter.match(/version ([v]?[\d.]+)/i)?.[1];
            return { namespace: ns, version };
        }]
    },
    {
        name: 'arc_create_runner_scale_set',
        tool: 'arc_create_runner_scale_set',
        description: 'Create ARC runner scale set (legacy direct approach)',
        required: ['name', 'namespace', 'githubConfigUrl'],
        regexes: [/create.*runner.*scale.*set/i, /add.*runner.*scale.*set/i],
        paramExtractors: [utter => {
            const name = utter.match(/named? ([a-z0-9-]+)/i)?.[1];
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            const repo = utter.match(/(repo|repository) ([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/i)?.[2];
            const minReplicas = toNumber(utter.match(/min(imum)? (\d+) replica/i)?.[2]);
            const maxReplicas = toNumber(utter.match(/max(imum)? (\d+) replica/i)?.[2]);
            // Extract container mode
            let containerMode: string | undefined;
            if (/dind|docker.?in.?docker|container.*mode.*dind|eliminate.*storage/i.test(utter)) {
                containerMode = 'dind';
            } else if (/novolume|no.?volume|ephemeral.*storage|kubernetes-novolume/i.test(utter)) {
                containerMode = 'kubernetes-novolume';
            } else if (/with.*volume|persistent.*storage|kubernetes.*mode/i.test(utter)) {
                containerMode = 'kubernetes';
            }
            return {
                name,
                namespace: ns,
                githubConfigUrl: repo ? `https://github.com/${repo}` : undefined,
                minReplicas,
                maxReplicas,
                containerMode
            };
        }]
    },
    {
        name: 'arc_list_runner_scale_sets',
        tool: 'arc_list_runner_scale_sets',
        description: 'List ARC runner scale sets',
        regexes: [/list.*runner.*scale.*sets?/i, /(show|what).*runners?/i, /get.*arc.*runners?/i],
        paramExtractors: [utter => {
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            return { namespace: ns };
        }]
    },
    {
        name: 'arc_get_runner_scale_set_status',
        tool: 'arc_get_runner_scale_set_status',
        description: 'Get runner scale set status',
        required: ['name', 'namespace'],
        regexes: [/(status|health|state).*(runner.*scale.*set|runners?)/i, /how.*(runners?).*(doing|health)/i],
        paramExtractors: [utter => {
            const name = utter.match(/(runner.*scale.*set|runners?) ([a-z0-9-]+)/i)?.[2];
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            return { name, namespace: ns };
        }]
    },
    {
        name: 'arc_scale_runner_scale_set',
        tool: 'arc_scale_runner_scale_set',
        description: 'Scale ARC runner scale set',
        required: ['name', 'namespace', 'replicas'],
        regexes: [/(scale|set).*(runner.*scale.*set|runners?)/i, /(increase|decrease).*(runner|replicas)/i],
        paramExtractors: [utter => {
            const name = utter.match(/(runner.*scale.*set|runners?) ([a-z0-9-]+)/i)?.[2];
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            const reps = toNumber(utter.match(/to (\d{1,3}) ?replica/i)?.[1] || utter.match(/to (\d{1,3})$/)?.[1]);
            return { name, namespace: ns, replicas: reps };
        }]
    },
    {
        name: 'arc_update_runner_image',
        tool: 'arc_update_runner_image',
        description: 'Update runner image',
        required: ['name', 'namespace', 'image'],
        regexes: [/update.*runner.*image/i, /(set|change).*image.*runner/i],
        paramExtractors: [utter => {
            const name = utter.match(/(runner.*scale.*set|runners?) ([a-z0-9-]+)/i)?.[2];
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            const image = utter.match(/image ([\w./:-]+:[\w.-]+)/i)?.[1] || utter.match(/to ([\w./:-]+:[\w.-]+)/i)?.[1];
            return { name, namespace: ns, image };
        }]
    },
    {
        name: 'arc_delete_runner_scale_set',
        tool: 'arc_delete_runner_scale_set',
        description: 'Delete runner scale set',
        required: ['name', 'namespace'],
        regexes: [/delete.*runner.*scale.*set/i, /remove.*runners?/i, /(cleanup|destroy).*arc.*runners?/i],
        paramExtractors: [utter => {
            const name = utter.match(/(runner.*scale.*set|runners?) ([a-z0-9-]+)/i)?.[2];
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            return { name, namespace: ns };
        }]
    },
    {
        name: 'arc_get_runner_logs',
        tool: 'arc_get_runner_logs',
        description: 'Get runner logs',
        required: ['runnerScaleSetName', 'namespace'],
        regexes: [/(logs|log).*(runner|arc)/i, /(show|get).*runner.*logs?/i],
        paramExtractors: [utter => {
            const name = utter.match(/(runner.*scale.*set|runners?) ([a-z0-9-]+)/i)?.[2];
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            const lines = toNumber(utter.match(/last (\d{1,4}) lines?/i)?.[1]);
            return { runnerScaleSetName: name, namespace: ns, lines };
        }]
    },
    {
        name: 'arc_evaluate_policies',
        tool: 'arc_evaluate_policies',
        description: 'Evaluate ARC policies',
        required: ['runnerScaleSetName', 'namespace'],
        regexes: [/evaluate.*arc.*polic/i, /(policy|policies).*arc.*(check|evaluate)/i, /check.*arc.*compliance/i],
        paramExtractors: [utter => {
            const name = utter.match(/(runner.*scale.*set|runners?) ([a-z0-9-]+)/i)?.[2];
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            return { runnerScaleSetName: name, namespace: ns };
        }]
    },
    {
        name: 'arc_generate_compliance_report',
        tool: 'arc_generate_compliance_report',
        description: 'Generate ARC compliance report',
        regexes: [/(generate|create).*arc.*compliance/i, /arc.*compliance.*report/i, /compliance.*report.*arc/i],
        paramExtractors: [utter => {
            const ns = utter.match(/namespace ([a-z0-9-]+)/i)?.[1];
            return { namespace: ns };
        }]
    },
    {
        name: 'arc_auto_fix_violations',
        tool: 'arc_auto_fix_violations',
        description: 'Auto fix ARC policy violations',
        required: ['runnerScaleSetName', 'namespace'],
        regexes: [/auto.*fix.*arc/i, /(apply|run).*arc.*auto[- ]?fix/i, /fix.*arc.*(violations|policies)/i],
        paramExtractors: [utter => {
            const name = utter.match(/(runner.*scale.*set|runners?) ([a-z0-9-]+)/i)?.[2];
            const ns = utter.match(/in (namespace |ns )?([a-z0-9-]+)/i)?.[2];
            const dryRun = /dry run/i.test(utter) ? true : undefined;
            return { runnerScaleSetName: name, namespace: ns, dryRun };
        }]
    },
    {
        name: 'arc_check_github_connection',
        tool: 'arc_check_github_connection',
        description: 'Check GitHub connection',
        regexes: [/check.*github.*connection/i, /(test|verify).*github.*connect/i, /github.*status/i],
        paramExtractors: [utter => {
            const token = utter.match(/token ([a-zA-Z0-9_]+)/i)?.[1];
            return { githubToken: token };
        }]
    },
    {
        name: 'arc_get_cluster_info',
        tool: 'arc_get_cluster_info',
        description: 'Get Kubernetes cluster info',
        regexes: [/^(what'?s|show|get).*(cluster|k8s).*info/i, /(cluster|kubernetes).*status/i]
    },
    {
        name: 'arc_backup_configuration',
        tool: 'arc_backup_configuration',
        description: 'Backup ARC configuration',
        regexes: [/backup.*arc.*config/i, /(save|export).*arc.*configuration/i],
        paramExtractors: [utter => {
            const outputPath = utter.match(/to (.+\.(yaml|yml|json))/i)?.[1];
            return { outputPath };
        }]
    },
    {
        name: 'arc_restore_configuration',
        tool: 'arc_restore_configuration',
        description: 'Restore ARC configuration',
        required: ['configPath'],
        regexes: [/restore.*arc.*config/i, /(import|load).*arc.*configuration/i],
        paramExtractors: [utter => {
            const configPath = utter.match(/from (.+\.(yaml|yml|json))/i)?.[1];
            return { configPath };
        }]
    },
    {
        name: 'arc_monitor_webhooks',
        tool: 'arc_monitor_webhooks',
        description: 'Monitor GitHub webhooks',
        regexes: [/monitor.*webhooks?/i, /(check|watch).*webhook.*status/i, /webhook.*health/i],
        paramExtractors: [utter => {
            const duration = toNumber(utter.match(/for (\d+) (minutes?|mins?)/i)?.[1]);
            return { durationMinutes: duration };
        }]
    }
];

export function parseArcIntent(utterance: string): ParsedIntent {
    const cleaned = utterance.trim();
    const matches: ParsedIntent[] = [];

    for (const p of arcPatterns) {
        if (p.regexes.some(r => r.test(cleaned))) {
            let params: Params = {};
            if (p.paramExtractors) {
                for (const ex of p.paramExtractors) {
                    params = { ...params, ...ex(cleaned) };
                }
            }
            const missing = (p.required || []).filter(req => params[req] === undefined || params[req] === null || params[req] === '');
            const confidenceBase = 0.6 + (p.confidenceBoost || 0);
            const completeness = p.required && p.required.length > 0 ? (((p.required.length - missing.length) / p.required.length) * 0.4) : 0.2;
            matches.push({
                intent: p.tool,
                confidence: Math.min(1, confidenceBase + completeness),
                params,
                missing: missing.length ? missing : undefined,
                notes: p.description
            });
        }
    }

    if (matches.length === 0) {
        return {
            intent: 'unknown',
            confidence: 0,
            params: {},
            notes: 'No matching ARC intent patterns',
            alternatives: ['arc_list_tools', 'arc_get_cluster_info', 'arc_list_runner_scale_sets']
        };
    }

    // Select highest confidence; if close, mark alternatives
    matches.sort((a, b) => b.confidence - a.confidence);
    const top = matches[0];
    const alt = matches.slice(1).filter(m => top.confidence - m.confidence < 0.15).map(m => m.intent);
    if (alt.length) top.alternatives = alt;
    return top;
}

// Export the pattern list for external use (e.g., help generation)
export const getArcIntentPatterns = () => arcPatterns.map(p => ({
    name: p.name,
    tool: p.tool,
    description: p.description,
    required: p.required || [],
    examples: p.regexes.map(r => r.source)
}));