import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
}

const BUCKET = requireEnv("MINIO_BUCKET");
const ENDPOINT = requireEnv("MINIO_ENDPOINT");
const PORT = requireEnv("MINIO_PORT");

export const s3 = new S3Client({
  endpoint: `http://${ENDPOINT}:${PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: requireEnv("MINIO_ACCESS_KEY"),
    secretAccessKey: requireEnv("MINIO_SECRET_KEY"),
  },
  forcePathStyle: true,
});

export async function uploadFile(params: {
  key: string;
  body: Buffer;
  contentType: string;
  size: number;
}): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ContentLength: params.size,
    }),
  );
  return params.key;
}

export async function getDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: 3600,
  });
}

export async function downloadFile(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  if (!response.Body) throw new Error(`No body for key: ${key}`);
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`[MinIO] Bucket "${BUCKET}" created`);
  }
}
