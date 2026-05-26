// This file creates the database connection ONCE.
// One DB connection shared everywhere(Home, Create, etc)
import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabaseSync('snipr.db')
export default db

// Every file that imports db from client.ts triggers it!