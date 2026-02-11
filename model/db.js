// Shared database connection (singleton pattern)
import config from '../config.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise();
const db = pgp(config.db.connectionString);

export default db;
