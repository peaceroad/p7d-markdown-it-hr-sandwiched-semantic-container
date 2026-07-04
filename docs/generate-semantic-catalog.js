import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const EN_PATH = path.join(ROOT, 'semantics', 'en.json')
const JA_PATH = path.join(ROOT, 'semantics', 'ja.json')

const EN_OVERVIEWS = {
  "abstract": "Use for an abstract or short formal summary of a larger work.",
  "acknowledgments": "Use for acknowledgments or thanks sections.",
  "afterword": "Use for an afterword placed after the main content.",
  "appendix": "Use for appendices and attached supporting sections.",
  "appendix-titlepage": "Use for ebook appendix-opening title pages, usually detected from an `h1` appendix heading.",
  "author": "Use for author information.",
  "bibliography": "Use for bibliographies, references lists, or works-cited sections.",
  "book": "Use for book or magazine information blocks.",
  "chapter-toc": "Use for a table of contents scoped to a chapter or section.",
  "chapter-titlepage": "Use for ebook chapter-opening title pages, usually detected from an `h1` chapter heading.",
  "colophon": "Use for colophon/publication-information sections.",
  "conclusion": "Use for conclusions or closing sections.",
  "credits": "Use for credits sections.",
  "dedication": "Use for dedication sections.",
  "editor-note": "Use for editorial notes, not general reader notes.",
  "endnotes": "Use for endnotes or collected notes at the end of a chapter or book.",
  "epigraph": "Use for epigraphs or opening quotations.",
  "epilogue": "Use for epilogues.",
  "errata": "Use for errata or correction lists.",
  "first-published": "Use for first-publication information.",
  "foreword": "Use for forewords.",
  "glossary": "Use for glossaries or term lists.",
  "index": "Use for index sections.",
  "introduction": "Use for introductions.",
  "keywords": "Use for keyword sections.",
  "lead": "Use for lead text or a lede/introduction paragraph.",
  "postscript": "Use for postscripts or dated additions.",
  "preamble": "Use for preambles or introductory formal text.",
  "preface": "Use for prefaces.",
  "prologue": "Use for prologues.",
  "pull-quote": "Use for pull quotes or highlighted excerpts that repeat nearby text.",
  "toc": "Use for a document-level table of contents.",
  "alert": "Use for alert-style warnings, urgent notices, or strong calls for attention.",
  "annotation": "Use for annotations or marginal/editorial comments that accompany the main content.",
  "caution": "Use for caution notices where readers should avoid mistakes, unsafe actions, or avoidable trouble.",
  "column": "Use for columns or sidebar articles.",
  "danger": "Use for danger notices with the strongest hazard level.",
  "hint": "Use for hints that help readers solve or understand something.",
  "important": "Use for important notices or important points.",
  "information": "Use for informational notes or information blocks.",
  "memo": "Use for memo sections.",
  "note": "Use for neutral notes, annotations, or remarks.",
  "notice": "Use for notices or announcements.",
  "point": "Use for key points or important takeaways.",
  "tip": "Use for tips or practical advice.",
  "warning": "Use for warning notices that are stronger than caution but not necessarily the strongest danger level.",
  "answer": "Use for answer text, especially a direct response to a question.",
  "assessments": "Use for assessments such as quizzes, exams, or grading/checking sections.",
  "explanation": "Use for explanations, especially after questions, examples, procedures, or solutions.",
  "faq": "Use for FAQ sections.",
  "feedback": "Use for feedback sections or response/comments areas.",
  "interview": "Use for interview-style Q&A content.",
  "lesson": "Use for lessons or learning units.",
  "problem": "Use for problems or exercises to be solved.",
  "qna": "Use for question-and-answer collections.",
  "question": "Use for individual questions or prompts.",
  "solution": "Use for solutions, worked answers, or methods of solving.",
  "check": "Use for checks, checklists, or confirmation items.",
  "decision": "Use for decisions or decided items in office, planning, or meeting documents.",
  "issue": "Use for issues, points of dispute, or problems to discuss.",
  "limitations": "Use for limitations, constraints, restrictions, or caveats.",
  "procedure": "Use for procedures, steps, or instructions.",
  "requirements": "Use for requirements or conditions that must be satisfied.",
  "resources": "Use for resources, materials, handouts, or supporting assets.",
  "task": "Use for tasks, assignments, homework, or action items.",
  "agenda": "Use for agenda sections, especially meeting agendas or lists of topics to discuss.",
  "event": "Use for event information.",
  "opinion": "Use for opinion or viewpoint sections.",
  "outline": "Use for outlines.",
  "overview": "Use for overviews.",
  "part-titlepage": "Use for ebook part-opening title pages, usually detected from an `h1` part heading.",
  "planning": "Use for plans, planning sections, schedules, or intended courses of action.",
  "profile": "Use for profile/person-introduction sections.",
  "proposal": "Use for proposals submitted for consideration, approval, or adoption.",
  "recommendation": "Use for recommendations or recommended choices.",
  "reference": "Use for reference information or a single reference block.",
  "related": "Use for broad related information.",
  "related-book": "Use for related book or magazine suggestions.",
  "related-article": "Use for related article suggestions.",
  "related-link": "Use for related links, see-also links, or further-reading links.",
  "supplement": "Use for supplements or supplemental information.",
  "suggestion": "Use for suggestions.",
  "summary": "Use for summaries or recaps.",
  "topic": "Use for topics or subject sections.",
  "learning-objectives": "Use for learning objectives or expected outcomes.",
  "minutes": "Use for meeting minutes or records of discussions and decisions.",
  "next-steps": "Use for follow-up actions or forward-looking next-step sections.",
  "prerequisites": "Use for prerequisite knowledge, setup, or preconditions.",
  "rubric": "Use for grading rubrics or evaluation criteria.",
  "troubleshooting": "Use for troubleshooting and diagnostic help sections."
}

const JA_OVERVIEWS = {
  "abstract": "要旨・抄録のような、本文全体を短くまとめる部分に使います。",
  "acknowledgments": "謝辞・謝意を示す部分に使います。",
  "afterword": "後書き・あとがき・跋文に使います。",
  "appendix": "付録や付属資料に使います。",
  "appendix-titlepage": "電子書籍などの付録扉・付属扉に使います。通常は`h1`の付録・付属見出しから検出します。",
  "author": "著者情報に使います。",
  "bibliography": "参考文献一覧や文献表に使います。",
  "book": "書籍・雑誌・書誌情報の案内に使います。",
  "chapter-toc": "章単位の目次に使います。",
  "chapter-titlepage": "電子書籍などの章扉に使います。通常は`h1`の章見出しから検出します。",
  "colophon": "奥付に使います。",
  "conclusion": "結論、結び、終わりに相当する部分に使います。",
  "credits": "クレジット表示に使います。",
  "dedication": "献呈に使います。",
  "editor-note": "編注・編集注・編集者注に使います。一般の注記とは分けます。",
  "endnotes": "後注、章末注、巻末注に使います。",
  "epigraph": "題辞・題句・題言に使います。",
  "epilogue": "エピローグ・終章に使います。",
  "errata": "正誤表に使います。",
  "first-published": "初出情報に使います。",
  "foreword": "刊行・発行に寄せた前置きに使います。",
  "glossary": "用語集・用語一覧に使います。",
  "index": "索引に使います。",
  "introduction": "序論、序説、はじめに相当の部分に使います。",
  "keywords": "キーワードや手がかり語に使います。",
  "lead": "リード文や導入文に使います。",
  "postscript": "追記に使います。",
  "preamble": "序や序文に使います。",
  "preface": "前書き・まえがきに使います。",
  "prologue": "プロローグ・序章に使います。",
  "pull-quote": "プルクオート・プルクォートに使います。",
  "toc": "目次・もくじに使います。",
  "alert": "アラート、注意喚起、警報のような強い通知に使います。",
  "annotation": "本文に添える注釈や補助的なコメントに使います。",
  "caution": "注意、注意事項、使用上の注意などに使います。",
  "column": "コラムやサイド記事に使います。",
  "danger": "危険を示す最も強い注意書きに使います。",
  "hint": "ヒントに使います。",
  "important": "重要情報や重要事項に使います。",
  "information": "案内、参考情報、情報ブロックに使います。",
  "memo": "メモに使います。",
  "note": "注、註、注記、備考のような中立的な注に使います。",
  "notice": "通知、通告、告知、掲示、お知らせに使います。",
  "point": "ポイントや要点に使います。",
  "tip": "コツ、秘訣、助言、アドバイス、豆知識に使います。",
  "warning": "注意より強く、危険ほど最上位ではない警告に使います。",
  "answer": "質問に対する回答や答えに使います。",
  "assessments": "評価、採点、試験、小テスト、確認テストに使います。",
  "explanation": "解説に使います。問題・解答・例の後に置く説明にも向きます。",
  "faq": "FAQやよくある質問に使います。",
  "feedback": "フィードバックに使います。",
  "interview": "インタビュー形式の内容に使います。",
  "lesson": "レッスンや単元に使います。",
  "problem": "問題、演習問題、練習問題に使います。",
  "qna": "Q&A、質疑応答、一問一答に使います。",
  "question": "質問、問い、設問、問1のような個別の問いに使います。",
  "solution": "解答、解答例、解法、解決方法に使います。",
  "check": "チェック、確認事項、チェックリストに使います。",
  "decision": "会議メモや業務文書の決定事項・決定内容に使います。",
  "issue": "問題点、争点、論点、検討課題、懸案事項に使います。",
  "limitations": "制限事項、制約、制約事項に使います。",
  "procedure": "手順、操作手順、作業手順に使います。",
  "requirements": "要件、必要条件、動作要件、システム要件に使います。",
  "resources": "資料や教材に使います。",
  "task": "課題、作業、タスク、宿題、アクションアイテムに使います。",
  "agenda": "会議や授業などの議題、アジェンダ、議事次第に使います。",
  "event": "イベント、行事、催し物などの情報に使います。",
  "opinion": "意見、見解、オピニオンに使います。",
  "outline": "概略やアウトラインに使います。",
  "overview": "概要、概観、大要、あらましに使います。",
  "part-titlepage": "電子書籍などの部扉に使います。通常は`h1`の部見出しから検出します。",
  "planning": "計画、計画案、プランなど、実行する予定や段取りに使います。",
  "profile": "プロフィールや人物紹介に使います。",
  "proposal": "検討・承認・採用を求める提案やプロポーザルに使います。",
  "recommendation": "おすすめ、推薦、推奨、勧めに使います。",
  "reference": "参照、参考資料、参照先に使います。",
  "related": "関連、関連情報、関連資料に使います。",
  "related-book": "関連本・関連書籍・関連雑誌に使います。",
  "related-article": "関連記事に使います。",
  "related-link": "関連リンクや参考リンクに使います。",
  "supplement": "補足情報や補遺に使います。",
  "suggestion": "提案やサジェストに使います。",
  "summary": "要約、まとめ、あらすじに使います。",
  "topic": "トピックや話題に使います。",
  "learning-objectives": "学習目標や到達目標を示す部分に使います。",
  "minutes": "議事録など、会議の記録を示す部分に使います。",
  "next-steps": "次のステップや今後の対応を示す部分に使います。",
  "prerequisites": "前提条件や事前準備を示す部分に使います。",
  "rubric": "評価基準・採点基準を示す部分に使います。",
  "troubleshooting": "トラブルシューティングや困ったときの案内に使います。"
}

const EN_NOTES = {
  "bibliography": "Plural `References` maps here; singular `Reference` remains `reference`.",
  "appendix-titlepage": "No default `role` is emitted. Explicit labels such as `Appendix titlepage.` work through the normal semantic-label flow; built-in titlepage inference can also infer this container from an hr-sandwiched `h1` like `Appendix A. Reference Data`, or from the first content `h1` when parsed frontmatter sets `sc.titlepage: true` / `sc: { titlepage: true }`.",
  "chapter-titlepage": "No default `role` is emitted. Explicit labels such as `Chapter titlepage.` work through the normal semantic-label flow; built-in titlepage inference can also infer this container from an hr-sandwiched `h1` like `Chapter 1. Title`, or from the first content `h1` when parsed frontmatter sets `sc.titlepage: true` / `sc: { titlepage: true }`.",
  "glossary": "Has a close DPUB-ARIA match and emits `doc-glossary`.",
  "note": "No default `role` is emitted. Kept as a section-level document block because many notes are part of the main flow, not tangential asides. Use `notice`, `warning`, `caution`, `important`, or `danger` for notice-like alerts.",
  "caution": "Use for preventable mistakes or care-needed points. Use `warning` or `danger` when the risk is stronger.",
  "warning": "Use for stronger warnings. Use `danger` only for the strongest hazard wording.",
  "danger": "Use sparingly for the strongest hazard level.",
  "alert": "Keep this for broad alert/attention-call sections; use `warning`, `caution`, or `danger` when the severity is clearer.",
  "answer": "Keep separate from `solution`: answers are responses, while solutions can include worked methods.",
  "assessments": "`test` is intentionally not recognized because it is too broad in software documentation.",
  "explanation": "No default `role` is emitted because there is no close DPUB-ARIA role.",
  "problem": "`practice problem(s)` is recognized, but bare `practice` is intentionally not recognized.",
  "question": "Keep separate from `problem`: questions ask; problems/exercises are to be solved.",
  "solution": "Keep separate from `answer`: solutions may include reasoning or method.",
  "check": "No default `role` is emitted because a checklist is a workflow section, not a DPUB notice by default.",
  "limitations": "No default `role` is emitted; this is a practical technical-document section rather than a DPUB structural role.",
  "procedure": "No default `role` is emitted; use for how-to steps rather than requirements or resources.",
  "requirements": "No default `role` is emitted; use `procedure` for steps and `limitations` for restrictions.",
  "resources": "Use `bibliography` for formal citations and `related-link` for link-only see-also lists.",
  "task": "Includes school assignments and office action items.",
  "reference": "Japanese bare `参考` is intentionally not a built-in alias because it is broad; use `参考資料` when you mean reference material.",
  "related-link": "Use `bibliography` for formal references lists; use this for navigational links.",
  "next-steps": "Use `task` for specific assignments or action items, and `planning` for plans.",
  "part-titlepage": "No default `role` is emitted. Explicit labels such as `Part titlepage.` work through the normal semantic-label flow; built-in titlepage inference can also infer this container from an hr-sandwiched `h1` like `Part 1. Title`, or from the first content `h1` when parsed frontmatter sets `sc.titlepage: true` / `sc: { titlepage: true }`.",
  "planning": "Use `proposal` when the section is an offer or project proposal for approval.",
  "proposal": "Japanese `企画案` maps here, but bare `企画` remains unregistered because it can mean planning more broadly."
}

const JA_NOTES = {
  "bibliography": "文献一覧・文献表はここです。単なる参考資料は`reference`や`resources`と使い分けます。",
  "appendix-titlepage": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。`付録扉。`/`付属扉。`のような明示ラベルは通常のsemantic labelとして使えます。組み込みのtitlepage推定では`付録A 参考データ`/`付属A 参考データ`のようなhrで挟まれた`h1`、または解析済みfrontmatterの`sc.titlepage: true` / `sc: { titlepage: true }`で指定されたファイル先頭の`h1`からも推定できます。",
  "chapter-titlepage": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。`章扉。`のような明示ラベルは通常のsemantic labelとして使えます。組み込みのtitlepage推定では`第1章 はじめに`、`第II章 ローマ数字`のようなhrで挟まれた`h1`、または解析済みfrontmatterの`sc.titlepage: true` / `sc: { titlepage: true }`で指定されたファイル先頭の`h1`からも推定できます。",
  "glossary": "DPUB-ARIAに近いroleがあり、`doc-glossary`を出します。",
  "note": "中立的な注です。本文の流れに含まれる注も多いため、補足的な`aside`ではなくsection相当の文書ブロックとして扱います。警告・注意・重要事項は`warning`/`caution`/`important`を使います。",
  "caution": "避けるべきミスや注意点に使います。より強い危険性がある場合は`warning`または`danger`を使います。",
  "warning": "注意より強い警告に使います。最上位の危険表示だけ`danger`を使います。",
  "danger": "最も強い危険表示に限定して使います。",
  "answer": "`solution`の`解答`/`解法`とは分けます。`answer`は回答・答え寄りです。",
  "assessments": "`テスト`単独は技術文書で広すぎるため認識しません。`小テスト`や`確認テスト`を使います。",
  "explanation": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。",
  "problem": "`練習問題`/`演習問題`は認識しますが、`練習`単独は広すぎるため認識しません。",
  "question": "`problem`/`問題`とは分けます。質問・問い・設問はここです。",
  "solution": "解答や解法に使います。回答・答えは`answer`と分けます。",
  "check": "チェックリストは業務・技術文書の作業用セクションなので、既定の`role`属性は出力しません。",
  "limitations": "技術文書では重要ですが、DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。",
  "procedure": "`requirements`/`要件`や`resources`/`資料`とは分け、実際の手順に使います。",
  "requirements": "要件や条件に使います。手順は`procedure`、制約は`limitations`に分けます。",
  "resources": "資料・教材に使います。正式な参考文献は`bibliography`、リンク集は`related-link`です。",
  "lesson": "`教訓`は学習単元よりも強い意味になりやすいため既定aliasにはしません。",
  "issue": "`検討課題`は会議の議題にも見えますが、内容としては検討すべき論点・懸案に近いため`issue`に寄せます。",
  "task": "`課題`は広い語ですが、学校のassignmentとして重要なため維持します。論点・懸案は`issue`を使います。",
  "reference": "`参考`単独は広いため既定aliasにはしません。参考資料として明示する場合は`参考資料`を使います。",
  "related-link": "リンク集としての関連リンク・参考リンクに使います。正式な文献一覧は`bibliography`です。",
  "next-steps": "具体的な作業項目は`task`、計画そのものは`planning`を使います。",
  "part-titlepage": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。`部扉。`のような明示ラベルは通常のsemantic labelとして使えます。組み込みのtitlepage推定では`第1部 扉タイトル`のようなhrで挟まれた`h1`、または解析済みfrontmatterの`sc.titlepage: true` / `sc: { titlepage: true }`で指定されたファイル先頭の`h1`からも推定できます。",
  "planning": "承認を求める企画案・提案書は`proposal`を使います。",
  "proposal": "`企画案`はproposalとして認識しますが、裸の`企画`はplanningとの境界が曖昧なため未登録です。"
}

const CATEGORIES = [
  {
    "enTitle": "Publishing structure and front/back matter",
    "jaTitle": "出版構造・前付け/後付け",
    "semantics": [
      "abstract",
      "acknowledgments",
      "afterword",
      "appendix",
      "appendix-titlepage",
      "author",
      "bibliography",
      "book",
      "chapter-toc",
      "chapter-titlepage",
      "colophon",
      "conclusion",
      "credits",
      "dedication",
      "editor-note",
      "endnotes",
      "epigraph",
      "epilogue",
      "errata",
      "first-published",
      "foreword",
      "glossary",
      "index",
      "introduction",
      "keywords",
      "lead",
      "part-titlepage",
      "postscript",
      "preamble",
      "preface",
      "prologue",
      "pull-quote",
      "toc"
    ]
  },
  {
    "enTitle": "Notices, tips, and sidebars",
    "jaTitle": "注意書き・ヒント・サイドバー",
    "semantics": [
      "alert",
      "annotation",
      "caution",
      "column",
      "danger",
      "hint",
      "important",
      "information",
      "memo",
      "note",
      "notice",
      "point",
      "tip",
      "warning"
    ]
  },
  {
    "enTitle": "Learning, Q&A, and assessment",
    "jaTitle": "学習・Q&A・評価",
    "semantics": [
      "answer",
      "assessments",
      "explanation",
      "faq",
      "feedback",
      "interview",
      "learning-objectives",
      "lesson",
      "problem",
      "qna",
      "question",
      "rubric",
      "solution"
    ]
  },
  {
    "enTitle": "Technical and workflow documentation",
    "jaTitle": "技術・業務フロードキュメント",
    "semantics": [
      "check",
      "decision",
      "issue",
      "limitations",
      "next-steps",
      "prerequisites",
      "procedure",
      "requirements",
      "resources",
      "task",
      "troubleshooting"
    ]
  },
  {
    "enTitle": "Editorial, planning, and related material",
    "jaTitle": "編集・計画・関連資料",
    "semantics": [
      "agenda",
      "event",
      "minutes",
      "opinion",
      "outline",
      "overview",
      "planning",
      "profile",
      "proposal",
      "recommendation",
      "reference",
      "related",
      "related-book",
      "related-article",
      "related-link",
      "supplement",
      "suggestion",
      "summary",
      "topic"
    ]
  }
]

const GENERATED_COMMENT = '<!-- This file is generated by docs/generate-semantic-catalog.js. Edit the generator and semantics/*.json, then rerun npm run docs:semantic-catalog. -->'

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const formatInlineCodeList = (values) => values.map((value) => `\`${value}\``).join(', ')

const formatAttrs = (attrs) => {
  if (!Array.isArray(attrs) || attrs.length === 0) return ''
  return attrs.map(([key, value]) => ` ${key}="${value}"`).join('')
}

const outputTag = (semantic) => `<${semantic.tag} class="sc-${semantic.name}"${formatAttrs(semantic.attrs)}>`

const labelsFor = (semantic) => [semantic.name, ...(Array.isArray(semantic.aliases) ? semantic.aliases : [])]

const validateCategories = (semantics) => {
  const semanticNames = new Set(semantics.map((semantic) => semantic.name))
  const categorizedNames = new Set()

  for (const category of CATEGORIES) {
    for (const name of category.semantics) {
      if (!semanticNames.has(name)) throw new Error(`Unknown semantic in category list: ${name}`)
      if (categorizedNames.has(name)) throw new Error(`Semantic appears in multiple categories: ${name}`)
      categorizedNames.add(name)
    }
  }

  const missing = [...semanticNames].filter((name) => !categorizedNames.has(name))
  if (missing.length > 0) throw new Error(`Semantics missing from category list: ${missing.join(', ')}`)
}

const renderEntries = ({ semantics, ja, language }) => {
  const byName = new Map(semantics.map((semantic) => [semantic.name, semantic]))
  const overviews = language === 'ja' ? JA_OVERVIEWS : EN_OVERVIEWS
  const notes = language === 'ja' ? JA_NOTES : EN_NOTES
  const lines = []

  for (const category of CATEGORIES) {
    lines.push(`### ${language === 'ja' ? category.jaTitle : category.enTitle}`, '')
    for (const name of category.semantics) {
      const semantic = byName.get(name)
      const overview = overviews[name] || (language === 'ja' ? `${name}を示す部分に使います。` : `Use for ${name} sections.`)
      lines.push(`- \`${name}\`: ${overview}`)
      lines.push(language === 'ja'
        ? `  - 出力: \`${outputTag(semantic)}\``
        : `  - Output: \`${outputTag(semantic)}\``)
      lines.push(language === 'ja'
        ? `  - 英語ラベル: ${formatInlineCodeList(labelsFor(semantic))}`
        : `  - English labels: ${formatInlineCodeList(labelsFor(semantic))}`)
      const jaLabels = Array.isArray(ja[name]) ? ja[name] : []
      lines.push(language === 'ja'
        ? `  - 日本語ラベル: ${formatInlineCodeList(jaLabels)}`
        : `  - Japanese labels: ${formatInlineCodeList(jaLabels)}`)
      if (notes[name]) lines.push(language === 'ja' ? `  - 注意: ${notes[name]}` : `  - Notes: ${notes[name]}`)
    }
    lines.push('')
  }

  return lines
}

const renderEnglish = (semantics, ja) => [
  '# Semantic catalog',
  '',
  GENERATED_COMMENT,
  '',
  'This document explains every built-in canonical semantic recognized by the plugin.',
  'It complements the compact label list in the README.',
  '',
  'Japanese version: [semantic-catalog_ja.md](semantic-catalog_ja.md).',
  '',
  '## Policy',
  '',
  '- The source of truth for names, aliases, tags, and default attributes is `semantics/en.json` plus locale aliases such as `semantics/ja.json`.',
  '- English canonical names are always recognized. Japanese aliases are loaded by default through the `languages` option.',
  '- Built-in aliases may use regex-like patterns. Runtime `semanticContainerSc` aliases are literal strings.',
  '- The package emits stable `sc-*` classes for all semantics.',
  '- This plugin handles semantics that wrap content as `section`, `aside`, or `div`.',
  '- Built-in titlepage inference converts conservative numbered, lettered, and Roman-numeral hr-sandwiched `h1` headings into `chapter-titlepage`, `appendix-titlepage`, and `part-titlepage`. Parsed frontmatter can also set `sc.titlepage: true` or nested `sc: { titlepage: true }` to wrap from the first content `h1` without an opening body `hr`.',
  '- `Prologue`, `Epilogue`, `Introduction`, `Conclusion`, `序章`, `終章`, `プロローグ`, and `エピローグ` are not inferred as h1 titlepages by default. Use explicit semantic labels for those DPUB section semantics, or handle whole-document wrapping in EPUB-level tooling.',
  '- Figure-like examples are intentionally delegated to figure/caption plugins such as `p7d-markdown-it-figure-with-p-caption`.',
  '- `role="doc-*"` is emitted only for close DPUB-ARIA matches.',
  '- `epub:type` is not emitted by default.',
  '',
  '## Common distinctions',
  '',
  'This section explains boundaries between easily confused semantics and shows which label to choose when several terms look similar.',
  '',
  '- `answer` vs `solution`: `answer` is a direct response. `solution` can include a worked method or explanation.',
  '- `question` vs `problem`: `question` asks something. `problem`/`exercise` is something to solve.',
  '- `bibliography` vs `reference` vs `resources` vs `related-link`: `bibliography` is a formal references list. `reference` is reference information. `resources` is supporting material. `related-link` is a see-also/further-reading link list.',
  '- `chapter-titlepage`/`appendix-titlepage`/`part-titlepage` vs `chapter-toc`/`toc`: titlepage semantics wrap chapter/appendix/part opening design material. TOC semantics wrap navigational lists.',
  '- `note` vs `notice`/`alert`/`important`: `note` is neutral and emits no default `role`. `notice` and `alert` are notification-like, while `important` marks emphasis without necessarily implying risk.',
  '- `caution` vs `warning` vs `danger`: `caution` is for care-needed points or preventable trouble. `warning` is stronger. `danger` is reserved for the strongest hazard level.',
  '- `requirements` vs `prerequisites` vs `procedure` vs `limitations`: `requirements` are conditions to satisfy. `prerequisites` are preconditions before starting. `procedure` is how to do something. `limitations` are restrictions or constraints.',
  '- `agenda` vs `issue`: `agenda` is the list of meeting or class topics. `issue` is a point to discuss, dispute, or resolve.',
  '- `minutes` vs `agenda` vs `decision`: `agenda` is the plan for a meeting. `minutes` is the record of a meeting. `decision` is a decision item.',
  '- `planning` vs `proposal`: `planning` describes plans, schedules, or intended courses of action. `proposal` is a suggested plan or project submitted for consideration or approval.',
  '- `learning-objectives` vs `rubric` vs `assessments`: `learning-objectives` states goals. `rubric` states evaluation criteria. `assessments` contains tests or grading sections.',
  '',
  '## Entries',
  '',
  ...renderEntries({ semantics, ja, language: 'en' }),
].join('\n').replace(/\n+$/, '\n')

const renderJapanese = (semantics, ja) => [
  '# Semantic catalog（日本語）',
  '',
  GENERATED_COMMENT,
  '',
  'この文書は、このプラグインが既定で認識するcanonical semanticを説明します。',
  'READMEの簡易一覧を補う詳細カタログです。',
  '',
  'English version: [semantic-catalog.md](semantic-catalog.md).',
  '',
  '## 方針',
  '',
  '- 名前、alias、出力タグ、既定属性の信頼できる情報源は`semantics/en.json`と`semantics/ja.json`です。',
  '- 英語のcanonical名は常に認識されます。日本語aliasは既定で`languages`オプションから読み込まれます。',
  '- built-in aliasでは正規表現に近いパターンを使うことがあります。実行時の`semanticContainerSc` aliasはリテラル文字列として扱います。',
  '- すべてのsemanticで安定した`sc-*` classを出力します。',
  '- このプラグインは、`section`、`aside`、`div`としてラップするsemanticを扱います。',
  '- 組み込みのtitlepage推定は、保守的な番号付き・文字付き・ローマ数字のhrサンドイッチ`h1`見出しを`chapter-titlepage`/`appendix-titlepage`/`part-titlepage`に変換します。解析済みfrontmatterでは`sc.titlepage: true`または入れ子の`sc: { titlepage: true }`を指定すると、本文側の開始`hr`なしでファイル先頭の`h1`から章扉・付録/付属扉・部扉として扱えます。',
  '- `Prologue`、`Epilogue`、`Introduction`、`Conclusion`、`序章`、`終章`、`プロローグ`、`エピローグ`は、既定ではh1 titlepageとして推定しません。これらのDPUB section semanticは明示ラベルで使うか、文書全体のラップをEPUB処理ツール側で扱います。',
  '- figure的な例示は、`p7d-markdown-it-figure-with-p-caption`などのfigure/caption系プラグインに委譲します。',
  '- `role="doc-*"`はDPUB-ARIAに近い対応がある場合だけ出力します。',
  '- `epub:type`は既定では出力しません。',
  '- 日本語aliasはEPUB/DPUB語彙の規範的な訳語表ではなく、このプラグインが日本語文書の見出しとして認識する語です。',
  '- そのため、直訳よりも実際の技術文書、業務文書、教材で見出しとして自然に使える語を優先しています。',
  '',
  '## 使い分け',
  '',
  'この節では、意味が近くて迷いやすいsemanticについて、どのラベルを選ぶとよいかを説明します。',
  '',
  '- `answer`と`solution`: `answer`は直接の回答です。`solution`は解き方や解決方法まで含められます。',
  '- `question`と`problem`: `question`は質問です。`problem`/`exercise`は解く対象です。',
  '- `bibliography`、`reference`、`resources`、`related-link`: `bibliography`は文献一覧、`reference`は参照情報、`resources`は教材・資料、`related-link`は関連リンク集です。',
  '- `chapter-titlepage`/`appendix-titlepage`/`part-titlepage`と`chapter-toc`/`toc`: titlepage系は章・付録/付属・部の扉デザイン部分、TOC系はナビゲーション用の目次です。',
  '- `note`と`notice`/`alert`/`important`: `note`は中立的な注記です。`notice`と`alert`は通知・告知寄り、`important`は危険性より重要度の強調です。',
  '- `caution`、`warning`、`danger`: `caution`は注意点や避けるべきミス、`warning`はそれより強い警告、`danger`は最も強い危険表示です。',
  '- `requirements`、`prerequisites`、`procedure`、`limitations`: `requirements`は満たすべき条件、`prerequisites`は始める前の前提、`procedure`は手順、`limitations`は制限や制約です。',
  '- `agenda`と`issue`: `agenda`は会議や授業の議題一覧です。`issue`は検討・解決すべき論点や懸案です。',
  '- `minutes`、`agenda`、`decision`: `agenda`は会議前の議題、`minutes`は会議記録、`decision`は決定事項です。',
  '- `planning`と`proposal`: `planning`は計画・予定・段取りです。`proposal`は検討や承認を求める提案・企画案です。',
  '- `learning-objectives`、`rubric`、`assessments`: `learning-objectives`は学習目標、`rubric`は評価基準、`assessments`は試験・評価セクションです。',
  '',
  '## 一覧',
  '',
  ...renderEntries({ semantics, ja, language: 'ja' }),
].join('\n').replace(/\n+$/, '\n')

const main = () => {
  const semantics = readJson(EN_PATH)
  const ja = readJson(JA_PATH)
  validateCategories(semantics)
  fs.writeFileSync(path.join(__dirname, 'semantic-catalog.md'), renderEnglish(semantics, ja), 'utf8')
  fs.writeFileSync(path.join(__dirname, 'semantic-catalog_ja.md'), renderJapanese(semantics, ja), 'utf8')
}

main()
