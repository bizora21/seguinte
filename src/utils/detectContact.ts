const MZ_PHONE = /\b(82|83|84|85|86|87)\d{7}\b/
const INTL_PHONE = /\+\d{7,15}/
const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
const URL = /https?:\/\/[^\s]+|www\.[^\s]+/i
const SOCIAL = /(?:whatsapp|instagram|facebook|fb|ig|tiktok|telegram)[\s:./]*[@\w]/i

export function containsContact(text: string): boolean {
  return (
    MZ_PHONE.test(text) ||
    INTL_PHONE.test(text) ||
    EMAIL.test(text) ||
    URL.test(text) ||
    SOCIAL.test(text)
  )
}
