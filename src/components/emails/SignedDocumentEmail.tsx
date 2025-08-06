import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface SignedDocumentEmailProps {
  documentTitle: string
  recipientName: string
  ownerName: string
  isOwner: boolean
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const SignedDocumentEmail = ({
  documentTitle,
  recipientName,
  ownerName,
  isOwner,
}: SignedDocumentEmailProps) => {
  const previewText = isOwner 
    ? `${recipientName} assinou o documento ${documentTitle}` 
    : `Aqui está sua cópia do documento assinado: ${documentTitle}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="150"
            height="auto"
            alt="Pacto Seguro"
            style={logo}
          />
          <Text style={paragraph}>
            {isOwner ? `Olá, ${ownerName},` : `Olá, ${recipientName},`}
          </Text>
          
          {isOwner ? (
            <Text style={paragraph}>
              Boas notícias! O destinatário <strong>{recipientName}</strong> completou e assinou o documento "{documentTitle}".
            </Text>
          ) : (
            <Text style={paragraph}>
              Obrigado por assinar o documento "{documentTitle}". Uma cópia do documento final assinado está anexada a este e-mail para seus registros.
            </Text>
          )}

          <Text style={paragraph}>
            Este documento agora está concluído e armazenado com segurança.
          </Text>

          {isOwner && (
             <Section style={btnContainer}>
                <Button style={button} href={`${baseUrl}/dashboard/documents`}>
                    Ver Meus Documentos
                </Button>
            </Section>
          )}
          
          <Hr style={hr} />
          <Text style={footer}>
            Pacto Seguro - A sua plataforma para assinaturas com validade e
            entendimento.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignedDocumentEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
}

const logo = {
  margin: '0 auto',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
}

const btnContainer = {
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#000000',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
}

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
}
