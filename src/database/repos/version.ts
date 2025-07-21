import { Collection, ObjectId } from 'mongodb';
import { databaseConnection } from '../index';

export interface Version {
  _id?: ObjectId;
  endpointId: ObjectId;
  sha256: string;
  fetchedAt: Date;
  json: object;
}

export class VersionRepository {
  private collection: Collection<Version>;

  constructor() {
    this.collection = databaseConnection.getDb().collection<Version>('versions');
    void this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    await this.collection.createIndex({ endpointId: 1, fetchedAt: -1 });
    await this.collection.createIndex({ sha256: 1 });
  }

  async store(endpointId: ObjectId, sha256: string, json: object): Promise<Version> {
    const version: Version = {
      endpointId,
      sha256,
      fetchedAt: new Date(),
      json,
    };

    const result = await this.collection.insertOne(version);
    version._id = result.insertedId;
    return version;
  }

  async findLatest(endpointId: ObjectId): Promise<Version | null> {
    return await this.collection.findOne(
      { endpointId },
      { sort: { fetchedAt: -1 } }
    );
  }

  async enforceLimit(endpointId: ObjectId, limit: number = 50): Promise<void> {
    const count = await this.collection.countDocuments({ endpointId });
    
    if (count > limit) {
      const excess = count - limit;
      const oldestVersions = await this.collection
        .find({ endpointId })
        .sort({ fetchedAt: 1 })
        .limit(excess)
        .toArray();

      const idsToDelete = oldestVersions
        .map((v: Version) => v._id)
        .filter((id): id is ObjectId => id !== undefined);
      
      await this.collection.deleteMany({ _id: { $in: idsToDelete } });
    }
  }

  async deleteByEndpoint(endpointId: ObjectId): Promise<void> {
    await this.collection.deleteMany({ endpointId });
  }
}

export const versionRepository = new VersionRepository(); 
