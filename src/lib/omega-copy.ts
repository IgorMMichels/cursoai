export const omegaContours = [
  "M39 136C29 121 24 106 24 88C24 42 62 8 110 8C160 8 198 43 198 90C198 120 186 145 167 165H220V204H126V157C145 145 157 125 157 101C157 70 137 48 110 48C82 48 62 70 62 101C62 109 64 116 67 123Z",
  "M16 165L148 86C112 113 89 139 78 161V204H16Z"
] as const

export const omegaCopy = {
  name: 'Omega',
  title: 'Omega — cripto, memecoins, futuros e trading',
  login: { signin: 'Entre na sua conta', signup: 'Crie sua conta', reset: 'Redefina sua senha', recovery: 'Escolha uma nova senha' },
  sceneCaption: 'Cripto, memecoins, futuros e trading.',
  pause: 'Pausar animação', resume: 'Retomar animação',
  featuresTitle: 'O que você encontra na Omega',
  features: [
    { title: 'Quatro áreas de estudo', text: 'Cripto, memecoins, futuros e trading em jornadas organizadas.', href: '/explorar', action: 'Ver jornadas' },
    { title: 'Memecoins com jornada própria', text: 'Aulas e módulos dedicados à análise de memecoins.', href: '/explorar', action: 'Conhecer o conteúdo' },
    { title: 'Guias de plataformas', text: 'Passos para conhecer Axiom, GMGN, Trojan e Phantom.', href: '/plataformas', action: 'Abrir guias' },
    { title: 'Estudo acompanhado', text: 'Aulas narradas, quizzes e acompanhamento de progresso.', href: '/curso', action: 'Acessar área do aluno' },
  ],
} as const
