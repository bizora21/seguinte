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

export interface MessageWithSender extends Message {
  sender: {
    email: string
  }
}

export interface ChatWithDetails extends Chat {
  product: {
    name: string
  }
  client: {
    email: string
  }
  seller: {
    email: string
  }
  _count?: {
    messages: number
  }
}