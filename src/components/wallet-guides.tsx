import { translateUi, translateTemplate } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, ExternalLink, ShieldAlert, X } from 'lucide-react'

type WalletId = 'tronlink' | 'metamask' | 'trust' | 'phantom' | 'exodus'
type GuideScreenshot = {
  src: string
  alt: string
  sourceUrl: string
  sourceLabel: string
  layout: 'landscape' | 'portrait' | 'phone-video' | 'panels'
}
type GuideStep = { title: string; text: string; screenshot?: GuideScreenshot }
type WalletGuide = {
  id: WalletId
  name: string
  description: string
  tint: string
  iconPath: string
  downloadUrl: string
  sourceUrl: string
  sourceLabel: string
  recommended?: boolean
  warning?: string
  compatible: boolean
  steps: GuideStep[]
}
type ExchangeId = 'coinbase' | 'binance' | 'okx'
type ExchangeGuide = {
  id: ExchangeId
  name: string
  description: string
  tint: string
  iconPath: string
  officialUrl: string
  referralEnv: string
  sourceUrl: string
  sourceLabel: string
  secondarySourceUrl?: string
  secondarySourceLabel?: string
  supportsTron: boolean
  status: string
  warning?: string
  steps: GuideStep[]
}

const exchanges: ExchangeGuide[] = [
  {
    id: 'binance', name: 'Binance', description: 'Compra em BRL · PIX pode aparecer', tint: 'binance', iconPath: '/exchange-icons/binance.png',
    officialUrl: 'https://www.binance.com/', referralEnv: 'VITE_REFERRAL_BINANCE_URL', sourceUrl: 'https://www.binance.com/pt-BR/support/faq/detail/b90065c7a7d44d0bb8b2ac7dc2cb0391', sourceLabel: 'Ajuda oficial · compra via Pix', secondarySourceUrl: 'https://www.binance.com/pt-BR/support/faq/detail/115003670492', secondarySourceLabel: 'Ajuda oficial · saques e redes', supportsTron: true, status: 'TRC-20 disponível',
    steps: [
      { title: 'Abra sua conta e proteja-a', text: 'Use apenas o site ou app oficial. Conclua a verificação solicitada e ative autenticação em dois fatores antes de depositar ou comprar.', },
      { title: 'Compre USDT com Pix', text: 'Selecione BRL, USDT e Transferência Bancária (Pix). Confira valor, cotação e taxas na prévia; opções podem variar por conta.', screenshot: { src: '/exchange-tutorials/binance-pix-buy.png', alt: 'Tela oficial da Binance para comprar USDT com reais e Pix', sourceUrl: 'https://www.binance.com/pt-BR/support/faq/detail/b90065c7a7d44d0bb8b2ac7dc2cb0391', sourceLabel: 'Guia oficial da compra com Pix', layout: 'landscape' } },
      { title: 'Aguarde o saldo', text: 'Pague somente o pedido criado na sua conta. Confirme que USDT aparece como disponível antes de iniciar saque.', screenshot: { src: '/exchange-tutorials/binance-pix-receipt.png', alt: 'Tela oficial da Binance informando que ordem de compra foi enviada', sourceUrl: 'https://www.binance.com/pt-BR/support/faq/detail/b90065c7a7d44d0bb8b2ac7dc2cb0391', sourceLabel: 'Guia oficial da compra com Pix', layout: 'landscape' } },
      { title: 'Selecione USDT para saque', text: 'Abra saque on-chain e escolha USDT. Confira se saldo e carteira de origem permitem retirada.', screenshot: { src: '/exchange-tutorials/binance-withdraw-asset.png', alt: 'Seletor de ativos da Binance antes de iniciar saque', sourceUrl: 'https://www.binance.com/pt-BR/support/faq/detail/115003670492', sourceLabel: 'Guia oficial de saques', layout: 'portrait' } },
      { title: 'Escolha TRON (TRC-20)', text: 'Cole o endereço de destino e escolha TRON (TRC-20). Endereço e rede precisam corresponder; redes diferentes podem causar perda dos fundos.', screenshot: { src: '/exchange-tutorials/binance-withdraw-network-new.jpeg', alt: 'Tela da Binance para inserir endereço e escolher rede de saque', sourceUrl: 'https://www.binance.com/pt-BR/support/faq/detail/115003670492', sourceLabel: 'Guia oficial de saques', layout: 'portrait' } },
      { title: 'Revise valor e taxa', text: 'Confira mínimo, taxa atual e valor líquido. Confirme com seus controles de segurança e acompanhe o status. Não use a taxa de imagens como valor atual.', screenshot: { src: '/exchange-tutorials/binance-withdraw-amount-new.png', alt: 'Tela oficial da Binance para informar o valor do saque de USDT', sourceUrl: 'https://www.binance.com/pt-BR/support/faq/detail/115003670492', sourceLabel: 'Guia oficial de saques', layout: 'portrait' } },
    ]
  },
  {
    id: 'okx', name: 'OKX', description: 'Compra e saque conforme sua conta', tint: 'okx', iconPath: '/exchange-icons/okx.png',
    officialUrl: 'https://www.okx.com/', referralEnv: 'VITE_REFERRAL_OKX_URL', sourceUrl: 'https://www.okx.com/en-us/help/how-do-i-buy-crypto', sourceLabel: 'Ajuda oficial OKX · compra', secondarySourceUrl: 'https://www.okx.com/en-us/help/how-do-i-make-a-crypto-withdrawal-app', secondarySourceLabel: 'Ajuda oficial OKX · saque', supportsTron: true, status: 'TRC-20 disponível',
    steps: [
      { title: 'Abra sua conta e proteja-a', text: 'Acesse o site ou app oficial. Complete verificação exigida e ative autenticação em dois fatores.', },
      { title: 'Abra Comprar', text: 'No app, toque em Comprar. Métodos de pagamento e produtos dependem do país e da conta.', screenshot: { src: '/exchange-tutorials/okx-buy-menu.png', alt: 'Menu real de compra no app OKX', sourceUrl: 'https://www.okx.com/en-us/help/how-do-i-buy-crypto', sourceLabel: 'Guia oficial de compra', layout: 'portrait' } },
      { title: 'Busque USDT', text: 'Escolha USDT na lista de ativos. Informe moeda e valor; disponibilidade, taxas e limites variam por país, conta e produto.', screenshot: { src: '/exchange-tutorials/okx-buy-asset.png', alt: 'Lista de ativos no app OKX com campo de busca', sourceUrl: 'https://www.okx.com/en-us/help/how-do-i-buy-crypto', sourceLabel: 'Guia oficial de compra', layout: 'portrait' } },
      { title: 'Revise a ordem', text: 'Confira preço, quantidade recebida, método e taxas na prévia. Confirme apenas se todos os dados estiverem corretos.', screenshot: { src: '/exchange-tutorials/okx-buy-amount.png', alt: 'Tela do app OKX para definir valor e forma de pagamento', sourceUrl: 'https://www.okx.com/en-us/help/how-do-i-buy-crypto', sourceLabel: 'Guia oficial de compra', layout: 'portrait' } },
      { title: 'Abra saque on-chain', text: 'Quando USDT estiver disponível, vá em Ativos > Sacar > Sacar cripto. Selecione USDT para iniciar transferência on-chain.', screenshot: { src: '/exchange-tutorials/okx-withdraw-1.png', alt: 'App OKX destacando onde abrir opção de saque', sourceUrl: 'https://www.okx.com/en-us/help/how-do-i-make-a-crypto-withdrawal-app', sourceLabel: 'Guia oficial de saques', layout: 'portrait' } },
      { title: 'Escolha carteira como destino', text: 'Selecione carteira externa e escolha a rede TRON (TRC-20). A rede no saque precisa ser igual à rede do endereço de destino.', screenshot: { src: '/exchange-tutorials/okx-withdraw-4.png', alt: 'Tela real do OKX para escolher exchange ou carteira externa como destino', sourceUrl: 'https://www.okx.com/en-us/help/how-do-i-make-a-crypto-withdrawal-app', sourceLabel: 'Guia oficial de saques', layout: 'portrait' } },
      { title: 'Confira valor, taxa e status', text: 'Revise endereço, mínimo, taxa e valor líquido na tela; confirme a autenticação solicitada. Acompanhe o status até concluído. Não repita saque pendente.' },
    ]
  },
  {
    id: 'coinbase', name: 'Coinbase', description: 'USDT informado como ERC-20', tint: 'coinbase', iconPath: '/exchange-icons/coinbase.png',
    officialUrl: 'https://www.coinbase.com/', referralEnv: 'VITE_REFERRAL_COINBASE_URL', sourceUrl: 'https://help.coinbase.com/en/coinbase/trading-and-funding/buying-selling-or-converting-crypto/how-do-i-buy-digital-currency', sourceLabel: 'Ajuda oficial · comprar cripto', secondarySourceUrl: 'https://www.coinbase.com/price/tether', secondarySourceLabel: 'Redes de USDT na Coinbase', supportsTron: false, status: 'Não compatível com TRC-20',
    warning: 'A página oficial consultada da Coinbase informa suporte a USDT apenas na rede Ethereum (ERC-20). Este checkout exige TRON (TRC-20). Não saque USDT da Coinbase para um endereço TRON. Disponibilidade pode variar por produto e região; confira sua conta.',
    steps: [
      { title: 'Abra Comprar', text: 'Use o botão Comprar e confira os ativos disponíveis para sua conta. Este frame vem do tutorial em vídeo oficial da Coinbase.', screenshot: { src: '/exchange-tutorials/coinbase-check-05.jpg', alt: 'Tela do app Coinbase com opção Comprar destacada', sourceUrl: 'https://help.coinbase.com/en/coinbase/trading-and-funding/buying-selling-or-converting-crypto/how-do-i-buy-digital-currency', sourceLabel: 'Vídeo oficial de compra', layout: 'phone-video' } },
      { title: 'Busque USDT', text: 'O vídeo oficial mostra Tether (USDT) na lista de ativos. Compra, pagamento e ativos disponíveis variam conforme a região e a conta.', screenshot: { src: '/exchange-tutorials/coinbase-check-07.jpg', alt: 'Tela do app Coinbase mostrando Tether (USDT) na lista de ativos', sourceUrl: 'https://help.coinbase.com/en/coinbase/trading-and-funding/buying-selling-or-converting-crypto/how-do-i-buy-digital-currency', sourceLabel: 'Vídeo oficial de compra', layout: 'phone-video' } },
      { title: 'Pare antes de enviar para TRON', text: 'A informação oficial consultada lista USDT na Coinbase como ERC-20. Essa rede não corresponde a TRON (TRC-20); não use esse saldo para este checkout.', },
    ]
  },
]

const exchangeReferrals: Partial<Record<ExchangeId, string>> = {
  coinbase: import.meta.env.VITE_REFERRAL_COINBASE_URL,
  binance: import.meta.env.VITE_REFERRAL_BINANCE_URL,
  okx: import.meta.env.VITE_REFERRAL_OKX_URL,
}

const wallets: WalletGuide[] = [
  {
    id: 'tronlink', name: 'TronLink', description: 'Carteira focada em TRON', tint: 'tronlink', iconPath: '/wallet-icons/tronlink.png',
    downloadUrl: 'https://www.tronlink.org/dlDetails/', sourceUrl: 'https://support.tronlink.org/hc/en-us/articles/17663848410649-How-to-transfer-receive-assets-in-TronLink-App', sourceLabel: 'Ajuda oficial TronLink', recommended: true, compatible: true,
    steps: [
      { title: 'Baixe o TronLink', text: 'Instale pela App Store, Google Play ou extensão indicada no site oficial. Confira o desenvolvedor antes de instalar. Grátis; iOS, Android e navegador.', },
      { title: 'Crie sua carteira', text: 'Escolha criar carteira nova e defina uma senha. Guarde a frase de recuperação offline, em papel, na ordem correta. Nunca fotografe, compartilhe ou digite essa frase em sites.', },
      { title: 'Confirme a frase', text: 'O app pede para confirmar palavras na ordem. Faça isso em local privado. A frase dá controle total sobre os fundos.', },
      { title: 'Obtenha USDT na rede TRON', text: 'Se usar uma exchange, compre USDT e confira se ela permite saque por TRON (TRC-20). Opções e taxas variam por país e plataforma.', },
      { title: 'Envie para o checkout', text: 'No TronLink, abra Transferir, selecione USDT (TRC-20), cole o endereço exibido pelo checkout e confira endereço, rede e valor antes de assinar. Mantenha TRX para taxas de rede.', screenshot: { src: '/wallet-tutorials/tronlink-home-send.png', alt: 'Tela real do TronLink com botão Send e lista de ativos TRON', sourceUrl: 'https://support.tronlink.org/hc/en-us/articles/17663848410649-How-to-transfer-receive-assets-in-TronLink-App', sourceLabel: 'Tutorial oficial TronLink', layout: 'portrait' } },
      { title: 'Aguarde confirmação', text: 'Confira o status no app e no explorador oficial da rede. O tempo varia.', },
    ]
  },
  {
    id: 'metamask', name: 'MetaMask', description: 'TRON já aparece nas redes', tint: 'metamask', iconPath: '/wallet-icons/metamask-brand.png',
    downloadUrl: 'https://metamask.io/download/', sourceUrl: 'https://support.metamask.io/configure/networks/tron', sourceLabel: 'Ajuda oficial MetaMask', compatible: true,
    warning: 'MetaMask já inclui TRON entre as redes disponíveis. Não use tutoriais antigos de RPC manual. Ao sacar, escolha USDT na rede TRON (TRC-20); redes diferentes não são intercambiáveis.',
    steps: [
      { title: 'Instale o MetaMask', text: 'Use o app ou a extensão obtidos pelo site oficial. Evite anúncios, links recebidos por mensagem e cópias com nomes parecidos.', },
      { title: 'Crie e proteja a carteira', text: 'Crie uma carteira e guarde a frase de recuperação offline. Nunca compartilhe a frase, senha ou códigos com suporte ou terceiros.', },
      { title: 'Abra a rede TRON', text: 'No seletor de redes, encontre TRON. Ela já é suportada pelo MetaMask; não precisa cadastrar RPC customizado. Os menus podem variar entre app e extensão.', screenshot: { src: '/wallet-tutorials/metamask-network-select.png', alt: 'Tela oficial do MetaMask com seletor de redes e tokens', sourceUrl: 'https://support.metamask.io/configure/networks/how-to-add-a-custom-network-rpc', sourceLabel: 'Captura do guia oficial MetaMask', layout: 'portrait' } },
      { title: 'Obtenha USDT em TRON', text: 'Em uma exchange que permita, compre USDT e escolha TRON (TRC-20) na tela de saque. Confirme ativo, endereço e rede antes de concluir.', },
      { title: 'Revise e envie', text: 'No MetaMask, selecione a conta na rede TRON, abra USDT e toque em Enviar. Cole o endereço do checkout, revise valor e taxa. Pode ser necessário ter TRX para recursos da rede.', },
      { title: 'Confira a confirmação', text: 'Aguarde o status confirmado no MetaMask e no checkout. Tempo varia; não envie de novo enquanto a primeira transação estiver pendente.', },
    ]
  },
  {
    id: 'trust', name: 'Trust Wallet', description: 'App mobile multirrede', tint: 'trust', iconPath: '/wallet-icons/trustwallet-brand.png',
    downloadUrl: 'https://trustwallet.com/download', sourceUrl: 'https://trustwallet.com/blog/company/smarter-tron-transfers', sourceLabel: 'Tutorial oficial Trust Wallet · TRON', compatible: true,
    steps: [
      { title: 'Baixe o Trust Wallet', text: 'Instale pela loja oficial ou pelo site Trust Wallet. Confira nome do desenvolvedor e domínio antes de abrir ou importar uma carteira.', },
      { title: 'Crie uma carteira', text: 'Siga o fluxo de criação e faça backup da frase de recuperação offline. A frase controla seus fundos; nunca a envie a ninguém.', },
      { title: 'Ative TRON e localize USDT', text: 'Na lista de ativos, habilite TRON (TRX). Procure USDT e confirme que a rede exibida é TRON / TRC-20 antes de usar.', },
      { title: 'Obtenha USDT por TRC-20', text: 'Se sacar de uma exchange, confirme que USDT e TRON (TRC-20) estão selecionados. Disponibilidade, taxas e nomes de menus variam.', },
      { title: 'Envie para o checkout', text: 'Abra USDT na rede TRON, toque em Enviar e confira endereço e valor caractere por caractere. Mantenha TRX suficiente para a taxa que o app mostrar.', screenshot: { src: '/wallet-tutorials/trustwallet-tron-send.png', alt: 'Quatro telas reais do Trust Wallet: USDT TRON, destinatário, valor e confirmação com taxa de rede', sourceUrl: 'https://trustwallet.com/blog/company/smarter-tron-transfers', sourceLabel: 'Tutorial oficial de transferências TRON', layout: 'panels' } },
      { title: 'Aguarde o status final', text: 'Acompanhe a transação na carteira e no checkout. Não repita o envio se houver demora; primeiro verifique o status na rede.', },
    ]
  },
  {
    id: 'phantom', name: 'Phantom', description: 'Não suporta rede TRON', tint: 'phantom', iconPath: '/wallet-icons/phantom-brand.png',
    downloadUrl: 'https://phantom.com/download', sourceUrl: 'https://help.phantom.com/articles/41372840389651', sourceLabel: 'Redes suportadas pela Phantom', compatible: false,
    warning: 'A documentação oficial atual da Phantom não lista TRON entre as redes suportadas. Não use esta carteira para enviar USDT TRC-20 e não tente adicionar RPC ou token manualmente.',
    steps: [
      { title: 'Confira as redes suportadas', text: 'A lista oficial da Phantom inclui Solana, Ethereum, Bitcoin, Base e outras redes descritas na ajuda. TRON não aparece nessa lista.', },
      { title: 'Não envie USDT TRC-20', text: 'Não escolha Solana ou outra rede para substituir TRON. Ativos e endereços de redes diferentes não são intercambiáveis.', },
      { title: 'Escolha carteira compatível', text: 'Para um checkout que aceite USDT TRC-20, use uma carteira que suporte a rede TRON, como TronLink, MetaMask, Trust Wallet ou Exodus Mobile/Desktop.', },
    ]
  },
  {
    id: 'exodus', name: 'Exodus', description: 'Use Mobile ou Desktop', tint: 'exodus', iconPath: '/wallet-icons/exodus-brand.png',
    downloadUrl: 'https://www.exodus.com/download', sourceUrl: 'https://www.exodus.com/support/en/articles/8598681-tron-and-tron-token-faqs-learn-more-about-trx-and-trc20-tokens', sourceLabel: 'Ajuda oficial Exodus', compatible: true,
    warning: 'Use Exodus Mobile ou Desktop: Exodus Web3 Wallet não suporta TRON. USDT na rede TRON exige recursos de rede; a carteira pode cobrar taxa em TRX.',
    steps: [
      { title: 'Baixe Exodus Mobile ou Desktop', text: 'Use o site exodus.com e selecione o app para seu dispositivo. Exodus Web3 Wallet não oferece suporte à rede TRON.', },
      { title: 'Crie e proteja sua carteira', text: 'Crie uma carteira e guarde o backup de recuperação offline. Nunca compartilhe frase, chave privada ou senha.', },
      { title: 'Ative TRON e encontre USDT', text: 'Na busca de ativos, filtre pela rede TRON e habilite USDT (TRC-20). Confira o nome da rede no detalhe do ativo.', screenshot: { src: '/wallet-tutorials/exodus-address-entry.png', alt: 'Lista real de ativos no Exodus com Tether USD e Tron', sourceUrl: 'https://www.exodus.com/support/en/articles/8598631-how-do-i-send-bitcoin-and-crypto-from-exodus', sourceLabel: 'Captura do guia oficial Exodus', layout: 'portrait' } },
      { title: 'Obtenha USDT na rede TRON', text: 'Ao sacar de uma exchange, selecione TRON (TRC-20). Confira se o ativo, endereço e rede de destino correspondem.', },
      { title: 'Envie e confira a taxa', text: 'Abra USDT (TRON), selecione Enviar e cole o endereço do checkout. Revise endereço e valor. Tenha TRX para recursos de rede se a carteira pedir.', },
      { title: 'Aguarde confirmação', text: 'Confira a atividade e espere o checkout reconhecer a transação. Taxas e tempo de confirmação variam; não repita o envio sem verificar.', },
    ]
  },
]

export function WalletGuideSection({ variant = 'landing' }: { variant?: 'landing' | 'access' }) {
  useUiTranslation();
  const [selectedWallet, setSelectedWallet] = useState<WalletGuide | null>(null)
  const [selectedExchange, setSelectedExchange] = useState<ExchangeGuide | null>(null)
  const closeModal = useCallback(() => setSelectedWallet(null), [])
  const isAccessPage = variant === 'access'

  return <>
    <section id={isAccessPage ? 'como-pagar' : 'como-comprar'} className={isAccessPage ? 'wallet-guide-section wallet-guide-access' : 'wallet-guide-section wallet-guide-landing'} aria-labelledby={isAccessPage ? 'wallet-access-title' : 'wallet-landing-title'}>
      <div className="wallet-guide-inner">
        <div className="wallet-guide-heading">
          <div>
            <p className="eyebrow">{translateUi(isAccessPage ? 'precisa pagar?' : 'como comprar · passo 1')}</p>
            <h2 id={isAccessPage ? 'wallet-access-title' : 'wallet-landing-title'} className="display-lg mt-4 text-[#eaf2ec]">{translateUi(isAccessPage ? 'Prepare uma carteira compatível.' : 'Comece por uma carteira segura.')}</h2>
          </div>
          <p>{translateUi(isAccessPage ? 'Escolha uma carteira compatível com TRON e confira as instruções oficiais antes de transferir.' : 'Consulte as etapas e fontes oficiais. Menus, taxas e disponibilidade podem mudar conforme a versão.')}</p>
        </div>

        <div className="wallet-cards-grid" aria-label={translateUi("Escolha sua carteira")}>
          {wallets.map((wallet) => <button key={wallet.id} type="button" onClick={() => { setSelectedWallet(wallet); setSelectedExchange(null) }} className="wallet-choice-card" data-wallet={wallet.id} aria-haspopup="dialog" aria-label={translateTemplate('Abrir guia de pagamento com {{value0}}', [wallet.name])}>
            <span className="wallet-choice-top"><WalletIcon wallet={wallet} />{wallet.recommended && <span className="wallet-recommended">{translateUi("Recomendada")}</span>}{!wallet.compatible && <span className="wallet-unsupported">{translateUi("Sem TRON")}</span>}</span>
            <span className="wallet-choice-name">{translateUi(wallet.name)}</span>
            <span className="wallet-choice-description">{translateUi(wallet.description)}</span>
            <span className="wallet-choice-action">{translateUi(wallet.compatible ? 'Ver passo a passo' : 'Ver compatibilidade')} <ArrowRight size={14} /></span>
          </button>)}
        </div>

        <div className="exchange-guide-block">
          <div className="exchange-guide-heading"><div><p className="eyebrow">{translateUi("como comprar · passo 2")}</p><h3>{translateUi("Compre USDT na exchange.")}</h3></div><p>{translateUi("Tutoriais educativos; não são recomendação. Disponibilidade e taxas variam. Links de indicação podem gerar comissão.")}</p></div>
          <div className="exchange-cards-grid" aria-label={translateUi("Tutoriais de exchanges")}>
            {exchanges.map((exchange) => <button key={exchange.id} type="button" onClick={() => { setSelectedExchange(exchange); setSelectedWallet(null) }} className="exchange-choice-card" data-exchange={exchange.id} aria-haspopup="dialog" aria-label={translateTemplate('Abrir tutorial da {{value0}}', [exchange.name])}>
              <span className="exchange-card-top"><WalletIcon wallet={exchange} className="exchange-brand-icon" /><span className={exchange.supportsTron ? 'exchange-compatible' : 'exchange-incompatible'}>{translateUi(exchange.status)}</span></span>
              <span className="exchange-choice-name">{translateUi(exchange.name)}</span>
              <span className="exchange-choice-description">{translateUi(exchange.description)}</span>
              <span className="wallet-choice-action">{translateUi("Ver tutorial ")}<ArrowRight size={14} /></span>
            </button>)}
          </div>
        </div>

      </div>
    </section>
    {selectedWallet && <WalletModal wallet={selectedWallet} onClose={closeModal} />}
    {selectedExchange && <ExchangeGuideModal exchange={selectedExchange} onClose={() => setSelectedExchange(null)} />}
  </>
}

export function CourseAccessPage() {
  useUiTranslation();
  return <div className="mx-auto max-w-[1100px]"><WalletGuideSection variant="access" /></div>
}

function useDialogFocus(onClose: () => void, focusKey: string) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
      if (!items.length) { event.preventDefault(); return }
      const first = items[0]!
      const last = items[items.length - 1]!
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  useEffect(() => { dialogRef.current?.focus() }, [focusKey])
  return { dialogRef, closeButtonRef }
}

function ExchangeGuideModal({ exchange, onClose }: { exchange: ExchangeGuide; onClose: () => void }) {
  useUiTranslation();
  const { dialogRef, closeButtonRef } = useDialogFocus(onClose, exchange.id)
  const referralUrl = exchangeReferrals[exchange.id]?.trim()
  const actionUrl = referralUrl || exchange.officialUrl

  return createPortal(<div className="wallet-guide-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} className="wallet-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="exchange-dialog-title" tabIndex={-1}>
      <div className="wallet-dialog-header">
        <div className="wallet-dialog-heading">
          <WalletIcon wallet={exchange} className="wallet-brand-icon-large" />
          <div><p className="wallet-dialog-kicker">{translateUi("Tutorial da exchange")}</p><h2 id="exchange-dialog-title">{translateUi("Como comprar USDT na ")}{translateUi(exchange.name)}</h2></div>
        </div>
        <button ref={closeButtonRef} type="button" onClick={onClose} className="wallet-dialog-close" aria-label={translateUi("Fechar tutorial")}><X size={20} /></button>
      </div>
      <div className="wallet-dialog-intro"><p>{translateUi("Capturas de guias oficiais. Telas, métodos, taxas e limites mudam por versão e país.")}</p></div>
      {exchange.warning && <div className="wallet-warning"><ShieldAlert size={18} /><p>{translateUi(exchange.warning)}</p></div>}
      <div className="wallet-step-list">
        {exchange.steps.map((step, index) => <article key={step.title} className={'wallet-step-card' + (step.screenshot ? ' has-screenshot' : '') + (step.screenshot?.layout === 'panels' ? ' has-panels' : '')}>
          <div className="wallet-step-number">{translateUi(String(index + 1).padStart(2, '0'))}</div>
          {step.screenshot && <GuideScreenshotFigure screenshot={step.screenshot} />}
          <div className="wallet-step-copy"><h3>{translateUi(step.title)}</h3><p>{translateUi(step.text)}</p></div>
        </article>)}
      </div>
      <div className="wallet-dialog-footer exchange-dialog-footer">
        <div className="exchange-source-links"><a className="wallet-source-link" href={exchange.sourceUrl} target="_blank" rel="noreferrer">{translateUi(exchange.sourceLabel)} <ExternalLink size={12} /></a>{exchange.secondarySourceUrl && <a className="wallet-source-link" href={exchange.secondarySourceUrl} target="_blank" rel="noreferrer">{translateUi(exchange.secondarySourceLabel)} <ExternalLink size={12} /></a>}</div>
        <a href={actionUrl} target="_blank" rel="noreferrer" className="wallet-primary-button exchange-open-link">{translateUi(referralUrl ? 'Abrir com link de indicação' : 'Abrir site oficial')} <ExternalLink size={14} /></a>
      </div>
    </div>
  </div>, document.body)
}

function WalletModal({ wallet, onClose }: { wallet: WalletGuide; onClose: () => void }) {
  useUiTranslation();
  const { dialogRef, closeButtonRef } = useDialogFocus(onClose, wallet.id)

  return createPortal(<div className="wallet-guide-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} className="wallet-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title" tabIndex={-1}>
      <div className="wallet-dialog-header">
        <div className="wallet-dialog-heading">
          <WalletIcon wallet={wallet} className="wallet-brand-icon-large" />
          <div><p className="wallet-dialog-kicker">{translateUi(wallet.compatible ? 'Guia de uso' : 'Compatibilidade da rede')}</p><h2 id="wallet-dialog-title">{translateUi("Como pagar com ")}{translateUi(wallet.name)}</h2></div>
        </div>
        <button ref={closeButtonRef} type="button" onClick={onClose} className="wallet-dialog-close" aria-label={translateUi("Fechar guia")}><X size={20} /></button>
      </div>

        <div className="wallet-dialog-intro"><p>{translateUi(wallet.compatible ? 'Etapas para preparar e conferir transferência de USDT em TRON. Imagens mostram telas de guias oficiais.' : 'TRON não aparece entre redes suportadas pela Phantom; guia abaixo mostra alternativas seguras.')}</p></div>
        {wallet.warning && <div className="wallet-warning"><ShieldAlert size={18} /><p>{translateUi(wallet.warning)}</p></div>}
        <div className="wallet-step-list">
          {wallet.steps.map((step, index) => <article key={step.title} className={'wallet-step-card' + (step.screenshot ? ' has-screenshot' : '') + (step.screenshot?.layout === 'panels' ? ' has-panels' : '')}>
            <div className="wallet-step-number">{translateUi(String(index + 1).padStart(2, '0'))}</div>
            {step.screenshot && <GuideScreenshotFigure screenshot={step.screenshot} />}
            <div className="wallet-step-copy"><h3>{translateUi(step.title)}</h3><p>{translateUi(step.text)}</p>{index === 0 && wallet.compatible && <a href={wallet.downloadUrl} target="_blank" rel="noreferrer">{translateUi("Site oficial ")}<ExternalLink size={12} /></a>}</div>
          </article>)}
        </div>
        <div className="wallet-dialog-footer">
          <a className="wallet-source-link" href={wallet.sourceUrl} target="_blank" rel="noreferrer">{translateUi(wallet.sourceLabel)} <ExternalLink size={12} /></a>
          <button type="button" onClick={onClose} className={wallet.compatible ? 'wallet-primary-button' : 'wallet-secondary-button'}>{translateUi(wallet.compatible ? 'Fechar guia' : 'Escolher outra carteira')}</button>
        </div>
    </div>
  </div>, document.body)
}

function WalletIcon({ wallet, className = '' }: { wallet: { name: string; tint: string; iconPath: string }; className?: string }) {
  useUiTranslation();
  return <span className={'wallet-brand-icon wallet-tint-' + wallet.tint + (className ? ' ' + className : '')} aria-hidden="true"><img src={wallet.iconPath} alt={translateUi("")} /></span>
}

function GuideScreenshotFigure({ screenshot }: { screenshot: GuideScreenshot }) {
  useUiTranslation();
  return <figure className="guide-screenshot" data-layout={screenshot.layout}>
    <img src={screenshot.src} alt={translateUi(screenshot.alt)} loading="lazy" decoding="async" />
    <figcaption>{translateUi("Fonte: ")}<a href={screenshot.sourceUrl} target="_blank" rel="noreferrer">{translateUi(screenshot.sourceLabel)} <ExternalLink size={11} /></a></figcaption>
  </figure>
}
