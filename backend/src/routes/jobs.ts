import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { embed } from "../services/embeddings";
import { upsertVector } from "../services/endee";
import { extractSkills } from "../utils/skills";

const router = Router();

// In-memory job store (no DB needed for this demo)
export const jobStore: Record<
    string,
    {
        title: string;
        company: string;
        description: string;
        skills: string[];
    }
> = {};

// POST /api/jobs/ingest
router.post("/ingest", async (req: Request, res: Response) => {
    try {
        const { title, company, description } = req.body as {
            title: string;
            company: string;
            description: string;
        };

        if (!title || !description) {
            return res
                .status(400)
                .json({ error: "title and description are required" });
        }

        const id = uuidv4();
        const combinedText = `${title} at ${company || "Unknown Company"}. ${description}`;
        const vector = await embed(combinedText);
        const skills = extractSkills(combinedText);

        jobStore[id] = { title, company: company || "", description, skills };

        await upsertVector("jobs", id, vector, {
            title,
            company: company || "",
            description: description.slice(0, 500),
            skills,
        });

        return res.json({
            success: true,
            id,
            skills,
            jobCount: Object.keys(jobStore).length,
        });
    } catch (err) {
        console.error("[jobs/ingest]", err);
        return res.status(500).json({ error: String(err) });
    }
});

// GET /api/jobs
router.get("/", (req: Request, res: Response) => {
    const jobs = Object.entries(jobStore).map(([id, data]) => ({
        id,
        ...data,
    }));
    return res.json({ jobs, count: jobs.length });
});

export default router;
