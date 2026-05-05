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
      device_type
    } = payload;

    if (!funnel_id || !public_key) {
      return res.status(400).json({
        success: false,
        message: "Missing funnel_id or public_key"
      });
    }

    const { data: existingFunnel, error: funnelError } = await supabase
      .from("funnels")
      .select("funnel_id, public_key")
      .eq("funnel_id", funnel_id)
      .maybeSingle();

    if (funnelError) {
      return res.status(500).json({
        success: false,
        message: "Error checking funnel",
        details: funnelError.message
      });
    }

    if (!existingFunnel) {
      const { error: createFunnelError } = await supabase
        .from("funnels")
        .insert({
          funnel_id,
          public_key,
          name: funnel_id,
          status: "active",
          last_event_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
        created_at: new Date().toISOString()
      });

    if (insertEventError) {
      return res.status(500).json({
        success: false,
        message: "Error inserting tracking event",
        details: insertEventError.message
      });
    }

    await supabase
      .from("funnels")
      .update({
        last_event_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("funnel_id", funnel_id);

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
