import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        {/* JS 無効時は表紙を隠し、演出前提で隠している要素を表示する */}
        <noscript>
          <style>{`.cover{display:none!important}body{overflow:auto!important}[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
