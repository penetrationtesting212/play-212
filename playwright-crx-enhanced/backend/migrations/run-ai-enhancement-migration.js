/**
 * Run AI Enhancement Features Migration
 * Creates tables for Visual AI, Context-Aware Locators, and XPath Analysis
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting AI Enhancement Features Migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '005_ai_enhancement_features.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Executing migration file: 005_ai_enhancement_features.sql');
    
    // Execute the migration
    await client.query(migrationSQL);

    console.log('\n✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying created tables...\n');
    const verifyQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN (
          'VisualFingerprint',
          'VisualComparison',
          'ScreenshotAnalysis',
          'LayoutChange',
          'ContextAwareLocator',
          'XPathAnalysis',
          'AIEnhancementHistory',
          'LocatorStability'
        )
      ORDER BY table_name;
    `;

    const result = await client.query(verifyQuery);

    if (result.rows.length === 8) {
      console.log('✅ All 8 tables created successfully:\n');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name} (${row.column_count} columns)`);
      });
    } else {
      console.log(`⚠️  Warning: Expected 8 tables, found ${result.rows.length}`);
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name} (${row.column_count} columns)`);
      });
    }

    console.log('\n📊 AI Enhancement Features Database Schema:');
    console.log('   🎨 Visual AI Tables:');
    console.log('      • VisualFingerprint - Element visual signatures');
    console.log('      • VisualComparison - Fingerprint comparison results');
    console.log('      • ScreenshotAnalysis - Screenshot analysis data');
    console.log('      • LayoutChange - Layout change detection');
    console.log('   🧠 Context-Aware Tables:');
    console.log('      • ContextAwareLocator - Smart locator suggestions');
    console.log('   🔍 XPath Analysis Tables:');
    console.log('      • XPathAnalysis - XPath analysis and conversions');
    console.log('   📈 Tracking Tables:');
    console.log('      • AIEnhancementHistory - All enhancement actions');
    console.log('      • LocatorStability - Locator stability metrics');

    console.log('\n✨ Database is ready for AI Enhancement features!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
