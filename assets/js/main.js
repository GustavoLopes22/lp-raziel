/* ==========================================================
   CONFIGURAÇÃO — edite só este bloco
   ========================================================== */
const CONFIG = {
  // Número com DDI + DDD, só dígitos. Ex.: 5551999999999
  whatsapp: '55XXXXXXXXXXX',

  // Mensagem padrão + variações por posição do botão (ajuda a saber de onde veio o lead)
  waMsg: 'Olá, Raziel! Vim pelo site e quero me inscrever no Seminário Avaliar para Prescrever. Pode me passar as informações da próxima turma?',
  waMsgPorOrigem: {
    aula: 'Olá, Raziel! Assisti à aula gratuita e quero saber mais sobre o Seminário Avaliar para Prescrever.',
    'flutuante': 'Olá, Raziel! Tenho uma dúvida sobre o Seminário Avaliar para Prescrever.'
  },

  // Depoimentos reais de alunos. Lista vazia = seção oculta.
  // foto é opcional (ex.: 'assets/img/depo-joao.webp'); sem foto, mostra as iniciais.
  depoimentos: [
    // { nome: 'Nome Sobrenome', cargo: 'Personal trainer · Porto Alegre', texto: 'Depoimento...', foto: '' },
  ],

  // Redes: deixe '' para esconder o ícone
  social: {
    instagram: 'https://www.instagram.com/prof_razielsouza/',
    youtube:   '',
    tiktok:    '',
    facebook:  '',
    linkedin:  ''
  }
};

/* ========================================================== */
(() => {
  const waLink = (origem) => {
    const msg = CONFIG.waMsgPorOrigem[origem] || CONFIG.waMsg;
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  // Links do WhatsApp + evento de conversão (GA4/GTM via dataLayer, Meta Pixel se existir)
  document.querySelectorAll('[data-wa]').forEach((el) => {
    const origem = el.dataset.wa;
    el.href = waLink(origem);
    el.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'whatsapp_click', cta_origem: origem });
      if (typeof window.fbq === 'function') window.fbq('track', 'Contact', { origem });
    });
  });

  // Redes sociais
  document.querySelectorAll('[data-social]').forEach((el) => {
    const rede = el.dataset.social;
    if (rede === 'whatsapp') return;
    const url = CONFIG.social[rede];
    if (url) el.href = url; else el.remove();
  });

  // Depoimentos
  const depos = CONFIG.depoimentos.filter((d) => d && d.texto && d.nome);
  if (depos.length) {
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const iniciais = (n) => n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('testiGrid').innerHTML = depos.map((d) => `
      <figure class="testi__card">
        <blockquote>“${esc(d.texto)}”</blockquote>
        <figcaption>
          ${d.foto ? `<img src="${esc(d.foto)}" alt="" width="48" height="48" loading="lazy">` : `<span class="testi__av">${esc(iniciais(d.nome))}</span>`}
          <span><strong>${esc(d.nome)}</strong>${d.cargo ? `<small>${esc(d.cargo)}</small>` : ''}</span>
        </figcaption>
      </figure>`).join('');
    document.getElementById('depoimentos').hidden = false;
  }

  // YouTube leve: só carrega o iframe no clique
  document.querySelectorAll('[data-yt]').forEach((box) => {
    box.querySelector('.yt__btn').addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${box.dataset.yt}?autoplay=1&rel=0`;
      f.title = 'Aula gratuita — Avaliar para Prescrever';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(f);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'video_play', video: box.dataset.yt });
    }, { once: true });
  });

  // Topbar sólida ao rolar + barra mobile após o hero
  const topbar = document.getElementById('topbar');
  const waBar = document.getElementById('waBar');
  const hero = document.querySelector('.hero');
  const waFloat = document.querySelector('.wa-float');
  const timeline = document.getElementById('timeline');
  const etapas = [...timeline.querySelectorAll('.tl')];
  const etapaAtual = document.getElementById('journeyNow');

  // Linha da timeline preenche conforme a rolagem; etapas acendem ao passar do meio da tela
  const atualizaTimeline = () => {
    const meio = window.innerHeight * 0.55;
    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (meio - r.top - 28) / (r.height - 56)));
    timeline.style.setProperty('--p', p.toFixed(3));
    let ativas = 0;
    etapas.forEach((el) => {
      const on = el.getBoundingClientRect().top < meio;
      el.classList.toggle('is-active', on);
      if (on) ativas++;
    });
    etapas.forEach((el, i) => el.classList.toggle('is-current', i === ativas - 1));
    etapaAtual.textContent = String(Math.max(1, ativas)).padStart(2, '0');
  };

  // Botões flutuantes somem no CTA final e no rodapé
  const fimVisivel = new Set();
  const onScroll = () => {
    const y = window.scrollY;
    topbar.classList.toggle('is-solid', y > 20);
    waBar.classList.toggle('is-on', y > hero.offsetHeight * 0.6 && !fimVisivel.size);
    waFloat.classList.toggle('is-off', fimVisivel.size > 0);
    atualizaTimeline();
  };
  const fimIO = new IntersectionObserver((ents) => {
    ents.forEach((e) => (e.isIntersecting ? fimVisivel.add(e.target) : fimVisivel.delete(e.target)));
    onScroll();
  });
  document.querySelectorAll('.final, .footer').forEach((el) => fimIO.observe(el));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Tooltip do botão flutuante após 8s
  setTimeout(() => {
    waFloat.classList.add('show-tip');
    setTimeout(() => waFloat.classList.remove('show-tip'), 5000);
  }, 8000);

  // Animação de entrada
  // [seletor, animação, atraso fixo opcional]; sem atraso fixo, irmãos entram em cascata
  const animacoes = [
    ['.hero__copy > *', 'rUp'],
    ['.hero__shape', 'rRise', 0.15],
    ['.hero__media img', 'rUp', 0.3],
    ['.hero__badge', 'rPop', 0.8],
    ['.kicker, .section__lead, .journey__lead, .journey__count, .pain__punch', 'rUp'],
    ['.h2, .journey__title', 'rBlur'],
    ['.pain__card, .diff:not(.diff--live), .testi__card, details, .free__steps li, .creds li', 'rUp'],
    ['.free__lead, .free__copy > .btn, .about__role, .cref, .about__grid blockquote, .link-ig, .price__lead', 'rUp'],
    ['.tl__n, .about__chip', 'rPop'],
    ['.tl__card, .free__media, .final__ticket', 'rRight'],
    ['.diff--live, .about__media, .price__list li', 'rLeft'],
    ['.price__card, .final__card', 'rScale'],
    ['.final__copy > *', 'rUp'],
    ['.footer__in > *', 'rFade'],
  ];
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  animacoes.forEach(([sel, anim, atraso]) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.classList.add('reveal');
      el.style.setProperty('--anim', anim);
      if (atraso != null) el.style.setProperty('--d', `${atraso}s`);
    });
  });
  const reveals = [...document.querySelectorAll('.reveal')];
  reveals.forEach((el) => {
    if (!el.style.getPropertyValue('--d')) {
      const irmaos = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.setProperty('--d', `${Math.min(irmaos.indexOf(el), 6) * 0.09}s`);
    }
  });

  // Loading: some após o carregamento (mínimo de 0,9s na tela, máximo de 4s) e libera as animações de entrada
  const loader = document.getElementById('loader');
  const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let liberado = false;
  const libera = () => {
    if (liberado) return;
    liberado = true;
    document.documentElement.classList.remove('is-loading');
    if (semMovimento) { loader.remove(); reveals.forEach((el) => io.observe(el)); return; }
    loader.classList.add('is-leaving');
    loader.addEventListener('animationend', (e) => { if (e.animationName === 'loaderOut') loader.remove(); });
    setTimeout(() => reveals.forEach((el) => io.observe(el)), 550);
  };
  const aposCarregar = () => setTimeout(libera, Math.max(0, 900 - performance.now()));
  if (document.readyState === 'complete') aposCarregar();
  else window.addEventListener('load', aposCarregar, { once: true });
  setTimeout(libera, 4000);

  document.getElementById('ano').textContent = new Date().getFullYear();
})();
