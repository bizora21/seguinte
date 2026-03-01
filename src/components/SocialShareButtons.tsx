import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Facebook,
  Twitter,
  MessageCircle,
  Send,
  Link as LinkIcon,
  Share2
} from 'lucide-react'

interface SocialShareProps {
  title: string
  description: string
  url: string
  image?: string
}

const SocialShareButtons: React.FC<SocialShareProps> = ({ title, description, url, image }) => {
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)
  const encodedUrl = encodeURIComponent(url)
  const encodedImage = image ? encodeURIComponent(image) : ''

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&title=${encodedTitle}&description=${encodedDescription}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedDescription}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedDescription}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  }

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    alert('Link copiado!')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => window.open(shareLinks.facebook, '_blank')}
          className="flex-1 bg-[#1877F2] hover:bg-[#166FE5] text-white"
          size="lg"
        >
          <Facebook className="w-5 h-5 mr-2" />
          Facebook
        </Button>

        <Button
          onClick={() => window.open(shareLinks.twitter, '_blank')}
          className="flex-1 bg-black hover:bg-gray-800 text-white"
          size="lg"
        >
          <Twitter className="w-5 h-5 mr-2" />
          Twitter
        </Button>

        <Button
          onClick={() => window.open(shareLinks.whatsapp, '_blank')}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          WhatsApp
        </Button>

        <Button
          onClick={() => window.open(shareLinks.telegram, '_blank')}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          size="lg"
        >
          <Send className="w-5 h-5 mr-2" />
          Telegram
        </Button>

        <Button
          onClick={() => window.open(shareLinks.linkedin, '_blank')}
          className="flex-1 bg-[#0077b5] hover:bg-[#006397] text-white"
          size="lg"
        >
          <LinkIcon className="w-5 h-5 mr-2" />
          LinkedIn
        </Button>

        <Button
          onClick={copyLink}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Copiar Link
        </Button>
      </div>
    </div>
  )
}

export default SocialShareButtons
