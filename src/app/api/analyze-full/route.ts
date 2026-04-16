import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentDateTime } from '@/lib/datetime';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, chart_context, force_refresh = false } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");

        // ──────────────────────────────────────────────────────
        // STEP 1: Check for existing analysis (unless force refreshed)
        // ──────────────────────────────────────────────────────
        const user = await users.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        if (!force_refresh && user.insights && user.houses && user.planets) {
            console.log(`[AnalyzeFull] Cache HIT for ${email}. Returning existing data.`);
            return NextResponse.json({
                success: true,
                message: "Existing insights retrieved from profile.",
                data: {
                    insights: user.insights,
                    houses: user.houses,
                    planets: user.planets,
                    dasha: user.dasha,
                    lastFullAnalysis: user.lastFullAnalysis
                }
            });
        }

        const effectiveChartContext = chart_context || user.chartContext || user.preferences?.chartContext;

        if (!effectiveChartContext) {
            return NextResponse.json({ 
                error: "No chart data available for analysis. Please generate a chart first." 
            }, { status: 400 });
        }

        // ──────────────────────────────────────────────────────
        // STEP 2: No existing insights — fetch from AI Backend
        // ──────────────────────────────────────────────────────
        console.log(`[AnalyzeFull] Cache MISS/Forced for ${email}. Fetching from AI Backend...`);

        if (!process.env.AI_BACKEND_URL) {
            console.error("[AnalyzeFull] AI_BACKEND_URL not configured");
            return NextResponse.json({ 
                error: "Analysis service is not configured. Please try again later." 
            }, { status: 503 });
        }

        let analysisData = null;
        try {
            const externalApiUrl = `${process.env.AI_BACKEND_URL}/api/analyze-full`;
            const response = await fetch(externalApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.AI_BACKEND_API_KEY || '' },
                body: JSON.stringify({ 
                    email: email, 
                    chart_context: effectiveChartContext 
                }),
                signal: AbortSignal.timeout(45000) // Analysis can take quite a while
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[AnalyzeFull] AI Backend Error: ${response.status} ${errorText}`);
                return NextResponse.json({ 
                    error: "The AI analyst is taking too long to respond. Please try again in a few moments." 
                }, { status: 503 });
            }

            analysisData = await response.json();
            console.log(`[AnalyzeFull] AI Backend successfully returned analysis for ${email}`);
        } catch (error) {
            console.error("[AnalyzeFull] External API request failed:", error);
            return NextResponse.json({ 
                error: "Unable to reach the analysis engine. Please try again later." 
            }, { status: 503 });
        }

        // ──────────────────────────────────────────────────────
        // STEP 3: Validate and prepare DB sync
        // ──────────────────────────────────────────────────────
        if (!analysisData) {
            return NextResponse.json({ error: "No analysis data returned." }, { status: 500 });
        }

        const updateData: any = {
            updatedAt: getCurrentDateTime()
        };

        // Efficiently merge whatever blocks the AI returned
        const fieldsToSync = ['insights', 'houses', 'planets', 'dasha', 'full_analysis'];
        let syncCount = 0;

        fieldsToSync.forEach(field => {
            const dataKey = field === 'full_analysis' ? 'lastFullAnalysis' : field;
            if (analysisData[field]) {
                updateData[dataKey] = analysisData[field];
                syncCount++;
            }
        });

        if (syncCount === 0) {
            console.warn(`[AnalyzeFull] AI returned successful response but no syncable fields for ${email}`);
        }

        // ──────────────────────────────────────────────────────
        // STEP 4: Store in User Profile and Return
        // ──────────────────────────────────────────────────────
        await users.updateOne({ email }, { $set: updateData });
        console.log(`[AnalyzeFull] Successfully sync'd ${syncCount} data blocks for ${email} to DB`);

        return NextResponse.json({
            success: true,
            message: "Structured insights generated and saved successfully to profile.",
            data: analysisData
        });

    } catch (error) {
        console.error("Analyze full error:", error);
        return NextResponse.json({ 
            error: "An unexpected error occurred during full analysis." 
        }, { status: 500 });
    }
}
