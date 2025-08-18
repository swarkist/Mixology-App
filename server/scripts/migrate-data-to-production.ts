#!/usr/bin/env tsx
/**
 * One-time data migration script to copy essential data from development to production
 * 
 * This script will copy:
 * - All cocktails (recipes)
 * - All ingredients 
 * - All tags
 * 
 * It will NOT copy:
 * - User accounts
 * - User preferences/my bar items
 * - Session data
 * 
 * Usage: tsx server/scripts/migrate-data-to-production.ts
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

interface MigrationStats {
  cocktails: { source: number; migrated: number; errors: number };
  ingredients: { source: number; migrated: number; errors: number };
  tags: { source: number; migrated: number; errors: number };
}

async function initializeFirebaseApps() {
  // Development Firebase
  const devServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  const devApp = admin.initializeApp({
    credential: admin.credential.cert(devServiceAccount),
  }, 'dev');
  const devDb = getFirestore(devApp);

  // Production Firebase
  const prodServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PROD || '{}');
  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(prodServiceAccount),
  }, 'prod');
  const prodDb = getFirestore(prodApp);

  return { devDb, prodDb };
}

async function migrateCocktails(devDb: FirebaseFirestore.Firestore, prodDb: FirebaseFirestore.Firestore) {
  console.log('🍸 Migrating cocktails...');
  
  const snapshot = await devDb.collection('cocktails').get();
  const stats = { source: snapshot.docs.length, migrated: 0, errors: 0 };
  
  const batch = prodDb.batch();
  
  for (const doc of snapshot.docs) {
    try {
      const cocktailRef = prodDb.collection('cocktails').doc(doc.id);
      batch.set(cocktailRef, doc.data());
      
      // Migrate sub-collections (ingredients and instructions)
      const ingredientsSnapshot = await devDb.collection('cocktails').doc(doc.id).collection('ingredients').get();
      for (const ingredientDoc of ingredientsSnapshot.docs) {
        const ingredientRef = cocktailRef.collection('ingredients').doc(ingredientDoc.id);
        batch.set(ingredientRef, ingredientDoc.data());
      }
      
      const instructionsSnapshot = await devDb.collection('cocktails').doc(doc.id).collection('instructions').get();
      for (const instructionDoc of instructionsSnapshot.docs) {
        const instructionRef = cocktailRef.collection('instructions').doc(instructionDoc.id);
        batch.set(instructionRef, instructionDoc.data());
      }
      
      stats.migrated++;
    } catch (error) {
      console.error(`Error migrating cocktail ${doc.id}:`, error);
      stats.errors++;
    }
  }
  
  await batch.commit();
  return stats;
}

async function migrateIngredients(devDb: FirebaseFirestore.Firestore, prodDb: FirebaseFirestore.Firestore) {
  console.log('🥃 Migrating ingredients...');
  
  const snapshot = await devDb.collection('ingredients').get();
  const stats = { source: snapshot.docs.length, migrated: 0, errors: 0 };
  
  const batch = prodDb.batch();
  
  for (const doc of snapshot.docs) {
    try {
      const ref = prodDb.collection('ingredients').doc(doc.id);
      batch.set(ref, doc.data());
      stats.migrated++;
    } catch (error) {
      console.error(`Error migrating ingredient ${doc.id}:`, error);
      stats.errors++;
    }
  }
  
  await batch.commit();
  return stats;
}

async function migrateTags(devDb: FirebaseFirestore.Firestore, prodDb: FirebaseFirestore.Firestore) {
  console.log('🏷️ Migrating tags...');
  
  const snapshot = await devDb.collection('tags').get();
  const stats = { source: snapshot.docs.length, migrated: 0, errors: 0 };
  
  const batch = prodDb.batch();
  
  for (const doc of snapshot.docs) {
    try {
      const ref = prodDb.collection('tags').doc(doc.id);
      batch.set(ref, doc.data());
      stats.migrated++;
    } catch (error) {
      console.error(`Error migrating tag ${doc.id}:`, error);
      stats.errors++;
    }
  }
  
  await batch.commit();
  return stats;
}

async function main() {
  console.log('🚀 Starting data migration from development to production...');
  
  // Verify required environment variables
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not set (development database)');
  }
  
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PROD) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON_PROD not set (production database)');
  }
  
  const { devDb, prodDb } = await initializeFirebaseApps();
  
  const migrationStats: MigrationStats = {
    cocktails: { source: 0, migrated: 0, errors: 0 },
    ingredients: { source: 0, migrated: 0, errors: 0 },
    tags: { source: 0, migrated: 0, errors: 0 }
  };
  
  try {
    // Migrate data
    migrationStats.cocktails = await migrateCocktails(devDb, prodDb);
    migrationStats.ingredients = await migrateIngredients(devDb, prodDb);
    migrationStats.tags = await migrateTags(devDb, prodDb);
    
    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log('════════════════════');
    console.log(`Cocktails: ${migrationStats.cocktails.migrated}/${migrationStats.cocktails.source} (${migrationStats.cocktails.errors} errors)`);
    console.log(`Ingredients: ${migrationStats.ingredients.migrated}/${migrationStats.ingredients.source} (${migrationStats.ingredients.errors} errors)`);
    console.log(`Tags: ${migrationStats.tags.migrated}/${migrationStats.tags.source} (${migrationStats.tags.errors} errors)`);
    
    const totalMigrated = migrationStats.cocktails.migrated + migrationStats.ingredients.migrated + migrationStats.tags.migrated;
    const totalErrors = migrationStats.cocktails.errors + migrationStats.ingredients.errors + migrationStats.tags.errors;
    
    console.log(`\n✅ Migration completed! ${totalMigrated} records migrated with ${totalErrors} errors.`);
    
    if (totalErrors > 0) {
      console.log('⚠️  Please review the error logs above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}