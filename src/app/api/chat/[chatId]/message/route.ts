import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateUUID } from '@/lib/uuid';
import { getCurrentDateTime } from '@/lib/datetime';
import { extractRashiSigns } from '@/utils/chartParser';

// POST /api/chat/[chatId]/message — Send a message and get AI response from the model
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const { text } = await req.json();

    if (!ObjectId.isValid(chatId)) {
      return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 });
    }
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');
    const chats = db.collection('chats');
    const users = db.collection('users');

    const chat = await chats.findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const userEmail = chat.userEmail;
    const userProfile = await users.findOne({ email: userEmail });

    if (!userProfile?.dob || !userProfile?.tob || !userProfile?.pob) {
      return NextResponse.json({ 
        error: 'Incomplete Birth Profile', 
        message: 'Namaste! To give you an accurate reading, I need your birth date, time, and place. Please update your profile first.',
        requiresProfile: true
      }, { status: 400 });
    }

    const backendUrl = process.env.AI_BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ 
        error: 'AI Backend Configuration Missing', 
        message: 'AI_BACKEND_URL environment variable is not set. Please configure it in .env.local'
      }, { status: 500 });
    }

    // 1. Ensure chart context exists (check both top-level and nested preferences)
    let chartContext = userProfile.chartContext || userProfile.preferences?.chartContext;
    if (!chartContext) {
      console.log(`Generating chart context for ${userProfile.email}...`);
      const chartRes = await fetch(`${backendUrl}/api/chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userProfile.name || 'Friend',
          dob: userProfile.dob,
          tob: userProfile.tob,
          place: userProfile.pob
        }),
      });

      if (chartRes.ok) {
        const chartData = await chartRes.json();
        chartContext = chartData.chart_context;
        // Save back to user profile for future use (syncing to both locations)
        await users.updateOne(
          { email: userEmail },
          { 
            $set: { 
              chartContext, 
              "preferences.chartContext": chartContext,
              updatedAt: getCurrentDateTime() 
            } 
          }
        );
      } else {
        throw new Error('Failed to compute birth chart context from backend.');
      }
    }

    // --- AUTOMATIC SIGN UPDATE FROM CHART CONTEXT ---
    // Extract and update profile signs whenever chartContext is available
    if (chartContext) {
      const { sunSign, moonSign } = extractRashiSigns(chartContext);
      
      // Update if signs are detected and either they are missing in profile 
      // or we just want to ensure they are always in sync with the latest chart computation
      if (sunSign || moonSign) {
        const profileUpdate: any = { updatedAt: getCurrentDateTime() };
        let needsUpdate = false;

        if (sunSign) {
          const formattedSun = sunSign.charAt(0).toUpperCase() + sunSign.slice(1).toLowerCase();
          if (userProfile.sunSign !== formattedSun) {
            profileUpdate.sunSign = formattedSun;
            needsUpdate = true;
          }
        }
        if (moonSign) {
          const formattedMoon = moonSign.charAt(0).toUpperCase() + moonSign.slice(1).toLowerCase();
          if (userProfile.moonSign !== formattedMoon) {
            profileUpdate.moonSign = formattedMoon;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await users.updateOne(
            { email: userEmail }, 
            { 
              $set: { 
                ...profileUpdate,
                "preferences.chartContext": chartContext // Ensure it's also in preferences
              } 
            }
          );
          console.log(`Auto-synced profile signs from chartContext for ${userEmail}: Moon=${profileUpdate.moonSign || 'unchanged'}, Sun=${profileUpdate.sunSign || 'unchanged'}`);
        }
      }
    }

    // 2. Prepare the history for the LLM
    const history = (chat.messages || [])
      .filter((m: any) => m.type === 'user' || m.type === 'ai')
      .slice(-2) // Keep ONLY last 2 messages (1 turn) to brutally save context
      .map((m: any) => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: (m.text || '').slice(0, 150) // Aggressive truncation
      }));

    // 3. Prepare the streaming request to /api/ask
    const askRes = await fetch(`${backendUrl}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: text,
        chart_context: chartContext,
        history: history,
        name: userProfile.name || 'Friend',
        lang: userProfile.preferredLanguage || 'english',
        dob: userProfile.dob
      }),
    });

    if (!askRes.ok) {
      const errorData = await askRes.json();
      return NextResponse.json({ error: errorData.error || 'AI Backend Error' }, { status: askRes.status });
    }

    // 3. Setup Response Stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullAiResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = askRes.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          let lineBuf = ''; // Buffer for incomplete lines across chunks

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            lineBuf += decoder.decode(value, { stream: true });
            const lines = lineBuf.split('\n');
            lineBuf = lines.pop() || ''; // Keep last incomplete line for next chunk
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') continue;
                
                try {
                  const data = JSON.parse(dataStr);
                  if (data.token) {
                    fullAiResponse += data.token;
                    controller.enqueue(encoder.encode(data.token));
                  } else if (data.error) {
                    controller.enqueue(encoder.encode(`[ERROR: ${data.error}]` ));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
          // After stream completes, save to DB
          try {
            const now = getCurrentDateTime();
            
            const userMessage = {
              id: generateUUID(),
              type: 'user',
              text: text.trim(),
              createdAt: now,
            };
            const aiResponse = {
              id: generateUUID(),
              type: 'ai',
              text: fullAiResponse,
              rating: null,
              createdAt: getCurrentDateTime(),
            };

            const hasUserMessage = chat.messages?.some((m: any) => m.type === 'user');
            
            const updateOps: any = {
              $push: { messages: { $each: [userMessage, aiResponse] } },
              $set: { updatedAt: now },
            };

            // Set title if this is the first user message
            if (!hasUserMessage) {
              updateOps.$set.title = text.trim().substring(0, 70);
            }

            const result = await chats.updateOne(
              { _id: new ObjectId(chatId) },
              updateOps
            );

            console.log(`Saved messages to chat ${chatId}. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
          } catch (dbError) {
            console.error("Database save error after stream:", dbError);
          }
          
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });


    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

