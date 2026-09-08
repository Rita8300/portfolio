import Head from 'next/head';
import { useEffect } from 'react';

const EMAIL = 'ryuta.miyamoto2028@gmail.com';

export default function Home() {
  useEffect(() => {
    const doc = document;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups = [];
    const on = (el, ev, fn, opts) => {
      if (!el) return;
      el.addEventListener(ev, fn, opts);
      cleanups.push(() => el.removeEventListener(ev, fn, opts));
    };

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
      setTimeout(sweep, 300);

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

    // --- 開閉トグル（Featured Works / Experience 共通） ---
    // 閉じた内容は hidden 属性でアクセシビリティツリーから外す。
    // 開くときは即座に hidden を外してからアニメーションし、閉じるときは
    // アニメーションが終わってから hidden を付ける（見た目のアニメーションを切らないため）。
    const hideTimers = new WeakMap();
    doc.querySelectorAll('[data-toggle]').forEach((btn) => {
      const wrap = btn.closest('.expandable');
      const body = wrap ? wrap.querySelector('.expandable-body') : null;
      on(btn, 'click', () => {
        if (!wrap) return;
        const open = wrap.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        const label = btn.querySelector('.toggle-label');
        if (label) label.textContent = open ? '閉じる' : btn.dataset.label || '詳しく見る';
        if (body) {
          const prevTimer = hideTimers.get(body);
          if (prevTimer) clearTimeout(prevTimer);
          if (open) {
            body.hidden = false;
          } else {
            const t = setTimeout(() => {
              body.hidden = true;
            }, prefersReduced ? 0 : 420);
            hideTimers.set(body, t);
          }
        }
      });
    });

    // --- ナビのスクロールスパイ（今見ているセクションをハイライト） ---
    // IntersectionObserver ではなく実座標で判定する。バックグラウンドタブ等で
    // オブザーバのコールバックが遅延・停止する環境でも確実に動くようにするため。
    const navItems = Array.from(doc.querySelectorAll('.topnav a'))
      .map((link) => ({ link, el: doc.getElementById(link.getAttribute('href').slice(1)) }))
      .filter((item) => item.el);
    if (navItems.length) {
      const setActiveNav = () => {
        const line = window.innerHeight * 0.4;
        let current = navItems[0];
        for (const item of navItems) {
          if (item.el.getBoundingClientRect().top - line <= 0) current = item;
        }
        navItems.forEach(({ link }) => link.classList.remove('is-active'));
        current.link.classList.add('is-active');
      };
      setActiveNav();
      on(window, 'load', setActiveNav);
      on(window, 'resize', setActiveNav, { passive: true });
      let lastSpyRun = 0;
      on(
        window,
        'scroll',
        () => {
          const now = Date.now();
          if (now - lastSpyRun < 90) return;
          lastSpyRun = now;
          setActiveNav();
        },
        { passive: true }
      );
    }

    // --- アドレスをコピー ---
    const copyBtn = doc.querySelector('[data-copy]');
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
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>宮本琉太 | Web制作・サービス企画</title>
        <meta
          name="description"
          content="福岡大学法学部の学生。React / TypeScriptでの開発やサービス企画に取り組んでいます。学習アプリ「おぼえこ」、新規事業企画「MachiQuest」などの制作をまとめたポートフォリオです。"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="宮本琉太 | Web制作・サービス企画" />
        <meta
          property="og:description"
          content="福岡大学法学部の学生。React / TypeScriptでの開発やサービス企画、学習アプリ「おぼえこ」・新規事業企画「MachiQuest」などをまとめたポートフォリオ。"
        />
        <meta property="og:url" content="https://ryuta-miyamoto.lolipop-now.app/" />
        <meta name="twitter:card" content="summary" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div className="page">
        <header className="topbar">
          <a href="#top" className="wordmark">
            宮本琉太
          </a>
          <nav className="topnav">
            <a href="#work">Work</a>
            <a href="#experience">Experience</a>
            <a href="#contact">Contact</a>
          </nav>
        </header>

        <main id="top" tabIndex={-1}>
          {/* ===== Hero ===== */}
          <section className="hero">
            <p className="hero-eyebrow" data-reveal>
              福岡大学 法学部 3年
            </p>
            <h1 className="hero-name" data-reveal style={{ '--reveal-delay': '60ms' }}>
              宮本 琉太
            </h1>
            <p className="hero-desc" data-reveal style={{ '--reveal-delay': '120ms' }}>
              Web制作やサービス企画に取り組んでいます。
              <br />
              React / TypeScriptを使った開発や、AIを活用した企画・制作をしています。
            </p>
            <div className="hero-actions" data-reveal style={{ '--reveal-delay': '180ms' }}>
              <a href="#work-oboeko" className="hero-link">
                おぼえこ
                <span className="arrow" aria-hidden="true" />
              </a>
              <a href="#work-machiquest" className="hero-link">
                MachiQuest
                <span className="arrow" aria-hidden="true" />
              </a>
            </div>
          </section>

          {/* ===== 01 Key Results ===== */}
          <section id="highlights" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                01
              </span>
              <h2>Key Results</h2>
            </div>
            <div className="section-body">
              <div className="highlight-grid">
                <div className="highlight-card" data-reveal>
                  <span className="highlight-eyebrow">個人開発</span>
                  <strong className="highlight-stat">Web版 公開中</strong>
                  <p>おぼえこの企画からUI設計・実装・公開まで担当</p>
                </div>
                <div className="highlight-card" data-reveal style={{ '--reveal-delay': '90ms' }}>
                  <span className="highlight-eyebrow">新規事業企画</span>
                  <strong className="highlight-stat">優秀賞</strong>
                  <p>IT企業の1Dayインターンで新規事業を企画</p>
                </div>
                <div className="highlight-card" data-reveal style={{ '--reveal-delay': '180ms' }}>
                  <span className="highlight-eyebrow">組織運営</span>
                  <strong className="highlight-stat">約30人規模</strong>
                  <p>歴史学研究会を現役部員一桁から立て直し</p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 02 Featured Works ===== */}
          <section id="work" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                02
              </span>
              <h2>Featured Works</h2>
            </div>
            <div className="section-body">
              <div className="featured-list">
                {/* --- おぼえこ --- */}
                <article id="work-oboeko" className="featured expandable" data-reveal>
                  <div className="mock mock--oboeko" aria-hidden="true">
                    <div className="mock-topbar">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="mock-oboeko-body">
                      <div className="mock-oboeko-header">
                        <span className="mock-seal">憶</span>おぼえこ
                      </div>
                      <div className="mock-flow">
                        <div className="mock-step">
                          <span className="mock-step-label">1. デッキを選ぶ</span>
                          <div className="mock-oboeko-cards">
                            <div className="mock-deck" style={{ '--c': '#8a3324' }}>
                              <span>01</span>会社法 判例
                            </div>
                            <div className="mock-deck" style={{ '--c': '#3f5d47' }}>
                              <span>02</span>サンプル：一般常識
                            </div>
                          </div>
                        </div>
                        <div className="mock-step">
                          <span className="mock-step-label">2. カードで確認する</span>
                          <div className="mock-flashcard">
                            <span className="mock-flashcard-label">もんだい</span>
                            <span className="mock-flashcard-text">取締役の善管注意義務とは？</span>
                            <div className="mock-flashcard-actions">
                              <span>まだ</span>
                              <span className="is-primary">覚えた</span>
                            </div>
                          </div>
                        </div>
                        <div className="mock-step">
                          <span className="mock-step-label">3. 結果を確認する</span>
                          <div className="mock-oboeko-strip">
                            今日 4<span>/10</span>
                          </div>
                          <p className="mock-result">3枚中2枚を「覚えた」に</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="featured-body">
                    <div className="featured-top">
                      <span className="featured-no">01</span>
                      <h3>おぼえこ</h3>
                      <span className="status-pill">Web版 公開中</span>
                    </div>
                    <ul className="featured-meta">
                      <li>個人開発</li>
                      <li>企画・UI設計・実装</li>
                      <li>継続改善中</li>
                    </ul>
                    <p className="featured-tagline">自分の教材を、一問一答で繰り返せる暗記学習アプリ</p>
                    <dl className="featured-facts">
                      <div>
                        <dt>背景</dt>
                        <dd>
                          授業や資格勉強で覚えたい内容を、紙へ書き直したり、復習する範囲を毎回選んだりする手間を減らすために制作しました。
                        </dd>
                      </div>
                      <div>
                        <dt>設計した体験</dt>
                        <dd>
                          覚えたい内容をデッキに分け、問題・答え・補足を登録できます。確認モードでは未習得・苦手なカードを優先し、その日の学習量や連続学習日数も記録できるようにしました。
                        </dd>
                      </div>
                      <div>
                        <dt>実装上の工夫</dt>
                        <dd>
                          ReactとTypeScriptで画面と状態を設計しています。学習データは端末内へ保存し、JSONによるバックアップと復元にも対応しています。
                        </dd>
                      </div>
                    </dl>
                    <p className="featured-tech">React / TypeScript / Vite（保存はブラウザ内、サーバー不要）</p>
                    <div id="oboeko-detail" className="expandable-body" hidden>
                      <div className="expandable-inner">
                        <div className="proj-group">
                          <span className="featured-group-label">主な機能</span>
                          <ul className="mini-list">
                            <li>デッキの作成・編集・削除</li>
                            <li>問題の手入力（表・裏・補足）</li>
                            <li>苦手なカードを優先した確認モード</li>
                            <li>1日の目標枚数と連続学習日数の記録</li>
                            <li>学習データの書き出し・読み込み（JSON）</li>
                          </ul>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">設計・実装上の判断</span>
                          <ul className="mini-list">
                            <li>復習の優先度は間隔反復（SRS）の日付計算ではなく、間違えた回数をもとにしたシンプルな並び替えにとどめている</li>
                            <li>学習データは外部に送らず端末内（localStorage）だけに保存し、書き出したJSONで引っ越しできるようにした</li>
                            <li>配色はよくある紫・青のグラデーションを避け、落ち着いた色を使っている</li>
                          </ul>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">次に改善したいこと（未実装）</span>
                          <ul className="mini-list">
                            <li>忘却のタイミングに合わせた復習日の自動計算（SRS）</li>
                            <li>写真やPDFからの問題作成</li>
                            <li>SPIやCABなど適性検査形式への対応</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="featured-actions">
                      <a
                        className="btn btn--solid"
                        href="https://oboeko.lolipop-now.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        アプリを試す
                      </a>
                      <a
                        className="btn"
                        href="https://github.com/Rita8300/oboeko"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHubでコードを見る
                      </a>
                      <button
                        type="button"
                        className="btn btn--toggle"
                        data-toggle
                        data-label="詳しく見る"
                        aria-expanded="false"
                        aria-controls="oboeko-detail"
                      >
                        <span className="toggle-label">詳しく見る</span>
                        <span className="toggle-chevron" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>

                {/* --- MachiQuest --- */}
                <article id="work-machiquest" className="featured expandable" data-reveal style={{ '--reveal-delay': '90ms' }}>
                  <div className="mock mock--machiquest" aria-hidden="true">
                    <div className="mock-topbar mock-topbar--dark">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="mock-mq-body">
                      <p className="mock-mq-kicker">GMO PEPABO 1DAY INTERNSHIP ／ WORK2</p>
                      <p className="mock-mq-title">個人店の集客 × ゲーミフィケーション</p>
                      <p className="mock-mq-name">
                        マチクエ
                        <span>MACHI QUEST</span>
                      </p>
                      <ul className="mock-mq-icons">
                        <li>クエスト</li>
                        <li>経験値</li>
                        <li>制覇マップ</li>
                        <li>連続来街ボーナス</li>
                      </ul>
                    </div>
                  </div>
                  <div className="featured-body">
                    <div className="featured-top">
                      <span className="featured-no">02</span>
                      <h3>MachiQuest</h3>
                      <span className="status-pill status-pill--award">IT企業 1Dayインターン 優秀賞</span>
                    </div>
                    <p className="featured-tagline">個人店の集客とゲーミフィケーションを組み合わせた新規事業企画</p>
                    <dl className="featured-facts">
                      <div>
                        <dt>想定顧客</dt>
                        <dd>来街者の減少に悩む商店街・中心市街地の運営者（商店街振興組合、中心市街地活性化協議会、DMOなど）。</dd>
                      </div>
                      <div>
                        <dt>課題</dt>
                        <dd>
                          集客施策がスタンプラリーなど単発で終わりやすい。新規の来街者数や再訪率を数字で示せない。毎回ゼロから準備する負担も大きい。
                        </dd>
                      </div>
                      <div>
                        <dt>サービス概要</dt>
                        <dd>
                          LINEミニアプリで、来街者ひとりひとりに合わせた「今日のクエスト」をAIが生成。3〜4店舗を巡るルートを提示し、チェックインで来街データを可視化する。
                        </dd>
                      </div>
                      <div>
                        <dt>差別化</dt>
                        <dd>
                          地図アプリやSNSのように「知っている店に行く」のではなく、「まだ知らない個人店に今日行かせる」設計。値引きではなく発見を軸にする。
                        </dd>
                      </div>
                    </dl>
                    <div id="machiquest-detail" className="expandable-body" hidden>
                      <div className="expandable-inner">
                        <div className="proj-group">
                          <span className="featured-group-label">収益モデル</span>
                          <p className="featured-detail-text">
                            商店街振興組合などとの年間ライセンス契約を本命に、立ち上げ期のPoC受託、単店向けの成果報酬型を組み合わせる案。
                          </p>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">PoC案</span>
                          <p className="featured-detail-text">鹿児島・天文館エリアで20〜30店舗×6〜8週間の実証実験を想定。</p>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">KPI</span>
                          <p className="featured-detail-text">
                            クエスト開始率、チェックイン完遂率、1人あたり訪問店舗数、新規開拓率、再回遊率など。
                          </p>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">AI活用</span>
                          <p className="featured-detail-text">
                            利用者の好み・行動履歴と、店舗側の情報（来てほしい時間帯や特徴など）を掛け合わせ、個別のクエストとルートを自動生成する。
                          </p>
                        </div>
                        <div className="proj-group">
                          <span className="featured-group-label">担当</span>
                          <p className="featured-detail-text">課題設定・顧客像・収益モデル・PoC設計までの立案を担当。</p>
                        </div>
                      </div>
                    </div>
                    <div className="featured-actions">
                      <a
                        className="btn btn--solid"
                        href="https://machiquest.lolipop-now.app/#who"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        詳しい企画書を見る
                      </a>
                      <button
                        type="button"
                        className="btn btn--toggle"
                        data-toggle
                        data-label="詳しく見る"
                        aria-expanded="false"
                        aria-controls="machiquest-detail"
                      >
                        <span className="toggle-label">詳しく見る</span>
                        <span className="toggle-chevron" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>

          {/* ===== 03 Experience ===== */}
          <section id="experience" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                03
              </span>
              <h2>Experience</h2>
            </div>
            <div className="section-body">
              <div className="exp-grid">
                <article className="exp-card expandable" data-reveal>
                  <h3>歴史学研究会</h3>
                  <p className="exp-summary">
                    現役部員が一桁まで減少していた研究会で、新歓企画や活動内容を見直しました。歴史初心者でも参加しやすいクイズ企画や史跡見学旅行などを実施し、登録・参加希望者を含め約30人規模まで拡大しました。
                  </p>
                  <ul className="exp-tags">
                    <li>企画</li>
                    <li>集客</li>
                    <li>コミュニティ運営</li>
                    <li>チーム運営</li>
                  </ul>
                  <div id="exp-history-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <p className="featured-detail-text">
                        当初は約5人まで減り、研究発表中心の活動が新入生には堅く見えていた。歴史クイズを企画し、もともとあった史跡見学を新入生向けの体験企画として活用しながら、参加者の反応やアンケートをもとに改善を重ねた。
                      </p>
                      <ul className="mini-list">
                        <li>歴史クイズを企画し、参加者の反応を見ながら形式を改善</li>
                        <li>既存の史跡見学を、新入生が入部前に体験できる企画として活用</li>
                        <li>QRコード経由のアンケートで参加理由や反応を確認</li>
                        <li>史跡見学の申込みから入部までの導線を設計</li>
                      </ul>
                      <p className="featured-detail-text">
                        自分たちが良いと思うものを押し出すだけでなく、相手が参加しづらい理由を考え、実際の反応をもとに改善する重要性を学んだ。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="exp-toggle"
                    data-toggle
                    data-label="詳しく見る"
                    aria-expanded="false"
                    aria-controls="exp-history-detail"
                  >
                    <span className="toggle-label">詳しく見る</span>
                    <span className="toggle-chevron" aria-hidden="true" />
                  </button>
                </article>

                <article className="exp-card expandable" data-reveal>
                  <h3>家庭教師</h3>
                  <p className="exp-summary">
                    生徒が解けない原因を「理解力不足」と決めつけず、どこでつまずいているのかを確認して伝え方を変えてきました。
                  </p>
                  <ul className="exp-tags">
                    <li>指導</li>
                    <li>コミュニケーション</li>
                  </ul>
                  <div id="exp-tutor-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <p className="featured-detail-text">
                        英語の前置詞でつまずいていた生徒には、本人が読んでいた漫画の英題（Attack on Titan）を例に、on
                        が持つ「〜への」というニュアンスを説明するなど、相手が興味を持てる題材に置き換えて伝えることを意識してきた。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="exp-toggle"
                    data-toggle
                    data-label="詳しく見る"
                    aria-expanded="false"
                    aria-controls="exp-tutor-detail"
                  >
                    <span className="toggle-label">詳しく見る</span>
                    <span className="toggle-chevron" aria-hidden="true" />
                  </button>
                </article>

                <article className="exp-card expandable" data-reveal>
                  <h3>会社法ゼミ</h3>
                  <p className="exp-summary">
                    会社法の判例を2〜3人のグループで調査し発表。株主総会や取締役会の役割、取締役の責任などを学んでいます。
                  </p>
                  <ul className="exp-tags">
                    <li>法律</li>
                    <li>リサーチ</li>
                    <li>プレゼン</li>
                  </ul>
                  <div id="exp-corplaw-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <p className="featured-detail-text">
                        中でも印象に残っているのは、会社の政治献金が目的の範囲に含まれるかが争われた八幡製鉄政治献金事件で、企業活動は利益の追求だけでなく社会との関係の中でも考える必要があることを学んだ。質疑応答を通じて、根拠を示しながら説明する力を磨いている。
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="exp-toggle"
                    data-toggle
                    data-label="詳しく見る"
                    aria-expanded="false"
                    aria-controls="exp-corplaw-detail"
                  >
                    <span className="toggle-label">詳しく見る</span>
                    <span className="toggle-chevron" aria-hidden="true" />
                  </button>
                </article>

                <article className="exp-card expandable" data-reveal>
                  <h3>インターン・企業研究</h3>
                  <p className="exp-summary">
                    IT・SIer・インフラ・金融など、複数企業のインターンや企業研究に参加。新規事業の企画・提案を経験しました（詳しくは
                    <a href="#work-machiquest">MachiQuest</a>を参照）。
                  </p>
                  <ul className="exp-tags">
                    <li>企業研究</li>
                    <li>新規事業</li>
                  </ul>
                  <div id="exp-intern-detail" className="expandable-body" hidden>
                    <div className="expandable-inner">
                      <ul className="companies">
                        <li>IT（Webサービス）</li>
                        <li>SIer</li>
                        <li>インフラ（電力）</li>
                        <li>金融（地方銀行）</li>
                      </ul>
                      <p className="featured-detail-text">
                        業種の異なる企業のインターンや企業研究に参加。AIによる業務効率化だけでなく、空いた時間を新しい提案や顧客対応へ振り向ける考え方に関心を持った。（社名は伏せています）
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="exp-toggle"
                    data-toggle
                    data-label="詳しく見る"
                    aria-expanded="false"
                    aria-controls="exp-intern-detail"
                  >
                    <span className="toggle-label">詳しく見る</span>
                    <span className="toggle-chevron" aria-hidden="true" />
                  </button>
                </article>
              </div>
            </div>
          </section>

          {/* ===== 04 Other Works ===== */}
          <section id="other-works" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                04
              </span>
              <h2>Other Works</h2>
            </div>
            <div className="section-body">
              <p data-reveal className="section-note">
                その他の制作・構想。進行度合いはそれぞれ異なります。
              </p>
              <div className="other-grid">
                <article className="other-card" data-reveal>
                  <div className="other-top">
                    <h3>TOEIC英単語学習ツール</h3>
                    <span className="status-pill status-pill--sm">Prototype</span>
                  </div>
                  <p>Excelを使って英単語を反復学習できる仕組みを制作。自分の学習の不便を出発点にした個人用ツール。</p>
                </article>
                <article className="other-card" data-reveal>
                  <div className="other-top">
                    <h3>配信支援アプリ</h3>
                    <span className="status-pill status-pill--sm">Experiment</span>
                  </div>
                  <p>ニコニコ生放送などを想定し、コメントやギフトのランキングを表示する試作。Node.jsでローカル動作を確認。</p>
                </article>
                <article className="other-card" data-reveal>
                  <div className="other-top">
                    <h3>大学授業・単位案内Bot</h3>
                    <span className="status-pill status-pill--sm">Concept</span>
                  </div>
                  <p>大学の学修ガイドを読み込ませ、授業や単位に関する質問に答えるBotの構想。</p>
                </article>
                <article className="other-card" data-reveal>
                  <div className="other-top">
                    <h3>法学部学生向けDiscordコミュニティ</h3>
                    <span className="status-pill status-pill--sm">Concept</span>
                  </div>
                  <p>法学部の学生が授業情報や過去問を共有できるコミュニティの設計。</p>
                </article>
              </div>
            </div>
          </section>

          {/* ===== 05 Skills ===== */}
          <section id="skills" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                05
              </span>
              <h2>Skills</h2>
            </div>
            <div className="section-body">
              <div className="skill-groups">
                <div className="skill-group" data-reveal>
                  <h3>Frontend</h3>
                  <ul className="chips">
                    <li>React</li>
                    <li>TypeScript</li>
                    <li>JavaScript</li>
                    <li>HTML</li>
                    <li>CSS</li>
                    <li>Vite</li>
                  </ul>
                  <p className="skill-use">WebアプリのUI設計・実装に使用。</p>
                </div>
                <div className="skill-group" data-reveal>
                  <h3>AI-assisted Development</h3>
                  <ul className="chips">
                    <li>ChatGPT</li>
                    <li>Claude</li>
                    <li>Codex</li>
                  </ul>
                  <p className="skill-use">企画整理、仕様作成、実装補助、デバッグ、アイデア検証などに活用。</p>
                </div>
                <div className="skill-group" data-reveal>
                  <h3>Prototype / Other</h3>
                  <ul className="chips">
                    <li>Python</li>
                    <li>Node.js</li>
                    <li>Expo</li>
                    <li>Excel</li>
                  </ul>
                  <p className="skill-use">小規模なツールやアプリの試作に使用。</p>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 06 About ===== */}
          <section id="about" className="section">
            <div data-reveal className="section-head">
              <span aria-hidden="true" className="index">
                06
              </span>
              <h2>About</h2>
            </div>
            <div className="section-body">
              <ul data-reveal className="fact-list">
                <li>福岡大学 法学部（会社法ゼミ）</li>
                <li>Web制作やサービス企画に取り組んでいる</li>
                <li>大学では歴史学研究会の活動にも参加</li>
                <li>技術だけでなく、企画やユーザー体験にも関心がある</li>
              </ul>
              <p data-reveal className="about-note">
                IT業界を志望していて、まず手を動かして試すことを大事にしている。
              </p>
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
              <p data-reveal className="section-note">
                連絡はメールでお願いします。
              </p>
              <div data-reveal className="contact-box">
                <span className="contact-addr">{EMAIL}</span>
                <div className="contact-actions">
                  <a href={`mailto:${EMAIL}`} className="btn btn--solid">
                    メールを書く
                  </a>
                  <button type="button" className="btn" data-copy>
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
