'use client'

import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

export interface SignaturePadRef {
  clear: () => void
  getSignatureDataUrl: () => string
}

interface SignaturePadProps {
  onBegin?: () => void
  onEnd?: () => void
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onBegin, onEnd }, ref) => {
    const sigCanvas = useRef<SignatureCanvas>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
      // O canvas precisa ser renderizado no cliente.
      // Este estado garante que o componente só tenta renderizar após a montagem.
      setIsMounted(true)
    }, [])
    
    useImperativeHandle(ref, () => ({
      clear: () => {
        sigCanvas.current?.clear()
      },
      getSignatureDataUrl: () => {
        if (sigCanvas.current?.isEmpty()) {
          return ''
        }
        // Retorna a imagem da assinatura em formato PNG com fundo transparente.
        return sigCanvas.current?.toDataURL('image/png') || ''
      },
    }))

    const handleClear = () => {
      sigCanvas.current?.clear()
    }

    if (!isMounted) {
      // Renderiza um placeholder ou nada durante a renderização do servidor
      return <div className="w-full h-[200px] bg-gray-200 rounded-md animate-pulse" />
    }

    return (
      <div className="relative w-full">
        <div className="border border-gray-300 rounded-md">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: 500, // Largura fixa inicial
              height: 200,
              className: 'sigCanvas w-full',
            }}
            onBegin={onBegin}
            onEnd={onEnd}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute top-2 right-2"
        >
          Limpar
        </Button>
      </div>
    )
  }
)

SignaturePad.displayName = 'SignaturePad'

export { SignaturePad }
