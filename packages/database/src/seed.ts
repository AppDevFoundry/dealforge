/**
 * Database seed script
 *
 * Creates development data for testing:
 * - Demo user with login credentials
 * - Sample real estate deals (rental, BRRRR, flip)
 * - Deal tags and user preferences
 *
 * Usage: pnpm db:seed
 */

import { config } from 'dotenv';

// Load .env.local from the root of the monorepo
// Note: tsx runs from packages/database/, so ../../ goes to root
config({ path: '../../.env.local' });
import { randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { getDb } from './client';
import { users, accounts, deals, dealTags, userPreferences } from './schema';

import { eq } from 'drizzle-orm';

// Demo user credentials
const DEMO_EMAIL = 'demo@dealforge.dev';
const DEMO_PASSWORD = 'demodemo123';

// Check for --force flag
const forceReseed = process.argv.includes('--force');

/**
 * Generate a unique ID
 */
function generateId(): string {
  return randomBytes(16).toString('hex');
}

async function seed() {
  console.log('🌱 Starting database seed...\n');

  const db = getDb();

  // Check if demo user already exists
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, DEMO_EMAIL),
  });

  if (existingUser) {
    if (forceReseed) {
      console.log('🗑️  Deleting existing demo user (--force flag)...');
      // Cascade delete will handle related records (accounts, deals, etc.)
      await db.delete(users).where(eq(users.id, existingUser.id));
      console.log('  ✓ Deleted existing demo user and related data\n');
    } else {
      console.log('⚠️  Demo user already exists. Skipping seed to avoid duplicates.');
      console.log('   Use --force flag to delete and re-seed.\n');
      process.exit(0);
    }
  }

  // Create demo user
  const userId = generateId();
  console.log('Creating demo user...');

  await db.insert(users).values({
    id: userId,
    email: DEMO_EMAIL,
    name: 'Demo User',
    emailVerified: true,
  });

  // Create account with password (for credential login)
  const hashedPassword = await hashPassword(DEMO_PASSWORD);
  console.log('Creating demo account with password...');

  await db.insert(accounts).values({
    id: generateId(),
    userId,
    accountId: userId,
    providerId: 'credential',
    password: hashedPassword,
  });

  // Create sample deals
  console.log('Creating sample deals...\n');

  // Pre-generate deal IDs for referencing in tags
  const dealIds = {
    rental1: generateId(),
    brrrr1: generateId(),
    flip1: generateId(),
    rental2: generateId(),
  };

  const sampleDeals = [
    {
      id: dealIds.rental1,
      userId,
      type: 'rental',
      name: 'Maple Street Duplex',
      status: 'draft',
      address: '123 Maple Street, Austin, TX 78701',
      latitude: 30.2672,
      longitude: -97.7431,
      inputs: {
        purchasePrice: 350000,
        downPaymentPercent: 25,
        interestRate: 7.0,
        loanTermYears: 30,
        monthlyRent: 2800,
        propertyTaxes: 7000,
        insurance: 1800,
        maintenance: 3000,
        vacancy: 5,
        propertyManagement: 8,
      },
      results: {
        loanAmount: 262500,
        monthlyMortgage: 1746,
        monthlyExpenses: 1167,
        monthlyCashFlow: 412,
        annualCashFlow: 4944,
        cashOnCash: 5.65,
        capRate: 6.2,
        totalInvestment: 87500,
      },
    },
    {
      id: dealIds.brrrr1,
      userId,
      type: 'brrrr',
      name: 'Oak Avenue Fixer-Upper',
      status: 'analyzing',
      address: '456 Oak Avenue, Dallas, TX 75201',
      latitude: 32.7767,
      longitude: -96.797,
      inputs: {
        purchasePrice: 180000,
        rehabCost: 45000,
        afterRepairValue: 280000,
        downPaymentPercent: 20,
        interestRate: 7.25,
        loanTermYears: 30,
        monthlyRent: 2200,
        propertyTaxes: 4500,
        insurance: 1400,
        maintenance: 2400,
        vacancy: 5,
        propertyManagement: 10,
        refinanceRate: 6.75,
        refinanceLTV: 75,
      },
      results: {
        totalInvestment: 81000,
        refinanceAmount: 210000,
        cashOutAfterRefi: 129000,
        cashLeftInDeal: -48000,
        monthlyMortgageAfterRefi: 1362,
        monthlyCashFlow: 358,
        cashOnCash: 'Infinite (no cash left)',
        capRate: 5.8,
      },
    },
    {
      id: dealIds.flip1,
      userId,
      type: 'flip',
      name: 'Cedar Lane Renovation',
      status: 'draft',
      address: '789 Cedar Lane, Houston, TX 77002',
      latitude: 29.7604,
      longitude: -95.3698,
      inputs: {
        purchasePrice: 220000,
        rehabCost: 65000,
        afterRepairValue: 350000,
        holdingMonths: 4,
        closingCostsBuy: 5000,
        closingCostsSell: 21000,
        carryingCosts: 3000,
        financingCosts: 8000,
      },
      results: {
        totalInvestment: 322000,
        netProfit: 28000,
        roi: 8.7,
        annualizedRoi: 26.1,
        profitMargin: 8.0,
      },
    },
    {
      id: dealIds.rental2,
      userId,
      type: 'rental',
      name: 'Downtown Condo Unit 4B',
      status: 'archived',
      address: '1000 Main Street #4B, San Antonio, TX 78205',
      latitude: 29.4241,
      longitude: -98.4936,
      inputs: {
        purchasePrice: 195000,
        downPaymentPercent: 20,
        interestRate: 6.875,
        loanTermYears: 30,
        monthlyRent: 1650,
        propertyTaxes: 4200,
        insurance: 1100,
        maintenance: 1800,
        vacancy: 8,
        propertyManagement: 10,
        hoaFees: 250,
      },
      results: {
        loanAmount: 156000,
        monthlyMortgage: 1024,
        monthlyExpenses: 942,
        monthlyCashFlow: -316,
        annualCashFlow: -3792,
        cashOnCash: -9.72,
        capRate: 4.1,
        totalInvestment: 39000,
      },
    },
  ];

  for (const deal of sampleDeals) {
    await db.insert(deals).values(deal);
    console.log(`  ✓ Created deal: ${deal.name} (${deal.type})`);
  }

  // Create deal tags
  console.log('\nCreating deal tags...');

  const tags = [
    { dealId: dealIds.rental1, tag: 'texas' },
    { dealId: dealIds.rental1, tag: 'austin' },
    { dealId: dealIds.rental1, tag: 'multifamily' },
    { dealId: dealIds.brrrr1, tag: 'texas' },
    { dealId: dealIds.brrrr1, tag: 'dallas' },
    { dealId: dealIds.brrrr1, tag: 'value-add' },
    { dealId: dealIds.flip1, tag: 'texas' },
    { dealId: dealIds.flip1, tag: 'houston' },
    { dealId: dealIds.flip1, tag: 'flip' },
    { dealId: dealIds.rental2, tag: 'texas' },
    { dealId: dealIds.rental2, tag: 'san-antonio' },
    { dealId: dealIds.rental2, tag: 'negative-cashflow' },
  ];

  for (const tag of tags) {
    await db.insert(dealTags).values({
      id: generateId(),
      dealId: tag.dealId,
      tag: tag.tag,
    });
  }
  console.log(`  ✓ Created ${tags.length} deal tags`);

  // Create user preferences
  console.log('\nCreating user preferences...');

  await db.insert(userPreferences).values({
    userId,
    defaultAssumptions: {
      downPaymentPercent: 25,
      interestRate: 7.0,
      loanTermYears: 30,
      vacancy: 5,
      propertyManagement: 8,
      maintenancePercent: 1,
      capexPercent: 1,
    },
    notificationPrefs: {
      emailDigest: true,
      dealAlerts: true,
    },
    uiPrefs: {
      defaultView: 'grid',
      showArchived: false,
    },
  });
  console.log('  ✓ Created user preferences');

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Demo user credentials:');
  console.log(`  Email: ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log('\n');

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
