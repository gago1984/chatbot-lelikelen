import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current inventory
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name');

    // Fetch upcoming schedule
    const { data: schedule } = await supabase
      .from('service_schedule')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .limit(10);

    // Fetch past completed services with attendance
    const { data: pastServices } = await supabase
      .from('service_schedule')
      .select('*')
      .eq('status', 'completed')
      .not('attendance', 'is', null)
      .order('date', { ascending: false })
      .limit(5);

    // Fetch recent chat history
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(20);

    // Check for today's services
    const today = new Date().toISOString().split('T')[0];
    const todayServices = schedule?.filter(s => s.date === today) || [];
    
    let todayServiceInfo = '';
    if (todayServices.length > 0) {
      const now = new Date();
      todayServiceInfo = todayServices.map(s => {
        const serviceTime = new Date(`${s.date}T${s.time}`);
        const hoursUntil = Math.max(0, (serviceTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        return `- TODAY at ${s.time} in ${s.location} (${hoursUntil > 0 ? `${hoursUntil.toFixed(1)} hours remaining` : 'in progress or completed'})`;
      }).join('\n');
    }

    const systemPrompt = `You are a helpful assistant for Leli-Kelen, a non-profit organization that serves food to disadvantaged people, elders, and homeless individuals. The organization serves food around 6-7pm in the street and relies on donations of rice, pasta, vegetables, tomato sauce, and other items.

IMPORTANT: You are bilingual and can communicate fluently in both English and Spanish. Respond in the same language the user writes to you. If they write in Spanish, respond in Spanish. If they write in English, respond in English.

Current Inventory:
${inventory?.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

Recent Completed Services (with attendance):
${pastServices?.map(s => `- ${s.date} at ${s.time} in ${s.location}: ${s.attendance} people attended`).join('\n') || 'No past services recorded yet.'}

${todayServiceInfo ? `TODAY'S SERVICES:\n${todayServiceInfo}\n` : 'No services scheduled for today.\n'}

Upcoming Service Schedule:
${schedule?.map(s => `- ${s.date} at ${s.time} - ${s.location} (${s.status})`).join('\n')}

Your role is to:
1. Answer questions about current inventory levels in English or Spanish
2. Provide information about past services and attendance (typically 100-120 people per service)
3. Provide information about scheduled service days and calculate time remaining
4. Answer if there are services today and how many hours until they start
5. Help coordinate tasks and operations
6. Be warm, compassionate, and supportive in both languages

Always be concise and helpful. Focus on the practical needs of the organization.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory?.map(m => ({ role: m.role, content: m.content })) || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save both messages to chat history
    await supabase.from('chat_messages').insert([
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    ]);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
