export type GuideScreenshot = { src: string; alt: string; sourceUrl: string; sourceLabel: string }
export type GuideStep = { title: string; text: string; screenshot?: GuideScreenshot }
export type PlatformGuide = {
  id: string
  name: string
  description: string
  badge: string
  iconPath?: string
  tint: string
  officialUrl: string
  sourceUrl: string
  sourceLabel: string
  referralEnv?: string
  recommended?: boolean
  warning?: string
  steps: GuideStep[]
}
export type PlatformGroup = { label: string; guides: PlatformGuide[] }
export type JourneyPlatformGuides = { title: string; subtitle: string; groups: PlatformGroup[] }

const referrals: Record<string, string | undefined> = {
  VITE_REFERRAL_AXIOM_URL: import.meta.env.VITE_REFERRAL_AXIOM_URL,
  VITE_REFERRAL_GMGN_URL: import.meta.env.VITE_REFERRAL_GMGN_URL,
  VITE_REFERRAL_FOMO_URL: import.meta.env.VITE_REFERRAL_FOMO_URL,
  VITE_REFERRAL_PHOTON_URL: import.meta.env.VITE_REFERRAL_PHOTON_URL,
  VITE_REFERRAL_TROJAN_URL: import.meta.env.VITE_REFERRAL_TROJAN_URL,
  VITE_REFERRAL_BINANCE_URL: import.meta.env.VITE_REFERRAL_BINANCE_URL,
  VITE_REFERRAL_BYBIT_URL: import.meta.env.VITE_REFERRAL_BYBIT_URL,
  VITE_REFERRAL_OKX_URL: import.meta.env.VITE_REFERRAL_OKX_URL,
  VITE_REFERRAL_BITGET_URL: import.meta.env.VITE_REFERRAL_BITGET_URL,
  VITE_REFERRAL_MEXC_URL: import.meta.env.VITE_REFERRAL_MEXC_URL,
  VITE_REFERRAL_HYPERLIQUID_URL: import.meta.env.VITE_REFERRAL_HYPERLIQUID_URL,
}

export function platformUrl(guide: PlatformGuide) {
  const referral = guide.referralEnv ? referrals[guide.referralEnv]?.trim() : undefined
  if (referral) {
    try { if (new URL(referral).protocol === 'https:') return { url: referral, referral: true } } catch { /* invalid env falls back to official site */ }
  }
  return { url: guide.officialUrl, referral: false }
}

export const platformGuidesByJourney: Record<string, JourneyPlatformGuides> = {
  memecoins: {
    title: 'Plataformas para estudar e operar',
    subtitle: 'Compare ferramentas, confira o endereço oficial e pratique com limites definidos.',
    groups: [
      { label: 'Terminais de trade', guides: [
        { id: 'axiom', name: 'Axiom', description: 'Terminal de Solana com descoberta de tokens e ordens rápidas.', badge: 'Descoberta', iconPath: '/platform-icons/axiom.ico', tint: '#a78bfa', officialUrl: 'https://axiom.trade', sourceUrl: 'https://docs.axiom.trade/axiom/finding-tokens/pulse', sourceLabel: 'Documentação Axiom', referralEnv: 'VITE_REFERRAL_AXIOM_URL', recommended: true, steps: [
          { title: 'Confirme o endereço', text: 'Digite axiom.trade no navegador e salve nos favoritos. Evite anúncios e links de grupos.' },
          { title: 'Prepare uma banca de risco', text: 'Crie ou conecte carteira de execução separada da custódia principal. Deposite somente valor que aceita perder.' },
          { title: 'Explore o Pulse', text: 'Filtre tokens por idade, liquidez e atividade. Use a lista para investigar contratos e holders, não como sinal de compra.' },
          { title: 'Configure custos e proteção', text: 'Confira slippage, taxa de prioridade e proteção MEV antes de enviar qualquer ordem.' },
          { title: 'Defina entrada e saída', text: 'Registre tese, tamanho, invalidação e saídas parciais antes de operar. Retire saldo não usado para carteira própria.' },
        ] },
        { id: 'gmgn', name: 'GMGN', description: 'Análise on-chain, carteiras monitoradas e execução.', badge: 'Análise + cópia', tint: '#7cc7ad', officialUrl: 'https://gmgn.ai', sourceUrl: 'https://docs.gmgn.ai/index/gmgn-meme-trading-guide', sourceLabel: 'Tutorial GMGN', referralEnv: 'VITE_REFERRAL_GMGN_URL', steps: [
          { title: 'Acesse o site oficial', text: 'Abra gmgn.ai diretamente. Se usar bot, obtenha o endereço somente pelo site oficial.' },
          { title: 'Separe carteira e saldo', text: 'Conecte carteira dedicada. Se optar por bot custodial, entenda quem controla as chaves e mantenha saldo mínimo.' },
          { title: 'Confira o token', text: 'Cole endereço do contrato e analise permissões, liquidez e concentração. Confirme sinais em outra fonte.' },
          { title: 'Avalie carteiras monitoradas', text: 'Olhe histórico, tamanho das posições e perdas; taxa de acerto isolada engana.' },
          { title: 'Execute com limites', text: 'Defina valor máximo e saída antes de copiar ou negociar. Exporte histórico para seu diário.' },
        ] },
        { id: 'fomo', name: 'FOMO', description: 'App móvel para acompanhar e executar operações.', badge: 'Mobile', iconPath: '/platform-icons/fomo.ico', tint: '#efad78', officialUrl: 'https://fomo.family', sourceUrl: 'https://fomo.family', sourceLabel: 'Site FOMO', referralEnv: 'VITE_REFERRAL_FOMO_URL', steps: [
          { title: 'Encontre o app pelo site', text: 'Abra loja oficial a partir de fomo.family e confira desenvolvedor. Não instale APK recebido por mensagem.' },
          { title: 'Proteja a carteira', text: 'Anote recuperação offline, ative bloqueio do aparelho e deposite pouco SOL para testar.' },
          { title: 'Investigue fora do app', text: 'Confira contrato, liquidez e holders em ferramenta independente antes de executar.' },
          { title: 'Confira custo total', text: 'Revise taxa exibida, slippage e prioridade antes de confirmar. Registre saída parcial e retire saldo não usado.' },
        ] },
        { id: 'photon', name: 'Photon', description: 'Terminal web com descoberta e ordens rápidas.', badge: 'Terminal web', tint: '#aeb8ff', officialUrl: 'https://photon-sol.tinyastro.io', sourceUrl: 'https://photon-sol.tinyastro.io', sourceLabel: 'Site Photon', referralEnv: 'VITE_REFERRAL_PHOTON_URL', steps: [
          { title: 'Salve o domínio correto', text: 'Confira photon-sol.tinyastro.io antes de conectar carteira; nomes parecidos são risco de phishing.' },
          { title: 'Separe capital de operação', text: 'Use carteira dedicada e confirme depósito pequeno antes de transferir outro valor.' },
          { title: 'Filtre no Memescope', text: 'Use feed para encontrar candidatos e investigue cada contrato antes da compra.' },
          { title: 'Configure e revise ordens', text: 'Ajuste slippage e custos de rede, defina tamanho e saída; retire lucros para custódia própria.' },
        ] },
        { id: 'trojan', name: 'Trojan', description: 'Terminal on-chain e bot de Telegram para Solana.', badge: 'Terminal + bot', tint: '#e1b878', officialUrl: 'https://trojan.com', sourceUrl: 'https://trojan.com', sourceLabel: 'Site Trojan', referralEnv: 'VITE_REFERRAL_TROJAN_URL', warning: 'Confira modelo de custódia e permissões do produto escolhido; bots e links falsos ampliam risco.', steps: [
          { title: 'Abra produto pelo site', text: 'Digite trojan.com. Se preferir bot, abra o link do Telegram publicado ali; a busca do Telegram pode mostrar clones.' },
          { title: 'Entenda a carteira', text: 'Confira como funciona controle das chaves no terminal ou bot escolhido. Guarde recuperação offline e mantenha saldo de execução pequeno.' },
          { title: 'Configure ordens', text: 'Defina tamanho, slippage e regras de saída antes de enviar endereço de contrato.' },
          { title: 'Revise cada confirmação', text: 'Confira token, liquidez, preço e custo. Faça vendas parciais e saques frequentes.' },
        ] },
      ] },
      { label: 'Wallets para trade', guides: [
        { id: 'phantom', name: 'Phantom', description: 'Carteira Solana com conexões a apps.', badge: 'Solana', iconPath: '/wallet-icons/phantom-brand.png', tint: '#aa91fa', officialUrl: 'https://phantom.com/download', sourceUrl: 'https://help.phantom.com/hc/en-us/articles/29995498642195-Connect-Phantom-to-apps', sourceLabel: 'Ajuda Phantom', recommended: true, steps: [
          { title: 'Instale pela fonte oficial', text: 'Use phantom.com/download e confira a extensão ou app publicado.' },
          { title: 'Proteja recuperação', text: 'Guarde a frase offline. Nunca a digite em site; conexão legítima abre confirmação na carteira.' },
          { title: 'Conecte com critério', text: 'Confira URL e pedido de assinatura; use carteira de trade separada de saldo principal.' },
          { title: 'Revise conexões', text: 'Desconecte apps sem uso e confira aprovações periodicamente.' },
        ] },
        { id: 'solflare', name: 'Solflare', description: 'Carteira Solana com suporte a hardware wallet.', badge: 'Hardware wallet', iconPath: '/platform-icons/solflare.ico', tint: '#eac783', officialUrl: 'https://solflare.com', sourceUrl: 'https://solflare.com', sourceLabel: 'Site Solflare', steps: [
          { title: 'Instale pelo site', text: 'Abra solflare.com e escolha extensão ou app oficial.' },
          { title: 'Guarde recuperação offline', text: 'Crie carteira dedicada. Não compartilhe frase ou chave privada.' },
          { title: 'Separe cofre e execução', text: 'Se usar Ledger, mantenha custódia de longo prazo separada da carteira conectada aos terminais.' },
          { title: 'Confira assinaturas', text: 'Revise endereço do app e transação exibida antes de aprovar.' },
        ] },
        { id: 'backpack', name: 'Backpack', description: 'Carteira e acesso a serviços do ecossistema Solana.', badge: 'Ecossistema', iconPath: '/platform-icons/backpack.ico', tint: '#e48d88', officialUrl: 'https://backpack.app', sourceUrl: 'https://backpack.app', sourceLabel: 'Site Backpack', steps: [
          { title: 'Instale da fonte oficial', text: 'Use backpack.app para abrir lojas ou extensão; confira o domínio.' },
          { title: 'Crie carteira', text: 'Proteja recuperação offline e ative bloqueio local.' },
          { title: 'Diferencie saldos', text: 'Saldo da carteira e saldo de exchange têm custódia e riscos diferentes.' },
          { title: 'Conecte somente o necessário', text: 'Use carteira dedicada em terminais; revise solicitações e retire saldo de execução.' },
        ] },
        { id: 'rabby', name: 'Rabby', description: 'Carteira EVM com prévia de transações.', badge: 'EVM', iconPath: '/platform-icons/rabby.png', tint: '#8caeff', officialUrl: 'https://rabby.io', sourceUrl: 'https://rabby.io', sourceLabel: 'Site Rabby', steps: [
          { title: 'Instale pelo site', text: 'Abra rabby.io e escolha extensão ou app oficial.' },
          { title: 'Separe carteira EVM', text: 'Use carteira própria para tokens de Base, BSC ou Ethereum; mantenha recuperação offline.' },
          { title: 'Leia a simulação', text: 'Confira o que sai da carteira, permissões pedidas e endereço do contrato antes de assinar.' },
          { title: 'Revogue permissões antigas', text: 'Revise aprovações e desconecte sites que não usa mais.' },
        ] },
      ] },
    ],
  },
  futuros: {
    title: 'Plataformas de futuros',
    subtitle: 'Conheça fluxos de operação. Use conta demo quando disponível; confira região, custos e riscos antes de depositar.',
    groups: [{ label: 'Corretoras e plataformas de futuros', guides: [
      { id: 'binance-futures', name: 'Binance Futures', description: 'Mercados de futuros com livro de ordens e margem.', badge: 'Liquidez', iconPath: '/exchange-icons/binance.png', tint: '#f0bd4d', officialUrl: 'https://www.binance.com/en/futures/home', sourceUrl: 'https://www.binance.com/en/support/faq/futures-trading', sourceLabel: 'Ajuda Binance', referralEnv: 'VITE_REFERRAL_BINANCE_URL', recommended: true, steps: [
        { title: 'Habilite futuros', text: 'Entre na conta oficial, conclua verificação exigida e ative 2FA. Leia avaliação de risco antes de habilitar derivativos.' },
        { title: 'Separe margem', text: 'Transfira valor pequeno da carteira spot para a carteira de futuros.' },
        { title: 'Configure posição', text: 'Confira par, modo de margem, alavancagem e tamanho antes de enviar ordem.' },
        { title: 'Defina proteção', text: 'Anexe stop e alvo, confirme se ordens de saída reduzem posição e monitore preço de liquidação.' },
        { title: 'Encerre e reconcilie', text: 'Feche pelo plano, confira custos e funding e transfira saldo não usado de volta.' },
      ] },
      { id: 'bybit', name: 'Bybit', description: 'Interface de perpétuos com ordens e ferramentas de risco.', badge: 'Interface', iconPath: '/platform-icons/bybit.ico', tint: '#e6b36b', officialUrl: 'https://www.bybit.com', sourceUrl: 'https://www.bybit.com/en/help-center', sourceLabel: 'Ajuda Bybit', referralEnv: 'VITE_REFERRAL_BYBIT_URL', steps: [
        { title: 'Proteja e verifique conta', text: 'Abra domínio oficial, conclua requisitos da sua região e ative 2FA.' },
        { title: 'Deposite com limite', text: 'Transfira somente margem planejada para conta de negociação.' },
        { title: 'Escolha contrato', text: 'Confira par, margem isolada ou cruzada, alavancagem e funding.' },
        { title: 'Envie entrada com TP/SL', text: 'Calcule tamanho pelo risco; configure stop e alvo antes de confirmar.' },
        { title: 'Acompanhe e retire', text: 'Monitore liquidação e custos; ative lista de endereços permitidos para saques.' },
      ] },
      { id: 'okx-futures', name: 'OKX Futures', description: 'Futuros com modo demo para praticar sem dinheiro.', badge: 'Modo demo', iconPath: '/exchange-icons/okx.png', tint: '#d6d9e0', officialUrl: 'https://www.okx.com', sourceUrl: 'https://www.okx.com/help', sourceLabel: 'Ajuda OKX', referralEnv: 'VITE_REFERRAL_OKX_URL', steps: [
        { title: 'Comece no demo', text: 'Abra modo de simulação na conta oficial e repita exercícios da jornada sem capital real.' },
        { title: 'Habilite segurança', text: 'Conclua verificação exigida e ative 2FA antes de usar conta real.' },
        { title: 'Configure risco', text: 'Confira contrato, margem, alavancagem, tamanho e funding.' },
        { title: 'Envie ordem completa', text: 'Use stop e alvo na entrada; revise se encerram posição em vez de abrir outra.' },
        { title: 'Revise resultado', text: 'Compare execução com plano e mantenha histórico de custos e operações.' },
      ] },
      { id: 'bitget', name: 'Bitget', description: 'Futuros e recurso de cópia de operações.', badge: 'Copy trading', iconPath: '/platform-icons/bitget.ico', tint: '#8cdbc7', officialUrl: 'https://www.bitget.com', sourceUrl: 'https://www.bitget.com/support', sourceLabel: 'Ajuda Bitget', referralEnv: 'VITE_REFERRAL_BITGET_URL', warning: 'Copiar outra pessoa não transfere responsabilidade pelas perdas.', steps: [
        { title: 'Proteja conta', text: 'Use site oficial, cumpra requisitos da conta e ative 2FA.' },
        { title: 'Defina capital e risco', text: 'Separe margem pequena e limite de perda antes de negociar ou copiar.' },
        { title: 'Avalie histórico de cópia', text: 'Observe drawdown, período e tamanho das posições; retorno passado não garante resultado.' },
        { title: 'Configure proteção', text: 'Defina limite por trader, stop de cópia e revise posições abertas.' },
      ] },
      { id: 'hyperliquid', name: 'Hyperliquid', description: 'Perpétuos on-chain conectados à sua carteira.', badge: 'On-chain', iconPath: '/platform-icons/hyperliquid.png', tint: '#9ce5ca', officialUrl: 'https://app.hyperliquid.xyz', sourceUrl: 'https://hyperliquid.gitbook.io/hyperliquid-docs', sourceLabel: 'Documentação Hyperliquid', referralEnv: 'VITE_REFERRAL_HYPERLIQUID_URL', warning: 'Confira disponibilidade regional, rede de depósito e assinaturas. Auto-custódia exige cuidado adicional.', steps: [
        { title: 'Prepare carteira dedicada', text: 'Crie wallet EVM separada; guarde recuperação offline.' },
        { title: 'Abra o app oficial', text: 'Digite app.hyperliquid.xyz e confira restrições para sua região antes de conectar.' },
        { title: 'Teste depósito', text: 'Verifique rede e ativo aceitos na interface atual; envie valor pequeno primeiro.' },
        { title: 'Leia permissões e posição', text: 'Revise cada assinatura, margem, alavancagem, tamanho e funding.' },
        { title: 'Feche e saque', text: 'Confirme destino e rede no saque. Guarde histórico para conciliar custos.' },
      ] },
      { id: 'mexc', name: 'MEXC', description: 'Catálogo amplo de contratos de altcoins.', badge: 'Altcoins', tint: '#90b4f4', officialUrl: 'https://www.mexc.com', sourceUrl: 'https://www.mexc.com/support', sourceLabel: 'Ajuda MEXC', referralEnv: 'VITE_REFERRAL_MEXC_URL', warning: 'Contratos pouco líquidos podem gerar slippage e liquidação rápida.', steps: [
        { title: 'Proteja conta', text: 'Use site oficial, verifique requisitos locais e ative 2FA.' },
        { title: 'Confira profundidade', text: 'Antes de escolher altcoin, observe livro de ordens e spread do contrato.' },
        { title: 'Reduza tamanho', text: 'Use margem isolada e risco menor quando a liquidez for baixa.' },
        { title: 'Envie proteção', text: 'Configure stop e alvo junto à entrada. Revise taxa, funding e preço de liquidação.' },
        { title: 'Retire saldo parado', text: 'Registre execução e custos; mova margem não usada para fora da conta de futuros.' },
      ] },
    ] }],
  },
}
