/**
 * Setup Database Indexes and Migrate to Optimized Structure
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/astra-navi-database';

async function setupDatabase() {
    console.log('🚀 Setting up AstraNavi Database Optimization...\n');

    let client;
    
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db();

        // ============================================
        // 1. USERS COLLECTION INDEXES
        // ============================================
        console.log('📝 Setting up users collection indexes...');
        const users = db.collection('users');
        
        try {
            await users.createIndex({ email: 1 }, { unique: true });
            console.log('  ✅ Created unique index on email');
        } catch {
            console.log('  ℹ️  Email index already exists or error occurred');
        }

        try {
            await users.createIndex({ moonSign: 1 });
            console.log('  ✅ Created index on moonSign');
        } catch {
            console.log('  ℹ️  Moon sign index already exists');
        }

        try {
            await users.createIndex({ sunSign: 1 });
            console.log('  ✅ Created index on sunSign');
        } catch {
            console.log('  ℹ️  Sun sign index already exists');
        }

        // ============================================
        // 2. MIGRATE HOROSCOPES TO OPTIMIZED COLLECTION
        // ============================================
        console.log('\n📝 Migrating horoscopes to optimized collection...');
        
        const oldHoroscopes = db.collection('daily_horoscopes');
        const newHoroscopes = db.collection('daily_horoscopes_by_sign');
        
        const oldCount = await oldHoroscopes.countDocuments();
        
        if (oldCount > 0) {
            console.log(`  Found ${oldCount} documents in old collection`);
            
            // Get unique sign+date combinations
            const uniqueHoroscopes = await oldHoroscopes.aggregate([
                {
                    $group: {
                        _id: { sign: '$sign', date: '$date' },
                        doc: { $first: '$$ROOT' }
                    }
                }
            ]).toArray();
            
            console.log(`  Migrating ${uniqueHoroscopes.length} unique horoscopes...`);
            
            for (const item of uniqueHoroscopes) {
                const doc = item.doc;
                await newHoroscopes.updateOne(
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
                            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(doc.date)
                        }
                    },
                    { upsert: true }
                );
            }
            
            console.log('  ✅ Migration complete!');
            console.log('  ℹ️  Old collection preserved. You can delete it manually:');
            console.log('     db.daily_horoscopes.drop()');
        } else {
            console.log('  ℹ️  No old horoscope data to migrate');
        }

        // ============================================
        // 3. CREATE OPTIMIZED HOROSCOPE INDEXES
        // ============================================
        console.log('\n📝 Setting up optimized horoscope indexes...');
        
        try {
            await newHoroscopes.createIndex(
                { sign: 1, date: 1 }, 
                { unique: true }
            );
            console.log('  ✅ Created unique compound index on sign + date');
        } catch (err: unknown) {
            const error = err as { code?: number; message: string };
            if (error.code === 85) {
                console.log('  ℹ️  Sign+date index already exists');
            } else {
                console.log('  ⚠️  Sign+date index:', error.message);
            }
        }

        try {
            await newHoroscopes.createIndex(
                { createdAt: 1 }, 
                { expireAfterSeconds: 2592000 } // 30 days
            );
            console.log('  ✅ Created TTL index (30 days auto-cleanup)');
        } catch (err: unknown) {
            const error = err as { code?: number; message: string };
            if (error.code === 85) {
                console.log('  ℹ️  TTL index already exists');
            } else {
                console.log('  ⚠️  TTL index:', error.message);
            }
        }

        // ============================================
        // 4. CHATS COLLECTION INDEXES
        // ============================================
        console.log('\n📝 Setting up chats collection indexes...');
        const chats = db.collection('chats');
        
        try {
            await chats.createIndex({ userEmail: 1, updatedAt: -1 });
            console.log('  ✅ Created compound index on userEmail + updatedAt');
        } catch {
            console.log('  ℹ️  UserEmail+updatedAt index already exists');
        }

        try {
            await chats.createIndex({ userEmail: 1, _id: -1 });
            console.log('  ✅ Created compound index on userEmail + _id');
        } catch {
            console.log('  ℹ️  UserEmail+_id index already exists');
        }

        // ============================================
        // 5. CHAT ANALYTICS INDEXES
        // ============================================
        console.log('\n📝 Setting up chat_analytics collection indexes...');
        const analytics = db.collection('chat_analytics');
        
        try {
            await analytics.createIndex({ email: 1 });
            console.log('  ✅ Created index on email');
        } catch {
            console.log('  ℹ️  Email index already exists');
        }

        try {
            await analytics.createIndex({ chatId: 1 });
            console.log('  ✅ Created index on chatId');
        } catch {
            console.log('  ℹ️  ChatId index already exists');
        }

        // ============================================
        // 6. VERIFY SETUP
        // ============================================
        console.log('\n📊 Verifying setup...\n');
        
        const collections = {
            'users': users,
            'daily_horoscopes_by_sign': newHoroscopes,
            'chats': chats,
            'chat_analytics': analytics
        };

        for (const [name, collection] of Object.entries(collections)) {
            const indexes = await collection.indexes();
            console.log(`${name}:`);
            indexes.forEach(idx => {
                const keys = Object.keys(idx.key).map(k => `${k}: ${idx.key[k]}`).join(', ');
                const flags = [];
                if (idx.unique) flags.push('UNIQUE');
                if (idx.expireAfterSeconds) flags.push(`TTL: ${idx.expireAfterSeconds}s`);
                console.log(`  - ${idx.name}: { ${keys} }${flags.length ? ' [' + flags.join(', ') + ']' : ''}`);
            });
            console.log('');
        }

        // ============================================
        // 7. SUMMARY
        // ============================================
        console.log('✅ Database optimization complete!\n');
        console.log('📈 Summary:');
        console.log(`  - Users: ${await users.countDocuments()} documents`);
        console.log(`  - Chats: ${await chats.countDocuments()} documents`);
        console.log(`  - Horoscopes (optimized): ${await newHoroscopes.countDocuments()} documents`);
        console.log(`  - Analytics: ${await analytics.countDocuments()} documents\n`);
        
        console.log('💡 Next steps:');
        console.log('  1. Test horoscope fetching by logging in');
        console.log('  2. Monitor query performance');
        console.log('  3. After confirming everything works, delete old collection:');
        console.log('     node -e "require(\'mongodb\').MongoClient.connect(\'mongodb://localhost:27017\').then(c => c.db(\'astra-navi-database\').collection(\'daily_horoscopes\').drop())"');
        console.log('');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Connection closed.\n');
        }
    }
}

setupDatabase().catch(console.error);
