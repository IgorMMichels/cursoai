import { useLocalization } from '@/contexts/localization-context'

export function SourceLanguageNotice({ text = false }: { text?: boolean }) {
  const { locale } = useLocalization()
  const message = text
    ? { 'pt-BR': 'O conteúdo integral desta aula e a narração estão disponíveis em português. As versões traduzidas do conteúdo serão publicadas separadamente.', en: 'The full lesson content and narration are currently in Portuguese. Translated lesson content will be published separately.', es: 'El contenido completo de esta clase y la narración están disponibles en portugués. Las versiones traducidas se publicarán por separado.' }[locale]
    : { 'pt-BR': 'Narrações disponíveis em português. Áudios em inglês serão adicionados futuramente.', en: 'Narration is available in Portuguese. English audio will be added in the future.', es: 'Las narraciones están disponibles en portugués. Los audios en inglés se añadirán más adelante.' }[locale]
  return <p role="note" className="my-4 rounded-lg border border-white/10 bg-white/[.025] px-4 py-3 text-xs leading-6 text-[#aaa7b5]">{message}</p>
}
