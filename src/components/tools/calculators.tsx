import { useId, useState } from 'react'
import { RotateCcw, ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'
import { calculatePosition, calculateRecovery, calculateRisk, type PositionDirection } from '@/lib/tool-calculations'

const number = (value: number, digits = 2) => Math.abs(value) >= 1e12 ? value.toLocaleString('pt-BR',{notation:'scientific',maximumFractionDigits:3}) : value.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits === 2 ? 2 : 0 })
const money = (value: number) => `${number(value)} USDT`
const parse = (value: string) => {
  const text = value.trim()
  if (!text) return NaN
  // Vírgula decimal em pt-BR, inclusive quando o valor vem com agrupamento.
  if (text.includes(',')) return /^-?\d+(?:\.\d{3})*,\d+$/.test(text) ? Number(text.replaceAll('.','').replace(',','.')) : NaN
  return Number(text)
}

function Field({ label, value, onChange, suffix, hint }: { label: string; value: string; onChange: (value: string) => void; suffix?: string; hint?: string }) {
  const id = useId()
  return <div className="tool-field"><label htmlFor={id}>{label}</label><div className="tool-input-wrap"><input id={id} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} autoComplete="off" /><span>{suffix}</span></div>{hint && <small id={`${id}-hint`}>{hint}</small>}</div>
}

function Metric({ label, value, accent, detail }: { label: string; value: string; accent?: string; detail?: string }) {
  return <div className={`tool-metric ${accent ?? ''}`}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="tool-note"><Info size={16} /><p>{children}</p></div>
}

function Reset({ onClick }: { onClick: () => void }) {
  return <button className="tool-text-button" onClick={onClick} type="button"><RotateCcw size={14} />Restaurar exemplo</button>
}

const riskExample = { capital:'1000', riskPercent:'1', entry:'60000', stop:'58800', target:'63600', entryFeePercent:'0,1', exitFeePercent:'0,1', leverage:'2' }

export function RiskCalculator() {
  const [values, setValues] = useState(riskExample)
  const [market, setMarket] = useState<'spot' | 'futures'>('spot')
  const [direction, setDirection] = useState<PositionDirection>('long')
  const update = (key: keyof typeof riskExample, value: string) => setValues((old) => ({ ...old, [key]: value }))
  const inputs = Object.fromEntries(Object.entries(values).map(([key,value]) => [key,parse(value)])) as Record<keyof typeof riskExample, number>
  const result = calculateRisk({ ...inputs, market, direction })
  const changeDirection = (next: PositionDirection) => {
    setDirection(next)
    const entry = parse(values.entry)
    if (Number.isFinite(entry) && entry > 0) setValues((old) => ({ ...old, stop:(entry*(next === 'long' ? .98 : 1.02)).toFixed(2), target:(entry*(next === 'long' ? 1.06 : .94)).toFixed(2) }))
  }
  return <div className="calculator-grid">
    <section className="calculator-controls" aria-label="Parâmetros de risco"><div className="calculator-section-head"><h2>Parâmetros</h2><Reset onClick={() => { setValues(riskExample); setMarket('spot'); setDirection('long') }} /></div>
      <div className="tool-field"><label htmlFor="risk-market">Mercado</label><select id="risk-market" value={market} onChange={(event) => { const next = event.target.value as 'spot'|'futures'; setMarket(next); if (next === 'spot') changeDirection('long') }}><option value="spot">Spot · compra do ativo</option><option value="futures">Futuros · contrato linear</option></select></div>
      {market === 'futures' && <div className="tool-segment" aria-label="Direção">{(['long','short'] as const).map((item) => <button key={item} type="button" aria-pressed={direction === item} onClick={() => changeDirection(item)}>{item === 'long' ? 'Long' : 'Short'}</button>)}</div>}
      <div className="tool-fields"><Field label="Banca disponível" value={values.capital} onChange={(v) => update('capital',v)} suffix="USDT" /><Field label="Risco escolhido" value={values.riskPercent} onChange={(v) => update('riskPercent',v)} suffix="%" hint="Percentual definido por você; o exemplo não é uma recomendação." />
      <Field label="Preço de entrada" value={values.entry} onChange={(v) => update('entry',v)} suffix="USDT" /><Field label="Preço do stop" value={values.stop} onChange={(v) => update('stop',v)} suffix="USDT" /><Field label="Preço do alvo" value={values.target} onChange={(v) => update('target',v)} suffix="USDT" />
      {market === 'futures' && <Field label="Alavancagem" value={values.leverage} onChange={(v) => update('leverage',v)} suffix="×" />}
      <Field label="Taxa de entrada" value={values.entryFeePercent} onChange={(v) => update('entryFeePercent',v)} suffix="%" /><Field label="Taxa de saída" value={values.exitFeePercent} onChange={(v) => update('exitFeePercent',v)} suffix="%" /></div>
    </section>
    <section className="calculator-result" aria-label="Resultado da simulação de risco"><div className="calculator-section-head"><h2>Resultado estimado</h2><span className="tool-live-dot">Exemplo fictício</span></div>
      {result.ok ? <>
        <div className="tool-metrics"><Metric label="Perda planejada no stop" value={money(result.value.lossAtStop)} accent="rose" detail="Inclui as taxas informadas" /><Metric label="Quantidade calculada" value={`${number(result.value.quantity,8)} BTC`} accent="lilac" /><Metric label="Exposição na entrada" value={money(result.value.exposure)} /><Metric label="Resultado estimado no alvo" value={money(result.value.profitAtTarget)} accent={result.value.profitAtTarget >= 0 ? 'green' : 'rose'} /><Metric label="Relação ganho/perda líquida" value={`${number(result.value.rewardRiskRatio)} : 1`} /><Metric label={market === 'spot' ? 'Compra + taxa de entrada' : 'Margem + taxa de entrada'} value={money(result.value.requiredCapital)} /></div>
        <div className="tool-explanation"><h3>O que esses números dizem?</h3><p>O risco escolhido corresponde a {money(result.value.riskBudget)} da sua banca. A quantidade é ajustada para que a distância até o stop e as taxas caibam nesse valor. Aproximar o stop aumenta a quantidade; afastá-lo reduz a quantidade, mantendo o mesmo orçamento de risco.</p><p>Dos {money(result.value.lossAtStop)} planejados, {money(result.value.feesAtStop)} são taxas. No alvo, o resultado já desconta {money(result.value.feesAtTarget)} em taxas.</p></div>
      </> : <div className="tool-error" role="status"><h3>Vamos ajustar o cenário</h3><p>{result.error}</p></div>}
      <Note>Modelo didático com execução exatamente nos preços informados. Slippage, gaps, funding e liquidação não estão incluídos. Stop acionado não garante a perda planejada.</Note>
    </section>
  </div>
}

const positionExample = { entry:'60000', exit:'63000', margin:'100', quantity:'0,01', leverage:'2', entryFeePercent:'0,1', exitFeePercent:'0,1', funding:'0' }

export function PositionCalculator() {
  const [values,setValues] = useState(positionExample)
  const [mode,setMode] = useState<'margin'|'quantity'>('margin')
  const [direction,setDirection] = useState<PositionDirection>('long')
  const update = (key: keyof typeof positionExample, value: string) => setValues((old) => ({ ...old,[key]:value }))
  const inputs = Object.fromEntries(Object.entries(values).map(([key,value]) => [key,parse(value)])) as Record<keyof typeof positionExample,number>
  const result = calculatePosition({ ...inputs,direction,...(mode === 'margin' ? {mode,margin:inputs.margin} : {mode,quantity:inputs.quantity}) })
  return <div className="calculator-grid"><section className="calculator-controls" aria-label="Parâmetros da posição"><div className="calculator-section-head"><h2>Parâmetros</h2><Reset onClick={() => {setValues(positionExample);setMode('margin');setDirection('long')}} /></div>
    <div className="tool-segment" aria-label="Direção da posição">{(['long','short'] as const).map((item) => <button key={item} type="button" aria-pressed={direction === item} onClick={() => setDirection(item)}>{item === 'long' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>} {item === 'long' ? 'Long' : 'Short'}</button>)}</div>
    <div className="tool-field"><label htmlFor="position-mode">Como definir a exposição?</label><select id="position-mode" value={mode} onChange={(event) => setMode(event.target.value as 'margin'|'quantity')}><option value="margin">Margem fixa · alavancagem muda a exposição</option><option value="quantity">Quantidade fixa · alavancagem muda a margem</option></select></div>
    <div className="tool-fields"><Field label="Preço de entrada" value={values.entry} onChange={(v) => update('entry',v)} suffix="USDT" /><Field label="Preço de saída" value={values.exit} onChange={(v) => update('exit',v)} suffix="USDT" />
      {mode === 'margin' ? <Field label="Margem informada" value={values.margin} onChange={(v) => update('margin',v)} suffix="USDT" /> : <Field label="Quantidade da posição" value={values.quantity} onChange={(v) => update('quantity',v)} suffix="BTC" />}
      <Field label="Alavancagem" value={values.leverage} onChange={(v) => update('leverage',v)} suffix="×" /><Field label="Taxa de entrada" value={values.entryFeePercent} onChange={(v) => update('entryFeePercent',v)} suffix="%" /><Field label="Taxa de saída" value={values.exitFeePercent} onChange={(v) => update('exitFeePercent',v)} suffix="%" /><Field label="Funding acumulado" value={values.funding} onChange={(v) => update('funding',v)} suffix="USDT" hint="Positivo: pago. Negativo: recebido. Informe o total, não uma taxa." /></div>
    <div className="tool-field"><label htmlFor="leverage-range">Compare a alavancagem: {values.leverage}×</label><input id="leverage-range" type="range" min="1" max="20" step="1" value={Number.isFinite(inputs.leverage) ? Math.min(20,Math.max(1,inputs.leverage)) : 1} onChange={(event) => update('leverage',event.target.value)} /></div>
  </section><section className="calculator-result" aria-label="Resultado da posição"><div className="calculator-section-head"><h2>Resultado estimado</h2><span className="tool-live-dot">Contrato linear</span></div>
    {result.ok ? <><div className={`position-hero ${result.value.netPnl >= 0 ? 'green' : 'rose'}`}><span>Resultado líquido estimado</span><strong>{result.value.netPnl > 0 ? '+' : ''}{money(result.value.netPnl)}</strong><p>Movimento do preço: {number(result.value.priceChangePercent)}% · {direction === 'long' ? 'posição comprada' : 'posição vendida'}</p></div>
      <div className="position-comparison"><div><span>Antes dos custos</span><strong>{money(result.value.grossPnl)}</strong></div><div><span>Taxas de entrada + saída</span><strong>−{money(result.value.totalFees)}</strong></div><div><span>Funding {result.value.funding < 0 ? 'recebido' : 'pago'}</span><strong>{result.value.funding < 0 ? '+' : '−'}{money(Math.abs(result.value.funding))}</strong></div></div>
      <div className="tool-metrics"><Metric label="Exposição na entrada" value={money(result.value.exposure)} accent="cyan" /><Metric label="Quantidade" value={`${number(result.value.quantity,8)} BTC`} /><Metric label="Margem calculada" value={money(result.value.margin)} /><Metric label="Margem + taxa de entrada" value={money(result.value.requiredCapital)} /><Metric label="Resultado / margem" value={`${number(result.value.returnOnMarginPercent)}%`} detail="Não é retorno sobre todo o patrimônio" /></div>
      <div className="tool-explanation"><h3>{mode === 'margin' ? 'Mesma margem, exposição diferente.' : 'Mesma quantidade, margem diferente.'}</h3><p>{mode === 'margin' ? 'Com margem fixa, aumentar a alavancagem aumenta a exposição e os efeitos da variação do preço. Os custos também crescem com a posição.' : 'Com quantidade fixa, mudar a alavancagem altera a margem exigida. O resultado em USDT permanece o mesmo para os mesmos preços e custos.'}</p><p>Long ganha com alta e perde com queda; short faz o caminho inverso, antes de custos. A alavancagem já foi usada para definir a exposição ou a margem e não multiplica o resultado outra vez.</p></div>
      {result.value.netPnl <= -result.value.margin && <div className="tool-error" role="status">A perda calculada alcança ou supera a margem. Uma posição real pode ser liquidada antes da saída informada; este simulador não determina o preço de liquidação.</div>}
    </> : <div className="tool-error" role="status"><h3>Confira os valores</h3><p>{result.error}</p></div>}
    <Note>Simulação de contratos lineares em USDT, sem ordens reais. Não calcula margem de manutenção, liquidação, regras de corretora nem contratos inversos. A taxa e o funding do exemplo são valores fictícios.</Note>
  </section></div>
}

export function RecoveryCalculator() {
  const [loss,setLoss] = useState('50')
  const [capital,setCapital] = useState('1000')
  const result = calculateRecovery(parse(loss))
  const initial = parse(capital)
  const validCapital = Number.isFinite(initial) && initial > 0
  return <div className="calculator-grid"><section className="calculator-controls" aria-label="Parâmetros da recuperação"><div className="calculator-section-head"><h2>Qual foi a queda?</h2><Reset onClick={() => {setLoss('50');setCapital('1000')}} /></div><Field label="Saldo inicial fictício" value={capital} onChange={setCapital} suffix="USDT" /><Field label="Queda do saldo" value={loss} onChange={setLoss} suffix="%" />
    <div className="tool-field"><label htmlFor="loss-range">Explore a queda no controle</label><input id="loss-range" type="range" min="0" max="100" value={Number.isFinite(parse(loss)) ? Math.min(100,Math.max(0,parse(loss))) : 0} onChange={(event) => setLoss(event.target.value)} /></div>
    <div className="recovery-presets" aria-label="Exemplos de queda">{[10,25,50,75,100].map((value) => <button type="button" key={value} aria-pressed={parse(loss) === value} onClick={() => setLoss(String(value))}>{value}%</button>)}</div>
    <Note>Os percentuais partem de saldos diferentes: a queda é sobre o saldo inicial; a recuperação é sobre o saldo restante.</Note>
  </section><section className="calculator-result" aria-label="Resultado da recuperação"><div className="calculator-section-head"><h2>Resultado da recuperação</h2><span className="tool-live-dot">Matemática do saldo</span></div>
    {result.ok && validCapital ? <><div className="recovery-hero"><span>Alta necessária sobre o saldo restante</span><strong>{result.value.recoveryPercent === null ? 'Sem percentual finito' : `+${number(result.value.recoveryPercent)}%`}</strong><p>{result.value.recoveryPercent === null ? 'Saldo zero não cresce por multiplicação percentual.' : `Depois de cair ${number(result.value.lossPercent)}%, restam ${number(result.value.remainingPercent)}% do saldo inicial.`}</p></div>
      <div className="recovery-bars"><div><span>Antes da queda</span><div className="recovery-track"><i style={{width:'100%'}} /></div><strong>{money(initial)}</strong></div><div><span>Depois da queda</span><div className="recovery-track"><i style={{width:`${result.value.remainingPercent}%`}} /></div><strong>{money(initial*(result.value.remainingPercent/100))}</strong></div></div>
      <div className="tool-explanation"><h3>{parse(loss) === 100 ? 'Por que não aparece um número?' : 'Por que queda e recuperação não se anulam?'}</h3><p>{result.value.recoveryPercent === null ? 'Com perda total, o ponto de partida é zero. Qualquer percentual multiplicado por zero continua zero; um novo aporte seria outra situação, fora deste cálculo.' : `Você saiu de ${money(initial)} para ${money(initial*(result.value.remainingPercent/100))}. Para voltar ao saldo inicial, precisa recuperar ${money(initial*(result.value.lossPercent/100))} a partir dessa base menor.`}</p><p>A fórmula é: queda ÷ (100 − queda) × 100. Por isso, perder 50% exige subir 100%. A ferramenta explica a relação matemática; não estima a chance ou o prazo de recuperação.</p></div>
    </> : <div className="tool-error" role="status">{!validCapital ? 'Informe um saldo inicial maior que zero.' : !result.ok ? result.error : ''}</div>}
    <Note>Modelo sem novos aportes, retiradas, custos ou inflação. Não representa previsão de preço nem promessa de recuperar perdas.</Note>
  </section></div>
}
