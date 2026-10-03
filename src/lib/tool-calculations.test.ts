/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePosition, calculateRecovery, calculateRisk } from './tool-calculations.ts'

const riskInput = { market: 'spot', direction: 'long', capital: 10000, riskPercent: 1, entry: 100, stop: 90, target: 120, entryFeePercent: 0, exitFeePercent: 0 } as const
const positionInput = { direction: 'long', mode: 'margin', entry: 100, exit: 110, margin: 100, leverage: 5, entryFeePercent: 0, exitFeePercent: 0, funding: 0 } as const

test('risk sizes a spot position from loss budget and validates capital', () => {
  const result = calculateRisk(riskInput)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.value.quantity, 10)
  assert.equal(result.value.lossAtStop, 100)
  assert.equal(result.value.profitAtTarget, 200)
  assert.equal(result.value.rewardRiskRatio, 2)
  assert.equal(calculateRisk({ ...riskInput, stop: 99.99 }).ok, false)
})

test('risk includes entry and stop fees inside the chosen risk budget', () => {
  const result = calculateRisk({ ...riskInput, entryFeePercent: 1, exitFeePercent: 1 })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.ok(Math.abs(result.value.quantity - 100 / 11.9) < 1e-10)
  assert.ok(Math.abs(result.value.lossAtStop - 100) < 1e-10)
})

test('short futures invert stop and target and require margin plus entry fee', () => {
  const result = calculateRisk({ ...riskInput, market: 'futures', direction: 'short', stop: 110, target: 80, leverage: 5 })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.value.margin, 200)
  assert.equal(result.value.profitAtTarget, 200)
  assert.equal(calculateRisk({ ...riskInput, direction: 'short' }).ok, false)
  assert.equal(calculateRisk({ ...riskInput, market: 'futures', stop: 99.99, leverage: 2 }).ok, false)
})

test('position derives quantity once from margin and separates fees and signed funding', () => {
  const result = calculatePosition({ ...positionInput, entryFeePercent: 1, exitFeePercent: 1, funding: 3 })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.value.quantity, 5)
  assert.equal(result.value.grossPnl, 50)
  assert.equal(result.value.entryFee, 5)
  assert.equal(result.value.exitFee, 5.5)
  assert.equal(result.value.netPnl, 36.5)
})

test('fixed quantity leverage changes margin, never gross profit', () => {
  const a = calculatePosition({ ...positionInput, mode: 'quantity', quantity: 5, leverage: 2 })
  const b = calculatePosition({ ...positionInput, mode: 'quantity', quantity: 5, leverage: 10 })
  assert.equal(a.ok, true)
  assert.equal(b.ok, true)
  if (!a.ok || !b.ok) return
  assert.equal(a.value.grossPnl, b.value.grossPnl)
  assert.equal(a.value.margin, 250)
  assert.equal(b.value.margin, 50)
  const short = calculatePosition({ ...positionInput, direction: 'short', exit: 90, funding: -5 })
  assert.equal(short.ok, true)
  if (short.ok) assert.equal(short.value.netPnl, 55)
})

test('recovery handles zero, 50%, near-total and total loss without infinity', () => {
  assert.deepEqual(calculateRecovery(50), { ok: true, value: { lossPercent: 50, remainingPercent: 50, recoveryPercent: 100, multiplier: 2 } })
  const total = calculateRecovery(100)
  assert.equal(total.ok, true)
  if (total.ok) assert.equal(total.value.recoveryPercent, null)
  const zero = calculateRecovery(0)
  if (zero.ok) assert.equal(zero.value.recoveryPercent, 0)
  const near = calculateRecovery(99.9)
  if (near.ok) assert.ok(Math.abs((near.value.recoveryPercent ?? 0) - 99900) < 1e-5)
})

test('rejects invalid directions, non-finite values, fees, capital and overflow', () => {
  for (const entry of [0, -1, NaN, Infinity]) assert.equal(calculateRisk({ ...riskInput, entry }).ok, false)
  assert.equal(calculateRisk({ ...riskInput, stop: 110 }).ok, false)
  assert.equal(calculateRisk({ ...riskInput, target: 80 }).ok, false)
  assert.equal(calculateRisk({ ...riskInput, riskPercent: 101 }).ok, false)
  assert.equal(calculatePosition({ ...positionInput, capital: 10 }).ok, false)
  assert.equal(calculatePosition({ ...positionInput, leverage: 0 }).ok, false)
  assert.equal(calculatePosition({ ...positionInput, entryFeePercent: -1 }).ok, false)
  assert.equal(calculatePosition({ ...positionInput, margin: Number.MAX_VALUE }).ok, false)
  for (const loss of [-1, 101, NaN, Infinity]) assert.equal(calculateRecovery(loss).ok, false)
})
