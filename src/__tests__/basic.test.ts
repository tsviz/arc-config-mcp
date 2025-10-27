import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('ARC MCP Server', () => {
    it('should have the correct package version', () => {
        const packageJsonPath = join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        expect(packageJson.version).toBe('2.4.0');
        expect(packageJson.name).toBe('arc-config-mcp');
    });

    it('should have the main build output', () => {
        const buildIndexPath = join(process.cwd(), 'build', 'index.js');
        expect(() => readFileSync(buildIndexPath, 'utf-8')).not.toThrow();
    });
});

describe('Configuration', () => {
    it('should have proper TypeScript configuration', () => {
        const tsconfigPath = join(process.cwd(), 'tsconfig.json');
        const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
        expect(tsconfig.compilerOptions.target).toBeDefined();
        expect(tsconfig.compilerOptions.module).toBe('Node16');
    });

    it('should have proper package.json scripts', () => {
        const packageJsonPath = join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        expect(packageJson.scripts.build).toBeDefined();
        expect(packageJson.scripts.start).toBeDefined();
        expect(packageJson.scripts.dev).toBeDefined();
        expect(packageJson.scripts.test).toBeDefined();
    });
});