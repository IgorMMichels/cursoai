import { translateUi, translateTemplate, getUiLocale } from '@/lib/ui-translation'
import { useTranslation as useUiTranslation } from 'react-i18next'
import { useId, useState } from 'react'
import { RotateCcw, ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'
import { calculatePosition, calculateRecovery, calculateRisk, type PositionDirection } from '@/lib/tool-calculations'

const number = (value: number, digits = 2) => Math.abs(value) >= 1e12 ? value.toLocaleString(getUiLocale(),{notation:'scientific',maximumFractionDigits:3}) : value.toLocaleString(getUiLocale(), { maximumFractionDigits: digits, minimumFractionDigits: digits === 2 ? 2 : 0 })
const money = (value: number) => `${number(value)} USDT`
const parse = (value: string) => {
  const text = value.trim()
  if (!text) return NaN
  // Vírgula decimal em pt-BR, inclusive quando o valor vem com agrupamento.
  if (text.includes(',')) return /^-?\d+(?:\.\d{3})*,\d+$/.test(text) ? Number(text.replaceAll('.','').replace(',','.')) : NaN
  return Number(text)
}

function Field({ label, value, onChange, suffix, hint }: { label: string; value: string; onChange: (value: string) => void; suffix?: string; hint?: string }) {
  useUiTranslation();
  const id = useId()
  return <div className="tool-field"><label htmlFor={id}>{translateUi(label)}</label><div className="tool-input-wrap"><input id={id} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} autoComplete="off" /><span>{translateUi(suffix)}</span></div>{hint && <small id={`${id}-hint`}>{translateUi(hint)}</small>}</div>
}

function Metric({ label, value, accent, detail }: { label: string; value: string; accent?: string; detail?: string }) {
  useUiTranslation();
  return <div className={`tool-metric ${accent ?? ''}`}><span>{translateUi(label)}</span><strong>{translateUi(value)}</strong>{detail && <small>{translateUi(detail)}</small>}</div>
}

function Note({ children }: { children: React.ReactNode }) {
  useUiTranslation();
  return <div className="tool-note"><Info size={16} /><p>{translateUi(children)}</p></div>
}

function Reset({ onClick }: { onClick: () => void }) {
  useUiTranslation();
  return <button className="tool-text-button" onClick={onClick} type="button"><RotateCcw size={14} />{translateUi("Restaurar exemplo")}</button>
}

const riskExample = { capital:'1000', riskPercent:'1', entry:'60000', stop:'58800', target:'63600', entryFeePercent:'0,1', exitFeePercent:'0,1', leverage:'2' }

export function RiskCalculator() {
  useUiTranslation();
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
    <section className="calculator-controls" aria-label={translateUi("Parâmetros de risco")}><div className="calculator-section-head"><h2>{translateUi("Parâmetros")}</h2><Reset onClick={() => { setValues(riskExample); setMarket('spot'); setDirection('long') }} /></div>
      <div className="tool-field"><label htmlFor="risk-market">{translateUi("Mercado")}</label><select id="risk-market" value={market} onChange={(event) => { const next = event.target.value as 'spot'|'futures'; setMarket(next); if (next === 'spot') changeDirection('long') }}><option value="spot">{translateUi("Spot · compra do ativo")}</option><option value="futures">{translateUi("Futuros · contrato linear")}</option></select></div>
      {market === 'futures' && <div className="tool-segment" aria-label={translateUi("Direção")}>{(['long','short'] as const).map((item) => <button key={item} type="button" aria-pressed={direction === item} onClick={() => changeDirection(item)}>{translateUi(item === 'long' ? 'Long' : 'Short')}</button>)}</div>}
      <div className="tool-fields"><Field label={translateUi("Banca disponível")} value={values.capital} onChange={(v) => update('capital',v)} suffix="USDT" /><Field label={translateUi("Risco escolhido")} value={values.riskPercent} onChange={(v) => update('riskPercent',v)} suffix="%" hint="Percentual definido por você; o exemplo não é uma recomendação." />
      <Field label={translateUi("Preço de entrada")} value={values.entry} onChange={(v) => update('entry',v)} suffix="USDT" /><Field label={translateUi("Preço do stop")} value={values.stop} onChange={(v) => update('stop',v)} suffix="USDT" /><Field label={translateUi("Preço do alvo")} value={values.target} onChange={(v) => update('target',v)} suffix="USDT" />
      {market === 'futures' && <Field label={translateUi("Alavancagem")} value={values.leverage} onChange={(v) => update('leverage',v)} suffix="×" />}
      <Field label={translateUi("Taxa de entrada")} value={values.entryFeePercent} onChange={(v) => update('entryFeePercent',v)} suffix="%" /><Field label={translateUi("Taxa de saída")} value={values.exitFeePercent} onChange={(v) => update('exitFeePercent',v)} suffix="%" /></div>
    </section>
    <section className="calculator-result" aria-label={translateUi("Resultado da simulação de risco")}><div className="calculator-section-head"><h2>{translateUi("Resultado estimado")}</h2><span className="tool-live-dot">{translateUi("Exemplo fictício")}</span></div>
      {result.ok ? <>
        <div className="tool-metrics"><Metric label={translateUi("Perda planejada no stop")} value={money(result.value.lossAtStop)} accent="rose" detail="Inclui as taxas informadas" /><Metric label={translateUi("Quantidade calculada")} value={`${number(result.value.quantity,8)} BTC`} accent="lilac" /><Metric label={translateUi("Exposição na entrada")} value={money(result.value.exposure)} /><Metric label={translateUi("Resultado estimado no alvo")} value={money(result.value.profitAtTarget)} accent={result.value.profitAtTarget >= 0 ? 'green' : 'rose'} /><Metric label={translateUi("Relação ganho/perda líquida")} value={`${number(result.value.rewardRiskRatio)} : 1`} /><Metric label={translateUi(market === 'spot' ? 'Compra + taxa de entrada' : 'Margem + taxa de entrada')} value={money(result.value.requiredCapital)} /></div>
        <div className="tool-explanation"><h3>{translateUi("O que esses números dizem?")}</h3><p>{translateUi("O risco escolhido corresponde a ")}{translateUi(money(result.value.riskBudget))} {translateUi(" da sua banca. A quantidade é ajustada para que a distância até o stop e as taxas caibam nesse valor. Aproximar o stop aumenta a quantidade; afastá-lo reduz a quantidade, mantendo o mesmo orçamento de risco.")}</p><p>{translateUi("Dos ")}{translateUi(money(result.value.lossAtStop))} {translateUi(" planejados, ")}{translateUi(money(result.value.feesAtStop))} {translateUi(" são taxas. No alvo, o resultado já desconta ")}{translateUi(money(result.value.feesAtTarget))} {translateUi(" em taxas.")}</p></div>
      </> : <div className="tool-error" role="status"><h3>{translateUi("Vamos ajustar o cenário")}</h3><p>{translateUi(result.error)}</p></div>}
      <Note>{translateUi("Modelo didático com execução exatamente nos preços informados. Slippage, gaps, funding e liquidação não estão incluídos. Stop acionado não garante a perda planejada.")}</Note>
    </section>
  </div>
}

const positionExample = { entry:'60000', exit:'63000', margin:'100', quantity:'0,01', leverage:'2', entryFeePercent:'0,1', exitFeePercent:'0,1', funding:'0' }

export function PositionCalculator() {
  useUiTranslation();
  const [values,setValues] = useState(positionExample)
  const [mode,setMode] = useState<'margin'|'quantity'>('margin')
  const [direction,setDirection] = useState<PositionDirection>('long')
  const update = (key: keyof typeof positionExample, value: string) => setValues((old) => ({ ...old,[key]:value }))
  const inputs = Object.fromEntries(Object.entries(values).map(([key,value]) => [key,parse(value)])) as Record<keyof typeof positionExample,number>
  const result = calculatePosition({ ...inputs,direction,...(mode === 'margin' ? {mode,margin:inputs.margin} : {mode,quantity:inputs.quantity}) })
  return <div className="calculator-grid"><section className="calculator-controls" aria-label={translateUi("Parâmetros da posição")}><div className="calculator-section-head"><h2>{translateUi("Parâmetros")}</h2><Reset onClick={() => {setValues(positionExample);setMode('margin');setDirection('long')}} /></div>
    <div className="tool-segment" aria-label={translateUi("Direção da posição")}>{(['long','short'] as const).map((item) => <button key={item} type="button" aria-pressed={direction === item} onClick={() => setDirection(item)}>{item === 'long' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>} {translateUi(item === 'long' ? 'Long' : 'Short')}</button>)}</div>
    <div className="tool-field"><label htmlFor="position-mode">{translateUi("Como definir a exposição?")}</label><select id="position-mode" value={mode} onChange={(event) => setMode(event.target.value as 'margin'|'quantity')}><option value="margin">{translateUi("Margem fixa · alavancagem muda a exposição")}</option><option value="quantity">{translateUi("Quantidade fixa · alavancagem muda a margem")}</option></select></div>
    <div className="tool-fields"><Field label={translateUi("Preço de entrada")} value={values.entry} onChange={(v) => update('entry',v)} suffix="USDT" /><Field label={translateUi("Preço de saída")} value={values.exit} onChange={(v) => update('exit',v)} suffix="USDT" />
      {mode === 'margin' ? <Field label={translateUi("Margem informada")} value={values.margin} onChange={(v) => update('margin',v)} suffix="USDT" /> : <Field label={translateUi("Quantidade da posição")} value={values.quantity} onChange={(v) => update('quantity',v)} suffix="BTC" />}
      <Field label={translateUi("Alavancagem")} value={values.leverage} onChange={(v) => update('leverage',v)} suffix="×" /><Field label={translateUi("Taxa de entrada")} value={values.entryFeePercent} onChange={(v) => update('entryFeePercent',v)} suffix="%" /><Field label={translateUi("Taxa de saída")} value={values.exitFeePercent} onChange={(v) => update('exitFeePercent',v)} suffix="%" /><Field label={translateUi("Funding acumulado")} value={values.funding} onChange={(v) => update('funding',v)} suffix="USDT" hint="Positivo: pago. Negativo: recebido. Informe o total, não uma taxa." /></div>
    <div className="tool-field"><label htmlFor="leverage-range">{translateUi("Compare a alavancagem: ")}{translateUi(values.leverage)}×</label><input id="leverage-range" type="range" min="1" max="20" step="1" value={Number.isFinite(inputs.leverage) ? Math.min(20,Math.max(1,inputs.leverage)) : 1} onChange={(event) => update('leverage',event.target.value)} /></div>
  </section><section className="calculator-result" aria-label={translateUi("Resultado da posição")}><div className="calculator-section-head"><h2>{translateUi("Resultado estimado")}</h2><span className="tool-live-dot">{translateUi("Contrato linear")}</span></div>
    {result.ok ? <><div className={`position-hero ${result.value.netPnl >= 0 ? 'green' : 'rose'}`}><span>{translateUi("Resultado líquido estimado")}</span><strong>{translateUi(result.value.netPnl > 0 ? '+' : '')}{translateUi(money(result.value.netPnl))}</strong><p>{translateUi("Movimento do preço: ")}{translateUi(number(result.value.priceChangePercent))}% · {translateUi(direction === 'long' ? 'posição comprada' : 'posição vendida')}</p></div>
      <div className="position-comparison"><div><span>{translateUi("Antes dos custos")}</span><strong>{translateUi(money(result.value.grossPnl))}</strong></div><div><span>{translateUi("Taxas de entrada + saída")}</span><strong>−{translateUi(money(result.value.totalFees))}</strong></div><div><span>{translateUi("Funding ")}{translateUi(result.value.funding < 0 ? 'recebido' : 'pago')}</span><strong>{translateUi(result.value.funding < 0 ? '+' : '−')}{translateUi(money(Math.abs(result.value.funding)))}</strong></div></div>
      <div className="tool-metrics"><Metric label={translateUi("Exposição na entrada")} value={money(result.value.exposure)} accent="cyan" /><Metric label={translateUi("Quantidade")} value={`${number(result.value.quantity,8)} BTC`} /><Metric label={translateUi("Margem calculada")} value={money(result.value.margin)} /><Metric label={translateUi("Margem + taxa de entrada")} value={money(result.value.requiredCapital)} /><Metric label={translateUi("Resultado / margem")} value={`${number(result.value.returnOnMarginPercent)}%`} detail="Não é retorno sobre todo o patrimônio" /></div>
      <div className="tool-explanation"><h3>{translateUi(mode === 'margin' ? 'Mesma margem, exposição diferente.' : 'Mesma quantidade, margem diferente.')}</h3><p>{translateUi(mode === 'margin' ? 'Com margem fixa, aumentar a alavancagem aumenta a exposição e os efeitos da variação do preço. Os custos também crescem com a posição.' : 'Com quantidade fixa, mudar a alavancagem altera a margem exigida. O resultado em USDT permanece o mesmo para os mesmos preços e custos.')}</p><p>{translateUi("Long ganha com alta e perde com queda; short faz o caminho inverso, antes de custos. A alavancagem já foi usada para definir a exposição ou a margem e não multiplica o resultado outra vez.")}</p></div>
      {result.value.netPnl <= -result.value.margin && <div className="tool-error" role="status">{translateUi("A perda calculada alcança ou supera a margem. Uma posição real pode ser liquidada antes da saída informada; este simulador não determina o preço de liquidação.")}</div>}
    </> : <div className="tool-error" role="status"><h3>{translateUi("Confira os valores")}</h3><p>{translateUi(result.error)}</p></div>}
    <Note>{translateUi("Simulação de contratos lineares em USDT, sem ordens reais. Não calcula margem de manutenção, liquidação, regras de corretora nem contratos inversos. A taxa e o funding do exemplo são valores fictícios.")}</Note>
  </section></div>
}

export function RecoveryCalculator() {
  useUiTranslation();
  const [loss,setLoss] = useState('50')
  const [capital,setCapital] = useState('1000')
  const result = calculateRecovery(parse(loss))
  const initial = parse(capital)
  const validCapital = Number.isFinite(initial) && initial > 0
  return <div className="calculator-grid"><section className="calculator-controls" aria-label={translateUi("Parâmetros da recuperação")}><div className="calculator-section-head"><h2>{translateUi("Qual foi a queda?")}</h2><Reset onClick={() => {setLoss('50');setCapital('1000')}} /></div><Field label={translateUi("Saldo inicial fictício")} value={capital} onChange={setCapital} suffix="USDT" /><Field label={translateUi("Queda do saldo")} value={loss} onChange={setLoss} suffix="%" />
    <div className="tool-field"><label htmlFor="loss-range">{translateUi("Explore a queda no controle")}</label><input id="loss-range" type="range" min="0" max="100" value={Number.isFinite(parse(loss)) ? Math.min(100,Math.max(0,parse(loss))) : 0} onChange={(event) => setLoss(event.target.value)} /></div>
    <div className="recovery-presets" aria-label={translateUi("Exemplos de queda")}>{[10,25,50,75,100].map((value) => <button type="button" key={value} aria-pressed={parse(loss) === value} onClick={() => setLoss(String(value))}>{translateUi(value)}%</button>)}</div>
    <Note>{translateUi("Os percentuais partem de saldos diferentes: a queda é sobre o saldo inicial; a recuperação é sobre o saldo restante.")}</Note>
  </section><section className="calculator-result" aria-label={translateUi("Resultado da recuperação")}><div className="calculator-section-head"><h2>{translateUi("Resultado da recuperação")}</h2><span className="tool-live-dot">{translateUi("Matemática do saldo")}</span></div>
    {result.ok && validCapital ? <><div className="recovery-hero"><span>{translateUi("Alta necessária sobre o saldo restante")}</span><strong>{translateUi(result.value.recoveryPercent === null ? 'Sem percentual finito' : translateTemplate("+{{value0}}%", [number(result.value.recoveryPercent)]))}</strong><p>{translateUi(result.value.recoveryPercent === null ? 'Saldo zero não cresce por multiplicação percentual.' : translateTemplate("Depois de cair {{value0}}%, restam {{value1}}% do saldo inicial.", [number(result.value.lossPercent), number(result.value.remainingPercent)]))}</p></div>
      <div className="recovery-bars"><div><span>{translateUi("Antes da queda")}</span><div className="recovery-track"><i style={{width:'100%'}} /></div><strong>{translateUi(money(initial))}</strong></div><div><span>{translateUi("Depois da queda")}</span><div className="recovery-track"><i style={{width:`${result.value.remainingPercent}%`}} /></div><strong>{translateUi(money(initial*(result.value.remainingPercent/100)))}</strong></div></div>
      <div className="tool-explanation"><h3>{translateUi(parse(loss) === 100 ? 'Por que não aparece um número?' : 'Por que queda e recuperação não se anulam?')}</h3><p>{translateUi(result.value.recoveryPercent === null ? 'Com perda total, o ponto de partida é zero. Qualquer percentual multiplicado por zero continua zero; um novo aporte seria outra situação, fora deste cálculo.' : translateTemplate("Você saiu de {{value0}} para {{value1}}. Para voltar ao saldo inicial, precisa recuperar {{value2}} a partir dessa base menor.", [money(initial), money(initial*(result.value.remainingPercent/100)), money(initial*(result.value.lossPercent/100))]))}</p><p>{translateUi("A fórmula é: queda ÷ (100 − queda) × 100. Por isso, perder 50% exige subir 100%. A ferramenta explica a relação matemática; não estima a chance ou o prazo de recuperação.")}</p></div>
    </> : <div className="tool-error" role="status">{translateUi(!validCapital ? 'Informe um saldo inicial maior que zero.' : !result.ok ? result.error : '')}</div>}
    <Note>{translateUi("Modelo sem novos aportes, retiradas, custos ou inflação. Não representa previsão de preço nem promessa de recuperar perdas.")}</Note>
  </section></div>
}
