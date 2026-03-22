import { Router, Request, Response } from "express";
import { embed } from "../services/embeddings";
import { upsertVector } from "../services/endee";
import { extractSkills } from "../utils/skills";

const router = Router();

// POST /api/resume/ingest
// Body: { text: string }
router.post("/ingest", async (req: Request, res: Response) => {
    try {
        const { text } = req.body as { text: string };
        if (!text || text.trim().length < 50) {
            return res
                .status(400)
                .json({ error: "Resume text too short (min 50 chars)" });
        }

        const vector = await embed(text);
        const skills = extractSkills(text);

        await upsertVector("resumes", "current-resume", vector, {
            text: text.slice(0, 1000),
            skills,
            timestamp: new Date().toISOString(),
        });

        return res.json({
            success: true,
            skills,
            vectorDimension: vector.length,
            message: "Resume indexed in Endee successfully",
        });
    } catch (err) {
        console.error("[resume/ingest]", err);
        return res.status(500).json({ error: String(err) });
    }
});

export default router;
