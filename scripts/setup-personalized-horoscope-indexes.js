/**
 * Personalized Horoscope Database Setup Script
 * 
 * This script sets up the database structure for personalized horoscopes
 * where each user gets their own unique horoscope based on their birth chart.
 * 
 * Key differences from rashi-based horoscopes:
 * - One entry per USER per day (not per rashi)
 * - Unique index on userId + date to prevent duplicates
 * - Stores user's birth data snapshot for reference
 * 
 * Usage:
 *   node scripts/setup-personalized-horoscope-indexes.js
 * 
 * Or in MongoDB shell:
 *   mongosh < scripts/setup-personalized-horoscope-indexes.js
 */

// Connect to database
const db = connect('mongodb://localhost:27017/astra-navi-database');

print('🚀 Setting up personalized horoscope database structure...\n');

// ============================================
// PERSONALIZED DAILY HOROSCOPES COLLECTION
// ============================================
print('📝 Creating indexes for personalized_daily_horoscopes collection...');

try {
    // PRIMARY INDEX: userId + date (UNIQUE to prevent duplicate entries)
    // This ensures each user can only have ONE horoscope per day
    db.personalized_daily_horoscopes.createIndex(
        { userId: 1, date: 1 }, 
        { unique: true }
    );
    print('✅ Created UNIQUE compound index on userId + date');
    print('   → Prevents duplicate horoscope entries for same user on same day');
    
    // LOOKUP INDEX: userId + createdAt (for user history queries)
    db.personalized_daily_horoscopes.createIndex(
        { userId: 1, createdAt: -1 }
    );
    print('✅ Created compound index on userId + createdAt');
    print('   → Optimizes queries for user horoscope history');
    
    // TTL INDEX: Auto-cleanup old horoscopes (30 days)
    db.personalized_daily_horoscopes.createIndex(
        { createdAt: 1 }, 
        { expireAfterSeconds: 2592000 }
    );
    print('✅ Created TTL index (30 days auto-cleanup)');
    print('   → Automatically deletes horoscopes older than 30 days');
    
} catch {
    print('⚠️  Personalized horoscopes indexes already exist or error occurred');
}

// ============================================
// VERIFY INDEXES
// ============================================
print('\n📊 Verifying personalized horoscope indexes:\n');

db.personalized_daily_horoscopes.getIndexes().forEach(idx => {
    const keys = Object.keys(idx.key).map(k => `${k}: ${idx.key[k]}`).join(', ');
    const flags = [];
    if (idx.unique) flags.push('UNIQUE');
    if (idx.expireAfterSeconds) flags.push(`TTL: ${idx.expireAfterSeconds}s`);
    print(`  - ${idx.name}: { ${keys} }${flags.length ? ' [' + flags.join(', ') + ']' : ''}`);
});

// ============================================
// COLLECTION STATS
// ============================================
print('\n📈 Collection Statistics:\n');

try {
    const stats = db.personalized_daily_horoscopes.stats();
    print(`personalized_daily_horoscopes:`);
    print(`  Documents: ${stats.count}`);
    print(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    print(`  Indexes: ${stats.nindexes}`);
    print(`  Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB\n`);
} catch {
    print(`personalized_daily_horoscopes: Collection not found (will be created on first insert)\n`);
}

// ============================================
// SAMPLE DOCUMENT STRUCTURE
// ============================================
print('📄 Sample Document Structure:\n');
print(`{
  userId: "user_email@example.com",
  date: "2026-04-15",
  birthData: {
    birthDate: "1990-05-15",
    birthTime: "14:30",
    birthPlace: "Mumbai",
    latitude: 19.0760,
    longitude: 72.8777,
    moonSign: "Taurus",
    sunSign: "Taurus",
    ascendant: "Leo"
  },
  horoscope: {
    overall_score: 78,
    mood: "Energetic",
    lucky_color: "Green",
    lucky_number: 7,
    career: "Your leadership skills shine today...",
    love: "Deep connections strengthen...",
    health: "Energy levels are high...",
    finance: "Good day for investments...",
    tip: "Trust your intuition in important decisions.",
    personalizedInsight: "With Moon in Taurus and Sun in Leo..."
  },
  createdAt: ISODate("2026-04-15T03:00:00Z"),
  updatedAt: ISODate("2026-04-15T03:00:00Z"),
  source: "external_api"
}\n`);

print('✅ Personalized horoscope database setup complete!\n');
print('📚 Key Features:');
print('  ✓ One horoscope per user per day (no duplicates)');
print('  ✓ Unique index prevents race conditions');
print('  ✓ Auto-cleanup after 30 days');
print('  ✓ Optimized for user history queries\n');

print('💡 Next Steps:');
print('  1. Update API to use personalized_daily_horoscopes collection');
print('  2. Ensure external API supports birth chart data');
print('  3. Test with multiple users on same day');
print('  4. Monitor storage growth (scales with active users)\n');

// ============================================
// COMMENTED OUT: Old rashi-based horoscope collection
// ============================================
// If you want to keep rashi-based horoscopes as fallback:
// db.daily_horoscopes_by_sign.createIndex({ sign: 1, date: 1 }, { unique: true });
// This collection stores only 12 documents per day (one per rashi)

