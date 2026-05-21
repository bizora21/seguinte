import { supabase } from '../lib/supabase'

export async function notifyAdmin(
  title: string,
  body: string,
  url: string,
  image?: string
): Promise<void> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .single()

    if (!data) return

    await supabase.functions.invoke('send-push-notification', {
      body: { user_id: data.id, title, body, url, ...(image ? { image } : {}) },
    })
  } catch (e) {
    console.error('notifyAdmin error:', e)
  }
}
