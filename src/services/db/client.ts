// This file creates the database connection ONCE, lazily on first access.
import * as SQLite from 'expo-sqlite'

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export function initDatabase() {
  if (!databaseInstance) {
    databaseInstance = SQLite.openDatabaseSync('snipr.db');
  }
  return databaseInstance;
}

export function closeDatabase() {
  if (databaseInstance) {
    try {
      databaseInstance.closeSync();
    } catch (err) {
      // Ignore
    }
    databaseInstance = null;
  }
}

// Proxy to delay database initialization until it is actually accessed.
// This prevents SQLite file locking during module evaluation on startup.
const dbProxy = new Proxy({} as SQLite.SQLiteDatabase, {
  get(target, prop) {
    const instance = initDatabase();
    const value = Reflect.get(instance, prop);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

export default dbProxy;