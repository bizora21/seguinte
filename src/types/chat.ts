export interface Chat {
  id: string
  product_id: string
  client_id: string
  seller_id: string
  created_at: string
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface ProfileInfo {
  email: string
  store_name?: string | null
}

export interface MessageWithSender extends Message {
  sender: ProfileInfo
}

export interface ChatWithDetails extends Chat {
  product: {
    name: string
  }
  client: ProfileInfo
  seller: ProfileInfo
  _count?: {
    messages: number
  }
}