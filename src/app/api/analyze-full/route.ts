import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentDateTime } from '@/lib/datetime';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, chart_context } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("astra-navi-database");
        const users = db.collection("users");

        // 1. Get user and their chart context
        const user = await users.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        const effectiveChartContext = chart_context || user.chartContext || user.preferences?.chartContext;

        if (!effectiveChartContext) {
            return NextResponse.json({ 
                error: "No chart data available for analysis. Please generate a chart first." 
            }, { status: 400 });
        }

        // 2. Call AI Backend for full analysis
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
                signal: AbortSignal.timeout(30000) // Analysis can take longer
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[AnalyzeFull] AI Backend Error: ${response.status} ${errorText}`);
                return NextResponse.json({ 
                    error: "The AI analyst is temporarily unavailable. Please try again later." 
                }, { status: 503 });
            }

            analysisData = await response.json();
            console.log(`[AnalyzeFull] AI Backend returned analysis for ${email}`);
        } catch (error) {
            console.error("[AnalyzeFull] External API request failed:", error);
            return NextResponse.json({ 
                error: "Unable to reach the analysis engine. Please try again later." 
            }, { status: 503 });
        }

        // 3. Save structured insights to MongoDB profile
        // Expecting analysisData to contain houses, planets, dasha, etc.
        const updateData: any = {
            updatedAt: getCurrentDateTime()
        };

        // If the AI returned specific blocks, merge them into the user profile
        if (analysisData.insights) {
            updateData.insights = analysisData.insights;
        }
        if (analysisData.houses) {
            updateData.houses = analysisData.houses;
        }
        if (analysisData.planets) {
            updateData.planets = analysisData.planets;
        }
        if (analysisData.dasha) {
            updateData.dasha = analysisData.dasha;
        }
        
        // Also save the full raw analysis if provided
        if (analysisData.full_analysis) {
            updateData.lastFullAnalysis = analysisData.full_analysis;
        }

        await users.updateOne({ email }, { $set: updateData });
        console.log(`[AnalyzeFull] Successfully sync'd analysis for ${email} to DB`);

        return NextResponse.json({
            success: true,
            message: "Structured insights generated and saved successfully.",
            data: analysisData
        });

    } catch (error) {
        console.error("Analyze full error:", error);
        return NextResponse.json({ 
            error: "Failed to perform full chart analysis." 
        }, { status: 500 });
    }
}
