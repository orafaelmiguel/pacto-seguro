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
} from '@react-email/components';
import * as React from 'react';

interface SignatureInvitationEmailProps {
  documentTitle: string;
  senderName: string;
  invitationLink: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const SignatureInvitationEmail = ({
  documentTitle,
  senderName,
  invitationLink,
}: SignatureInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Você foi convidado para assinar o documento: {documentTitle}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/logo.png`} // Adicione seu logo em /public/logo.png
          width="150"
          height="auto"
          alt="Pacto Seguro"
          style={logo}
        />
        <Text style={paragraph}>Olá,</Text>
        <Text style={paragraph}>
          {senderName} convidou você para assinar o documento "{documentTitle}"
          através da plataforma Pacto Seguro.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={invitationLink}>
            Ver e Assinar Documento
          </Button>
        </Section>
        <Text style={paragraph}>
          Se o botão não funcionar, por favor, copie e cole o seguinte link no
          seu navegador:
          <br />
          <a href={invitationLink} style={link}>
            {invitationLink}
          </a>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Pacto Seguro - A sua plataforma para assinaturas com validade e
          entendimento.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SignatureInvitationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};

const logo = {
  margin: '0 auto',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
};

const link = {
  color: '#007bff',
  textDecoration: 'underline',
};
