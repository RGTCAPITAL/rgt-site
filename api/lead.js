/**
 * POST /api/lead — ponte entre o formulário público e o CRM.
 *
 * Por que existe: o webhook da plataforma (`/api/leads/webhook` no rgt-app)
 * só abre com o header `x-rgt-secret`, e esse segredo não pode ficar no
 * JavaScript da página — tudo que vai pro navegador é público. Esta função
 * roda no servidor da Vercel, guarda o segredo e repassa a chamada.
 *
 * O que ela NÃO faz, de propósito: falar com o banco. A credencial do
 * Supabase não entra neste repositório, que hoje é público (RGT-50). Se o
 * segredo daqui vazar, o pior que alguém consegue é criar lead falso —
 * não ler dado de credor.
 *
 * Variáveis de ambiente (projeto rgt-site na Vercel):
 *   LEADS_WEBHOOK_SECRET  — o mesmo valor do rgt-app
 *   RGT_APP_URL           — opcional; default é a produção
 */

const APP_URL = process.env.RGT_APP_URL || 'https://rgt-app-ten.vercel.app';

/** Campos que o webhook aceita. Qualquer outra coisa é descartada aqui. */
const CAMPOS = ['nome', 'telefone', 'email', 'cpf_cnpj', 'numero_processo', 'mensagem'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const segredo = process.env.LEADS_WEBHOOK_SECRET;
  if (!segredo) {
    // Sem o segredo configurado na Vercel, o lead se perderia em silêncio.
    console.error('[api/lead] LEADS_WEBHOOK_SECRET ausente no ambiente');
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

  /**
   * Armadilha pra robô: um campo escondido no formulário, que pessoa nenhuma
   * preenche porque não aparece na tela. Preenchido = é bot.
   *
   * Devolve 200, não 400. Robô que recebe erro tenta de novo com outro
   * formato; robô que recebe sucesso vai embora achando que funcionou.
   */
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  if (!body.nome || String(body.nome).trim().length < 2) {
    return res.status(400).json({ error: 'nome_obrigatorio' });
  }

  const payload = {};
  for (const campo of CAMPOS) {
    if (body[campo] !== undefined && body[campo] !== null) {
      payload[campo] = String(body[campo]).slice(0, 2000);
    }
  }

  try {
    const r = await fetch(`${APP_URL}/api/leads/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-rgt-secret': segredo },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      // O corpo do webhook pode trazer detalhe de validação; serve pro log,
      // não pro credor, que não tem o que fazer com "validation_failed".
      const detalhe = await r.text().catch(() => '');
      console.error('[api/lead] webhook respondeu', r.status, detalhe.slice(0, 300));
      return res.status(502).json({ error: 'webhook_failed' });
    }

    const dados = await r.json().catch(() => ({}));
    return res.status(201).json({ ok: true, id: dados.id ?? null });
  } catch (erro) {
    console.error('[api/lead] falha ao chamar o webhook:', erro);
    return res.status(502).json({ error: 'webhook_unreachable' });
  }
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
