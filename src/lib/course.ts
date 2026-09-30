export type Lesson = { id: string; title: string; duration: string }

export type CourseModule = {
  id: string
  number: string
  title: string
  subtitle: string
  icon: string
  color: string
  duration: string
  lessons: Lesson[]
}

export const modules: CourseModule[] = [
  {
    "id": "m1",
    "number": "01",
    "title": "Entenda o terreno",
    "subtitle": "Blockchain, Bitcoin e o que uma carteira realmente guarda.",
    "icon": "Blocks",
    "color": "mint",
    "duration": "24 min",
    "lessons": [
      {
        "id": "m1l1",
        "title": "Uma rede que mantém o próprio livro-caixa",
        "duration": "7 min"
      },
      {
        "id": "m1l2",
        "title": "Bitcoin, ether e tokens: ativos diferentes",
        "duration": "8 min"
      },
      {
        "id": "m1l3",
        "title": "Carteiras, chaves e custódia",
        "duration": "9 min"
      }
    ]
  },
  {
    "id": "m2",
    "number": "02",
    "title": "Faça o básico bem feito",
    "subtitle": "Exchanges, ordens e transferências sem pressa.",
    "icon": "ArrowLeftRight",
    "color": "blue",
    "duration": "20 min",
    "lessons": [
      {
        "id": "m2l1",
        "title": "Como avaliar uma exchange",
        "duration": "7 min"
      },
      {
        "id": "m2l2",
        "title": "Ordens a mercado, limitadas e stop",
        "duration": "6 min"
      },
      {
        "id": "m2l3",
        "title": "A primeira transferência sem improviso",
        "duration": "7 min"
      }
    ]
  },
  {
    "id": "m8",
    "number": "03",
    "title": "Compre Bitcoin com clareza",
    "subtitle": "Compare caminhos de compra, custos e custódia.",
    "icon": "Bitcoin",
    "color": "lilac",
    "duration": "22 min",
    "lessons": [
      {
        "id": "m8l1",
        "title": "Bitcoin à vista, ETF ou P2P?",
        "duration": "8 min"
      },
      {
        "id": "m8l2",
        "title": "Uma compra simulada do começo ao fim",
        "duration": "7 min"
      },
      {
        "id": "m8l3",
        "title": "Depois da compra: registro e custódia",
        "duration": "7 min"
      }
    ]
  },
  {
    "id": "m3",
    "number": "04",
    "title": "Leia além do ticker",
    "subtitle": "Uma rotina de pesquisa antes de formar opinião.",
    "icon": "ScanSearch",
    "color": "lilac",
    "duration": "23 min",
    "lessons": [
      {
        "id": "m3l1",
        "title": "Comece pelo problema, não pelo preço",
        "duration": "8 min"
      },
      {
        "id": "m3l2",
        "title": "Oferta, desbloqueios e liquidez",
        "duration": "8 min"
      },
      {
        "id": "m3l3",
        "title": "Dados, fontes e sinais de alerta",
        "duration": "7 min"
      }
    ]
  },
  {
    "id": "m4",
    "number": "05",
    "title": "Defina o risco antes da entrada",
    "subtitle": "Orçamento, cenários e uma estratégia que caiba na sua vida.",
    "icon": "Scale",
    "color": "amber",
    "duration": "22 min",
    "lessons": [
      {
        "id": "m4l1",
        "title": "Capacidade de risco e dinheiro necessário",
        "duration": "7 min"
      },
      {
        "id": "m4l2",
        "title": "Dimensione pelo prejuízo que tolera",
        "duration": "8 min"
      },
      {
        "id": "m4l3",
        "title": "Aportes periódicos, diversificação e revisão",
        "duration": "7 min"
      }
    ]
  },
  {
    "id": "m5",
    "number": "06",
    "title": "Proteja o acesso",
    "subtitle": "Engenharia social, permissões e resposta a incidentes.",
    "icon": "ShieldCheck",
    "color": "mint",
    "duration": "21 min",
    "lessons": [
      {
        "id": "m5l1",
        "title": "Golpes que começam com pressa",
        "duration": "7 min"
      },
      {
        "id": "m5l2",
        "title": "Assinaturas, permissões e links",
        "duration": "7 min"
      },
      {
        "id": "m5l3",
        "title": "Sua rotina de segurança e plano de resposta",
        "duration": "7 min"
      }
    ]
  },
  {
    "id": "m6",
    "number": "07",
    "title": "Explore sem confundir rendimento e segurança",
    "subtitle": "DeFi, staking, liquidez e o contexto tributário brasileiro.",
    "icon": "Orbit",
    "color": "blue",
    "duration": "25 min",
    "lessons": [
      {
        "id": "m6l1",
        "title": "DeFi: contratos, protocolos e dependências",
        "duration": "8 min"
      },
      {
        "id": "m6l2",
        "title": "Staking, empréstimos e provisão de liquidez",
        "duration": "8 min"
      },
      {
        "id": "m6l3",
        "title": "Registros e impostos no Brasil",
        "duration": "9 min"
      }
    ]
  },
  {
    "id": "m9",
    "number": "08",
    "title": "Futuros: long, short e padrões",
    "subtitle": "Derivativos, margem e leitura de mercado — nível avançado.",
    "icon": "ChartNoAxesCombined",
    "color": "amber",
    "duration": "26 min",
    "lessons": [
      {
        "id": "m9l1",
        "title": "Spot, futuro e posição comprada ou vendida",
        "duration": "9 min"
      },
      {
        "id": "m9l2",
        "title": "Tendência, suporte, resistência e rompimentos",
        "duration": "8 min"
      },
      {
        "id": "m9l3",
        "title": "Simulador de exposição e liquidação",
        "duration": "9 min"
      }
    ]
  },
  {
    "id": "m7",
    "number": "09",
    "title": "Transforme estudo em processo",
    "subtitle": "Psicologia, política pessoal e próximos 30 dias.",
    "icon": "Compass",
    "color": "lilac",
    "duration": "18 min",
    "lessons": [
      {
        "id": "m7l1",
        "title": "Decida fora do ruído",
        "duration": "6 min"
      },
      {
        "id": "m7l2",
        "title": "Escreva sua política pessoal",
        "duration": "6 min"
      },
      {
        "id": "m7l3",
        "title": "Seu roteiro de 30 dias",
        "duration": "6 min"
      }
    ]
  }
]

export const findLesson = (moduleId: string, lessonId: string) =>
  modules.find((module) => module.id === moduleId)?.lessons.find((lesson) => lesson.id === lessonId)

export const allLessons = modules.flatMap((module) =>
  module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id, moduleTitle: module.title })),
)
