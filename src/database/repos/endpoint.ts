import { Collection, ObjectId } from 'mongodb';
import { databaseConnection } from '../index';

export interface Endpoint {
  _id?: ObjectId;
  url: string;
  channels: string[];
  lastHash?: string;
  createdAt: Date;
  enabled: boolean;
}

export class EndpointRepository {
  private collection: Collection<Endpoint>;

  constructor() {
    this.collection = databaseConnection.getDb().collection<Endpoint>('endpoints');
    void this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    await this.collection.createIndex({ url: 1 });
    await this.collection.createIndex({ channels: 1 });
  }

  async add(url: string, channelId: string): Promise<Endpoint> {
    const existing = await this.collection.findOne({ url });
    
    if (existing) {
      if (!existing.channels.includes(channelId)) {
        await this.collection.updateOne(
          { _id: existing._id },
          { $addToSet: { channels: channelId } }
        );
        existing.channels.push(channelId);
      }
      return existing;
    }

    const endpoint: Endpoint = {
      url,
      channels: [channelId],
      createdAt: new Date(),
      enabled: true,
    };

    const result = await this.collection.insertOne(endpoint);
    endpoint._id = result.insertedId;
    return endpoint;
  }

  async remove(url: string, channelId: string): Promise<boolean> {
    const endpoint = await this.collection.findOne({ url });
    
    if (!endpoint || !endpoint.channels.includes(channelId)) {
      return false;
    }

    if (endpoint.channels.length === 1) {
      await this.collection.deleteOne({ _id: endpoint._id });
      return true;
    } else {
      await this.collection.updateOne(
        { _id: endpoint._id },
        { $pull: { channels: channelId } }
      );
      return true;
    }
  }

  async findByChannel(channelId: string): Promise<Endpoint[]> {
    return await this.collection.find({ channels: channelId }).toArray();
  }

  async findAllEnabled(): Promise<Endpoint[]> {
    return await this.collection.find({ enabled: true }).toArray();
  }

  async updateHash(endpointId: ObjectId, hash: string): Promise<void> {
    await this.collection.updateOne(
      { _id: endpointId },
      { $set: { lastHash: hash } }
    );
  }
}

// Lazy initialization to avoid database connection timing issues
let _endpointRepository: EndpointRepository | null = null;

export const getEndpointRepository = (): EndpointRepository => {
  if (!_endpointRepository) {
    _endpointRepository = new EndpointRepository();
  }
  return _endpointRepository;
}; 
