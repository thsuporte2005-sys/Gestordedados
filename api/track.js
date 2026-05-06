const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        success: false,
        message: "Missing Supabase environment variables"
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = req.body || {};
    const {
      funnel_id,
      public_key,
      lead_id,
      event_name,
      event_value,
      page_url,
      referrer,
      user_agent,
      browser_language,
      device_type,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
      gclid
    } = payload;

    if (!funnel_id || !public_key) {
      return res.status(400).json({
        success: false,
        message: "Missing funnel_id or public_key"
      });
    }

    // Capture dynamic nested event_data (from pixel.js answer_click or lead_created)
    const event_data = payload.event_data || payload;
    const name = event_data.name || payload.name;
    const email = event_data.email || payload.email;
    const phone = event_data.phone || event_data.whatsapp || payload.phone || payload.whatsapp;
    
    let domain = null;
    try {
        if (page_url) {
            domain = new URL(page_url).hostname;
        }
    } catch(e) {}

    const { data: existingFunnel, error: funnelError } = await supabase
      .from("funnels")
      .select("funnel_id, public_key, quiz_url")
      .eq("funnel_id", funnel_id)
      .maybeSingle();

    if (funnelError) {
      return res.status(500).json({
        success: false,
        message: "Error checking funnel",
        details: funnelError.message
      });
    }

    const nowIso = new Date().toISOString();

    if (!existingFunnel) {
      const { error: createFunnelError } = await supabase
        .from("funnels")
        .insert({
          funnel_id,
          public_key,
          name: funnel_id,
          status: "active",
          last_page_url: page_url || null,
          last_domain: domain || null,
          quiz_url: page_url || null, // Se é o primeiro page_view, já vira quiz_url natural
          last_event_name: event_name || "unknown_event",
          last_event_at: nowIso,
          updated_at: nowIso
        });

      if (createFunnelError) {
        return res.status(500).json({
          success: false,
          message: "Error creating funnel",
          details: createFunnelError.message
        });
      }
    } else if (existingFunnel.public_key !== public_key) {
      return res.status(403).json({
        success: false,
        message: "Invalid public_key for this funnel_id"
      });
    }

    const { error: insertEventError } = await supabase
      .from("tracking_events")
      .insert({
        funnel_id,
        public_key,
        lead_id: lead_id || `lead_${Date.now()}`,
        event_name: event_name || "unknown_event",
        event_value: event_value || null,
        event_data: payload,
        page_url: page_url || null,
        referrer: referrer || null,
        user_agent: user_agent || null,
        browser_language: browser_language || null,
        device_type: device_type || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null,
        fbclid: fbclid || null,
        gclid: gclid || null,
        created_at: nowIso
      });

    if (insertEventError) {
      return res.status(500).json({
        success: false,
        message: "Error inserting tracking event",
        details: insertEventError.message
      });
    }

    // Update Funnel Stats
    let funnelUpdateObj = {
      last_event_at: nowIso,
      last_event_name: event_name || "unknown_event",
      status: "active",
      updated_at: nowIso
    };

    if (page_url) {
      funnelUpdateObj.last_page_url = page_url;
      funnelUpdateObj.last_domain = domain;
    }
    
    // Auto-capture quiz_url on first page_view if missing
    if (event_name === 'page_view' && existingFunnel && !existingFunnel.quiz_url && page_url) {
        funnelUpdateObj.quiz_url = page_url;
    }

    await supabase
      .from("funnels")
      .update(funnelUpdateObj)
      .eq("funnel_id", funnel_id);

    // Upsert Lead if necessary
    const shouldCreateLead = ['lead_created', 'form_submit', 'quiz_completed'].includes(event_name);
    
    if (shouldCreateLead) {
      await supabase
        .from('leads')
        .upsert({
          funnel_id,
          lead_id: lead_id || `lead_${Date.now()}`,
          name: name || null,
          email: email || null,
          phone: phone || null,
          status: event_name === 'quiz_completed' ? 'Completo' : 'Novo',
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
          fbclid: fbclid || null,
          gclid: gclid || null,
          page_url: page_url || null,
          updated_at: nowIso
        }, {
          onConflict: 'lead_id'
        });
    }

    return res.status(200).json({
      success: true,
      message: "Evento recebido com sucesso"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message
    });
  }
};
