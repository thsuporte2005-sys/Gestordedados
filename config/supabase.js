// Configuração do Supabase
// Substitua pelas suas chaves do Supabase
const SUPABASE_URL = localStorage.getItem('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = localStorage.getItem('SUPABASE_ANON_KEY') || '';

let supabase = null;

if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client Iniciado");
    } catch (e) {
        console.error("Erro ao iniciar Supabase:", e);
    }
} else {
    console.warn("Supabase não configurado. Por favor, adicione as chaves no código ou nas configurações.");
}

window.supabaseClient = supabase;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
