import { GLOSSARY } from '../labels'

/** Ícono "?" con el texto del glosario (tooltip nativo + enfoque por teclado). */
export default function InfoTip({ term }: { term: string }) {
  const text = GLOSSARY[term] ?? term
  return (
    <span className="group relative inline-block align-middle">
      <button
        type="button"
        aria-label={`Qué es ${term}`}
        className="ml-2 h-6 w-6 rounded-full border border-line text-sm font-bold text-slate-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-8 z-20 hidden w-72 rounded-md border border-line bg-navy p-3 text-sm font-normal normal-case not-italic tracking-normal text-ink shadow-lg group-hover:block group-focus-within:block"
      >
        <strong>{term}.</strong> {text}
      </span>
    </span>
  )
}
