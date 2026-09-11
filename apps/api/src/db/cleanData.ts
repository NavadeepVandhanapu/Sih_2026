import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../data/legal_metrology.db');

const db = new Database(dbPath);

const realisticComments = [
  'Customer support email and phone number are missing from the back of the packet.',
  'Net weight text is way too tiny to read without a magnifying glass.',
  'Printed MRP on the box does not state if taxes are included or not.',
  'Manufacturing date and expiry date are smudged on the wrapper seam.',
  'Toll-free customer care phone number was dead when I called to ask about ingredients.',
  'Unit price per 100g is missing on this family pack.',
  'Manufacturer address only gives a city name without any street name or PIN code.',
  'There is a higher price sticker pasted over the original printed MRP.',
];

const realisticStores = [
  'DMart Superstore',
  'Reliance Smart Point',
  'Local Grocery Mart',
  'Blinkit Delivery',
  'BigBasket Online',
  'Spencer\'s Hypermarket',
  'Nature\'s Basket',
  'FreshMart Corner',
];

const realisticLocations = [
  'Indiranagar, Bengaluru',
  'Connaught Place, New Delhi',
  'Bandra West, Mumbai',
  'Gomti Nagar, Lucknow',
  'T. Nagar, Chennai',
  'Banjara Hills, Hyderabad',
  'Sector 18, Noida',
  'Alwarpet, Chennai',
];

const rows = db.prepare('SELECT id, consumer_notes, purchase_store, consumer_location FROM complaints').all() as any[];
let updated = 0;

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  let needsUpdate = false;
  let newNote = row.consumer_notes;
  let newStore = row.purchase_store;
  let newLocation = row.consumer_location;

  if (row.consumer_notes && (row.consumer_notes.includes('Automated consumer') || row.consumer_notes.includes('grievance regarding'))) {
    newNote = realisticComments[i % realisticComments.length];
    needsUpdate = true;
  }
  if (row.purchase_store && (row.purchase_store.includes('Retail Commodity') || row.purchase_store === 'Retail Outlet')) {
    newStore = realisticStores[i % realisticStores.length];
    needsUpdate = true;
  }
  if (row.consumer_location && (row.consumer_location.includes('Zone') || row.consumer_location.includes('District') || row.consumer_location === 'Retail Market, India')) {
    newLocation = realisticLocations[i % realisticLocations.length];
    needsUpdate = true;
  }

  if (needsUpdate) {
    db.prepare('UPDATE complaints SET consumer_notes = ?, purchase_store = ?, consumer_location = ? WHERE id = ?')
      .run(newNote, newStore, newLocation, row.id);
    updated++;
  }
}

console.log(`Successfully updated ${updated} records with clean, natural everyday language!`);
process.exit(0);
