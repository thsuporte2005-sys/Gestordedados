// vercel-fix.js
// Correção rápida: força a aba Integrar HTML a usar o domínio atual da Vercel.
(function () {
  function currentBaseUrl() {
    return window.location.origin;
  }

  function replaceNetlifyReferences() {
    var root = document.getElementById('app-content');
    if (!root) return;
    root.innerHTML = root.innerHTML.split('https://gestordedados.netlify.app').join(currentBaseUrl());
  }

  function getKeys() {
    var funnel = localStorage.getItem('integrate_funnel_id');
    var key = localStorage.getItem('integrate_public_key');
    if (!funnel) {
      funnel = 'quiz_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('integrate_funnel_id', funnel);
    }
    if (!key) {
      key = 'pk_live_' + Math.random().toString(36).slice(2, 16);
      localStorage.setItem('integrate_public_key', key);
    }
    return { funnel: funnel, key: key };
  }

  window.copyInstallCode = async function () {
    var k = getKeys();
    var base = currentBaseUrl();
    var code = '<scr' + 'ipt\n' +
      '  async\n' +
      '  src="' + base + '/pixel.js"\n' +
      '  data-funnel-id="' + k.funnel + '"\n' +
      '  data-public-key="' + k.key + '"\n' +
      '  data-endpoint="' + base + '/api/track">\n' +
      '</scr' + 'ipt>';

    await navigator.clipboard.writeText(code);
    var box = document.getElementById('integration-feedback-container');
    if (box) box.innerHTML = '<div class="mt-3 p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm font-medium">Código da Vercel copiado.</div>';
  };

  window.generateNewIntegration = function () {
    localStorage.setItem('integrate_funnel_id', 'quiz_' + Math.random().toString(36).slice(2, 10));
    localStorage.setItem('integrate_public_key', 'pk_live_' + Math.random().toString(36).slice(2, 16));
    if (typeof window.renderIntegrate === 'function') window.renderIntegrate();
    setTimeout(replaceNetlifyReferences, 100);
  };

  window.testIntegration = async function () {
    var k = getKeys();
    try {
      var response = await fetch(currentBaseUrl() + '/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnel_id: k.funnel,
          public_key: k.key,
          lead_id: 'test_lead_' + Date.now(),
          event_name: 'integration_test',
          event_value: 'Teste manual feito pelo dashboard Vercel',
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          browser_language: navigator.language,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          created_at: new Date().toISOString()
        })
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok || data.success === false) throw new Error(data.details || data.message || 'HTTP ' + response.status);
      var box = document.getElementById('integration-feedback-container');
      if (box) box.innerHTML = '<div class="mt-3 p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm font-medium">Integração funcionando corretamente.</div>';
    } catch (error) {
      var boxError = document.getElementById('integration-feedback-container');
      if (boxError) boxError.innerHTML = '<div class="mt-3 p-3 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm font-medium">Erro: ' + error.message + '</div>';
      console.error(error);
    }
  };

  var originalRenderIntegrate = window.renderIntegrate;
  if (typeof originalRenderIntegrate === 'function') {
    window.renderIntegrate = async function () {
      await originalRenderIntegrate.apply(this, arguments);
      replaceNetlifyReferences();
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(replaceNetlifyReferences, 300);
  });
})();