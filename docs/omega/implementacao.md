# Ajustes implementados

A marca da plataforma agora é **Omega**, sem acento. O símbolo aparece sem moldura, arredondamento, fundo de placa ou sombra no componente compartilhado e no footer. Metadados, navegação e assinaturas SVG usam o mesmo nome. O título do curso Cripto do Zero foi preservado onde identifica o curso.

O login tem uma cena própria em `src/components/ui/omega-login-ascii.tsx`. A geometria extrudada vem dos paths do símbolo Trajetória, e `AsciiEffect` converte sua renderização em caracteres. O painel permite pausar/retomar. No celular, uma cena compacta aparece acima do formulário; apenas o canvas visível é montado. Com movimento reduzido, mostra o símbolo estático e oferece “Ativar animação” por escolha explícita. Sem WebGL, permanece estático. O renderer de Bitcoin existente permanece inalterado.

A correção de visibilidade ajustou a iluminação para que a conversão ASCII não transforme a superfície em espaços, aumentou a oscilação e usa caracteres `#`, `+`, `:` e `.`. Não há bloqueio automático da animação apenas por largura de tela ou número de núcleos.

A seção de comparação da landing foi substituída por quatro diferenciais ligados a páginas reais: jornadas, memecoins, guias de plataformas e estudo acompanhado. Textos novos estão centralizados em `src/lib/omega-copy.ts`. Traduções ainda não foram implementadas.

Verificações no navegador:

- Canvas e tabela ASCII visíveis no desktop e no celular, com caracteres não vazios.
- Comparação de quadros confirma caracteres mudando durante a animação nos dois tamanhos.
- Comparação de quadros confirma que a pausa mantém os caracteres parados.
- Fallback estático com movimento reduzido e ativação explícita funcionando.
- Alternância entre cadastro, entrada e redefinição de senha.
- Logo com borda de 0 px, raio de 0 px e sombra ausente no login, header e footer.
- Quatro diferenciais e ausência da comparação antiga.
- Ausência de rolagem horizontal nas larguras verificadas de 390, 768 e 1440 px.
- Título da página atualizado para Omega.

Build e lint executados; permanecem avisos preexistentes. Autenticação remota com uma conta real não foi testada.

Prévias locais capturadas da implementação:

- `login-implementado.png`
- `login-mobile-implementado.png`
- `landing-ajustes.png`
