// HuggingFace Inference API — free tier
// Model: mistralai/Mistral-7B-Instruct-v0.3
// Generates a 2-sentence explanation of why a job matches the resume

const HF_LLM_URL =
    "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3";

export async function explainMatch(
    resumeSnippet: string,
    jobTitle: string,
    jobDescription: string,
    matchScore: number,
    sharedSkills: string[],
): Promise<string> {
    const prompt = `<s>[INST] You are a recruiter. Explain in exactly 2 sentences why this candidate matches this job. Be specific.

Candidate summary: ${resumeSnippet.slice(0, 400)}

Job: ${jobTitle}
Description: ${jobDescription.slice(0, 300)}
Match: ${(matchScore * 100).toFixed(0)}%
Shared skills: ${sharedSkills.join(", ")}

Write exactly 2 sentences. [/INST]`;

    try {
        const response = await fetch(HF_LLM_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 120,
                    temperature: 0.4,
                    return_full_text: false,
                },
                options: { wait_for_model: true },
            }),
        });

        if (!response.ok) {
            return buildFallback(jobTitle, sharedSkills);
        }

        const data = (await response.json()) as Array<{
            generated_text: string;
        }>;
        return (data[0]?.generated_text || "").trim().slice(0, 300);
    } catch {
        // Fallback: never let LLM failure break match results
        return buildFallback(jobTitle, sharedSkills);
    }
}

function buildFallback(jobTitle: string, sharedSkills: string[]): string {
    const top = sharedSkills.slice(0, 3).join(", ");
    return `Your experience with ${top || "relevant technologies"} aligns well with this ${jobTitle} role. The semantic similarity between your resume and this job description indicates strong compatibility.`;
}
