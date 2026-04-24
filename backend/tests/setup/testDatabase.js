import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;
const TEST_MONGO_PORT = Number(process.env.TEST_MONGO_PORT || 27027);
const TEST_MONGO_URI = process.env.TEST_MONGO_URI;

export async function connectTestDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (TEST_MONGO_URI) {
    process.env.MONGO_URI = TEST_MONGO_URI;
    await mongoose.connect(process.env.MONGO_URI);
    await clearTestDatabase();
    return;
  }

  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: "127.0.0.1",
      port: TEST_MONGO_PORT,
    },
  });
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
}

export async function clearTestDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const { collections } = mongoose.connection;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({ }))
  );
}

export async function disconnectTestDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export function setupApiTestLifecycle() {
  beforeAll(async () => {
    await connectTestDatabase();
  }, 30_000);

  afterEach(async () => {
    await clearTestDatabase();
  }, 30_000);

  afterAll(async () => {
    await disconnectTestDatabase();
  }, 30_000);
}
