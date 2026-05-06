/**
 * Database Health Check Script
 * Checks MongoDB connection and analyzes collections
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/astra-navi-database';

async function checkDatabase() {
    console.log('🔍 Checking MongoDB Database...\n');
    console.log(`📍 Connection URI: ${MONGODB_URI}\n`);

    let client;
    
    try {
        // Connect to MongoDB
        console.log('⏳ Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected successfully!\n');

        const db = client.db();
        
        // Get database stats
        console.log('📊 Database Statistics:');
        const dbStats = await db.stats();
        console.log(`  Database: ${dbStats.db}`);
        console.log(`  Collections: ${dbStats.collections}`);
        console.log(`  Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Indexes: ${dbStats.indexes}`);
        console.log(`  Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB\n`);

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('📁 Collections Found:');
        collections.forEach(coll => {
            console.log(`  - ${coll.name}`);
        });
        console.log('');

        // Check each collection
        const collectionNames = ['users', 'chats', 'chat_analytics', 'daily_horoscopes', 'daily_horoscopes_by_sign'];
        
        for (const collName of collectionNames) {
            try {
                const collection = db.collection(collName);
                const count = await collection.countDocuments();
                const indexes = await collection.indexes();
                
                console.log(`\n📦 Collection: ${collName}`);
                console.log(`  Documents: ${count}`);
                console.log(`  Indexes: ${indexes.length}`);
                
                if (indexes.length > 0) {
                    console.log('  Index Details:');
                    indexes.forEach(idx => {
                        const keys = Object.keys(idx.key).map(k => `${k}: ${idx.key[k]}`).join(', ');
                        console.log(`    - ${idx.name}: { ${keys} }${idx.unique ? ' [UNIQUE]' : ''}${idx.expireAfterSeconds ? ` [TTL: ${idx.expireAfterSeconds}s]` : ''}`);
                    });
                }

                // Sample document
                if (count > 0) {
                    const sample = await collection.findOne();
                    console.log('  Sample Document Keys:', Object.keys(sample).join(', '));
                }
            } catch {
                console.log(`\n📦 Collection: ${collName}`);
                console.log(`  ⚠️  Not found or error occurred`);
            }
        }

        // Check for old horoscope collection
        console.log('\n\n🔄 Migration Status:');
        try {
            const oldHoroscopes = db.collection('daily_horoscopes');
            const oldCount = await oldHoroscopes.countDocuments();
            
            const newHoroscopes = db.collection('daily_horoscopes_by_sign');
            const newCount = await newHoroscopes.countDocuments();
            
            if (oldCount > 0) {
                console.log(`  ⚠️  Old collection (daily_horoscopes): ${oldCount} documents`);
                console.log(`  ℹ️  New collection (daily_horoscopes_by_sign): ${newCount} documents`);
                console.log(`  📝 Action needed: Run migration script or manually migrate data`);
            } else {
                console.log(`  ✅ Using optimized collection (daily_horoscopes_by_sign): ${newCount} documents`);
            }
        } catch {
            console.log(`  ℹ️  No old horoscope data found`);
        }

        // Check users with moon signs
        console.log('\n\n👥 User Analysis:');
        try {
            const users = db.collection('users');
            const totalUsers = await users.countDocuments();
            const usersWithMoonSign = await users.countDocuments({ moonSign: { $exists: true, $ne: null } });
            const usersWithSunSign = await users.countDocuments({ sunSign: { $exists: true, $ne: null } });
            
            console.log(`  Total Users: ${totalUsers}`);
            console.log(`  Users with Moon Sign: ${usersWithMoonSign} (${totalUsers > 0 ? ((usersWithMoonSign/totalUsers)*100).toFixed(1) : 0}%)`);
            console.log(`  Users with Sun Sign: ${usersWithSunSign} (${totalUsers > 0 ? ((usersWithSunSign/totalUsers)*100).toFixed(1) : 0}%)`);
            
            if (usersWithMoonSign > 0) {
                const signDistribution = await users.aggregate([
                    { $match: { moonSign: { $exists: true, $ne: null } } },
                    { $group: { _id: '$moonSign', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]).toArray();
                
                console.log('\n  Moon Sign Distribution:');
                signDistribution.forEach(sign => {
                    console.log(`    ${sign._id}: ${sign.count} users`);
                });
            }
        } catch {
            console.log(`  ⚠️  Error analyzing users`);
        }

        // Check today's horoscopes
        console.log('\n\n🌟 Today\'s Horoscopes:');
        try {
            const horoscopes = db.collection('daily_horoscopes_by_sign');
            const today = new Date().toISOString().split('T')[0];
            const todayHoroscopes = await horoscopes.find({ date: today }).toArray();
            
            if (todayHoroscopes.length > 0) {
                console.log(`  ✅ ${todayHoroscopes.length} horoscopes cached for today (${today})`);
                console.log('  Signs cached:', todayHoroscopes.map(h => h.sign).join(', '));
            } else {
                console.log(`  ℹ️  No horoscopes cached yet for today (${today})`);
                console.log('  💡 Horoscopes will be fetched when users login');
            }
        } catch {
            console.log(`  ⚠️  Error checking horoscopes`);
        }

        // Recommendations
        console.log('\n\n💡 Recommendations:');
        
        const users = db.collection('users');
        const userIndexes = await users.indexes();
        const hasEmailIndex = userIndexes.some(idx => idx.key.email === 1);
        
        if (!hasEmailIndex) {
            console.log('  ⚠️  Missing email index on users collection');
            console.log('     Run: db.users.createIndex({ email: 1 }, { unique: true })');
        }
        
        try {
            const horoscopes = db.collection('daily_horoscopes_by_sign');
            const horoscopeIndexes = await horoscopes.indexes();
            const hasSignDateIndex = horoscopeIndexes.some(idx => idx.key.sign === 1 && idx.key.date === 1);
            const hasTTL = horoscopeIndexes.some(idx => idx.expireAfterSeconds);
            
            if (!hasSignDateIndex) {
                console.log('  ⚠️  Missing sign+date index on horoscopes collection');
                console.log('     Run: db.daily_horoscopes_by_sign.createIndex({ sign: 1, date: 1 }, { unique: true })');
            }
            
            if (!hasTTL) {
                console.log('  ⚠️  Missing TTL index on horoscopes collection');
                console.log('     Run: db.daily_horoscopes_by_sign.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })');
            }
            
            if (hasEmailIndex && hasSignDateIndex && hasTTL) {
                console.log('  ✅ All critical indexes are in place!');
            }
        } catch {
            console.log('  ℹ️  Horoscope collection not found - will be created on first use');
        }

        console.log('\n\n✅ Database check complete!\n');

    } catch (error) {
        console.error('\n❌ Error connecting to MongoDB:');
        console.error(`   ${error.message}\n`);
        console.error('💡 Troubleshooting:');
        console.error('   1. Check if MongoDB is running: net start MongoDB');
        console.error('   2. Verify connection string in .env.local');
        console.error('   3. Check MongoDB service status\n');
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Connection closed.\n');
        }
    }
}

// Run the check
checkDatabase().catch(console.error);
