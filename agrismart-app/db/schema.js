import * as SQLite from 'expo-sqlite'

let dbPromise = null

// Open the database once and reuse the same connection.
export function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('agrismart.db')
  }
  return dbPromise
}

// Create tables if they don't exist. Called once at app startup.
export async function initDb() {
  const db = await getDb()
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS crop_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop_type TEXT NOT NULL,
      variety TEXT,
      planting_date TEXT,
      region TEXT,
      soil_type TEXT,
      irrigation TEXT,
      area TEXT,
      sensor_id TEXT,
      current_stage_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked',
      started_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      photo_uri TEXT,
      temperature REAL,
      humidity REAL,
      verdict_json TEXT,
      detected_stage TEXT,
      health TEXT,
      ready_to_advance INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      inspection_id INTEGER,
      type TEXT NOT NULL,
      severity TEXT,
      treatment TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      resolution_photo_uri TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );
  `)

  // Migrations for existing installs (CREATE TABLE IF NOT EXISTS won't add columns)
  await ensureColumn(db, 'anomalies', 'details_json', 'TEXT')
  await ensureColumn(db, 'crop_profile', 'is_active', 'INTEGER DEFAULT 0')
}

// Add a column only if it doesn't already exist.
async function ensureColumn(db, table, column, definition) {
  const cols = await db.getAllAsync(`PRAGMA table_info(${table})`)
  if (!cols.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

// Wipe everything (used by "réinitialiser" in ProfileScreen).
export async function resetDb() {
  const db = await getDb()
  await db.execAsync(`
    DELETE FROM anomalies;
    DELETE FROM inspections;
    DELETE FROM stages;
    DELETE FROM crop_profile;
  `)
}
