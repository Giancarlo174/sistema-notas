import Head from 'next/head';

export default function CustomHead({ title = "Sistema de Seguimiento Académico" }) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content="Sistema de seguimiento de notas y desempeño académico" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <meta name="theme-color" content="#4f46e5" />
    </Head>
  );
}
