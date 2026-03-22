import { Endee, Precision } from "endee";
import dotenv from "dotenv";
dotenv.config();

// all-MiniLM-L6-v2 outputs 384 dimensions
const VECTOR_DIMENSION = 384;

let client: Endee | null = null;

export function getEndeeClient(): Endee {
    if (!client) {
        client = new Endee(process.env.ENDEE_AUTH_TOKEN || "");
        client.setBaseUrl(
            `${process.env.ENDEE_BASE_URL || "http://localhost:8080"}/api/v1`,
        );
    }
    return client;
}

export async function ensureIndexExists(indexName: string): Promise<void> {
    const c = getEndeeClient();
    try {
        await c.getIndex(indexName);
    } catch {
        await c.createIndex({
            name: indexName,
            dimension: VECTOR_DIMENSION,
            spaceType: "cosine",
            precision: Precision.INT8,
        });
        console.log(`[Endee] Created index: ${indexName}`);
    }
}

export async function upsertVector(
    indexName: string,
    id: string,
    vector: number[],
    meta: Record<string, unknown>,
): Promise<void> {
    await ensureIndexExists(indexName);
    const index = await getEndeeClient().getIndex(indexName);
    await index.upsert([{ id, vector, meta }]);
}

export async function queryVectors(
    indexName: string,
    vector: number[],
    topK: number,
): Promise<
    Array<{ id: string; similarity: number; meta: Record<string, unknown> }>
> {
    await ensureIndexExists(indexName);
    const index = await getEndeeClient().getIndex(indexName);
    const results = await index.query({ vector, topK });
    return results.map((r) => ({
        id: r.id,
        similarity: r.similarity,
        meta: r.meta as Record<string, unknown>,
    }));
}
