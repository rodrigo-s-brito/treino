// Modelo do service worker. O build preenche a versão e a lista (ver vite.config.ts).
// O app pode abrir sem rede: rede primeiro para o HTML, cache para o resto.
// Nunca toca em `version.json` nem em outra origem (API do GitHub).
const VERSAO = "4ab21cc98f020294";
const ARQUIVOS = ["assets/ExercisePicker-CxWsogoZ.js","assets/ExerciseSheet-CyOX9vhj.js","assets/GroupChips-D_StSEzr.js","assets/Insights-BuJ8UUuK.js","assets/Match-C36JyiiJ.js","assets/WeightStepSheet-DLWjyyXf.js","assets/academia-CbkK_rQ5.js","assets/academia-Dx3xFU6a.js","assets/ajustes-DcSHw7LJ.js","assets/conectar-B1h8esnJ.js","assets/createLucideIcon-DZ-Qj3lx.js","assets/errors-DdTeJpeR.js","assets/evolucao-C2IL-6HZ.js","assets/evolucao_.metas-BNslgY9k.js","assets/evolucao_.registrar-C6XfvLlZ.js","assets/exercicio._id-_Vbl9Z3-.js","assets/exercicios-Di7ef-yQ.js","assets/formato-B-RKf_Kj.js","assets/historico-BjWF2fXO.js","assets/index-DoZF0iEw.css","assets/index-DsRvFVKp.js","assets/insights-Df8_mY8c.js","assets/link-ByMW0fLc.js","assets/manrope-latin-400-normal-8tf8FM3T.woff","assets/manrope-latin-400-normal-PaqtzbVb.woff2","assets/manrope-latin-500-normal-BYYD-dBL.woff2","assets/manrope-latin-500-normal-DMZssgOp.woff","assets/manrope-latin-600-normal-4f0koTD-.woff2","assets/manrope-latin-600-normal-BqgrALkZ.woff","assets/manrope-latin-700-normal-BZp_XxE4.woff2","assets/manrope-latin-700-normal-DGRFkw-m.woff","assets/manrope-latin-800-normal-BfWYOv1c.woff2","assets/manrope-latin-800-normal-uHUdIJgA.woff","assets/matchContext-DD_JRuzo.js","assets/react-dom-Dpzq_YFI.js","assets/rotina._id-BMm4rd8A.js","assets/route-BPoIVbzB.js","assets/sessao-D4g-qJ_s.js","assets/sora-latin-400-normal-CRt88UEn.woff2","assets/sora-latin-400-normal-OW7qkl5a.woff","assets/sora-latin-500-normal-01eiPEn0.woff2","assets/sora-latin-500-normal-w58xtEt9.woff","assets/sora-latin-600-normal-1_7fyUAY.woff","assets/sora-latin-600-normal-Cdg4DaK0.woff2","assets/sora-latin-700-normal-9waGdLWo.woff2","assets/sora-latin-700-normal-BKPfQAnC.woff","assets/sync-CmWvg5IB.js","assets/treinar-DU_Jqtjy.js","assets/treino._id-DpcF6Scx.js","assets/triangle-alert-DgmX_maq.js","assets/useBackup-BrKGjnVI.js","assets/volume-Bd22LKLE.js","favicon.ico","icon-192.png","icon-512.png","index.html","manifest.webmanifest"];

const PREFIXO = "ferro-";
const CACHE = PREFIXO + VERSAO;
const ESCOPO = new URL(self.registration.scope).pathname;
const PAGINA = ESCOPO + "index.html";
const GUARDADOS = new Set(ARQUIVOS.map((f) => ESCOPO + f));

/** sinal ruim na academia: não deixar a abertura presa esperando a rede */
const LIMITE_REDE_MS = 3000;

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      // "reload" fura o cache HTTP de 10 min do Pages, senão o index.html velho
      // entraria junto com os assets novos
      cache.addAll([...GUARDADOS].map((url) => new Request(url, { cache: "reload" }))),
    ),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        // só os nossos: todo github.io do usuário divide esta origem
        Promise.all(
          nomes.filter((n) => n.startsWith(PREFIXO) && n !== CACHE).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Sem `skipWaiting` automático: a versão nova espera, e uma aba aberta no meio
// do treino continua achando os arquivos dela. A faixa de atualização pede a troca.
self.addEventListener("message", (evento) => {
  if (evento.data === "ativar") self.skipWaiting();
});

async function abrirPagina(pedido) {
  const limite = new Promise((resolve) => setTimeout(() => resolve(null), LIMITE_REDE_MS));
  try {
    const resposta = await Promise.race([fetch(pedido), limite]);
    if (resposta) return resposta;
  } catch {
    // sem rede: cai no HTML guardado
  }
  const cache = await caches.open(CACHE);
  return (await cache.match(PAGINA)) ?? fetch(pedido);
}

async function lerGuardado(pedido, caminho) {
  const cache = await caches.open(CACHE);
  return (await cache.match(caminho)) ?? fetch(pedido);
}

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  if (pedido.mode === "navigate") {
    evento.respondWith(abrirPagina(pedido));
  } else if (GUARDADOS.has(url.pathname)) {
    evento.respondWith(lerGuardado(pedido, url.pathname));
  }
});
