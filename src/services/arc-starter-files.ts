

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_FILES = [
  'runner-deployment.yaml',
  'horizontal-runner-autoscaler.yaml'
];

const TEMPLATE_DIR = path.join(__dirname, '../../templates');

export function getMissingArcFiles(workspacePath: string): string[] {
  return REQUIRED_FILES.filter(file => !fs.existsSync(path.join(workspacePath, file)));
}

export function promptForStarterFiles(missing: string[]): string {
  return `No ARC config files found (missing: ${missing.join(', ')}). Would you like to create starter files? [Y/n]`;
}

export function createStarterFiles(workspacePath: string, missing: string[]): void {
  missing.forEach(file => {
    const src = path.join(TEMPLATE_DIR, file);
    const dest = path.join(workspacePath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
}
