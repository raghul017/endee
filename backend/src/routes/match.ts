import { Router, Request, Response } from "express";
import { embed } from "../services/embeddings";
import { queryVectors, ensureIndexExists } from "../services/endee";
import { explainMatch } from "../services/explain";
import { getSharedSkills } from "../utils/skills";

const router = Router();

// POST /api/match
// Body: { resumeText: string, topK?: number }
router.post("/", async (req: Request, res: Response) => {
    try {
        const { resumeText, topK = 5 } = req.body as {
            resumeText: string;
            topK?: number;
        };

        if (!resumeText || resumeText.trim().length < 50) {
            return res
                .status(400)
                .json({ error: "Resume text required (min 50 chars)" });
        }

        const resumeVector = await embed(resumeText);

        await ensureIndexExists("jobs");
        const results = await queryVectors("jobs", resumeVector, topK);

        if (results.length === 0) {
            return res.json({
                matches: [],
                message:
                    "No jobs found. Please ingest some job descriptions first.",
            });
        }

        // Enrich with explanations (only top 3 to save HF API quota)
        const enrichedMatches = await Promise.all(
            results.map(async (result, index) => {
                const meta = result.meta as {
                    title: string;
                    company: string;
                    description: string;
                    skills: string[];
                };
                const sharedSkills = getSharedSkills(
                    resumeText,
                    meta.description || "",
                );

                let explanation = "";
                if (index < 3) {
                    explanation = await explainMatch(
                        resumeText,
                        meta.title,
                        meta.description,
                        result.similarity,
                        sharedSkills,
                    );
                }

                return {
                    id: result.id,
                    title: meta.title,
                    company: meta.company,
                    description: meta.description,
                    matchScore: parseFloat(
                        (result.similarity * 100).toFixed(1),
                    ),
                    sharedSkills,
                    explanation,
                    rank: index + 1,
                };
            }),
        );

        return res.json({
            matches: enrichedMatches,
            total: enrichedMatches.length,
        });
    } catch (err) {
        console.error("[match]", err);
        return res.status(500).json({ error: String(err) });
    }
});

export default router;
