# Jornada de Memecoins — Aula 3 do módulo 03: Slippage, taxas e MEV

- Curso/jornada: Jornada de Memecoins
- Módulo: 03 — Operação
- ID: `meme-m3l3`
- Áudio: [/audio/journeys/meme-m3l3.mp3](/audio/journeys/meme-m3l3.mp3)
- Origem do texto: public/audio/journeys/meme-m3l3.json
- Método: Texto original usado para gerar o áudio, preservado integralmente nos metadados de narração.

## Transcrição

Slippage, taxas e MEV. Todo swap tem custos além do preço. O slippage é a diferença entre o preço que você viu e o que executou — em pools rasos, ele explode. A tolerância de slippage é o limite que você aceita; alta demais, vira convite para abuso. Somam-se a taxa do pool, a taxa da rede e, em redes congestionadas, a taxa de prioridade para entrar no bloco.

Existe ainda o MEV: robôs que observam as transações pendentes e lucram reordenando-as. O ataque clássico é o sandwich — o robô compra antes de você, sua ordem sobe o preço, ele vende em seguida. Sua perda, o lucro dele. Defesas práticas: tolerância mínima que execute, ordens menores, rotas de proteção contra MEV quando disponíveis. E atenção: token que só compra com slippage altíssimo costuma ser armadilha de taxa.
