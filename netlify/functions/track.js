const { createClient } = require('@supabase/supabase-js');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Method Not Allowed'
        })
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Missing Supabase environment variables'
        })
      };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Invalid JSON body'
        })
      };
    }

    const {
      funnel_id,
      public_key,
      lead_id,
      session_id,
      event_name,
      event_value,
      event_data,
      step_number,
      question,
      answer,
      button_text,
      clicked_text,
      link_url,
      form_data,
      name,
      email,
      phone,
      whatsapp,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
      gclid,
      country,
      page_url,
      referrer,
      user_agent,
      browser_language,
      device_type,
      created_at
    } = payload;

    if (!funnel_id || !public_key) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Missing funnel_id or public_key'
        })
      };
    }

    // Verify Funnel exists
    const { data: existingFunnel, error: funnelLookupError } = await supabase
      .from('funnels')
      .select('id, funnel_id, public_key')
      .eq('funnel_id', funnel_id)
      .maybeSingle();

    if (funnelLookupError) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Error checking funnel',
          details: funnelLookupError.message
        })
      };
    }

    if (!existingFunnel) {
      const { error: insertFunnelError } = await supabase
        .from('funnels')
        .insert({
          funnel_id,
          public_key,
          name: funnel_id,
          status: 'active',
          last_event_at: created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertFunnelError) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            message: 'Error creating funnel',
            details: insertFunnelError.message
          })
        };
      }
    } else if (existingFunnel.public_key !== public_key) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Invalid public_key for this funnel_id'
        })
      };
    }

    // Extract dynamic data from event_data if it exists (from new pixel.js format)
    const finalStep = event_data?.step_id || step_number || null;
    const finalQuestion = event_data?.question || question || null;
    const finalAnswer = event_data?.answer || answer || null;
    const finalName = event_data?.name || name || null;
    const finalEmail = event_data?.email || email || null;
    const finalPhone = event_data?.phone || event_data?.whatsapp || phone || whatsapp || null;

    const trackObj = {
      funnel_id,
      public_key,
      lead_id: lead_id || `lead_${Date.now()}`,
      event_name: event_name || 'unknown_event',
      event_value: event_value || null,
      step_number: finalStep,
      question: finalQuestion,
      answer: finalAnswer,
      event_data: event_data || payload,
      button_text: event_data?.button_text || button_text || null,
      clicked_text: clicked_text || null,
      link_url: event_data?.link_url || link_url || null,
      form_data: form_data || null,
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
      fbclid: fbclid || null,
      gclid: gclid || null,
      country: country || null,
      page_url: page_url || null,
      referrer: referrer || null,
      user_agent: user_agent || null,
      browser_language: browser_language || null,
      device_type: device_type || null,
      created_at: created_at || new Date().toISOString()
    };

    const { error: eventInsertError } = await supabase
      .from('tracking_events')
      .insert(trackObj);

    if (eventInsertError) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Error inserting tracking event',
          details: eventInsertError.message
        })
      };
    }

    await supabase
      .from('funnels')
      .update({
        last_event_at: created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('funnel_id', funnel_id);

    // Save lead centrally
    const shouldCreateLead = ['lead_created', 'form_submit', 'quiz_completed'].includes(event_name);
    
    // We update lead anyway to capture the UTMs on page_view or button_click if desired,
    // but following instructions strictly: "Se event_name for lead_created ou form_submit, salvar/atualizar também na tabela leads."
    if (shouldCreateLead) {
      await supabase
        .from('leads')
        .upsert({
          funnel_id,
          lead_id: lead_id || `lead_${Date.now()}`,
          name: finalName,
          email: finalEmail,
          phone: finalPhone,
          status: event_name === 'quiz_completed' ? 'Completo' : 'Novo',
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
          fbclid: fbclid || null,
          gclid: gclid || null,
          country: country || null,
          page_url: page_url || null,
          user_agent: user_agent || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'lead_id'
        });
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Evento recebido com sucesso'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        details: error.message
      })
    };
  }
};
