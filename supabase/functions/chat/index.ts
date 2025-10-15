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

    // Fetch recent chat history
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(20);

    const systemPrompt = `You are a helpful assistant for a non-profit organization that serves food to disadvantaged people, elders, and homeless individuals. The organization serves food around 6-7pm in the street and relies on donations of rice, pasta, vegetables, tomato sauce, and other items.

Current Inventory:
${inventory?.map(item => `- ${item.name}: ${item.quantity} ${item.unit} (Low stock threshold: ${item.low_stock_threshold} ${item.unit})`).join('\n')}

Upcoming Service Schedule:
${schedule?.map(s => `- ${s.date} at ${s.time} - ${s.location} (${s.status})`).join('\n')}

Your role is to:
1. Answer questions about current inventory levels
2. Identify items running low on stock
3. Provide information about scheduled service days
4. Help coordinate tasks and operations
5. Be warm, compassionate, and supportive

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
