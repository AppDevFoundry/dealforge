/**
 * Load All Data Orchestrator Script
 *
 * Orchestrates the full data population pipeline in the correct order:
 * 1. Clear fake/synthetic data
 * 2. Load TDHCA titles and liens
 * 3. Load CCN utility data
 * 4. Run Go sync for market data (HUD, Census, BLS)
 * 5. Discover parks from ownership records
 * 6. Calculate distress scores
 * 7. Verify data
 *
 * Usage:
 *   pnpm --filter @dealforge/database load:all [options]
 *
 * Options:
 *   --skip-tdhca      Skip TDHCA data loading
 *   --skip-ccn        Skip CCN data loading
 *   --skip-market     Skip market data sync (HUD, Census, BLS)
 *   --skip-discover   Skip park discovery
 *   --skip-distress   Skip distress score calculation
 *   --dry-run         Show what would be done without executing
 */

import { config } from 'dotenv';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Load environment
config({ path: '../../.env.local' });

interface StepResult {
  step: string;
  success: boolean;
  duration: number;
  error?: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    skipTdhca: args.includes('--skip-tdhca'),
    skipCcn: args.includes('--skip-ccn'),
    skipMarket: args.includes('--skip-market'),
    skipDiscover: args.includes('--skip-discover'),
    skipDistress: args.includes('--skip-distress'),
    dryRun: args.includes('--dry-run'),
  };
}

function runPnpmScript(args: string[], cwd: string): { success: boolean; output: string } {
  try {
    const output = execFileSync('pnpm', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      output: err.stdout || err.stderr || err.message || 'Unknown error',
    };
  }
}

function runGoCommand(args: string[], cwd: string): { success: boolean; output: string } {
  try {
    const output = execFileSync('go', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      output: err.stdout || err.stderr || err.message || 'Unknown error',
    };
  }
}

async function loadAllData() {
  const options = parseArgs();
  const results: StepResult[] = [];

  console.log('DealForge Data Population Pipeline');
  console.log('===================================');
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log('');

  const rootDir = path.resolve(__dirname, '../../../..');
  const dbPkgDir = path.resolve(__dirname, '../..');
  const goServiceDir = path.join(rootDir, 'services/data-sync');
  const dataDir = path.join(rootDir, 'data');

  // Check prerequisites
  console.log('Checking prerequisites...');
  const tdhcaTitlesPath = path.join(dataDir, 'raw/tdhca/titles.csv');
  const tdhcaLiensPath = path.join(dataDir, 'raw/tdhca/liens.csv');
  const waterCcnPath = path.join(dataDir, 'raw/ccn/water.zip');
  const sewerCcnPath = path.join(dataDir, 'raw/ccn/sewer.zip');

  const prerequisites = {
    tdhcaTitles: fs.existsSync(tdhcaTitlesPath),
    tdhcaLiens: fs.existsSync(tdhcaLiensPath),
    waterCcn: fs.existsSync(waterCcnPath),
    sewerCcn: fs.existsSync(sewerCcnPath),
    goService: fs.existsSync(goServiceDir),
  };

  console.log(`  TDHCA titles: ${prerequisites.tdhcaTitles ? '✓' : '✗'} ${tdhcaTitlesPath}`);
  console.log(`  TDHCA liens: ${prerequisites.tdhcaLiens ? '✓' : '✗'} ${tdhcaLiensPath}`);
  console.log(`  Water CCN: ${prerequisites.waterCcn ? '✓' : '✗'} ${waterCcnPath}`);
  console.log(`  Sewer CCN: ${prerequisites.sewerCcn ? '✓' : '✗'} ${sewerCcnPath}`);
  console.log(`  Go service: ${prerequisites.goService ? '✓' : '✗'} ${goServiceDir}`);
  console.log('');

  // Step 1: Clear fake data
  console.log('Step 1: Clearing fake/synthetic data...');
  if (!options.dryRun) {
    const startTime = Date.now();
    const result = runPnpmScript(['tsx', 'src/scripts/clear-fake-data.ts', '--execute'], dbPkgDir);
    results.push({
      step: 'Clear fake data',
      success: result.success,
      duration: Date.now() - startTime,
      error: result.success ? undefined : result.output,
    });
    console.log(result.success ? '  ✓ Complete' : `  ✗ Failed: ${result.output}`);
  } else {
    console.log('  [DRY RUN] Would run: pnpm tsx src/scripts/clear-fake-data.ts --execute');
  }

  // Step 2: Load TDHCA data
  if (!options.skipTdhca) {
    console.log('\nStep 2: Loading TDHCA data...');
    if (!options.dryRun) {
      // Titles
      if (prerequisites.tdhcaTitles) {
        console.log('  Loading titles...');
        const startTime = Date.now();
        const result = runPnpmScript(['tsx', 'src/scripts/sync-tdhca-titles.ts', tdhcaTitlesPath], dbPkgDir);
        results.push({
          step: 'Load TDHCA titles',
          success: result.success,
          duration: Date.now() - startTime,
          error: result.success ? undefined : result.output,
        });
        console.log(result.success ? '  ✓ Titles loaded' : `  ✗ Failed: ${result.output}`);
      } else {
        console.log('  ⚠ Skipping titles (file not found)');
      }

      // Liens
      if (prerequisites.tdhcaLiens) {
        console.log('  Loading liens...');
        const startTime = Date.now();
        const result = runPnpmScript(['tsx', 'src/scripts/sync-tdhca-liens.ts', tdhcaLiensPath], dbPkgDir);
        results.push({
          step: 'Load TDHCA liens',
          success: result.success,
          duration: Date.now() - startTime,
          error: result.success ? undefined : result.output,
        });
        console.log(result.success ? '  ✓ Liens loaded' : `  ✗ Failed: ${result.output}`);
      } else {
        console.log('  ⚠ Skipping liens (file not found)');
      }
    } else {
      console.log('  [DRY RUN] Would load TDHCA titles and liens');
    }
  } else {
    console.log('\nStep 2: SKIPPED (TDHCA data)');
  }

  // Step 3: Load CCN data
  if (!options.skipCcn) {
    console.log('\nStep 3: Loading CCN data...');
    if (!options.dryRun) {
      // Water CCN
      if (prerequisites.waterCcn) {
        console.log('  Loading water CCN...');
        const startTime = Date.now();
        const result = runPnpmScript(['tsx', 'src/scripts/sync-ccn-data.ts', waterCcnPath, 'water'], dbPkgDir);
        results.push({
          step: 'Load Water CCN',
          success: result.success,
          duration: Date.now() - startTime,
          error: result.success ? undefined : result.output,
        });
        console.log(result.success ? '  ✓ Water CCN loaded' : `  ✗ Failed: ${result.output}`);
      } else {
        console.log('  ⚠ Skipping water CCN (file not found)');
      }

      // Sewer CCN
      if (prerequisites.sewerCcn) {
        console.log('  Loading sewer CCN...');
        const startTime = Date.now();
        const result = runPnpmScript(['tsx', 'src/scripts/sync-ccn-data.ts', sewerCcnPath, 'sewer'], dbPkgDir);
        results.push({
          step: 'Load Sewer CCN',
          success: result.success,
          duration: Date.now() - startTime,
          error: result.success ? undefined : result.output,
        });
        console.log(result.success ? '  ✓ Sewer CCN loaded' : `  ✗ Failed: ${result.output}`);
      } else {
        console.log('  ⚠ Skipping sewer CCN (file not found)');
      }
    } else {
      console.log('  [DRY RUN] Would load CCN data');
    }
  } else {
    console.log('\nStep 3: SKIPPED (CCN data)');
  }

  // Step 4: Run Go sync for market data
  if (!options.skipMarket && prerequisites.goService) {
    console.log('\nStep 4: Syncing market data (Go service)...');
    if (!options.dryRun) {
      // HUD
      console.log('  Syncing HUD FMR data...');
      let startTime = Date.now();
      let result = runGoCommand(['run', './cmd/sync', '--state=TX', '--sources=hud'], goServiceDir);
      results.push({
        step: 'Sync HUD FMR',
        success: result.success,
        duration: Date.now() - startTime,
        error: result.success ? undefined : result.output,
      });
      console.log(result.success ? '  ✓ HUD data synced' : `  ✗ Failed: ${result.output}`);

      // Census
      console.log('  Syncing Census data...');
      startTime = Date.now();
      result = runGoCommand(['run', './cmd/sync', '--state=TX', '--sources=census', '--census-year=2023'], goServiceDir);
      results.push({
        step: 'Sync Census',
        success: result.success,
        duration: Date.now() - startTime,
        error: result.success ? undefined : result.output,
      });
      console.log(result.success ? '  ✓ Census data synced' : `  ✗ Failed: ${result.output}`);

      // BLS
      console.log('  Syncing BLS data...');
      startTime = Date.now();
      result = runGoCommand(['run', './cmd/sync', '--state=TX', '--sources=bls', '--bls-start-year=2022', '--bls-end-year=2025'], goServiceDir);
      results.push({
        step: 'Sync BLS',
        success: result.success,
        duration: Date.now() - startTime,
        error: result.success ? undefined : result.output,
      });
      console.log(result.success ? '  ✓ BLS data synced' : `  ✗ Failed: ${result.output}`);
    } else {
      console.log('  [DRY RUN] Would sync HUD, Census, and BLS data');
    }
  } else {
    console.log('\nStep 4: SKIPPED (Market data)');
    if (!prerequisites.goService) {
      console.log('  (Go service directory not found)');
    }
  }

  // Step 5: Discover parks
  if (!options.skipDiscover) {
    console.log('\nStep 5: Discovering parks from ownership records...');
    if (!options.dryRun) {
      const startTime = Date.now();
      const result = runPnpmScript(['tsx', 'src/scripts/discover-parks.ts', '--min-units=5'], dbPkgDir);
      results.push({
        step: 'Discover parks',
        success: result.success,
        duration: Date.now() - startTime,
        error: result.success ? undefined : result.output,
      });
      console.log(result.success ? '  ✓ Parks discovered' : `  ✗ Failed: ${result.output}`);
    } else {
      console.log('  [DRY RUN] Would discover parks');
    }
  } else {
    console.log('\nStep 5: SKIPPED (Park discovery)');
  }

  // Step 6: Calculate distress scores
  if (!options.skipDistress) {
    console.log('\nStep 6: Calculating distress scores...');
    if (!options.dryRun) {
      const startTime = Date.now();
      const result = runPnpmScript(['tsx', 'src/scripts/calculate-distress-scores.ts'], dbPkgDir);
      results.push({
        step: 'Calculate distress',
        success: result.success,
        duration: Date.now() - startTime,
        error: result.success ? undefined : result.output,
      });
      console.log(result.success ? '  ✓ Distress scores calculated' : `  ✗ Failed: ${result.output}`);
    } else {
      console.log('  [DRY RUN] Would calculate distress scores');
    }
  } else {
    console.log('\nStep 6: SKIPPED (Distress scores)');
  }

  // Step 7: Verify data
  console.log('\nStep 7: Verifying data...');
  if (!options.dryRun) {
    const startTime = Date.now();
    const result = runPnpmScript(['tsx', 'src/scripts/verify-data.ts'], dbPkgDir);
    results.push({
      step: 'Verify data',
      success: result.success,
      duration: Date.now() - startTime,
      error: result.success ? undefined : result.output,
    });
    console.log(result.output);
  } else {
    console.log('  [DRY RUN] Would verify data');
  }

  // Print summary
  console.log('\n=== Pipeline Summary ===');
  console.log('');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`Total steps: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed steps:');
    for (const result of results.filter(r => !r.success)) {
      console.log(`  - ${result.step}: ${result.error}`);
    }
  }

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\nTotal duration: ${(totalDuration / 1000).toFixed(1)}s`);
}

loadAllData().catch(console.error);
