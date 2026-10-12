export type PlatformGuideScreenshot = {
  src: string
  alt: string
  caption: string
  highlight: { left: number; top: number; size?: number }
}

export type PlatformGuideMedia = {
  logo: string
  cover: string
  screenshots: Array<PlatformGuideScreenshot | null | PlatformGuideScreenshot[]>
  missingSteps?: Record<number, string>
}

const shot = (name: string, caption: string, left: number, top: number, alt: string): PlatformGuideScreenshot => ({
  src: `/platform-tutorials/${name}.webp`, alt, caption, highlight: { left, top, size: name === 'hl-01-connect' ? 90 : 60 },
})

export const platformGuideMedia: Record<string, PlatformGuideMedia> = {
  'binance-futures': {
    logo: '/platform-logos/binance.png', cover: '/platform-covers/capa-binance.png', screenshots: [
      shot('binance-fut-01-enable', 'Clique aqui: abra "Futuros" no menu superior', 12, 9, 'Site oficial da Binance com acesso ao menu Futures.'),
      shot('binance-fut-02-transfer', 'Clique aqui: De (Spot) · Para (Futuros) · Quantidade', 75, 52, 'Transferência de saldo da carteira Spot para Futuros na Binance.'),
      shot('binance-fut-03-leverage', 'Clique aqui: ajuste margem isolada e alavancagem', 72, 28, 'Seletor de modo de margem e alavancagem nos futuros da Binance.'),
      shot('binance-fut-04-order', 'Clique aqui: Take Profit · Stop Loss · Comprar/Long', 82, 75, 'Formulário de ordem de futuros Binance com TP, SL e botões de compra e venda.'),
      shot('binance-fut-05-positions', 'Clique aqui: acompanhe o PnL · feche pela própria aba', 17, 42, 'Área Positions da Binance com controles para monitorar e encerrar posição.'),
    ],
  },
  bybit: {
    logo: '/platform-logos/bybit.png', cover: '/platform-covers/capa-bybit.png', screenshots: [
      null,
      shot('bybit-01-transfer', 'Clique aqui: Spot → Derivativos → Transferir', 82, 52, 'Painel de ativos e botão Transfer da Bybit.'),
      shot('bybit-02-isolated', 'Clique aqui: Isolada · ajuste a alavancagem', 23, 20, 'Painel de margem e alavancagem isolada da Bybit.'),
      shot('bybit-03-order', 'Clique aqui: TP · SL · Comprar/Long', 56, 79, 'Formulário de ordem Bybit com TP/SL e botão Buy.'),
      shot('bybit-04-positions', 'Clique aqui: P&L · Fechar', 72, 70, 'Abas de ordens abertas e posições da Bybit.'),
    ],
  },
  'okx-futures': {
    logo: '/platform-logos/okx.png', cover: '/platform-covers/capa-okx.png', screenshots: [
      shot('okx-fut-01-menu', 'Clique aqui: abra Futuros no menu Negociar', 24, 13, 'Interface de negociação OKX com menu Trade.'),
      shot('okx-fut-02-transfer', 'Clique aqui: Transferir para a conta de trading', 23, 53, 'Painel de transferência e saldo disponível na OKX.'),
      shot('okx-fut-03-pair-leverage', 'Clique aqui: escolha o par · ajuste margem e alavancagem', 10, 50, 'Seletor de contrato e controles de alavancagem na OKX.'),
      shot('okx-fut-04-order', 'Clique aqui: TP · SL · executar a ordem', 80, 66, 'Formulário OKX para abrir posição com TP/SL.'),
      shot('okx-fut-05-positions', 'Clique aqui: PnL · Fechar Posição', 76, 53, 'Área de posições e controles para fechar operação na OKX.'),
    ],
  },
  bitget: {
    logo: '/platform-logos/bitget.png', cover: '/platform-covers/capa-bitget.png', screenshots: [
      null,
      shot('bitget-01-menu-transfer', 'Clique aqui: Futuros · Transferir', 24, 14, 'Menu Bitget com acesso à área Futures.'),
      shot('bitget-04-copy', 'Clique aqui: analise Top Traders · Copiar com limite', 62, 15, 'Menu Bitget com recurso Copy trading.'),
      [
        shot('bitget-02-pair-isolated', 'Clique aqui: par · Isolada · alavancagem', 57, 35, 'Controles de par e margem isolada na Bitget.'),
        shot('bitget-03-order', 'Clique aqui: TP · SL · executar', 55, 76, 'Formulário de ordem Bitget com opções de TP/SL.'),
      ],
      shot('bitget-05-positions', 'Clique aqui: P&L · Fechar', 48, 50, 'Abas de posições abertas e ordens TP/SL na Bitget.'),
    ],
  },
  hyperliquid: {
    logo: '/platform-logos/hyperliquid.png', cover: '/platform-covers/capa-hyperliquid.png', screenshots: [
      shot('hl-01-connect', 'Clique aqui: Conectar Carteira', 78, 93, 'Tela Hyperliquid com botão Enable Trading.',),
      shot('hl-02-deposit', 'Clique aqui: confira a rede Arbitrum · Depositar', 52, 87, 'Formulário de depósito USDC via Arbitrum na Hyperliquid.'),
      shot('hl-03-trade', 'Clique aqui: par · alavancagem · Long/Short', 43, 61, 'Painel de trade Hyperliquid com seletor do mercado, margem e Long/Short.'),
      shot('hl-04-stop', 'Clique aqui: defina o stop · Fechar Posição', 43, 25, 'Opções de Take Profit e Stop Loss no formulário Hyperliquid.'),
      shot('hl-05-positions', 'Clique aqui: PnL · Fechar', 18, 49, 'Tabela de posições e PnL na Hyperliquid.'),
    ],
  },
  mexc: {
    logo: '/platform-logos/mexc.png', cover: '/platform-covers/capa-mexc.png', screenshots: [
      null,
      shot('mexc-01-menu-transfer', 'Clique aqui: Futuros · Transferir', 52, 55, 'Menu de transferência de saldo para futuros na MEXC.'),
      shot('mexc-02-pair', 'Clique aqui: escolha o par · confira a alavancagem', 57, 12, 'Lista de contratos e pares disponíveis na MEXC.'),
      shot('mexc-03-isolated', 'Clique aqui: Isolada · alavancagem baixa (ex.: 3x)', 70, 28, 'Seletor de margem e alavancagem dos futuros MEXC.'),
      [
        shot('mexc-04-order', 'Clique aqui: TP · SL · executar', 57, 68, 'Formulário MEXC para ordem com Take Profit e Stop Loss.'),
        shot('mexc-05-positions', 'Clique aqui: P&L · Fechar', 54, 53, 'Controles do modo de posição e gerenciamento de futuros MEXC.'),
      ],
    ],
  },
  axiom: {
    logo: '/platform-logos/axiom.png', cover: '/platform-covers/capa-axiom.png', screenshots: [
      shot('axiom-passo1-url', 'Confira axiom.trade e salve nos favoritos.', 25, 8, 'Axiom aberto no navegador com domínio axiom.trade.'),
      shot('axiom-passo2-banca', 'Deposite só o valor que aceita perder.', 54, 49, 'Barra de saldo Axiom com botão Deposit.'),
      shot('axiom-passo3-pulse', 'Use Pulse e investigue cada token antes de operar.', 48, 43, 'Painel Pulse da Axiom com listas de tokens e filtros.'),
      shot('axiom-passo4-custos', 'Ajuste slippage e priority fee antes da ordem.', 76, 43, 'Painel Axiom de compra com controles de slippage e taxa de prioridade.'),
      shot('axiom-passo5-ordem', 'Defina valor e planeje saída antes de entrar.', 83, 49, 'Terminal Axiom com abas Market e Limit e controles de ordem.'),
    ],
  },
  gmgn: {
    logo: '/platform-logos/gmgn.png', cover: '/platform-covers/capa-gmgn.png', screenshots: [
      shot('gmgn-passo1-url', 'Confira gmgn.ai e salve nos favoritos.', 27, 8, 'GMGN aberto no navegador com domínio gmgn.ai.'),
      shot('gmgn-passo2-wallet', 'Conecte carteira dedicada, nunca carteira principal.', 79, 48, 'Barra GMGN com botões Sign Up e Log In.'),
      shot('gmgn-passo3-token', 'Confira contrato, liquidez e concentração de holders.', 50, 46, 'Tabela GMGN com métricas de tokens e análise de risco.'),
      shot('gmgn-passo4-smartmoney', 'Avalie PnL e histórico; não copie às cegas.', 50, 48, 'Painel Smart Money da GMGN com PnL total e taxa de acerto.'),
      shot('gmgn-passo5-exec', 'Revise o valor antes de confirmar compra.', 86, 80, 'Tabela de tokens GMGN com ações de execução.'),
    ],
  },
  fomo: {
    logo: '/platform-logos/fomo.png', cover: '/platform-covers/capa-fomo.png', missingSteps: { 1: 'Captura pública desta etapa não existe. Anote a frase de recuperação offline; nunca compartilhe.' }, screenshots: [
      shot('fomo-passo1-app', 'Instale o app oficial e confira desenvolvedor fomo Labs Inc.', 53, 34, 'Página do app FOMO na loja móvel, com nome do desenvolvedor.'),
      null,
      shot('fomo-passo3-dex', 'Investigue liquidez, volume e idade no DEX Screener.', 36, 32, 'DEX Screener com colunas de liquidez e idade de tokens.'),
      shot('fomo-passo4-custos', 'Compare custos e valor de mercado antes de entrar.', 48, 53, 'App FOMO com lista de tokens e valores de mercado.'),
    ],
  },
  photon: {
    logo: '/platform-logos/photon.png', cover: '/platform-covers/capa-photon.png', screenshots: [
      shot('photon-passo1-url', 'Confira photon-sol.tinyastro.io antes de conectar.', 29, 8, 'Photon aberto no navegador com domínio oficial visível.'),
      shot('photon-passo2-conexao', 'Conecte carteira dedicada e confira saldo.', 47, 52, 'Barra do Photon com carteira conectada e saldo SOL.'),
      shot('photon-passo3-memescope', 'Filtre Newly Created, About to Graduate e Graduated.', 49, 39, 'Feed Memescope do Photon com filtro Newly Created.'),
      shot('photon-passo4-slippage', 'Ajuste Quick Buy, presets e Snipe antes de operar.', 54, 52, 'Barra de configurações Photon com Quick Buy, Presets e Snipe.'),
    ],
  },
  trojan: {
    logo: '/platform-logos/trojan.png', cover: '/platform-covers/capa-trojan.png', screenshots: [
      shot('trojan-passo1-site', 'Abra o bot pelo site oficial trojan.app.', 53, 10, 'Tela Telegram do bot Trojan com referência ao site oficial.'),
      shot('trojan-passo2-custodia', 'Bot custodia fundos; deposite pouco e saque com frequência.', 52, 62, 'Tela Trojan com endereço pixelizado e saldo da carteira.'),
      shot('trojan-passo3-ordens', 'Configure Buy, Sell, Limit e DCA com limites claros.', 50, 34, 'Menu Trojan com ordens Limit e DCA.'),
      shot('trojan-passo4-confirmacao', 'Revise configurações antes de confirmar qualquer ordem.', 75, 59, 'Menu de configurações e ordens do Trojan.'),
    ],
  },
  phantom: {
    logo: '/platform-logos/phantom.png', cover: '/platform-covers/capa-phantom.png', screenshots: [
      shot('phantom-passo1-site', 'Baixe apenas em phantom.com; desconfie de clones.', 88, 16, 'Site Phantom no navegador com botão Download.'),
      shot('phantom-passo2-frase', 'Anote as 12 palavras no papel; nunca tire print.', 50, 80, 'Tela Phantom de frase de recuperação com palavras ocultas.'),
      shot('phantom-passo3-conexao', 'Confira URL do site antes de conectar.', 56, 24, 'Carteira Phantom na aba Sites para revisar conexões.'),
      shot('phantom-passo4-desconectar', 'Revise apps conectados e desconecte o que não usa.', 23, 88, 'Tela Phantom com botão Disconnect para site conectado.'),
    ],
  },
  solflare: {
    logo: '/platform-logos/solflare.png', cover: '/platform-covers/capa-solflare.png', screenshots: [
      shot('solflare-passo1-site', 'Confira solflare.com e salve nos favoritos.', 27, 8, 'Dashboard Solflare aberto no domínio solflare.com.'),
      shot('solflare-passo2-frase', 'Confirme a frase offline; nunca compartilhe.', 85, 46, 'Tela Solflare de confirmação da frase de recuperação.'),
      shot('solflare-passo3-cofre', 'Guarde longo prazo em Ledger; mantenha pouco na hot wallet.', 48, 50, 'Carteira Solflare com opções de cofre e uso operacional.'),
      shot('solflare-passo4-assinaturas', 'Leia tudo antes de assinar; pare se algo parecer estranho.', 51, 64, 'Aviso de transação no app Solflare antes da assinatura.'),
    ],
  },
  backpack: {
    logo: '/platform-logos/backpack.png', cover: '/platform-covers/capa-backpack.png', missingSteps: { 1: 'Captura pública do onboarding não existe. Guarde frase e PIN offline, sem compartilhar.' }, screenshots: [
      shot('backpack-passo1-app', 'Baixe apenas em backpack.app; confira app e extensão oficiais.', 20, 12, 'App Backpack com seletor de carteira importada.'),
      null,
      shot('backpack-passo3-saldo', 'Saldo da wallet e saldo da exchange têm custódias diferentes.', 48, 45, 'Saldo total da carteira Backpack.'),
      shot('backpack-passo4-withdraw', 'Confira Withdraw, rede e endereço antes de enviar.', 51, 50, 'Tela Backpack Send para transferir ativos.'),
    ],
  },
  rabby: {
    logo: '/platform-logos/rabby.png', cover: '/platform-covers/capa-rabby.png', screenshots: [
      shot('rabby-passo1-site', 'Instale somente por rabby.io.', 49, 46, 'Site Rabby com opções oficiais de extensão e app.'),
      shot('rabby-passo2-evm', 'Selecione rede certa antes de enviar.', 48, 48, 'Rabby com lista de redes EVM disponíveis.'),
      shot('rabby-passo3-simulacao', 'Leia alertas e simulação antes de assinar.', 77, 74, 'Rabby simulando transferência e alertando sobre destino novo.'),
      shot('rabby-passo4-revogar', 'Revise e revogue permissões antigas.', 67, 56, 'Revoke.cash com lista de permissões e ações de revogação.'),
    ],
  },
}
