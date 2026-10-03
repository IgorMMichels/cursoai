# Cripto do Zero — Aula 3 do módulo 08: Simulador de exposição e liquidação

- Curso/jornada: Cripto do Zero
- Módulo: 08 — Futuros: long, short e padrões
- ID: `m9l3`
- Áudio: [/audio/narrated/m9l3-d71f18845d39.mp3](/audio/narrated/m9l3-d71f18845d39.mp3)
- Origem do texto: public/audio/narrated/m9l3-d71f18845d39.json
- Método: Texto original usado para gerar o áudio, preservado integralmente nos metadados de narração.

## Transcrição

Simulador de exposição e liquidação.

Este laboratório usa valor nocional e movimento hipotético para mostrar como a direção e a alavancagem mudam o resultado aritmético. Ele não usa preços atuais, não estima chance de liquidação e não reproduz as regras de uma exchange ou contrato.

O resultado simplificado é nocional × variação do preço × direção. A margem inicial é aproximada por nocional ÷ alavancagem. Custos, funding, ajustes, margem de manutenção, slippage, gaps e regras de liquidação podem mudar muito o resultado real — e uma posição pode ser encerrada antes que o cenário selecionado aconteça.

Use a simulação para perguntar “quanto posso perder?” antes de perguntar “quanto posso ganhar?”. Futuros são instrumentos complexos e não são necessários para aprender sobre Bitcoin ou concluir esta trilha.

Para guardar: Simulação de alavancagem ensina escala de risco; não encontra entrada nem sugere operar.
