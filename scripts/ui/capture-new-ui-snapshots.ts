#!/usr/bin/env node
/**
 * New UI Snapshot Generator
 *
 * This script captures HTML snapshots from new UI renderer functions for parity
 * comparison with legacy UI snapshots. It dynamically imports render functions
 * from app/forms, app/portal, and app/admin directories.
 *
 * Usage: npm run ui:snapshot:new
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const REPO_ROOT = join(__dirname, '../..');
const APP_DIR = join(REPO_ROOT, 'app');
const OUTPUT_DIR = join(REPO_ROOT, 'docs/ui/new');
const SNAPSHOTS_DIR = join(OUTPUT_DIR, 'snapshots/html');
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json');

/**
 * Validates that a module path stays within REPO_ROOT and returns a file:// URL.
 * @throws Error if path resolves outside REPO_ROOT
 */
export function getValidatedModuleUrl(modulePath: string): string {
  const resolved = resolve(REPO_ROOT, modulePath);
  const normalizedRoot = resolve(REPO_ROOT);

  if (!resolved.startsWith(normalizedRoot + '/') && resolved !== normalizedRoot) {
    throw new Error(`Path traversal rejected: ${modulePath} resolves outside repo root`);
  }

  return pathToFileURL(resolved).href;
}

// Renderer patterns to scan
const RENDERER_PATTERNS = [
  { kind: 'form', pattern: 'forms/*/render.ts' },
  { kind: 'portal', pattern: 'portal/*/render.ts' },
  { kind: 'admin', pattern: 'admin/*/render.ts' },
];

// Fixture data for renderers that require options
const FIXTURE_DATA = {
  portal: {
    home: {
      userEmail: 'test.applicant@example.com',
      homeCountryIso: 'US',
      homeCountryName: 'United States',
      reportLinks: [
        { href: '/reporting/user-summary', label: 'User Summary' },
        { href: '/reporting/user-integrity', label: 'User Integrity' },
      ],
    },
    tabs: {
      templateName: 'contact.html',
      userHomeCountryIso: 'US',
      userHomeCountryName: 'United States',
    },
    disabled: {},
  },
  admin: {},
  form: {},
};

// Type definitions for manifest entries
interface ManifestEntry {
  id: string;
  kind: 'form' | 'portal' | 'admin';
  renderer_module: string;
  renderer_function: string;
  snapshot_path: string;
  login_required: boolean;
  context: Record<string, unknown>;
  auth: 'google-oauth' | 'public' | 'none' | 'admin';
  auth_permissions?: string[] | null;
  external_deps?: string[] | null;
  include: boolean;
  note?: string;
}

interface Manifest {
  $schema: string;
  version: string;
  generated: string;
  navigation_model: string;
  snapshot_base_url: string;
  entries: ManifestEntry[];
}

/**
 * Converts a module path to a kebab-case snapshot ID
 */
function pathToId(modulePath: string, kind: string): string {
  // Extract the directory name (e.g., 'ttc_application_us' from 'forms/ttc_application_us/render.ts')
  const parts = modulePath.split('/');
  const dirName = parts[parts.length - 2] || kind; // Directory containing render.ts
  return dirName.toLowerCase().replace(/_/g, '-');
}

/**
 * Converts a function name to a kebab-case ID suffix
 */
function functionToId(functionName: string): string {
  return functionName
    .replace(/^render/, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * Determines if a renderer function requires options based on its name
 */
function needsOptions(functionName: string): boolean {
  // Known renderers that take options
  const needsOptionsList = ['renderPortalHome', 'renderPortalTab'];
  return needsOptionsList.includes(functionName);
}

/**
 * Gets fixture data for a specific renderer
 */
function getFixtureData(kind: string, functionName: string): Record<string, unknown> {
  if (kind === 'portal') {
    if (functionName === 'renderPortalHome') {
      return FIXTURE_DATA.portal.home;
    }
    if (functionName === 'renderPortalTab') {
      return FIXTURE_DATA.portal.tabs;
    }
  }
  return {};
}

/**
 * Finds all render.ts files matching a glob pattern
 */
function findRenderers(_kind: string, pattern: string): string[] {
  const [category] = pattern.split('/');
  const categoryDir = join(APP_DIR, category);

  if (!readdirSync(categoryDir, { withFileTypes: true }).some((d) => d.isDirectory())) {
    return [];
  }

  const renderers: string[] = [];
  const subdirs = readdirSync(categoryDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const subdir of subdirs) {
    const renderPath = join(categoryDir, subdir, 'render.ts');
    try {
      readdirSync(dirname(renderPath)); // Check if directory exists
      // Try to read to verify file exists
      readFileSync(renderPath, 'utf-8');
      renderers.push(renderPath);
    } catch {
      // File doesn't exist, skip
    }
  }

  return renderers;
}

/**
 * Extracts exported render function names from a renderer module
 */
async function extractRenderFunctions(modulePath: string): Promise<string[]> {
  const moduleUrl = getValidatedModuleUrl(modulePath);
  const module = await import(moduleUrl);

  const renderFunctions: string[] = [];
  for (const [name, value] of Object.entries(module)) {
    if (name.startsWith('render') && typeof value === 'function') {
      renderFunctions.push(name);
    }
  }

  return renderFunctions;
}

/**
 * Captures a snapshot from a renderer function
 */
async function captureSnapshot(
  modulePath: string,
  functionName: string,
  kind: string
): Promise<{ html: string; context: Record<string, unknown> }> {
  const moduleUrl = getValidatedModuleUrl(modulePath);
  const module = await import(moduleUrl);
  const renderFn = module[functionName] as (...args: unknown[]) => string;

  const context = getFixtureData(kind, functionName);
  let html: string;

  try {
    if (needsOptions(functionName)) {
      html = renderFn(context);
    } else {
      html = renderFn();
    }
  } catch (error) {
    html = `<!-- Error rendering ${functionName}: ${error} -->`;
  }

  return { html, context };
}

/**
 * Writes a snapshot HTML file
 */
function writeSnapshot(kind: string, id: string, html: string): string {
  const kindDir = join(SNAPSHOTS_DIR, kind);
  mkdirSync(kindDir, { recursive: true });
  const snapshotPath = join(kindDir, `${id}.html`);

  writeFileSync(snapshotPath, html, 'utf-8');
  return relative(OUTPUT_DIR, snapshotPath);
}

/**
 * Generates the full snapshot ID
 */
function generateSnapshotId(modulePath: string, functionName: string, kind: 'form' | 'portal' | 'admin'): string {
  const basePath = pathToId(modulePath, kind);
  const functionSuffix = functionToId(functionName);

  // For render*Form functions, use the base path only
  if (functionName.endsWith('Form') || functionName === basePath.replace(/-/g, '')) {
    return basePath;
  }

  // Otherwise combine base path with function name
  return functionSuffix ? `${basePath}-${functionSuffix}` : basePath;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('📸 New UI Snapshot Generator');
  console.log('=============================\n');

  const entries: ManifestEntry[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const { kind, pattern } of RENDERER_PATTERNS) {
    console.log(`Scanning ${kind} renderers...`);

    const renderers = findRenderers(kind, pattern);

    for (const rendererPath of renderers) {
      const modulePath = relative(REPO_ROOT, rendererPath).replace(/\\/g, '/');

      try {
        const renderFunctions = await extractRenderFunctions(modulePath);

        if (renderFunctions.length === 0) {
          console.log(`  ⚠️  No render functions found in ${modulePath}`);
          continue;
        }

        for (const functionName of renderFunctions) {
          const typedKind = kind as 'form' | 'portal' | 'admin';
          const snapshotId = generateSnapshotId(modulePath, functionName, typedKind);

          console.log(`  📄 Capturing ${snapshotId} (${functionName})...`);

          const { html, context } = await captureSnapshot(modulePath, functionName, typedKind);
          const snapshotPath = writeSnapshot(typedKind, snapshotId, html);

          // Determine auth requirements
          const loginRequired = typedKind !== 'portal' || functionName !== 'renderDisabledPage';
          const auth: 'google-oauth' | 'public' | 'none' | 'admin' =
            typedKind === 'admin' ? 'admin' : loginRequired ? 'google-oauth' : 'none';

          entries.push({
            id: snapshotId,
            kind: typedKind,
            renderer_module: modulePath,
            renderer_function: functionName,
            snapshot_path: snapshotPath,
            login_required: loginRequired,
            context,
            auth,
            include: true,
          });
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${modulePath}: ${error}`);
      }
    }
  }

  // Write manifest
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const manifest: Manifest = {
    $schema: './manifest.schema.json',
    version: '1.0.0',
    generated: today,
    navigation_model: 'next-app-router',
    snapshot_base_url: '/',
    entries,
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  console.log(`\n✅ Generated ${entries.length} snapshots`);
  console.log(`📁 Manifest: ${MANIFEST_PATH}`);
  console.log(`📁 Snapshots: ${SNAPSHOTS_DIR}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
