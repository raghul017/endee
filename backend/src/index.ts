import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import express from "express";
import cors from "cors";
import resumeRoutes from "./routes/resume";
import jobRoutes from "./routes/jobs";
import matchRoutes from "./routes/match";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Health check — verify Endee connection
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        endeeUrl: process.env.ENDEE_BASE_URL,
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/match", matchRoutes);

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    console.log(
        `Endee vector DB at: ${process.env.ENDEE_BASE_URL || "http://localhost:8080"}`,
    );
});
