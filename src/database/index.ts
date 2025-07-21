import { MongoClient, Db } from 'mongodb';
import { config } from '../config';

export class Database {
  private client: MongoClient;
  private db!: Db;

  constructor() {
    this.client = new MongoClient(config.mongo.uri);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db();
    console.log('Connected to MongoDB');
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}

export const databaseConnection = new Database();
