// Service worker legado desativado por segurança operacional.
// A versão anterior tinha escopo raiz e podia interceptar também o app da Direção.
const CACHE='majestic-atendimento-v1';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    try{await caches.delete(CACHE)}catch{}
    try{await self.registration.unregister()}catch{}
    try{
      const clientes=await self.clients.matchAll({type:'window',includeUncontrolled:true});
      clientes.forEach(cliente=>cliente.navigate(cliente.url).catch(()=>{}));
    }catch{}
  })());
});

// Não intercepta mais nenhuma requisição.
self.addEventListener('fetch',()=>{});
