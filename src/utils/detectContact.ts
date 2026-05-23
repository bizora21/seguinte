// Telefone MZ (9 dígitos começados por 8[2-7]), com ou sem prefixo 258 / +258.
// Ancorado em \D ou início/fim de string em vez de \b para funcionar com '+'.
const PHONE = /(?:^|\D)(?:\+?258)?8[2-7]\d{7}(?:\D|$)/

const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
const URL = /https?:\/\/[^\s]+|\bwww\.[^\s]+/i
// \b nos limites evita falsos positivos como "ig" dentro de "Liga" / "obrigado" / "figura".
const SOCIAL = /\b(?:whatsapp|instagram|facebook|fb|ig|tiktok|telegram|messenger)\b/i

export function containsContact(text: string): boolean {
  // Junta dígitos separados por espaços/hífens/pontos/parênteses para detectar
  // formatos como "84 123 4567", "(84) 123-4567", "+258 84.123.4567".
  const normalized = text.replace(/(\d)[\s\-.()]+(?=\d)/g, '$1')

  return (
    PHONE.test(normalized) ||
    EMAIL.test(text) ||
    URL.test(text) ||
    SOCIAL.test(text)
  )
}
