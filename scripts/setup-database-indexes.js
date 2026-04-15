/**
 * Database Index Setup Script
 * Run this script to create all necessary indexes for optimal performance
 * 
 * Usage:
 *   node scripts/setup-database-indexes.js
 * 
 * Or in MongoDB shell:
 *   mongosh < scripts/setup-database-indexes.js
 */

// Connect to database
const db = connect('mongodb://localhost:27017/astra-navi-database');

print('🚀 Setting up database indexes for AstraNavi...\n');

// ============================================
// 1. USERS COLLECTION
// ============================================
print('📝 Creating indexes for users collection...');

try {
    // Primary lookup by email (unique)
    db.users.createIndex({ email: 1 }, { unique: true });
    print('✅ Created unique index on email');
    
    // Lookup by moon sign (for analytics)
    db.users.createIndex({ moonSign: 1 });
    print('✅ Created index on moonSign');
    
    // Lookup by sun sign
    db.users.createIndex({ sunSign: 1 });
    print('✅ Created index on sunSign');
    
} catch (e) {
    print('⚠️  Users indexes: ' + e.message);
}

// ============================================
// 2. PERSONALIZED DAILY HOROSCOPES
// ============================================
print('\n📝 Creating indexes for personalized_daily_horoscopes collection...');

try {
    // PRIMARY INDEX: userId + date (UNIQUE to prevent duplicate entries per user per day)
    db.personalized_daily_horoscopes.createIndex(
        { userId: 1, date: 1 }, 
        { unique: true }
    );
    print('✅ Created unique compound index on userId + date');
    
    // LOOKUP INDEX: userId + createdAt (for user history)
    db.personalized_daily_horoscopes.createIndex(
        { userId: 1, createdAt: -1 }
    );
    print('✅ Created compound index on userId + createdAt');
    
    // TTL index for auto-cleanup (30 days)
    db.personalized_daily_horoscopes.createIndex(
        { createdAt: 1 }, 
        { expireAfterSeconds: 2592000 }
    );
    print('✅ Created TTL index (30 days auto-cleanup)');
    
} catch (e) {
    print('⚠️  Personalized horoscopes indexes: ' + e.message);
}

// ============================================
// COMMENTED OUT: Old rashi-based daily horoscopes
// ============================================
// This was the old system with only 12 horoscopes per day (one per rashi)
// Now using personalized horoscopes (one per user per day)
/*
print('\n📝 Creating indexes for daily_horoscopes_by_sign collection...');

try {
    db.daily_horoscopes_by_sign.createIndex(
        { sign: 1, date: 1 }, 
        { unique: true }
    );
    print('✅ Created unique compound index on sign + date');
    
    db.daily_horoscopes_by_sign.createIndex(
        { createdAt: 1 }, 
        { expireAfterSeconds: 2592000 }
    );
    print('✅ Created TTL index (30 days auto-cleanup)');
    
} catch (e) {
    print('⚠️  Horoscopes indexes: ' + e.message);
}
*/

// ============================================
// 3. CHATS COLLECTION
// ============================================
print('\n📝 Creating indexes for chats collection...');

try {
    // User's chats sorted by update time
    db.chats.createIndex({ email: 1, updatedAt: -1 });
    print('✅ Created compound index on email + updatedAt');
    
    // Pagination cursor
    db.chats.createIndex({ email: 1, _id: -1 });
    print('✅ Created compound index on email + _id');
    
    // Chat title search
    db.chats.createIndex({ email: 1, title: 'text' });
    print('✅ Created text index on title');
    
} catch (e) {
    print('⚠️  Chats indexes: ' + e.message);
}

// ============================================
// 4. CHAT ANALYTICS COLLECTION
// ============================================
print('\n📝 Creating indexes for chat_analytics collection...');

try {
    // User analytics
    db.chat_analytics.createIndex({ email: 1 });
    print('✅ Created index on email');
    
    // Chat analytics
    db.chat_analytics.createIndex({ chatId: 1 });
    print('✅ Created index on chatId');
    
    // Compound for time-based queries
    db.chat_analytics.createIndex({ email: 1, createdAt: -1 });
    print('✅ Created compound index on email + createdAt');
    
} catch (e) {
    print('⚠️  Analytics indexes: ' + e.message);
}

// ============================================
// 5. MIGRATION: Old to New Horoscope Collection
// ============================================
print('\n📝 Checking for old horoscope data to migrate...');

try {
    const oldCount = db.daily_horoscopes.countDocuments();
    
    if (oldCount > 0) {
        print(`⚠️  Found ${oldCount} documents in old collection`);
        print('🔄 Migrating to sign-based collection...');
        
        // Get unique sign+date combinations
        const pipeline = [
            {
                $group: {
                    _id: { sign: '$sign', date: '$date' },
                    doc: { $first: '$$ROOT' }
                }
            }
        ];
        
        const uniqueDocs = db.daily_horoscopes.aggregate(pipeline).toArray();
        
        uniqueDocs.forEach(item => {
            const doc = item.doc;
            db.daily_horoscopes_by_sign.updateOne(
                { sign: doc.sign, date: doc.date },
                {
                    $setOnInsert: {
                        sign: doc.sign,
                        date: doc.date,
                        overall_score: doc.overall_score,
                        mood: doc.mood,
                        lucky_color: doc.lucky_color,
                        lucky_number: doc.lucky_number,
                        career: doc.career,
                        love: doc.love,
                        health: doc.health,
                        finance: doc.finance,
                        tip: doc.tip,
                        createdAt: new Date(doc.createdAt || doc.date)
                    }
                },
                { upsert: true }
            );
        });
        
        print(`✅ Migrated ${uniqueDocs.length} unique horoscopes`);
        print('⚠️  Old collection preserved. Delete manually if migration successful:');
        print('   db.daily_horoscopes.drop()');
    } else {
        print('✅ No old horoscope data found');
    }
} catch (e) {
    print('⚠️  Migration: ' + e.message);
}

// ============================================
// 6. VERIFY INDEXES
// ============================================
print('\n📊 Verifying all indexes...\n');

print('Users collection indexes:');
db.users.getIndexes().forEach(idx => {
    print(`  - ${JSON.stringify(idx.key)}`);
});

print('\nHoroscopes collection indexes:');
// COMMENTED OUT: Old rashi-based horoscopes
// db.daily_horoscopes_by_sign.getIndexes().forEach(idx => {
//     print(`  - ${JSON.stringify(idx.key)}`);
// });

// NEW: Personalized horoscopes
db.personalized_daily_horoscopes.getIndexes().forEach(idx => {
    print(`  - ${JSON.stringify(idx.key)}`);
});

print('\nChats collection indexes:');
db.chats.getIndexes().forEach(idx => {
    print(`  - ${JSON.stringify(idx.key)}`);
});

print('\nChat Analytics collection indexes:');
db.chat_analytics.getIndexes().forEach(idx => {
    print(`  - ${JSON.stringify(idx.key)}`);
});

// ============================================
// 7. COLLECTION STATS
// ============================================
print('\n📈 Collection Statistics:\n');

const collections = ['users', 'chats', 'chat_analytics', 'personalized_daily_horoscopes'];
// COMMENTED OUT: Old rashi-based collection
// const collections = ['users', 'chats', 'chat_analytics', 'daily_horoscopes_by_sign'];

collections.forEach(collName => {
    try {
        const stats = db[collName].stats();
        print(`${collName}:`);
        print(`  Documents: ${stats.count}`);
        print(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        print(`  Indexes: ${stats.nindexes}`);
        print(`  Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB\n`);
    } catch (e) {
        print(`${collName}: Collection not found\n`);
    }
});

print('✅ Database setup complete!\n');
print('📚 Next steps:');
print('  1. Test queries with explain() to verify index usage');
print('  2. Monitor slow queries: db.setProfilingLevel(1, { slowms: 100 })');
print('  3. Check index usage: db.collection.aggregate([{ $indexStats: {} }])');
print('  4. Set up monitoring alerts for collection growth\n');
