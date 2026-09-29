import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, ExternalLink, HelpCircle, LockKeyhole, ShieldAlert, Smartphone, X } from 'lucide-react'

type WalletId = 'tronlink' | 'metamask' | 'trust' | 'phantom' | 'exodus'
type Mockup = { screen: string; rows: string[] }
type GuideStep = { title: string; text: string; mockup: Mockup }
type WalletGuide = {
  id: WalletId
  name: string
  initials: string
  description: string
  tint: string
  downloadUrl: string
  sourceUrl: string
  sourceLabel: string
  recommended?: boolean
  warning?: string
  compatible: boolean
  steps: GuideStep[]
}

const wallets: WalletGuide[] = [
  {
    id: 'tronlink', name: 'TronLink', initials: 'T', description: 'Carteira focada em TRON', tint: 'tronlink',
    downloadUrl: 'https://www.tronlink.org/dlDetails/', sourceUrl: 'https://support.tronlink.org/hc/en-us/articles/17663848410649-How-to-transfer-receive-assets-in-TronLink-App', sourceLabel: 'Ajuda oficial TronLink', recommended: true, compatible: true,
    steps: [
      { title: 'Baixe o TronLink', text: 'Instale pela App Store, Google Play ou extensão indicada no site oficial. Confira o desenvolvedor antes de instalar. Grátis; iOS, Android e navegador.', mockup: { screen: 'Download oficial', rows: ['App Store · iOS', 'Google Play · Android', 'Extensão de navegador'] } },
      { title: 'Crie sua carteira', text: 'Escolha criar carteira nova e defina uma senha. Guarde a frase de recuperação offline, em papel, na ordem correta. Nunca fotografe, compartilhe ou digite essa frase em sites.', mockup: { screen: 'Nova carteira', rows: ['Criar carteira', 'Definir senha', 'Frase guardada offline'] } },
      { title: 'Confirme a frase', text: 'O app pede para confirmar palavras na ordem. Faça isso em local privado. A frase dá controle total sobre os fundos.', mockup: { screen: 'Confirmar backup', rows: ['Palavra 1 ·•••', 'Palavra 2 ·•••', 'Backup confirmado'] } },
      { title: 'Obtenha USDT na rede TRON', text: 'Se usar uma exchange, compre USDT e confira se ela permite saque por TRON (TRC-20). Opções e taxas variam por país e plataforma.', mockup: { screen: 'Saque de USDT', rows: ['Ativo · USDT', 'Rede · TRON (TRC-20)', 'Taxa · confira antes de sacar'] } },
      { title: 'Envie para o checkout', text: 'No TronLink, abra Transferir, selecione USDT (TRC-20), cole o endereço exibido pelo checkout e confira endereço, rede e valor antes de assinar. Mantenha TRX para taxas de rede.', mockup: { screen: 'Revisar transferência', rows: ['Ativo · USDT', 'Rede · TRON (TRC-20)', 'Endereço e valor · conferir'] } },
      { title: 'Aguarde confirmação', text: 'Confira o status no app e no explorador oficial da rede. O tempo varia. Acesso só é liberado após confirmação pelo checkout; este protótipo não processa pagamentos.', mockup: { screen: 'Status da rede', rows: ['Transação enviada', 'Aguardando confirmações', 'Não envie novamente sem conferir'] } },
    ]
  },
  {
    id: 'metamask', name: 'MetaMask', initials: 'M', description: 'TRON já aparece nas redes', tint: 'metamask',
    downloadUrl: 'https://metamask.io/download/', sourceUrl: 'https://support.metamask.io/configure/networks/tron', sourceLabel: 'Ajuda oficial MetaMask', compatible: true,
    warning: 'MetaMask já inclui TRON entre as redes disponíveis. Não use tutoriais antigos de RPC manual. Ao sacar, escolha USDT na rede TRON (TRC-20); redes diferentes não são intercambiáveis.',
    steps: [
      { title: 'Instale o MetaMask', text: 'Use o app ou a extensão obtidos pelo site oficial. Evite anúncios, links recebidos por mensagem e cópias com nomes parecidos.', mockup: { screen: 'MetaMask oficial', rows: ['Extensão de navegador', 'App para iOS', 'App para Android'] } },
      { title: 'Crie e proteja a carteira', text: 'Crie uma carteira e guarde a frase de recuperação offline. Nunca compartilhe a frase, senha ou códigos com suporte ou terceiros.', mockup: { screen: 'Proteger carteira', rows: ['Nova carteira', 'Backup offline', 'Frase nunca compartilhada'] } },
      { title: 'Abra a rede TRON', text: 'No seletor de redes, encontre TRON. Ela já é suportada pelo MetaMask; não precisa cadastrar RPC customizado. Os menus podem variar entre app e extensão.', mockup: { screen: 'Redes', rows: ['Ethereum', 'Base', 'TRON · selecionar'] } },
      { title: 'Obtenha USDT em TRON', text: 'Em uma exchange que permita, compre USDT e escolha TRON (TRC-20) na tela de saque. Confirme ativo, endereço e rede antes de concluir.', mockup: { screen: 'Detalhes do saque', rows: ['Ativo · USDT', 'Rede · TRON (TRC-20)', 'Confira antes de confirmar'] } },
      { title: 'Revise e envie', text: 'No MetaMask, selecione a conta na rede TRON, abra USDT e toque em Enviar. Cole o endereço do checkout, revise valor e taxa. Pode ser necessário ter TRX para recursos da rede.', mockup: { screen: 'Enviar USDT', rows: ['Rede · TRON', 'Destino · confira o endereço', 'Taxa · revisar'] } },
      { title: 'Confira a confirmação', text: 'Aguarde o status confirmado no MetaMask e no checkout. Tempo varia; não envie de novo enquanto a primeira transação estiver pendente.', mockup: { screen: 'Atividade', rows: ['USDT · enviado', 'Rede · TRON', 'Status · verificar'] } },
    ]
  },
  {
    id: 'trust', name: 'Trust Wallet', initials: 'TW', description: 'App mobile multirrede', tint: 'trust',
    downloadUrl: 'https://trustwallet.com/download', sourceUrl: 'https://trustwallet.com/tron-wallet', sourceLabel: 'Página oficial Trust Wallet', compatible: true,
    steps: [
      { title: 'Baixe o Trust Wallet', text: 'Instale pela loja oficial ou pelo site Trust Wallet. Confira nome do desenvolvedor e domínio antes de abrir ou importar uma carteira.', mockup: { screen: 'Download oficial', rows: ['App Store · iOS', 'Google Play · Android', 'Site · trustwallet.com'] } },
      { title: 'Crie uma carteira', text: 'Siga o fluxo de criação e faça backup da frase de recuperação offline. A frase controla seus fundos; nunca a envie a ninguém.', mockup: { screen: 'Backup seguro', rows: ['Criar carteira', 'Guardar frase offline', 'Não compartilhar'] } },
      { title: 'Ative TRON e localize USDT', text: 'Na lista de ativos, habilite TRON (TRX). Procure USDT e confirme que a rede exibida é TRON / TRC-20 antes de usar.', mockup: { screen: 'Ativos', rows: ['TRON · ativar', 'Tether · USDT', 'Rede · TRON (TRC-20)'] } },
      { title: 'Obtenha USDT por TRC-20', text: 'Se sacar de uma exchange, confirme que USDT e TRON (TRC-20) estão selecionados. Disponibilidade, taxas e nomes de menus variam.', mockup: { screen: 'Saque', rows: ['Moeda · USDT', 'Rede · TRON', 'Taxa · revisar'] } },
      { title: 'Envie para o checkout', text: 'Abra USDT na rede TRON, toque em Enviar e confira endereço e valor caractere por caractere. Mantenha TRX suficiente para a taxa que o app mostrar.', mockup: { screen: 'Transferência', rows: ['Ativo · USDT (TRON)', 'Destino · conferir', 'TRX · saldo para taxa'] } },
      { title: 'Aguarde o status final', text: 'Acompanhe a transação na carteira e no checkout. Não repita o envio se houver demora; primeiro verifique o status na rede.', mockup: { screen: 'Confirmação', rows: ['Enviado', 'Aguardando rede', 'Confira antes de repetir'] } },
    ]
  },
  {
    id: 'phantom', name: 'Phantom', initials: 'P', description: 'Não suporta rede TRON', tint: 'phantom',
    downloadUrl: 'https://phantom.com/download', sourceUrl: 'https://help.phantom.com/articles/41372840389651', sourceLabel: 'Redes suportadas pela Phantom', compatible: false,
    warning: 'A documentação oficial atual da Phantom não lista TRON entre as redes suportadas. Não use esta carteira para enviar USDT TRC-20 e não tente adicionar RPC ou token manualmente.',
    steps: [
      { title: 'Confira as redes suportadas', text: 'A lista oficial da Phantom inclui Solana, Ethereum, Bitcoin, Base e outras redes descritas na ajuda. TRON não aparece nessa lista.', mockup: { screen: 'Redes Phantom', rows: ['Solana', 'Ethereum · Base', 'TRON · não suportada'] } },
      { title: 'Não envie USDT TRC-20', text: 'Não escolha Solana ou outra rede para substituir TRON. Ativos e endereços de redes diferentes não são intercambiáveis.', mockup: { screen: 'Rede incompatível', rows: ['USDT · TRC-20', 'Destino · exige TRON', 'Envio bloqueado neste guia'] } },
      { title: 'Escolha carteira compatível', text: 'Para um checkout que aceite USDT TRC-20, use uma carteira que suporte a rede TRON, como TronLink, MetaMask, Trust Wallet ou Exodus Mobile/Desktop.', mockup: { screen: 'Alternativas', rows: ['TronLink · TRON', 'MetaMask · TRON', 'Trust Wallet / Exodus · TRON'] } },
    ]
  },
  {
    id: 'exodus', name: 'Exodus', initials: 'E', description: 'Use Mobile ou Desktop', tint: 'exodus',
    downloadUrl: 'https://www.exodus.com/download', sourceUrl: 'https://www.exodus.com/support/en/articles/8598681-tron-and-tron-token-faqs-learn-more-about-trx-and-trc20-tokens', sourceLabel: 'Ajuda oficial Exodus', compatible: true,
    warning: 'Use Exodus Mobile ou Desktop: Exodus Web3 Wallet não suporta TRON. USDT na rede TRON exige recursos de rede; a carteira pode cobrar taxa em TRX.',
    steps: [
      { title: 'Baixe Exodus Mobile ou Desktop', text: 'Use o site exodus.com e selecione o app para seu dispositivo. Exodus Web3 Wallet não oferece suporte à rede TRON.', mockup: { screen: 'Escolher versão', rows: ['Mobile · iOS / Android', 'Desktop · Windows / Mac', 'Web3 Wallet · sem TRON'] } },
      { title: 'Crie e proteja sua carteira', text: 'Crie uma carteira e guarde o backup de recuperação offline. Nunca compartilhe frase, chave privada ou senha.', mockup: { screen: 'Segurança', rows: ['Criar carteira', 'Backup offline', 'Chaves só com você'] } },
      { title: 'Ative TRON e encontre USDT', text: 'Na busca de ativos, filtre pela rede TRON e habilite USDT (TRC-20). Confira o nome da rede no detalhe do ativo.', mockup: { screen: 'Buscar ativo', rows: ['Rede · TRON', 'Ativo · Tether (USDT)', 'Padrão · TRC-20'] } },
      { title: 'Obtenha USDT na rede TRON', text: 'Ao sacar de uma exchange, selecione TRON (TRC-20). Confira se o ativo, endereço e rede de destino correspondem.', mockup: { screen: 'Retirada', rows: ['Ativo · USDT', 'Rede · TRON (TRC-20)', 'Taxa · variável'] } },
      { title: 'Envie e confira a taxa', text: 'Abra USDT (TRON), selecione Enviar e cole o endereço do checkout. Revise endereço e valor. Tenha TRX para recursos de rede se a carteira pedir.', mockup: { screen: 'Enviar ativo', rows: ['USDT · TRON', 'Destino · conferir', 'Taxa máxima · revisar'] } },
      { title: 'Aguarde confirmação', text: 'Confira a atividade e espere o checkout reconhecer a transação. Taxas e tempo de confirmação variam; não repita o envio sem verificar.', mockup: { screen: 'Atividade', rows: ['Transação enviada', 'Confirmação da rede', 'Status do checkout'] } },
    ]
  },
]

export function WalletGuideSection({ variant = 'landing' }: { variant?: 'landing' | 'access' }) {
  const [selectedWallet, setSelectedWallet] = useState<WalletGuide | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const closeModal = useCallback(() => { setSelectedWallet(null); setShowPayment(false) }, [])
  const isAccessPage = variant === 'access'

  return <>
    <section id={isAccessPage ? 'como-pagar' : 'como-comprar'} className={isAccessPage ? 'wallet-guide-section wallet-guide-access' : 'wallet-guide-section wallet-guide-landing'} aria-labelledby={isAccessPage ? 'wallet-access-title' : 'wallet-landing-title'}>
      <div className="wallet-guide-inner">
        <div className="wallet-guide-heading">
          <div>
            <p className="eyebrow">{isAccessPage ? 'precisa pagar?' : 'como comprar · passo 1'}</p>
            <h2 id={isAccessPage ? 'wallet-access-title' : 'wallet-landing-title'} className="display-lg mt-4 text-[#eaf2ec]">{isAccessPage ? 'Prepare uma carteira compatível.' : 'Comece por uma carteira segura.'}</h2>
          </div>
          <p>{isAccessPage ? 'Escolha uma carteira que suporte TRON. Guias abaixo usam mockups e podem divergir das telas atuais do app.' : 'Os cartões abrem guias por carteira com mockups ilustrativos. Menus e taxas podem mudar conforme a versão.'}</p>
        </div>

        <div className="wallet-cards-grid" aria-label="Escolha sua carteira">
          {wallets.map((wallet) => <button key={wallet.id} type="button" onClick={() => { setSelectedWallet(wallet); setShowPayment(false) }} className={'wallet-choice-card wallet-tint-' + wallet.tint} aria-haspopup="dialog" aria-label={'Abrir guia de pagamento com ' + wallet.name}>
            <span className="wallet-choice-top"><span className="wallet-monogram" aria-hidden="true">{wallet.initials}</span>{wallet.recommended && <span className="wallet-recommended">Recomendada</span>}{!wallet.compatible && <span className="wallet-unsupported">Sem TRON</span>}</span>
            <span className="wallet-choice-name">{wallet.name}</span>
            <span className="wallet-choice-description">{wallet.description}</span>
            <span className="wallet-choice-action">{wallet.compatible ? 'Ver passo a passo' : 'Ver compatibilidade'} <ArrowRight size={14} /></span>
          </button>)}
        </div>

        <div className="wallet-network-note"><ShieldAlert size={17} /><p>Envie somente pela rede indicada pelo checkout. USDT TRC-20 precisa de endereço compatível com TRON. Confira endereço, ativo e rede antes de confirmar.</p></div>
        {isAccessPage && <div className="wallet-demo-note"><HelpCircle size={16} /><p>Esta área está em modo demonstração. Checkout, endereço de pagamento e liberação automática ainda não estão configurados.</p></div>}
      </div>
    </section>
    {selectedWallet && <WalletModal wallet={selectedWallet} showPayment={showPayment} onClose={closeModal} onContinue={() => setShowPayment(true)} />}
  </>
}

export function CourseAccessPage() {
  return <div className="mx-auto max-w-[1100px]"><WalletGuideSection variant="access" /></div>
}

function WalletModal({ wallet, showPayment, onClose, onContinue }: { wallet: WalletGuide; showPayment: boolean; onClose: () => void; onContinue: () => void }) {
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

  useEffect(() => { dialogRef.current?.focus() }, [showPayment])

  return createPortal(<div className="wallet-guide-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} className="wallet-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title" tabIndex={-1}>
      <div className="wallet-dialog-header">
        <div className="wallet-dialog-heading">
          <span className={'wallet-monogram wallet-tint-' + wallet.tint} aria-hidden="true">{wallet.initials}</span>
          <div><p className="wallet-dialog-kicker">{showPayment ? 'Próxima etapa' : wallet.compatible ? 'Guia ilustrativo' : 'Compatibilidade da rede'}</p><h2 id="wallet-dialog-title">{showPayment ? 'Pagamento indisponível' : 'Como pagar com ' + wallet.name}</h2></div>
        </div>
        <button ref={closeButtonRef} type="button" onClick={onClose} className="wallet-dialog-close" aria-label="Fechar guia"><X size={20} /></button>
      </div>

      {showPayment ? <div className="wallet-payment-unavailable">
        <span className="wallet-payment-icon"><LockKeyhole size={22} /></span>
        <p className="wallet-dialog-kicker">Sem cobrança nesta demonstração</p>
        <h3>Checkout ainda não configurado.</h3>
        <p>Não há endereço de recebimento nem confirmação automática nesta versão. Não envie USDT. Nenhum pagamento será feito ou acesso liberado por transferência.</p>
        <button type="button" onClick={onClose} className="wallet-primary-button">Entendi, fechar</button>
      </div> : <>
        <div className="wallet-dialog-intro"><p>{wallet.compatible ? 'Etapas simples para preparar e conferir uma transferência em USDT na rede TRON (TRC-20).' : 'Este guia explica por que Phantom não serve para enviar USDT pela rede TRON.'}</p><span><Smartphone size={14} /> Mockups ilustrativos</span></div>
        {wallet.warning && <div className="wallet-warning"><ShieldAlert size={18} /><p>{wallet.warning}</p></div>}
        <div className="wallet-step-list">
          {wallet.steps.map((step, index) => <article key={step.title} className="wallet-step-card">
            <div className="wallet-step-number">{String(index + 1).padStart(2, '0')}</div>
            <WalletMockup wallet={wallet} mockup={step.mockup} />
            <div className="wallet-step-copy"><h3>{step.title}</h3><p>{step.text}</p>{index === 0 && wallet.compatible && <a href={wallet.downloadUrl} target="_blank" rel="noreferrer">Site oficial <ExternalLink size={12} /></a>}</div>
          </article>)}
        </div>
        <div className="wallet-dialog-footer">
          <a className="wallet-source-link" href={wallet.sourceUrl} target="_blank" rel="noreferrer">{wallet.sourceLabel} <ExternalLink size={12} /></a>
          {wallet.compatible ? <button type="button" onClick={onContinue} className="wallet-primary-button">Entendi, quero pagar <ArrowRight size={15} /></button> : <button type="button" onClick={onClose} className="wallet-secondary-button">Escolher outra carteira</button>}
        </div>
      </>}
    </div>
  </div>, document.body)
}

function WalletMockup({ wallet, mockup }: { wallet: WalletGuide; mockup: Mockup }) {
  return <div className={'wallet-mockup wallet-mockup-' + wallet.tint} aria-hidden="true">
    <div className="wallet-mockup-notch" />
    <div className="wallet-mockup-bar"><span>{wallet.name}</span><span>•••</span></div>
    <div className="wallet-mockup-screen-title"><span className="wallet-mockup-orb">{wallet.initials}</span><span>{mockup.screen}</span></div>
    <div className="wallet-mockup-rows">{mockup.rows.map((row, index) => <div key={row}><span>{row}</span>{index === 0 && <Check size={12} />}</div>)}</div>
  </div>
}
