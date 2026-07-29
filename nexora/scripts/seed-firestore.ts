/**
 * One-time Firestore seeding script.
 *
 * Populates real Firestore documents (using firebase-admin, which bypasses
 * firestore.rules entirely) so the live app has data to show instead of
 * falling back to mock data.
 *
 * Setup:
 *  1. npm install firebase-admin --save-dev
 *  2. Firebase Console -> Project Settings -> Service Accounts ->
 *     "Generate new private key" -> save the JSON file somewhere safe
 *     (do NOT commit it — it's already covered by .gitignore's *.json
 *     service-account patterns, but double check).
 *  3. Run:
 *     GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *       npx tsx scripts/seed-firestore.ts
 *
 * Safe to re-run: uses the same doc IDs as the mock data, so it upserts
 * rather than duplicating documents.
 */

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import {
  MOCK_STREAMS,
  MOCK_GIFTS,
  MOCK_GAMES,
  MOCK_EVENTS,
  MOCK_SHOPPING_PRODUCTS,
  MOCK_DIGITAL_PRODUCTS,
  MOCK_SERVICES
} from '../src/data/mockData';
import { SEEDED_VIDEOS } from '../src/services/VideoService';
import { SEEDED_MUSIC_TRACKS } from '../src/services/MusicService';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const firebaseConfig = JSON.parse(
  readFileSync(path.join(__dirname, '../firebase-applet-config.json'), 'utf-8')
);

// Prefer an explicit service account file if SEED_SERVICE_ACCOUNT is set,
// otherwise fall back to GOOGLE_APPLICATION_CREDENTIALS / ADC.
const credential = process.env.SEED_SERVICE_ACCOUNT
  ? cert(JSON.parse(readFileSync(process.env.SEED_SERVICE_ACCOUNT, 'utf-8')))
  : applicationDefault();

const app = initializeApp({
  credential,
  projectId: firebaseConfig.projectId
});

// This project uses a NAMED Firestore database, not "(default)".
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Mock data has sparse fields (e.g. empty seat slots with userName: undefined).
// Firestore rejects literal `undefined` — this tells it to just omit those
// fields instead of throwing.
db.settings({ ignoreUndefinedProperties: true });

type SeedItem = { id: string; [key: string]: unknown };

async function seedCollection(collectionName: string, items: SeedItem[]) {
  const batch = db.batch();
  for (const item of items) {
    const { id, ...data } = item;
    batch.set(db.collection(collectionName).doc(id), data, { merge: true });
  }
  await batch.commit();
  console.log(`✓ Seeded ${items.length} docs into "${collectionName}"`);
}

async function main() {
  console.log(`Seeding project: ${firebaseConfig.projectId}`);
  console.log(`Database: ${firebaseConfig.firestoreDatabaseId}\n`);

  await seedCollection('streams', MOCK_STREAMS as unknown as SeedItem[]);
  await seedCollection('gift_catalog', MOCK_GIFTS as unknown as SeedItem[]);
  await seedCollection('game_rooms', MOCK_GAMES as unknown as SeedItem[]);
  await seedCollection('ticketed_events', MOCK_EVENTS as unknown as SeedItem[]);
  await seedCollection('shopping_products', MOCK_SHOPPING_PRODUCTS as unknown as SeedItem[]);
  await seedCollection('digital_products', MOCK_DIGITAL_PRODUCTS as unknown as SeedItem[]);
  await seedCollection('creator_services', MOCK_SERVICES as unknown as SeedItem[]);
  await seedCollection('video_library', SEEDED_VIDEOS as unknown as SeedItem[]);
  await seedCollection('music_tracks', SEEDED_MUSIC_TRACKS as unknown as SeedItem[]);

  console.log('\nDone. Refresh the live app — it should now show live Firestore data instead of mock data.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
