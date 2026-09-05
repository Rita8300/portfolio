import Head from 'next/head';
import { useEffect } from 'react';

const EMAIL = 'ryuta.miyamoto2028@gmail.com';

export default function Home() {
  useEffect(() => {
    const doc = document;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const cleanups = [];
    const on = (el, ev, fn, opts) => {
      if (!el) return;
      el.addEventListener(ev, fn, opts);
      cleanups.push(() => el.removeEventListener(ev, fn, opts));
    };

    // --- 表紙: クリック / Enter / Space で開く ---
    doc.body.style.overflow = 'hidden';
    const cover = doc.querySelector('.cover');
    const openCover = () => {
      if (!cover || cover.classList.contains('is-open')) return;
      cover.classList.add('is-open');
      doc.body.style.overflow = '';
      const main = doc.getElementById('top');
      if (main) main.focus({ preventScroll: true });
    };
    on(cover, 'click', openCover);
    on(cover, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        openCover();
      }
    });
    // ディープリンク(#about など)で来たら表紙をすぐ開く
    if (window.location.hash && window.location.hash !== '#hero') openCover();

    // --- スクロール表示アニメ + ジャンプ移動のフォールバック ---
    const revealEls = Array.from(doc.querySelectorAll('[data-reveal]'));
    const heads = Array.from(doc.querySelectorAll('.section-head'));
    const watched = [...revealEls, ...heads];
    const show = (el) => el.classList.add('is-visible');

    if ('IntersectionObserver' in window && !prefersReduced) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target);
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
      );
      watched.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());

      // 画面内・画面上に既にある要素は即表示（初回ロード / ハッシュジャンプ対策）
      const sweep = () => {
        const vh = window.innerHeight || doc.documentElement.clientHeight;
        watched.forEach((el) => {
          if (el.classList.contains('is-visible')) return;
          const r = el.getBoundingClientRect();
          if (r.top < vh * 0.95) {
            show(el);
            io.unobserve(el);
          }
        });
      };
      sweep();
      on(window, 'load', sweep);
      on(window, 'hashchange', () => setTimeout(sweep, 60));
      on(window, 'resize', sweep, { passive: true });
      // 念のため、遅延読み込み後にもう一度
      setTimeout(sweep, 300);
      setTimeout(sweep, 1200);

      // スクロール中もスイープ。速いジャンプやアンカー移動での IO 取りこぼしを拾う。
      // requestAnimationFrame は非表示タブで止まるため時間ベースで間引く。
      let lastSweep = 0;
      on(
        window,
        'scroll',
        () => {
          const now = Date.now();
          if (now - lastSweep < 90) return;
          lastSweep = now;
          sweep();
        },
        { passive: true }
      );
    } else {
      watched.forEach(show);
    }

    // --- ヒーローのスポットライト ---
    const masthead = doc.querySelector('.masthead');
    const spot = doc.querySelector('.hero-spot');
    if (masthead && spot && !prefersReduced && finePointer) {
      on(masthead, 'pointermove', (e) => {
        const r = masthead.getBoundingClientRect();
        spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
        spot.style.setProperty('--my', `${e.clientY - r.top}px`);
        spot.style.opacity = '1';
      });
      on(masthead, 'pointerleave', () => {
        spot.style.opacity = '0';
      });
    }

    // --- ヒーローのタグから該当セクションへ ---
    const tagTargets = { '会社法ゼミ': '#about', 'IT業界志望': '#vision' };
    doc.querySelectorAll('.tags button.tag').forEach((btn) => {
      on(btn, 'click', () => {
        const sel = tagTargets[btn.textContent.trim()];
        const el = sel && doc.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      });
    });

    // --- Projects の開閉 ---
    doc.querySelectorAll('.proj-toggle').forEach((btn) => {
      on(btn, 'click', () => {
        const proj = btn.closest('.proj');
        if (!proj) return;
        const open = proj.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    // --- Strengths カードのチルト ---
    if (!prefersReduced && finePointer) {
      doc.querySelectorAll('.card').forEach((card) => {
        on(card, 'pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.transform = `perspective(600px) rotateX(${(py - 0.5) * -6}deg) rotateY(${(px - 0.5) * 6}deg)`;
          card.style.setProperty('--gx', `${px * 100}%`);
          card.style.setProperty('--gy', `${py * 100}%`);
        });
        on(card, 'pointerleave', () => {
          card.style.transform = '';
        });
      });
    }

    // --- アドレスをコピー ---
    const copyBtn = Array.from(doc.querySelectorAll('.contact-actions .btn')).find((b) =>
      b.textContent.includes('コピー')
    );
    const toast = doc.querySelector('.toast-inner');
    let toastTimer;
    on(copyBtn, 'click', async () => {
      try {
        await navigator.clipboard.writeText(EMAIL);
      } catch {
        const ta = doc.createElement('textarea');
        ta.value = EMAIL;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        try {
          doc.execCommand('copy');
        } catch {
          /* noop */
        }
        doc.body.removeChild(ta);
      }
      if (toast) {
        toast.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
      }
    });

    return () => {
      clearTimeout(toastTimer);
      cleanups.forEach((fn) => fn());
      doc.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>宮本琉太 | 福岡大学 法学部 3年</title>
        <meta
          name="description"
          content="宮本琉太（福岡大学 法学部 3年）のポートフォリオ。会社法を学びながら、AIを活用したアプリ開発（暗記学習アプリなど）に取り組む学生。強み・制作実績・経験・志望をまとめています。"
        />
        <meta name="theme-color" content="#f6f7f8" />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="宮本琉太 | 福岡大学 法学部 3年" />
        <meta
          property="og:description"
          content="会社法を学びながら、AIを活用したアプリ開発（暗記学習アプリ「おぼえこ」など）に取り組む学生のポートフォリオ。"
        />
        <meta property="og:url" content="https://ryuta-miyamoto.lolipop-now.app/" />
        <meta name="twitter:card" content="summary" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div className="cover" role="button" tabIndex={0} aria-label="詳細を見る">
        <div className="cover-inner">
          <p className="cover-kicker">福岡大学 法学部 3年</p>
          <p className="cover-name">宮本琉太</p>
          <p className="cover-cta">
            <span>詳細を見る</span>
            <span aria-hidden="true" className="cover-chevron" />
          </p>
        </div>
      </div>

      <div className="page">
        <header className="topbar">
          <a href="#hero" className="wordmark">
            宮本琉太
          </a>
          <a href="#contact" className="topbar-link">
            Contact
          </a>
        </header>

        <main id="top" tabIndex={-1}>
          {/* ===== Masthead ===== */}
          <section id="hero" className="masthead">
            <div aria-hidden="true" className="hero-spot" />
            <div className="hero-inner">
              <p data-reveal className="eyebrow">
                福岡大学 法学部 3年
              </p>
              <h1 data-reveal style={{ '--reveal-delay': '80ms' }} className="name">
                宮本琉太
              </h1>
              <p data-reveal style={{ '--reveal-delay': '140ms' }} className="name-latin">
                Ryuta Miyamoto
              </p>
              <p data-reveal style={{ '--reveal-delay': '220ms' }} className="masthead-line">
                身近な「分かりにくい」を、AIと技術で使いやすい形にする。
              </p>
              <ul data-reveal style={{ '--reveal-delay': '300ms' }} className="tags">
                <li>
                  <span className="tag tag--static">法学部 3年</span>
                </li>
                <li>
                  <button type="button" className="tag">
                    会社法ゼミ
                  </button>
                </li>
                <li>
                  <button type="button" className="tag">
                    IT業界志望
                  </button>
                </li>
              </ul>
              <p data-reveal style={{ '--reveal-delay': '380ms' }} aria-hidden="true" className="scroll-hint">
                Scroll
              </p>
            </div>
          </section>

          {/* ===== 01 About ===== */}
          <section id="about" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                01
              </span>
              <h2>About Me</h2>
            </div>
            <div className="section-body">
              <p data-reveal style={{ '--reveal-delay': '80ms' }} className="lead">
                福岡大学法学部法律学科で会社法を学びながら、AIやアプリ開発に取り組んでいます。法律を専攻していますが、AIを使って身近な課題を解決し、実際に動くサービスへ落とし込むことに興味を持ったことから、IT分野の学習を始めました。関心の根っこにあるのは「相手が動かない理由を決めつけず、興味を持てる入り口を設計して行動につなげる」という考え方です。歴史学研究会の勧誘の立て直しも、家庭教師での教え方も、暗記学習アプリ「おぼえこ」の開発も、この延長線上にあります。最近は、おぼえこを機能を絞って動くWeb版まで作りました。
              </p>
              <ul data-reveal style={{ '--reveal-delay': '150ms' }} className="fact-list">
                <li>福岡大学 法学部 法律学科（2028年卒業見込み）</li>
                <li>会社法を扱うゼミに所属</li>
                <li>IT業界を志望。特に、AIを活用して新しい価値やサービスを生み出す仕事に関心がある</li>
                <li>自由に挑戦でき、実行やアウトプットを重視する企業に魅力を感じている</li>
              </ul>
            </div>
          </section>

          {/* ===== 02 Skills ===== */}
          <section id="skills" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                02
              </span>
              <h2>Skills</h2>
            </div>
            <div className="section-body">
              <p data-reveal style={{ '--reveal-delay': '80ms' }} className="section-note">
                実際に触った深さで、3つに分けています。
              </p>
              <div data-reveal style={{ '--reveal-delay': '140ms' }} className="skill-tiers">
                <div className="skill-tier">
                  <span className="skill-tier-label">制作で使用</span>
                  <ul className="chips">
                    <li>HTML</li>
                    <li>JavaScript</li>
                    <li>TypeScript</li>
                    <li>React</li>
                    <li>Node.js</li>
                    <li>Vite</li>
                    <li>Expo</li>
                    <li>ChatGPT</li>
                    <li>Claude</li>
                    <li>Codex</li>
                    <li>Excel</li>
                  </ul>
                </div>
                <div className="skill-tier">
                  <span className="skill-tier-label">学習中</span>
                  <ul className="chips">
                    <li>Python</li>
                    <li>GitHub（公開・運用は今後強化）</li>
                  </ul>
                </div>
                <div className="skill-tier">
                  <span className="skill-tier-label">使用経験あり</span>
                  <ul className="chips">
                    <li>Discord</li>
                  </ul>
                </div>
              </div>
              <ul data-reveal style={{ '--reveal-delay': '200ms' }} className="mini-list skill-notes">
                <li>Python は、条件分岐・繰り返し処理・入力処理・乱数を使った簡単なプログラムまで。</li>
                <li>法律文書や判例を読み、要点を整理する力。</li>
                <li>グループでの判例発表・質疑応答。</li>
              </ul>
            </div>
          </section>

          {/* ===== 03 Projects ===== */}
          <section id="projects" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                03
              </span>
              <h2>Projects</h2>
            </div>
            <div className="section-body">
              <p data-reveal style={{ '--reveal-delay': '80ms' }} className="section-note">
                進行度合いはそれぞれ異なります。カードの「詳しく見る」で機能やこだわりを開けます。
              </p>
              <div data-reveal style={{ '--reveal-delay': '140ms' }} className="projects">
                <article className="proj">
                  <div className="proj-top">
                    <span className="proj-no" aria-hidden="true">
                      01
                    </span>
                    <div className="proj-headings">
                      <h3 className="proj-title">暗記学習アプリ「おぼえこ」</h3>
                      <span className="proj-status">Web版 制作</span>
                    </div>
                  </div>
                  <p className="proj-summary">
                    学生や資格受験者が、教材を見ながら問題を手で入力し、デッキにまとめて反復学習するためのアプリ。まず Web 版を制作し、機能を絞って動く形にした。
                  </p>
                  <div className="proj-actions">
                    <a
                      className="proj-toggle proj-toggle--link"
                      href="https://oboeko.lolipop-now.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      デモを開く
                      <span className="proj-arrow" aria-hidden="true" />
                    </a>
                    <button type="button" className="proj-toggle" aria-expanded="false">
                      詳しく見る
                      <span className="proj-chevron" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="proj-detail">
                    <div className="proj-detail-inner">
                      <div className="proj-group">
                        <span className="proj-group-label">作ったもの（Web版 v1）</span>
                        <ul className="mini-list">
                          <li>デッキの作成・編集・削除</li>
                          <li>教材からの問題手入力（表・裏・補足、続けて追加）</li>
                          <li>学習進捗（覚えた枚数）の記録と表示</li>
                          <li>カードをめくって覚えたか確認するモード</li>
                          <li>学習データのバックアップ（書き出し・読み込み）</li>
                        </ul>
                      </div>
                      <div className="proj-group">
                        <span className="proj-group-label">使用技術</span>
                        <ul className="mini-list">
                          <li>React / TypeScript / Vite</li>
                          <li>保存はブラウザ内で完結（サーバー不要）</li>
                        </ul>
                      </div>
                      <div className="proj-group">
                        <span className="proj-group-label">これから</span>
                        <ul className="mini-list">
                          <li>写真やPDFからの問題作成</li>
                          <li>SPIやCABなどへの対応</li>
                          <li>解説付き問題演習</li>
                          <li>1日の学習目標設定と達成時の演出</li>
                          <li>スマホアプリ化とApp Storeでの公開</li>
                        </ul>
                      </div>
                      <div className="proj-group">
                        <span className="proj-group-label">こだわり</span>
                        <ul className="mini-list">
                          <li>AIが作ったような無機質なデザインを避ける</li>
                          <li>日本の学生が直感的に使えるUIにする</li>
                          <li>問題を解くだけでなく、理解につながる解説を付ける</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="proj">
                  <div className="proj-top">
                    <span className="proj-no" aria-hidden="true">
                      02
                    </span>
                    <div className="proj-headings">
                      <h3 className="proj-title">TOEIC英単語学習ツール</h3>
                      <span className="proj-status">制作</span>
                    </div>
                  </div>
                  <p className="proj-summary">
                    Excelなどを活用し、英単語を反復して学習できる仕組みを制作。自分の学習上の不便を出発点に、覚えやすさと継続しやすさを考えた。
                  </p>
                </article>

                <article className="proj">
                  <div className="proj-top">
                    <span className="proj-no" aria-hidden="true">
                      03
                    </span>
                    <div className="proj-headings">
                      <h3 className="proj-title">配信支援アプリ</h3>
                      <span className="proj-status">試作</span>
                    </div>
                  </div>
                  <p className="proj-summary">
                    ニコニコ生放送などの配信を想定し、コメントやギフトのランキングを表示するアプリを試作。Node.jsを利用し、ローカル環境での動作確認に取り組んだ。
                  </p>
                </article>

                <article className="proj">
                  <div className="proj-top">
                    <span className="proj-no" aria-hidden="true">
                      04
                    </span>
                    <div className="proj-headings">
                      <h3 className="proj-title">大学授業・単位案内Bot</h3>
                      <span className="proj-status">構想</span>
                    </div>
                  </div>
                  <p className="proj-summary">
                    大学の学修ガイドを読み込ませ、授業・単位・履修などに関する質問へ回答するBotを構想。大量の資料から必要な情報へアクセスしやすくすることを目的としている。
                  </p>
                </article>

                <article className="proj">
                  <div className="proj-top">
                    <span className="proj-no" aria-hidden="true">
                      05
                    </span>
                    <div className="proj-headings">
                      <h3 className="proj-title">法学部学生向けDiscordコミュニティ</h3>
                      <span className="proj-status">設計</span>
                    </div>
                  </div>
                  <p className="proj-summary">
                    法学部の学生が、授業情報や過去問、大学生活に関する情報を共有できるコミュニティを設計。
                  </p>
                  <button type="button" className="proj-toggle" aria-expanded="false">
                    詳しく見る
                    <span className="proj-chevron" aria-hidden="true" />
                  </button>
                  <div className="proj-detail">
                    <div className="proj-detail-inner">
                      <div className="proj-group">
                        <span className="proj-group-label">設計している内容</span>
                        <ul className="mini-list">
                          <li>授業別チャンネルの整理</li>
                          <li>自己紹介の導線作成</li>
                          <li>過去問共有のルール設計</li>
                          <li>学内システムへのリンク整理</li>
                          <li>イベント管理機能の検討</li>
                          <li>安心して利用するための規則作成</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* ===== 04 Experience ===== */}
          <section id="experience" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                04
              </span>
              <h2>Experience</h2>
            </div>
            <div className="section-body">
              <ul data-reveal style={{ '--reveal-delay': '80ms' }} className="exp-list">
                <li className="exp-item">
                  <h3 className="exp-role">家庭教師</h3>
                  <p className="exp-body">
                    生徒が解けない原因を「理解力不足」と決めつけず、どこでつまずいているのかを確認。英語の前置詞でつまずいていた生徒には、本人が読んでいた漫画の英題（Attack on Titan）を例に、on が持つ「〜への」というニュアンスを説明するなど、相手が興味を持てる題材に置き換えて伝えることを意識してきた。
                  </p>
                </li>
                <li className="exp-item">
                  <h3 className="exp-role">歴史学研究会</h3>
                  <p className="exp-body">
                    当初は約5人まで減り、研究発表中心の活動が新入生には堅く見えていた歴史学研究会。歴史クイズを企画し、もともとあった史跡見学を新入生向けの体験企画として活用しながら、参加者の反応やアンケートをもとに改善を重ねた。
                  </p>
                  <ul className="mini-list">
                    <li>歴史クイズを企画し、参加者の反応を見ながら形式を改善</li>
                    <li>既存の史跡見学を、新入生が入部前に体験できる企画として活用</li>
                    <li>QRコード経由のアンケートで参加理由や反応を確認</li>
                    <li>史跡見学の申込みから入部までの導線を設計</li>
                  </ul>
                  <p className="exp-body">
                    結果として所属者は約30人規模まで増加。自分たちが良いと思うものを押し出すだけでなく、相手が参加しづらい理由を考え、実際の反応をもとに改善する重要性を学んだ。
                  </p>
                </li>
                <li className="exp-item">
                  <h3 className="exp-role">会社法ゼミ</h3>
                  <p className="exp-body">
                    株主総会や取締役会の役割、取締役の責任など会社法の判例を2〜3人のグループで調査し発表。中でも印象に残っているのは、会社の政治献金が目的の範囲に含まれるかが争われた八幡製鉄政治献金事件で、企業活動は利益の追求だけでなく社会との関係の中でも考える必要があることを学んだ。質疑応答を通じて、根拠を示しながら説明する力を磨いている。
                  </p>
                </li>
                <li className="exp-item">
                  <h3 className="exp-role">インターン・企業研究</h3>
                  <ul className="companies">
                    <li>GMOペパボ</li>
                    <li>かんぽシステムソリューションズ</li>
                    <li>さくら情報システム</li>
                    <li>九州電力</li>
                    <li>福岡銀行</li>
                    <li>GMOインターネットグループ関連イベント</li>
                  </ul>
                  <p className="exp-body">
                    参加・研究した企業。あるIT企業のインターンでは、地域の個人店が抱える集客の課題に着目し、街歩きとゲーミフィケーションを組み合わせたサービスを企画。利用者だけでなく店舗や運営者の視点でも課題を整理し、対象顧客・収益モデル・実証方法まで具体化して、着眼点と完成度を評価され優秀賞をいただいた。一連の参加を通して、AIによる業務効率化だけでなく、空いた時間を新しい提案や顧客対応へ振り向ける考え方に関心を持ち、完成度を上げてから動くのではなく、まず実行して改善を重ねる姿勢を大切にしたいと考えるようになった。
                  </p>
                  <a
                    className="exp-link"
                    href="https://machiquest.lolipop-now.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    企画書「MachiQuest」を見る
                    <span className="proj-arrow" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* ===== 05 Strengths ===== */}
          <section id="strengths" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                05
              </span>
              <h2>Strengths</h2>
            </div>
            <div className="section-body">
              <div data-reveal style={{ '--reveal-delay': '80ms' }} className="grid">
                <div className="card">
                  <h3>相手が動かない理由を決めつけない</h3>
                  <p>
                    家庭教師では、生徒が解けない原因を「理解力不足」と決めつけず、どこでつまずいているのかを確認した。英語の前置詞でつまずいていた生徒には、読んでいた漫画の英題を例にするなど、相手が興味を持てる題材に置き換えることを意識してきた。
                  </p>
                </div>
                <div className="card">
                  <h3>組織の課題を発見し、立て直せる</h3>
                  <p>
                    約5人まで減っていた歴史学研究会で、歴史クイズを企画し、もともとあった史跡見学を新入生向けに活用。反応やアンケートをもとに改善を重ね、約30人規模まで増やすことができた。
                  </p>
                </div>
                <div className="card">
                  <h3>課題を見つけ、動く形にできる</h3>
                  <p>
                    IT企業のインターンでは、個人店の集客課題に街歩き×ゲーミフィケーションのサービスを企画し、優秀賞をいただいた。学習アプリ「おぼえこ」も、自分の「覚えにくい」を出発点にWeb版まで作った。AIは道具として使い、目的や利用者像は自分で考えている。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 06 Career Vision ===== */}
          <section id="vision" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                06
              </span>
              <h2>Career Vision</h2>
            </div>
            <div className="section-body">
              <ul data-reveal style={{ '--reveal-delay': '80ms' }} className="next-list">
                <li>IT業界を志望しています。特に、AIを活用して新しい価値やサービスを生み出す仕事に関心があります。</li>
                <li>自由に挑戦でき、実行やアウトプットを重視する企業に魅力を感じています。</li>
              </ul>
              <p data-reveal style={{ '--reveal-delay': '150ms' }} className="section-note vision-note">
                大切にしている考え方
              </p>
              <ul data-reveal style={{ '--reveal-delay': '190ms' }} className="mini-list">
                <li>まず小さく作り、試しながら改善する</li>
                <li>AIを単なる時短ではなく、新しい価値を生み出すために使う</li>
                <li>利用者がどこで困るかを具体的に考える</li>
                <li>専門知識のない人にも分かる形に整理する</li>
                <li>興味を持ったことを、実際に動く成果物へ変える</li>
              </ul>
            </div>
          </section>

          {/* ===== 07 Contact ===== */}
          <section id="contact" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                07
              </span>
              <h2>Contact</h2>
            </div>
            <div className="section-body">
              <p data-reveal style={{ '--reveal-delay': '80ms' }} className="section-note">
                連絡はメールでお願いします。
              </p>
              <div data-reveal style={{ '--reveal-delay': '140ms' }} className="contact-box">
                <span className="contact-addr">{EMAIL}</span>
                <div className="contact-actions">
                  <a href={`mailto:${EMAIL}`} className="btn btn--solid">
                    メールを書く
                  </a>
                  <button type="button" className="btn">
                    アドレスをコピー
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <span>© 2026 宮本琉太</span>
          <span>Fukuoka University</span>
        </footer>
      </div>

      <div role="status" aria-live="polite" className="toast">
        <span className="toast-inner">アドレスをコピーしました</span>
      </div>
    </>
  );
}
