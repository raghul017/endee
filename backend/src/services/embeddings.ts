// HuggingFace Inference API — free tier
// Model: sentence-transformers/all-MiniLM-L6-v2
// Output: 384-dimensional float vectors
// Free tier: ~1000 requests/day — enough for demo

const HF_EMBED_URL =
    "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5";

export async function embed(text: string): Promise<number[]> {
    const response = await fetch(HF_EMBED_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inputs: text,
            options: { wait_for_model: true },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(
            `HuggingFace embedding failed (${response.status}): ${err}`,
        );
    }

    const data = (await response.json()) as number[] | number[][];

    // HF returns nested array for sentence-transformers: [[0.1, 0.2, ...]]
    if (Array.isArray(data[0])) {
        return data[0] as number[];
    }
    return data as number[];
}

// Embeds a list of texts sequentially with a small delay to respect rate limits
export async function embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
        const vector = await embed(text);
        results.push(vector);
        await new Promise((r) => setTimeout(r, 250)); // 250ms between calls
    }
    return results;
}
