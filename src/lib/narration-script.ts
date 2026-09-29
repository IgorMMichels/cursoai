import type { Lesson } from './course'

export type AudioWord = { start: number; end: number; charStart: number; charEnd: number }
export type NarrationTrack = {
  src: string
  captionsSrc: string
  transcript: string
  summary: string
  duration: number
  voice: string
}

export const lessonTranscript = (lesson: Pick<Lesson, 'title' | 'content' | 'takeaway'>) =>
  [lesson.title + '.', ...lesson.content, 'Para guardar: ' + lesson.takeaway].join('\n\n')

export const welcomeScript = {
  id: 'welcome',
  title: 'Boas-vindas ao Cripto do Zero',
  summary: 'Como estudar, acompanhar as narrações e praticar ao longo da trilha.',
  transcript: 'Boas-vindas ao Cripto do Zero. Aqui você vai estudar criptoativos, carteiras, análise de projetos, segurança, finanças descentralizadas e futuros.\n\nComece pelos fundamentos e avance na ordem dos módulos. Cada aula combina explicação, narração e uma atividade. O tempo indicado na aula é uma estimativa para estudar e responder ao exercício; a duração do áudio aparece no player.\n\nVocê pode pausar, voltar e mudar a velocidade da narração. A transcrição apresenta o mesmo texto do áudio. Use os exemplos para identificar o que entendeu e o que ainda precisa pesquisar.\n\nVocê não precisa comprar nenhum ativo para aprender. O objetivo é construir critérios para avaliar oportunidades, reconhecer limites e entender riscos. Vamos começar pelos fundamentos.',
}
