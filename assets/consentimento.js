/*
 * Aviso de cookies + Meta Pixel.
 *
 * O pixel só carrega DEPOIS que o visitante aceita: cookie de marketing
 * precisa de consentimento pela LGPD, e a política de privacidade promete
 * isso (seção 10). Quem recusa navega igual, sem pixel nenhum. A escolha fica
 * guardada neste navegador e pode ser trocada pelo link "Cookies" do rodapé.
 *
 * Eventos enviados (nenhum dado pessoal vai junto):
 * - PageView em toda página;
 * - Contact ao clicar em qualquer link de WhatsApp;
 * - Lead quando o formulário de credores é enviado (chamado em credores.html).
 *
 * O pixel é do portfólio "RGT Capital" no Meta Business, não da agência: o
 * público que ele junta é ativo da empresa.
 */
(function () {
  var PIXEL_ID = '1845368026616559'; // conjunto de dados "Site RGT Capital" no portfólio RGT Capital
  var CHAVE = 'rgt.cookies'; // 'aceito' | 'recusado'

  function lerEscolha() {
    try {
      return localStorage.getItem(CHAVE);
    } catch (e) {
      return null; // navegador sem storage: pergunta de novo a cada visita
    }
  }

  function gravarEscolha(valor) {
    try {
      localStorage.setItem(CHAVE, valor);
    } catch (e) {
      /* sem storage: a escolha vale só nesta página */
    }
  }

  var pixelLigado = false;
  function ligarPixel() {
    if (pixelLigado || !PIXEL_ID) return;
    pixelLigado = true;
    /* Snippet oficial da Meta (fbevents.js). */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  /* Usado pelas páginas: só envia se o visitante aceitou. */
  window.rgtRastrear = function (evento) {
    if (pixelLigado && window.fbq) window.fbq('track', evento);
  };

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (link) window.rgtRastrear('Contact');
  });

  var aviso = null;
  function fecharAviso() {
    if (aviso) {
      aviso.remove();
      aviso = null;
    }
  }

  function abrirAviso() {
    if (aviso || !PIXEL_ID) return;
    aviso = document.createElement('div');
    aviso.className = 'cookie-aviso';
    aviso.setAttribute('role', 'dialog');
    aviso.setAttribute('aria-label', 'Aviso de cookies');
    aviso.innerHTML =
      '<p>Usamos cookies para medir a visita ao site e mostrar anúncios da RGT Capital nas redes da Meta. ' +
      'Você escolhe. <a href="politica-privacidade.html#cookies">Saiba mais</a></p>' +
      '<div class="cookie-aviso-botoes">' +
      '<button type="button" class="cookie-recusar">Recusar</button>' +
      '<button type="button" class="cookie-aceitar">Aceitar</button>' +
      '</div>';
    aviso.querySelector('.cookie-aceitar').addEventListener('click', function () {
      gravarEscolha('aceito');
      fecharAviso();
      ligarPixel();
    });
    aviso.querySelector('.cookie-recusar').addEventListener('click', function () {
      gravarEscolha('recusado');
      fecharAviso();
      // Se já tinha aceitado antes nesta página, recarrega pra descarregar o pixel.
      if (pixelLigado) location.reload();
    });
    document.body.appendChild(aviso);
  }

  /* Link "Cookies" do rodapé reabre o aviso pra trocar a escolha. */
  window.rgtCookies = { abrir: abrirAviso };

  function iniciar() {
    var escolha = lerEscolha();
    if (escolha === 'aceito') ligarPixel();
    else if (escolha !== 'recusado') abrirAviso();

    var links = document.querySelectorAll('[data-cookies]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        abrirAviso();
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
