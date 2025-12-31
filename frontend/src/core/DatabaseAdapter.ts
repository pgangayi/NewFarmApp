/**
 * SIMULATED DATABASE ADAPTER
 * --------------------------
 * A lightweight Persistence Layer using localStorage to simulate a database.
 * This replaces the specific SQLite Wasm implementation for this iteration
 * to focus on the Auth Architecture without heavy DB ops.
 */

const DB_KEY = 'farmers_boot_db_v1';

interface DBSchema {
  users: Array<any>;
  farms: Array<any>;
  locations: Array<any>;
  animals: Array<any>;
  crops: Array<any>;
}

export class DatabaseAdapter {
  private static load(): DBSchema {
    const raw = localStorage.getItem(DB_KEY);
    const defaults = { users: [], farms: [], locations: [], animals: [], crops: [] };

    if (!raw) {
      return defaults;
    }
    try {
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  }

  private static save(data: DBSchema) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  // --- Generic Helpers ---

  static findOne(table: keyof DBSchema, predicate: (item: any) => boolean) {
    const db = this.load();
    return db[table].find(predicate) || null;
  }

  static insert(table: keyof DBSchema, item: any) {
    const db = this.load();
    db[table].push(item);
    this.save(db);
    return item;
  }

  static update(table: keyof DBSchema, predicate: (item: any) => boolean, updates: any) {
    const db = this.load();
    const index = db[table].findIndex(predicate);
    if (index !== -1) {
      db[table][index] = { ...db[table][index], ...updates };
      this.save(db);
      return db[table][index];
    }
    return null;
  }

  static findMany(table: keyof DBSchema, predicate: (item: any) => boolean) {
    const db = this.load();
    return db[table].filter(predicate);
  }

  static delete(table: keyof DBSchema, predicate: (item: any) => boolean) {
    const db = this.load();
    const initialLength = db[table].length;
    db[table] = db[table].filter(item => !predicate(item));
    if (db[table].length !== initialLength) {
      this.save(db);
      return true;
    }
    return false;
  }
}
