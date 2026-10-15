import assert from 'node:assert/strict'
import test from 'node:test'
import { formatCpf, isValidCpf, onlyDigits } from './cpf.ts'

test('accepts CPFs with valid check digits, with or without mask', () => {
  assert.equal(isValidCpf('529.982.247-25'), true)
  assert.equal(isValidCpf('52998224725'), true)
})

test('rejects wrong check digits, repeated digits and wrong length', () => {
  assert.equal(isValidCpf('529.982.247-24'), false)
  assert.equal(isValidCpf('11111111111'), false)
  assert.equal(isValidCpf('1234567890'), false)
  assert.equal(isValidCpf(''), false)
})

test('formats progressively while typing', () => {
  assert.equal(formatCpf('5299'), '529.9')
  assert.equal(formatCpf('52998224725'), '529.982.247-25')
  assert.equal(formatCpf('529982247259999'), '529.982.247-25')
  assert.equal(onlyDigits(formatCpf('52998224725')), '52998224725')
})
