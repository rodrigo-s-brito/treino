// Modelo do service worker. O build preenche a versão e a lista (ver vite.config.ts).
// O app pode abrir sem rede: rede primeiro para o HTML, cache para o resto.
// Nunca toca em `version.json` nem em outra origem (API do GitHub).
const VERSAO = "a508821b18a8617e";
const ARQUIVOS = ["assets/ExercisePicker-Di30MFOp.js","assets/ExerciseSheet-B_Yncje3.js","assets/GroupChips-Ctvu1TcQ.js","assets/Insights-Cf1t36Kf.js","assets/Match-D6M0BWQB.js","assets/WeightStepSheet-DsDRynCh.js","assets/academia-Bh_Pwegm.js","assets/academia-BwWFOnJB.js","assets/ajustes-Dx3gh4qT.js","assets/conectar-DUcxkG5N.js","assets/createLucideIcon-WH4axtdb.js","assets/errors-DdTeJpeR.js","assets/evolucao-0EvbFziM.js","assets/evolucao_.metas-DynZ8Tkv.js","assets/evolucao_.registrar-D5nu4PFg.js","assets/exercicio._id-BzTimOur.js","assets/exercicios-DNpYbJGY.js","assets/formato-hGxOt-ls.js","assets/historico-BHA_dcDy.js","assets/index-DOTpoQXv.js","assets/index-KGBiVInm.css","assets/insights-hcKLUJJX.js","assets/link-CIsVqviq.js","assets/manrope-latin-400-normal-8tf8FM3T.woff","assets/manrope-latin-400-normal-PaqtzbVb.woff2","assets/manrope-latin-500-normal-BYYD-dBL.woff2","assets/manrope-latin-500-normal-DMZssgOp.woff","assets/manrope-latin-600-normal-4f0koTD-.woff2","assets/manrope-latin-600-normal-BqgrALkZ.woff","assets/manrope-latin-700-normal-BZp_XxE4.woff2","assets/manrope-latin-700-normal-DGRFkw-m.woff","assets/manrope-latin-800-normal-BfWYOv1c.woff2","assets/manrope-latin-800-normal-uHUdIJgA.woff","assets/matchContext-QLJYCcL5.js","assets/react-dom-C6LYFlib.js","assets/rotina._id-D7fJTXo1.js","assets/route-DRF7JNEG.js","assets/sessao-BUr7e8Hh.js","assets/sora-latin-400-normal-CRt88UEn.woff2","assets/sora-latin-400-normal-OW7qkl5a.woff","assets/sora-latin-500-normal-01eiPEn0.woff2","assets/sora-latin-500-normal-w58xtEt9.woff","assets/sora-latin-600-normal-1_7fyUAY.woff","assets/sora-latin-600-normal-Cdg4DaK0.woff2","assets/sora-latin-700-normal-9waGdLWo.woff2","assets/sora-latin-700-normal-BKPfQAnC.woff","assets/sync-BLC7-8dC.js","assets/treinar-BaR01WcL.js","assets/treino._id-C-0DQQBg.js","assets/triangle-alert-C5q3p2nM.js","assets/useBackup-Cd5CByhf.js","assets/volume-btv3gxH7.js","favicon.ico","icon-192.png","icon-512.png","index.html","manifest.webmanifest"];

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
