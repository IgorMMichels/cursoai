export type CalculationResult<T> = { ok: true; value: T } | { ok: false; error: string }
export type PositionDirection = 'long' | 'short'

export interface RiskInput {
  market: 'spot' | 'futures'
  direction: PositionDirection
  capital: number
  riskPercent: number
  entry: number
  stop: number
  target: number
  entryFeePercent: number
  exitFeePercent: number
  leverage?: number
}

export interface RiskResult {
  quantity: number
  exposure: number
  riskBudget: number
  lossAtStop: number
  grossLossAtStop: number
  feesAtStop: number
  profitAtTarget: number
  feesAtTarget: number
  rewardRiskRatio: number
  requiredCapital: number
  margin: number
}

export type PositionInput = {
  direction: PositionDirection
  entry: number
  exit: number
  leverage: number
  entryFeePercent: number
  exitFeePercent: number
  /** Valor na moeda de cotação: positivo é custo pago; negativo é recebido. */
  funding: number
  capital?: number
} & ({ mode: 'margin'; margin: number } | { mode: 'quantity'; quantity: number })

export interface PositionResult {
  quantity: number
  exposure: number
  margin: number
  requiredCapital: number
  grossPnl: number
  netPnl: number
  entryFee: number
  exitFee: number
  totalFees: number
  funding: number
  returnOnMarginPercent: number
  priceChangePercent: number
}

export interface RecoveryResult {
  lossPercent: number
  remainingPercent: number
  recoveryPercent: number | null
  multiplier: number | null
}

const failure = (error: string): { ok: false; error: string } => ({ ok: false, error })
const positive = (value: number) => Number.isFinite(value) && value > 0
const feeValid = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100
const directionValid = (direction: string) => direction === 'long' || direction === 'short'
const allFinite = (value: Record<string, number>) => Object.values(value).every(Number.isFinite)

/** Modelo linear, execução exatamente no preço do stop, sem slippage nem liquidação. */
export function calculateRisk(input: RiskInput): CalculationResult<RiskResult> {
  const { market, direction, capital, riskPercent, entry, stop, target, entryFeePercent, exitFeePercent } = input
  if (market !== 'spot' && market !== 'futures') return failure('Escolha spot ou futuros.')
  if (!directionValid(direction)) return failure('Escolha long ou short.')
  if (market === 'spot' && direction !== 'long') return failure('Spot representa a compra de um ativo; short exige o modelo de futuros.')
  if (![capital, entry, stop, target].every(positive)) return failure('Banca e preços precisam ser números maiores que zero.')
  if (!positive(riskPercent) || riskPercent > 100) return failure('O risco precisa ser maior que 0% e até 100% da banca.')
  if (!feeValid(entryFeePercent) || !feeValid(exitFeePercent)) return failure('As taxas precisam estar entre 0% e 100%.')
  if (direction === 'long' ? stop >= entry || target <= entry : stop <= entry || target >= entry) {
    return failure(direction === 'long' ? 'No long, o stop fica abaixo da entrada e o alvo acima.' : 'No short, o stop fica acima da entrada e o alvo abaixo.')
  }
  const leverage = market === 'spot' ? 1 : input.leverage
  if (!positive(leverage ?? NaN) || (leverage ?? 0) < 1) return failure('A alavancagem precisa ser um número igual ou maior que 1.')
  const riskBudget = capital * (riskPercent / 100)
  const distance = Math.abs(entry - stop)
  const stopCostPerUnit = entry * (entryFeePercent / 100) + stop * (exitFeePercent / 100)
  const quantity = riskBudget / (distance + stopCostPerUnit)
  const exposure = quantity * entry
  const margin = exposure / (leverage as number)
  const requiredCapital = margin + exposure * (entryFeePercent / 100)
  const grossLossAtStop = quantity * distance
  const feesAtStop = quantity * stopCostPerUnit
  const lossAtStop = grossLossAtStop + feesAtStop
  const feesAtTarget = quantity * (entry * (entryFeePercent / 100) + target * (exitFeePercent / 100))
  const profitAtTarget = quantity * Math.abs(target - entry) - feesAtTarget
  const value = { quantity, exposure, riskBudget, lossAtStop, grossLossAtStop, feesAtStop, profitAtTarget, feesAtTarget, rewardRiskRatio: profitAtTarget / lossAtStop, requiredCapital, margin }
  if (!allFinite(value) || quantity <= 0 || lossAtStop <= 0) return failure('Os valores ultrapassam os limites do cálculo. Use números menores.')
  if (requiredCapital > capital * (1 + 1e-12)) return failure(market === 'spot' ? 'A banca não cobre essa posição e a taxa de entrada. Reduza o risco ou aumente a distância do stop.' : 'A banca não cobre a margem e a taxa de entrada dessa posição. Reduza o risco ou revise o cenário.')
  return { ok: true, value }
}

/** Contratos lineares na moeda de cotação. Alavancagem dimensiona margem, nunca multiplica P&L novamente. */
export function calculatePosition(input: PositionInput): CalculationResult<PositionResult> {
  if (!directionValid(input.direction)) return failure('Escolha long ou short.')
  if (![input.entry, input.exit].every(positive)) return failure('Os preços de entrada e saída precisam ser maiores que zero.')
  if (!positive(input.leverage) || input.leverage < 1) return failure('A alavancagem precisa ser igual ou maior que 1.')
  if (!feeValid(input.entryFeePercent) || !feeValid(input.exitFeePercent)) return failure('As taxas precisam estar entre 0% e 100%.')
  if (!Number.isFinite(input.funding)) return failure('Informe um funding válido: positivo para custo e negativo para recebimento.')
  if (input.capital !== undefined && !positive(input.capital)) return failure('A banca disponível precisa ser maior que zero.')
  if (input.mode !== 'margin' && input.mode !== 'quantity') return failure('Escolha margem fixa ou quantidade definida.')
  if (input.mode === 'margin' ? !positive(input.margin) : !positive(input.quantity)) return failure('A margem ou a quantidade precisa ser maior que zero.')
  const quantity = input.mode === 'margin' ? input.margin * input.leverage / input.entry : input.quantity
  const exposure = quantity * input.entry
  const margin = input.mode === 'margin' ? input.margin : exposure / input.leverage
  const entryFee = exposure * (input.entryFeePercent / 100)
  const exitFee = quantity * input.exit * (input.exitFeePercent / 100)
  const totalFees = entryFee + exitFee
  const grossPnl = quantity * (input.exit - input.entry) * (input.direction === 'long' ? 1 : -1)
  const netPnl = grossPnl - totalFees - input.funding
  const requiredCapital = margin + entryFee
  const value = { quantity, exposure, margin, requiredCapital, grossPnl, netPnl, entryFee, exitFee, totalFees, funding: input.funding, returnOnMarginPercent: netPnl / margin * 100, priceChangePercent: (input.exit - input.entry) / input.entry * 100 }
  if (!allFinite(value) || quantity <= 0 || margin <= 0) return failure('Os valores ultrapassam os limites do cálculo. Use números menores.')
  if (input.capital !== undefined && requiredCapital > input.capital * (1 + 1e-12)) return failure('A banca não cobre a margem e a taxa de entrada. Reduza a posição.')
  return { ok: true, value }
}

export function calculateRecovery(lossPercent: number): CalculationResult<RecoveryResult> {
  if (!Number.isFinite(lossPercent) || lossPercent < 0 || lossPercent > 100) return failure('A queda precisa estar entre 0% e 100%.')
  const remainingPercent = 100 - lossPercent
  // Saldo zero não admite recuperação percentual finita.
  return { ok: true, value: { lossPercent, remainingPercent, recoveryPercent: remainingPercent === 0 ? null : lossPercent / remainingPercent * 100, multiplier: remainingPercent === 0 ? null : 100 / remainingPercent } }
}
