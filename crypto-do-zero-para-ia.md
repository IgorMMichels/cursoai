# Crypto do Zero — Contexto Completo para uma IA do Zero

> **Objetivo deste arquivo:** dar a uma IA (sem nenhum conhecimento prévio) todo o contexto necessário para entender o que é "crypto", como funciona, quais são os conceitos, atores, tecnologias, riscos e casos de uso. Leia de cima para baixo.

**Idioma:** Português (pt-BR)
**Nível:** Zero absoluto → intermediário
**Escopo:** Bitcoin, Blockchain, Ethereum, DeFi, NFTs, Stablecoins, Exchanges, Segurança, Regulação

---

## 1. TL;DR — Explicação em 30 segundos

**Crypto (criptomoeda/criptoativo)** é dinheiro e valor digital que funciona **sem banco central, sem governo e sem intermediário**, usando uma tecnologia chamada **blockchain**.

Pense assim:
1. **Blockchain = caderno público imutável** onde todo mundo anota quem enviou o quê para quem.
2. **Criptomoeda = a moeda** que circula nesse caderno (ex: Bitcoin = BTC, Ether = ETH).
3. **Descentralização =** ninguém é dono do caderno — milhares de computadores no mundo têm uma cópia igual.
4. **Criptografia =** matemática que garante que só o dono pode gastar suas moedas e ninguém pode falsificar.

Se você entendeu isso, você já entendeu 80%.

---

## 2. Analogias Fundamentais (para IA entender intuição)

### 2.1. Blockchain = Livro-caixa compartilhado
Imagine uma planilha Google Sheets pública onde:
- Toda transferência é uma linha nova: `Alice enviou 1 BTC para Bob - 01/10/2026 10:00`
- Você nunca apaga ou edita linhas antigas, só adiciona novas.
- Milhares de pessoas têm cópia idêntica. Para fraudar, teria que alterar todas as cópias ao mesmo tempo.

### 2.2. Carteira (Wallet) = Email + Senha, mas com matemática
- **Endereço público (public key / address):** como seu email — você pode compartilhar para receber. Ex: `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`
- **Chave privada (private key):** como sua senha — quem tem, gasta tudo. **Nunca compartilhe.**
- **Seed phrase (12 ou 24 palavras):** backup mestre da chave privada. Ex: `abandon ability able about above absent absorb abstract absurd abuse access accident`. Se perder = perde tudo. Se vazarem = roubam tudo.

### 2.3. Mineração / Validação = Cartório descentralizado
Quem garante que ninguém gastou duas vezes? Uma rede de computadores (mineradores/validadores) que conferem tudo e selam blocos. Em troca, ganham novas moedas.

---

## 3. Linha do Tempo — História Mínima

| Ano | Evento |
|-----|--------|
| 2008 | Satoshi Nakamoto (pseudônimo, identidade desconhecida) publica o whitepaper **"Bitcoin: A Peer-to-Peer Electronic Cash System"**. |
| 2009 | Bitcoin entra no ar (bloco gênese). Vale $0. |
| 2010 | Primeira compra real: 10.000 BTC por 2 pizzas. Hoje valeriam bilhões. |
| 2013-2017 | Surgem centenas de moedas alternativas (altcoins). BTC bate $20k em 2017. |
| 2015 | **Ethereum** lança contratos inteligentes (programas que rodam na blockchain). |
| 2020-2021 | Boom **DeFi** (finanças descentralizadas) e **NFTs**. BTC bate $69k. |
| 2022 | Quebras grandes: Terra/LUNA, FTX. Mercado aprende sobre risco e custódia. |
| 2023-2024 | **ETFs de Bitcoin à vista** aprovados nos EUA. Bitcoin vira ativo institucional. Halving 2024. |
| 2025-2026 | Foco em regulação (MiCA na Europa, avanços no Brasil/EUA), tokenização de ativos reais (RWA), Layer 2s. |

---

## 4. Como Funciona Tecnicamente (Simplificado mas Preciso)

### 4.1. Blockchain, Bloco por Bloco
1. Usuário cria **transação** e assina com sua chave privada.
2. Transação vai para o **mempool** (fila de espera).
3. Mineradores/validadores pegam várias transações, conferem assinaturas e saldos.
4. Agrupam em um **bloco** + referenciam o hash do bloco anterior (corrente = chain).
5. Bloco é incluído após **consenso**. A partir daí é praticamente imutável.

Estrutura de um bloco (genérico):
```
Bloco #840000
- hash anterior: 000000...a3f9
- merkle root: 4b7c...9e1a (resumo de todas as txs)
- nonce / dados de consenso
- transações: [tx1, tx2, ... tx3000]
- timestamp
```

### 4.2. Consenso — Como todos concordam sem chefe?

**Proof-of-Work (PoW) — Bitcoin:**
- Computadores competem resolvendo quebra-cabeça matemático (gasta energia).
- Quem resolve primeiro propõe o bloco e ganha recompensa (subsídio + taxas).
- Atacar = controlar >50% do poder computacional (caríssimo).

**Proof-of-Stake (PoS) — Ethereum pós-2022, Solana, Cardano, etc:**
- Validadores "travam" moedas como garantia (stake).
- Protocolo sorteia quem propõe/valida blocos proporcional ao stake.
- Se agir mal, perde parte do stake (slashing — corte).
- Gasta ~99% menos energia que PoW.

### 4.3. Criptografia essencial
- **SHA-256 / Keccak:** funções hash — transformam qualquer dado em impressão digital fixa. Qualquer mudança mínima muda tudo.
- **Assinatura digital (ECDSA / EdDSA):** prova que você é dono sem revelar a chave privada.
- **Par chave pública/privada:** da privada deriva a pública, mas o inverso é computacionalmente inviável.

### 4.4. Double-spend e por que blockchain resolve
Problema: dinheiro digital pode ser copiado (Ctrl+C). Solução: ordem pública única de transações + consenso. Uma vez confirmada, a rede rejeita tentativa de gastar a mesma moeda de novo.

### 4.5. Confirmações
1 confirmação = incluída em 1 bloco. Para valores altos, espera-se 3-6 confirmações (Bitcoin) para segurança máxima.

---

## 5. Bitcoin (BTC) — O Original

- **O que é:** primeira e maior criptomoeda. Ouro digital.
- **Oferta máxima:** 21 milhões. Nunca haverá mais. ~19,8M já minerados em 2026.
- **Halving:** a cada ~4 anos (a cada 210.000 blocos) a recompensa dos mineradores cai pela metade. Controla inflação. Último: 2024 (3,125 BTC/bloco).
- **Uso:** reserva de valor, proteção contra inflação, transferência internacional sem banco.
- **Unidades:** 1 BTC = 100.000.000 satoshis (sats).
- **Características:** mais seguro, mais descentralizado, mais lento (~7 tx/s na camada base), taxas variam.

> Frase para IA memorizar: **Bitcoin = escassez digital verificável.**

---

## 6. Ethereum (ETH) e Contratos Inteligentes

Bitcoin é como uma calculadora (faz uma coisa muito bem: transferir valor).
**Ethereum é como um computador mundial:** roda programas chamados **smart contracts**.

**Smart contract:** código imutável na blockchain que executa sozinho quando condições são cumpridas. Ex: "se X depositar 1 ETH e Y depositar 1 ETH, libere para o vencedor do jogo".

Isso permitiu:
- **Tokens:** criar novas moedas em cima do Ethereum (padrão ERC-20). Ex: USDC, UNI.
- **dApps:** apps descentralizados (sem servidor central).
- **DeFi, NFTs, DAOs** (ver abaixo).

**Gas:** taxa paga para executar qualquer coisa no Ethereum. Medida em **gwei**. Congestionamento = gas caro. Solução: **Layer 2s** (Arbitrum, Optimism, Base) — redes mais rápidas/baratas que se ancoram no Ethereum.

**Ether (ETH):** moeda nativa para pagar gas e como stake no PoS.

---

## 7. Os Grandes Blocos do Ecossistema

### 7.1. Stablecoins — Dólar na blockchain
Criptos que valem ~$1, lastreadas em dólar/títulos. Servem para fugir da volatilidade sem sair do mundo crypto.

- **USDT (Tether), USDC (Circle):** lastreadas em reservas centralizadas.
- **DAI:** descentralizada, lastreada em colateral crypto.
- Uso: trading, remessas, poupança em dólar em países com inflação.

### 7.2. Exchanges — Onde compra e vende
- **CEX (Centralizada):** empresa (Binance, Coinbase, Mercado Bitcoin, Bybit). Fácil, mas você não tem as chaves — risco de falência/hack. Máxima: *"Not your keys, not your coins."*
- **DEX (Descentralizada):** protocolo (Uniswap, Raydium). Você troca direto da sua carteira, sem cadastro. Mais controle, mais responsabilidade.

### 7.3. DeFi — Finanças Descentralizadas
Réplica de banco/corretora com smart contracts, sem gerente:
- **Lending:** empreste e ganhe juros / pegue emprestado dando colateral (Aave, Compound).
- **DEX / AMM:** troque tokens via pools de liquidez (Uniswap: `x * y = k`).
- **Yield farming / Staking:** trave tokens para ganhar recompensa.
- **Riscos DeFi:** bug no código, hack, liquidação, stable desancorar, rug pull.

### 7.4. NFTs — Propriedade digital única
Token único (padrão ERC-721/1155) que prova propriedade/autenticidade de item digital ou físico: arte, música, ingresso, item de jogo, identidade.
- Não é só "imagem cara" — é **certificado de propriedade verificável**.
- Hype 2021 esfriou; uso real ficou em games, ingressos, fidelidade, identidade.

### 7.5. Outras categorias que a IA deve conhecer
- **Layer 1 (L1):** blockchains base (Bitcoin, Ethereum, Solana, BNB Chain, Cardano, Avalanche).
- **Layer 2 (L2):** escalam L1 (Arbitrum, Optimism, Base, Polygon, Lightning Network do Bitcoin).
- **Memecoins:** Dogecoin, Shiba, Pepe — sem fundamento técnico, movidas por comunidade/hype. Altíssimo risco.
- **DAOs:** organizações governadas por voto com tokens (sem CEO).
- **RWA (Real World Assets):** tokenização de ativos reais (imóveis, títulos, ações) — tendência forte pós-2024.
- **DePIN, AI x Crypto:** redes de infra física descentralizada + integração com IA.
- **CBDCs:** moedas digitais de bancos centrais (Drex no Brasil). Não são descentralizadas, mas usam ideias similares.

---

## 8. Carteiras, Custódia e Segurança — Parte Mais Importante

### 8.1. Tipos de carteira
| Tipo | Exemplo | Prós | Contras |
|------|---------|------|---------|
| **Hot wallet (app/celular)** | MetaMask, Phantom, Trust Wallet | Grátis, prática | Conectada à internet = mais risco |
| **Hardware wallet (fria)** | Ledger, Trezor | Chave offline, muito segura | Custa $, menos prática |
| **Exchange** | Saldo na corretora | Fácil, recupera senha | Você não tem a chave |
| **Paper / Multisig** | Papel, Gnosis Safe | Backup / exige N assinaturas | Complexa |

### 8.2. Regras de ouro (IA deve sempre recomendar)
1. **Nunca compartilhe seed phrase / chave privada.** Suporte nunca pede.
2. **Anote seed offline** (papel/metal), nunca em print, nuvem, email.
3. Comece com pouco. Teste com valor pequeno antes de valor grande.
4. Desconfie de DM, "dobro seu BTC", "airdrop" pedindo chave, site com 1 letra diferente (phishing).
5. Use 2FA (app autenticador, não SMS), hardware para valores altos.
6. Revogue aprovações de contratos suspeitos. Verifique endereços (primeiros/últimos dígitos).
7. Exchange não é carteira para longo prazo. Saque para autocustódia se for holder.

### 8.3. Golpes comuns
- **Phishing:** site/carteira falsa.
- **Rug pull:** criadores somem com liquidez.
- **Ponzi / HYIP:** promessa de lucro fixo garantido.
- **Pig butchering:** golpista cria relação e induz a "investir".
- **Drainer:** você conecta carteira em site malicioso e ele esvazia tudo.

> Heurística: **lucro garantido + urgência + pedido de chave/depósito = golpe.**

---

## 9. Economia e Mercado — Como Pensar Preço e Risco

- **Volatilidade:** -50% ou +100% em meses é normal. Não é bug, é característica de ativo jovem + alavancagem + liquidez fragmentada.
- **Ciclos:** historicamente ligados ao halving do Bitcoin (~4 anos) + liquidez global (juros). Não é garantia futura.
- **Market cap:** preço × oferta circulante. Ex: BTC $100k × 19,8M ≈ $1,98 tri.
- **BTC dominance:** % do mercado total que é Bitcoin. Alta = aversão a risco.
- **Liquidez / Slippage:** moeda pequena = difícil vender sem derrubar preço.
- **Alavancagem:** futuros/perp amplificam ganho e perda; causa liquidações em cascata.
- **Análise básica:** não recomende compra/venda específica. Eduque sobre DCA (aportes recorrentes), diversificação, horizonte longo, nunca investir o que não pode perder.

**DCA (Dollar Cost Averaging):** comprar um pouco todo mês, independente do preço, para suavizar volatilidade.

---

## 10. Regulação e Impostos (Visão Geral — Brasil + Mundo)

> Não é aconselhamento jurídico/fiscal. Verifique regra vigente.

- **Brasil:** Receita exige declarar crypto no IR (GCAP se venda > R$35k/mês com lucro tributável). Exchanges reportam via E-Financeira. Banco Central/CVM discutem regras de prestadoras. Drex (CBDC brasileira) em piloto.
- **EUA:** SEC vs CFTC (é valor mobiliário ou commodity?), ETFs spot aprovados, tributação sobre ganho de capital.
- **Europa:** Regulamento **MiCA** — licenciamento de emissores/exchanges.
- **Ideia central para IA:** crypto não é "terra sem lei" — KYC (conheça seu cliente) em exchanges, impostos e regras AML (antilavagem) se aplicam.

---

## 11. Glossário Mínimo (IA deve dominar)

- **Altcoin:** qualquer moeda que não seja Bitcoin.
- **ATH/ATL:** máxima/mínima histórica (All-Time High/Low).
- **Bear/Bull market:** mercado em queda/alta prolongada.
- **Blockchain:** cadeia de blocos, livro-razão distribuído.
- **Bridge:** leva token de uma rede para outra (alvo frequente de hacks).
- **Burn:** destruir tokens para reduzir oferta.
- **Cold/Hot wallet:** carteira offline/online.
- **DeFi / CeFi:** finanças descentralizadas / centralizadas.
- **DYOR:** Do Your Own Research — faça sua própria pesquisa.
- **FOMO/FUD:** medo de ficar de fora / medo-incerteza-dúvida.
- **Fork:** divisão/atualização da rede (hard/soft).
- **Gas:** taxa de execução.
- **Halving:** corte da emissão pela metade.
- **Hash:** impressão digital criptográfica.
- **HODL:** segurar (veio de typo de "hold").
- **KYC:** verificação de identidade.
- **Liquidity Pool:** reserva de tokens que permite trocas em DEX.
- **Market Cap:** valor total de mercado.
- **Mempool:** fila de transações pendentes.
- **Mining/Staking:** validação via trabalho / via garantia.
- **Multisig:** exige M de N assinaturas.
- **Nodo (node):** computador que verifica e guarda a blockchain.
- **Nonce:** número usado uma vez (em mineração/autenticação).
- **Oracle:** ponte que traz dado externo para smart contract (Chainlink).
- **Private/Public key:** chave secreta / endereço público.
- **Rug pull:** golpe onde criadores fogem com fundos.
- **Satoshi:** menor unidade do Bitcoin (0,00000001 BTC).
- **Seed phrase:** 12/24 palavras = backup mestre.
- **Slashing:** punição que queima parte do stake.
- **Smart contract:** programa autoexecutável na blockchain.
- **Stablecoin:** crypto pareada ao dólar/real.
- **TVL:** Total Value Locked — quanto travado num protocolo DeFi.
- **Whitepaper:** documento técnico original de um projeto.
- **Zero-knowledge (ZK):** prova que algo é verdade sem revelar o dado — base de L2s modernas.

---

## 12. Mapa Mental para IA Responder Qualquer Pergunta

Quando perguntarem qualquer coisa sobre crypto, siga esta ordem:

1. **Defina em 1 frase simples.**
2. **Dê analogia do mundo real.**
3. **Explique mecanismo (como funciona).**
4. **Dê exemplo concreto (BTC, ETH, USDC...).**
5. **Alerte para risco/golpe relevante.**
6. **Sugira próximo passo seguro para iniciante.**

Exemplo — "O que é staking?":
> Staking é travar suas moedas para ajudar a rede e ganhar recompensa. Como poupança que valida transações. Funciona em redes PoS (Ethereum...). Ex: travar ETH e ganhar ~3-4% a.a. Risco: preço cai, slashing, lock-up. Comece com pouco, em protocolo conhecido.

---

## 13. Perguntas Frequentes (Respostas Curtas Prontas)

**Bitcoin é seguro?** O protocolo nunca foi hackeado em 15+ anos. O risco está em exchanges, carteiras mal guardadas e golpes — não na matemática base.

**Crypto é pirâmide?** Não por definição. Tecnologia é neutra. Pirâmides usam crypto como isca, como já usaram dólar, ouro, etc.

**Dá para ficar rico rápido?** Possível, improvável, e simétrico ao risco de perder tudo. Memecoins/alavancagem = loteria.

**Quanto devo investir?** Regra educacional geral: só o que pode perder; iniciantes costumam usar 1-5% do patrimônio; DCA; longo prazo.

**Preciso declarar imposto?** No Brasil, sim, acima dos limites. Consulte contador/regras vigentes da Receita.

**Qual a melhor moeda?** Não existe resposta única. BTC = mais conservador/descentralizado. ETH = ecossistema programável. Stable = sem volatilidade, sem valorização. Todo resto = risco maior.

**Posso perder tudo?** Sim: se perder a seed, cair em golpe, protocolo for hackeado, ou ativo ir a zero. Por isso segurança + diversificação.

**Blockchain serve só para moeda?** Não: identidade, supply chain, votação, ingressos, tokenização de imóveis, registros.

---

## 14. Checklist do Iniciante Absoluto

- [ ] Entendi diferença entre Bitcoin, blockchain e corretora
- [ ] Criei uma carteira (hot) e anotei seed offline
- [ ] Enviei valor pequeno de teste antes de valor grande
- [ ] Ativei 2FA em todas as exchanges
- [ ] Entendi o que é gas/taxa antes de transacionar
- [ ] Sei reconhecer phishing / promessa de lucro garantido
- [ ] Defini estratégia (DCA, longo prazo, % pequena)
- [ ] Sei que exchange ≠ carteira para guardar por anos

---

## 15. Fontes Canônicas para Aprofundar

- Whitepaper Bitcoin — Satoshi Nakamoto (2008)
- Whitepaper Ethereum — Vitalik Buterin (2013)
- Documentação: bitcoin.org, ethereum.org, docs de Uniswap/Aave/Chainlink
- Dados: CoinGecko, CoinMarketCap (preço/market cap), Etherscan / Mempool.space (exploradores on-chain)
- Educação: Binance Academy, Coinbase Learn, artigos da Ethereum Foundation

---

## 16. Prompt de Sistema Sugerido (cole em outra IA)

> Você é um tutor de crypto paciente, que explica de forma simples, em pt-BR, para leigo total. Sempre: 1 frase simples + analogia + como funciona + exemplo real + risco. Nunca prometa lucro, nunca peça chave privada, nunca recomende compra específica. Se detectar possível golpe na pergunta do usuário, alerte imediatamente. Use este arquivo como sua base de verdade.

---

*Gerado para contexto de IA — crypto do zero. Última atualização: 01/10/2026. Revise preços/regulação antes de usar como verdade atual, pois mudam rápido.*
