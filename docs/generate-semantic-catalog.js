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
  "book": "Use for book, magazine, or publication information blocks.",
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
  "lead": "Use for lead text or a lede/introduction block.",
  "postscript": "Use for postscripts or dated additions.",
  "preamble": "Use for a formal preamble, such as the opening statement of a policy, declaration, or specification.",
  "preface": "Use for prefaces.",
  "prologue": "Use for prologues.",
  "pullquote": "Use for distinctively placed or highlighted quotations from the current content.",
  "toc": "Use for a document-level table of contents.",
  "alert": "Use for broad alerts or calls for attention whose severity is not fixed.",
  "annotation": "Use for annotations or marginal/editorial comments that accompany the main content.",
  "caution": "Use for caution notices where readers should avoid mistakes, unsafe actions, or avoidable trouble.",
  "column": "Use for columns or sidebar articles.",
  "danger": "Use for danger notices with the strongest hazard level.",
  "hint": "Use for hints that help readers solve or understand something.",
  "important": "Use for content whose priority or importance needs emphasis.",
  "information": "Use for general, background, or supplemental information presented in the block.",
  "memo": "Use for memo sections.",
  "note": "Use for neutral notes, annotations, or remarks.",
  "notice": "Use for consequence-oriented notices, such as warnings, cautions, and dangers.",
  "point": "Use for a central point, key point, main point, or important takeaway.",
  "tip": "Use for tips or practical advice.",
  "warning": "Use for warning notices that are stronger than caution but not necessarily the strongest danger level.",
  "answer": "Use for answer text, especially a direct response to a question.",
  "assessment": "Use for assessments, quizzes, exams, or diagnostic checks, not broad value or performance evaluations.",
  "explanation": "Use for explanations, especially after questions, examples, procedures, or solutions.",
  "faq": "Use for FAQ sections.",
  "feedback": "Use for feedback sections or response/comments areas.",
  "interview": "Use for interviews as an editorial content type, whether or not every passage follows a strict Q&A sequence.",
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
  "evaluation": "Use for judgments of quality, value, effectiveness, results, or performance against criteria.",
  "opinion": "Use for opinion or viewpoint sections.",
  "outline": "Use for outlines.",
  "overview": "Use for overviews.",
  "part-titlepage": "Use for ebook part-opening title pages, usually detected from an `h1` part heading.",
  "planning": "Use for plans, planning sections, schedules, or intended courses of action.",
  "profile": "Use for profile/person-introduction sections.",
  "proposal": "Use for formal proposals or planning documents submitted for consideration, approval, or adoption.",
  "recommendation": "Use for recommendations, advised choices, or advised actions.",
  "reference": "Use for reference information or a single reference block.",
  "related": "Use for broad related information.",
  "related-book": "Use for related book, magazine, or publication suggestions.",
  "related-article": "Use for related article suggestions.",
  "related-link": "Use for related links, see-also links, or further-reading links.",
  "supplement": "Use for supplements or supplemental information.",
  "suggestion": "Use for lighter suggestions that do not necessarily require formal approval.",
  "summary": "Use for summaries or recaps.",
  "topic": "Use for topics or subject sections.",
  "learning-objective": "Use for learning objectives or expected outcomes.",
  "minutes": "Use for meeting minutes or records of discussions and decisions.",
  "next-steps": "Use for follow-up actions or forward-looking next-step sections.",
  "prerequisites": "Use for prerequisite knowledge, setup, or preconditions.",
  "rubric": "Use for grading rubrics or evaluation criteria.",
  "troubleshooting": "Use for troubleshooting and diagnostic help sections.",
  "updates": "Use for update notes, revision history, or change-history sections."
}

const JA_OVERVIEWS = {
  "abstract": "要旨・抄録のような、本文全体を短くまとめる部分に使います。",
  "acknowledgments": "謝辞・謝意を示す部分に使います。",
  "afterword": "後書き・あとがき・跋文に使います。",
  "appendix": "付録、付属書・附属書、付属資料・附属資料に使います。",
  "appendix-titlepage": "電子書籍などの付録扉・付属扉に使います。通常は`h1`の付録・付属見出しから検出します。",
  "author": "著者情報に使います。",
  "bibliography": "参考文献一覧や文献表に使います。",
  "book": "書籍・雑誌・刊行物・書誌情報の案内に使います。",
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
  "errata": "正誤表や訂正に使います。",
  "first-published": "初出情報に使います。",
  "foreword": "刊行・発行に寄せた前置きに使います。",
  "glossary": "用語集・用語一覧に使います。",
  "index": "索引に使います。",
  "introduction": "序論、序説、はじめに相当の部分に使います。",
  "keywords": "キーワード、重要語、手がかり語に使います。",
  "lead": "リード文や導入文をまとめるブロックに使います。",
  "postscript": "追記に使います。",
  "preamble": "規約、宣言、仕様などの正式な前文に使います。",
  "preface": "前書き・まえがきに使います。",
  "prologue": "プロローグ・序章に使います。",
  "pullquote": "本文中の引用を目立つ位置や表示で取り上げるプルクオート・プルクォートに使います。",
  "toc": "目次・もくじに使います。",
  "alert": "危険や問題に対して注意を促す、危険度を固定しないアラート・注意喚起に使います。",
  "annotation": "本文に添える注釈や補助的なコメントに使います。",
  "caution": "注意、注意事項、注意書・注意書き、使用上の注意などに使います。",
  "column": "コラムやサイド記事に使います。",
  "danger": "危険を示す最も強い注意書きに使います。",
  "hint": "ヒントに使います。",
  "important": "重要、重要情報、重要事項、重要なこと・事柄に使います。",
  "information": "案内・ご案内、お知らせ・告知、参考情報、情報ブロックに使います。",
  "memo": "メモに使います。",
  "note": "注、註、注記、備考のような中立的な注に使います。",
  "notice": "行為・出来事から生じ得る結果を読者へ知らせる通知・通告に使います。",
  "point": "ポイントや要点に使います。",
  "tip": "コツ、秘訣、助言、アドバイス、豆知識に使います。",
  "warning": "注意より強く、危険ほど最上位ではない警告に使います。",
  "answer": "質問に対する回答や答えに使います。",
  "assessment": "アセスメント、試験、小テスト、確認テストに使います。",
  "explanation": "解説に使います。問題・解答・例の後に置く説明にも向きます。",
  "faq": "FAQやよくある質問に使います。",
  "feedback": "フィードバックに使います。",
  "interview": "インタビュー形式の内容に使います。",
  "lesson": "レッスンや単元に使います。",
  "problem": "解く対象となる問題、演習問題、練習問題の単位に使います。",
  "qna": "Q&A、質疑応答、一問一答に使います。",
  "question": "質問、問い、設問、小問、発問のような個別の問いに使います。",
  "solution": "解答、解答例、解法、解決方法に使います。",
  "check": "チェック、確認事項、チェックリストに使います。",
  "decision": "会議メモや業務文書の決定事項・決定内容に使います。",
  "issue": "問題点、争点、論点、検討課題、懸案事項に使います。",
  "limitations": "制限事項、制約、制約事項に使います。",
  "procedure": "手順、操作手順、作業手順に使います。",
  "requirements": "要件、要求事項、必要条件、必須項目、動作要件、システム要件に使います。",
  "resources": "資料、教材、参考資料に使います。",
  "task": "タスク、宿題、アクションアイテムに使います。",
  "agenda": "会議や授業などの議題、アジェンダ、議事次第に使います。",
  "event": "イベント、行事、催し物などの情報に使います。",
  "evaluation": "製品評価、品質評価、性能評価、パフォーマンス評価に使います。",
  "opinion": "意見、見解、オピニオンに使います。",
  "outline": "概略やアウトラインに使います。",
  "overview": "概要、概観、大要、あらましに使います。",
  "part-titlepage": "電子書籍などの部扉に使います。通常は`h1`の部見出しから検出します。",
  "planning": "計画、計画案、プランなど、実行する予定や段取りに使います。",
  "profile": "プロフィールや人物紹介に使います。",
  "proposal": "検討・承認・採否判断の対象となる提案書、企画案、企画書、プロポーザルに使います。",
  "recommendation": "おすすめ、提言、推薦、推奨、推奨事項に使います。",
  "reference": "参照、参照先、参照情報、リファレンスに使います。",
  "related": "関連情報、関連資料に使います。",
  "related-book": "関連本・関連書籍・関連雑誌・関連刊行物に使います。",
  "related-article": "関連記事に使います。",
  "related-link": "関連リンクや参考リンクに使います。",
  "supplement": "補足情報や補遺に使います。",
  "suggestion": "正式な承認を必須としない提案やサジェストに使います。",
  "summary": "要約、まとめ、あらすじに使います。",
  "topic": "トピックや話題に使います。",
  "learning-objective": "学習目標や到達目標を示す部分に使います。",
  "minutes": "議事録など、会議の記録を示す部分に使います。",
  "next-steps": "次のステップや今後の対応を示す部分に使います。",
  "prerequisites": "前提条件や事前準備を示す部分に使います。",
  "rubric": "評価基準・採点基準を示す部分に使います。",
  "troubleshooting": "トラブルシューティングや困ったときの案内に使います。",
  "updates": "更新、更新履歴、改訂履歴に使います。"
}

const EN_NOTES = {
  "bibliography": "Plural `References` maps here; singular `Reference` remains `reference`. `doc-bibliography` requires at least one descendant list of entries. The plugin recognizes the author-supplied section label but does not invent or validate that list structure.",
  "appendix-titlepage": "No default `role` is emitted. Explicit labels such as `Appendix titlepage.` are available, but they follow the normal semantic-label flow and the label text remains visible unless hidden with `labelControl` or `semanticContainerSc`. When hidden, the roleless `div` does not receive an `aria-label` fallback. If a workflow needs accessible named titlepage groups, add an explicit role-bearing wrapper such as `role=\"group\"` in that workflow. For ebook title pages, prefer hr-sandwiched `h1` inference such as `Appendix A. Reference Data`, or parsed frontmatter `sc.titlepage: true` / `sc: { titlepage: true }`.",
  "chapter-titlepage": "No default `role` is emitted. Explicit labels such as `Chapter titlepage.` are available, but they follow the normal semantic-label flow and the label text remains visible unless hidden with `labelControl` or `semanticContainerSc`. When hidden, the roleless `div` does not receive an `aria-label` fallback. If a workflow needs accessible named titlepage groups, add an explicit role-bearing wrapper such as `role=\"group\"` in that workflow. For ebook title pages, prefer hr-sandwiched `h1` inference such as `Chapter 1. Title`, or parsed frontmatter `sc.titlepage: true` / `sc: { titlepage: true }`.",
  "glossary": "Has a close DPUB-ARIA match and emits `doc-glossary`.",
  "foreword": "Japanese labels accept `刊行に寄せて` and forms scoped by `本書の` or `日本語版の`; malformed bare `の刊行に寄せて` is intentionally not recognized.",
  "editor-note": "Natural spaced forms are recognized. Unspaced `editornote` and apostrophe-less `editors note` are intentionally not treated as English headings.",
  "lead": "This is the only built-in semantic with `hideLabel: true`. It uses a roleless `div`: a lead/lede is normally opening prose rather than a separately navigable document section, and `lead` is not an EPUB Structural Semantics Vocabulary term or DPUB-ARIA role. The hidden control marker therefore does not create a named `region` landmark. The marker is hidden by default in standard, bracket, and GitHub alert input. A non-empty inline label control overrides the default and shows a replacement label. An exact jointless heading such as `## Lead` is intentionally not matched, because hiding its only text would leave an empty heading. This follows the general invariant for any semantic whose catalog label is hidden by default; it is not a hard-coded `lead` matcher exception.",
  "book": "This remains the canonical semantic for book, magazine, and publication information so the established `sc-book` output stays stable. `publication`, `magazine`, and their information forms are input labels. Use `related-book` for related or suggested publications and `colophon` for the current work's formal imprint. Bare plural `publications` is intentionally not recognized because it often means an author's works or a publication list. Dual `sc-book` / `sc-publication` output is intentionally not added because compatibility would also have to define label and joint class aliases.",
  "chapter-toc": "Emits `doc-toc` on `nav`. Use only when the wrapped content is actually a navigational list of links scoped to a chapter or smaller section; the plugin does not manufacture or validate link structure.",
  "endnotes": "`doc-endnotes` requires at least one descendant list of notes and must not be applied directly to that list. This plugin only recognizes an explicitly authored section label; note collection, backlinks, list generation, and structural validation belong to a footnote/endnote plugin or downstream EPUB tooling.",
  "errata": "Has a close DPUB-ARIA match and emits `doc-errata`. Use for corrections after publication; use `updates` for general update or revision-history notes.",
  "note": "No default `role` is emitted. Kept as a section-level document block because many notes are part of the main flow, not tangential asides. Use `notice`, `warning`, `caution`, `important`, or `danger` for notice-like alerts.",
  "notice": "Emits the structural DPUB-ARIA `doc-notice` role, whose current definition is to notify users of consequences that might arise from an action or event; examples include warnings, cautions, and dangers. Its superclass is `note`, not `alert`: the role does not by itself create a pop-up, move focus, or request immediate announcement. Japanese `通知` and the more formal `通告` are built in as direct, natural headings for this author-selected semantic, just as English `Notice` is. The content still needs to fit the consequence-oriented role. Broader announcement headings `お知らせ` and `告知` map instead to roleless `information`; `掲示` remains unregistered. Japanese `注意書` and `注意書き` map to `caution` rather than serving as translations of `notice`.",
  "information": "Use for general, background, or supplemental information presented in the block. Japanese `お知らせ` and `告知` are pragmatic roleless matches for generic announcements that do not establish the consequence-oriented `doc-notice` contract. `参考情報` maps here because it normally supplies material for understanding or judgment; `参照情報` maps to `reference` when the block identifies what or where to consult. Japanese `案内` remains another pragmatic roleless match. Use a more specific semantic for procedures, events, updates, or navigation when that function is clear; bare `掲示` remains unregistered.",
  "index": "`doc-index` represents a navigational aid containing links to indexed subjects. The plugin recognizes the section label but does not manufacture or validate index entries or links.",
  "caution": "Use for preventable mistakes or care-needed points. Use `warning` or `danger` when the risk is stronger.",
  "warning": "Use for stronger warnings. Use `danger` only for the strongest hazard wording.",
  "danger": "Use sparingly for the strongest hazard level.",
  "alert": "Keep this for broad alert/attention-call sections; use `warning`, `caution`, or `danger` when the severity is clearer. Japanese `注意喚起` describes the act or category of calling attention rather than one specific caution level, so it remains here. `警報` is intentionally not recognized because it implies a stronger alarm level or an alarm-system topic.",
  "important": "Use this for importance rather than hazard severity. Noun phrases such as `important notice` and `important information` are recognized; abstract `importance` is intentionally not recognized. No default role is emitted because importance alone does not imply the consequences described by `doc-notice`.",
  "answer": "Keep separate from `solution`: answers are responses, while solutions can include worked methods.",
  "assessment": "`test` is intentionally not recognized because it is too broad in software documentation. This semantic covers assessment, quiz, exam, and diagnostic/checking sections. Bare Japanese `採点` is intentionally left out because scoring or grading is an action rather than an assessment itself. The singular canonical follows the current EPUB `assessment` term; plural `assessments` remains an input label.",
  "evaluation": "Keep separate from `assessment`, `rubric`, and `feedback`: evaluation judges quality, value, effectiveness, results, or performance; assessment measures or tests; rubrics define criteria; feedback comments on results. Natural English product, quality, and performance evaluation headings are recognized in singular and plural forms. Bare Japanese `評価`, `評価結果`, and `総合評価` remain unregistered because they can cross assessment, grading, and judgment boundaries; only specific product, quality, and performance evaluation labels are built in.",
  "learning-objective": "The singular canonical follows the current EPUB `learning-objective` term. The former canonical `learning-objectives` remains a compatibility alias, and the natural spaced singular/plural headings are recognized. Bare `objectives` is intentionally not recognized because project and business objectives are not necessarily learning objectives. No default role is emitted because the EPUB term has no DPUB-ARIA role mapping.",
  "explanation": "No default `role` is emitted because there is no close DPUB-ARIA role.",
  "interview": "No default `role` is emitted because an interview may include narrative, profile, or conversational material instead of a strict question-and-answer series. Use `qna` when the content is explicitly structured as questions and answers.",
  "problem": "A problem is a unit to be solved and may contain its prompt or instructions directly; it does not require a nested `question`. Questions, hints, answers, and explanations are independently usable blocks and are not linked automatically by matching numbers. `practice problem(s)` is recognized, but bare `practice` is intentionally not recognized. Japanese bare `問題` is retained for common exercise/problem headings; use `問題点` or `既知の問題` for an issue-reporting section.",
  "pullquote": "The canonical spelling follows EPUB `pullquote` and DPUB-ARIA `doc-pullquote`; `pull quote` and former canonical `pull-quote` remain input aliases. Output and canonical-name configuration now use `sc-pullquote` / `pullquote`. DPUB-ARIA requires a duplicated presentational pullquote to be hidden from assistive technologies, but the plugin cannot determine whether marked text is the source occurrence or a duplicate, so it does not add `aria-hidden` automatically. Add it in a downstream transform when the rendered pullquote duplicates text elsewhere.",
  "qna": "Bare `QA` is intentionally not recognized because technical documents commonly use it for quality assurance. Use `Q&A`, `Q and A`, or `Questions and answers` for a series of questions and answers; use `question` and `answer` for independent units.",
  "question": "Keep separate from `problem`: a question is an independently labelled question, subquestion, or teaching prompt and may appear inside or outside a problem. Bare Japanese `問` stays unregistered, and specialist forms beyond the established `発問`, `主発問`, and `中心発問` labels remain conservative omissions.",
  "solution": "Keep separate from `answer`: solutions may include reasoning or method.",
  "check": "No default `role` is emitted because a checklist is a workflow section, not a DPUB notice by default.",
  "limitations": "No default `role` is emitted; this is a practical technical-document section rather than a DPUB structural role.",
  "procedure": "No default `role` is emitted; use for how-to steps rather than requirements or resources.",
  "requirements": "No default `role` is emitted; use `procedure` for steps and `limitations` for restrictions. System, hardware, and software requirements map here. Japanese `推奨環境` also stays here because it describes an operating environment, not a general recommendation.",
  "resources": "Use `bibliography` for formal citations and `related-link` for link-only see-also lists. Japanese `参考資料` maps here as supporting material rather than to singular `reference`.",
  "task": "Includes school assignments and office action items.",
  "preamble": "Use for a formal opening statement. Keep separate from `preface` (authorial front matter), `foreword` (introductory words often by another contributor), `introduction` (main-text orientation), and `prologue` (opening narrative or document section).",
  "reference": "Use for a reference block, reference destination, or lookup information: content that identifies what or where to consult rather than merely presenting useful background information. Japanese `参照`, `参照先`, and `参照情報` map here; bare `参考` is intentionally not recognized because it is broad, `参考情報` maps to `information`, and supporting `参考資料` maps to `resources`.",
  "related": "Use noun phrases such as `related information` and `related resources`; abstract `relation` is intentionally not recognized.",
  "related-book": "This remains the canonical semantic for compatibility while covering related books, magazines, and other publications. `related-publication` and natural publication forms are input aliases; output and canonical-name configuration remain `sc-related-book` / `related-book`.",
  "related-link": "Use `bibliography` for formal references lists; use this for navigational links.",
  "next-steps": "Use `task` for specific assignments or action items, and `planning` for plans.",
  "overview": "Japanese `概要` can sometimes function as a formal abstract. It remains under the roleless `overview`; use `要旨` or `抄録` when the publication-specific `doc-abstract` meaning is intended.",
  "part-titlepage": "No default `role` is emitted. Explicit labels such as `Part titlepage.` are available, but they follow the normal semantic-label flow and the label text remains visible unless hidden with `labelControl` or `semanticContainerSc`. When hidden, the roleless `div` does not receive an `aria-label` fallback. If a workflow needs accessible named titlepage groups, add an explicit role-bearing wrapper such as `role=\"group\"` in that workflow. For ebook title pages, prefer hr-sandwiched `h1` inference such as `Part 1. Title`, or parsed frontmatter `sc.titlepage: true` / `sc: { titlepage: true }`.",
  "planning": "Use `proposal` when a formal proposal or planning document is submitted for approval, and `suggestion` for a lighter idea.",
  "point": "English `point` can mean a central idea or the main substance of an argument, so Japanese `要点` remains here. It is a roleless main-flow `section`, not a `doc-tip` aside; use `hint` or `tip` for helpful advice.",
  "proposal": "Use for formal approval or adoption decisions. Japanese `提案書`, `企画案`, and `企画書` map here; bare `提案` maps to `suggestion`, and bare `企画` remains unregistered because it can mean planning more broadly.",
  "recommendation": "Use for advised choices or actions. Japanese `提言` maps here rather than to `proposal`; imperative or adjectival English forms such as `recommend` and `recommended` are intentionally not recognized as standalone labels.",
  "suggestion": "Use for lighter ideas that do not necessarily require approval. Japanese bare `提案` maps here; formal `提案書` maps to `proposal`. English uses the noun labels `suggestion` and `suggestions`, not the verb `suggest`.",
  "summary": "Japanese `まとめ` can also serve as a closing section. It remains under the roleless `summary`; use `結論` or `おわりに` when the stronger `doc-conclusion` meaning is intended.",
  "supplement": "Use for material that clarifies or supplements the main work. Keep separate from `appendix`, which is a formal appended document structure and has the close `doc-appendix` role, and from a later addendum or postscript. Japanese `補遺` is retained as an established documentation term for a supplement. `追補` is closer to addendum and remains unregistered; `追記` stays under `postscript`.",
  "toc": "Emits `doc-toc` on `nav`. Use only for a real table-of-contents navigation aid; the plugin does not manufacture or validate descendant links.",
  "updates": "No default `role` is emitted. Use for general update notes or revision history; use `postscript` for added after-notes and `errata` for corrections."
}

const JA_NOTES = {
  "bibliography": "文献一覧・文献表はここです。補助的な参考資料は`resources`、参照先や参照情報は`reference`に分けます。`doc-bibliography`には文献項目を含む子孫listが少なくとも1つ必要です。プラグインは見出しからsectionを認識しますが、list構造の生成・検証は行いません。",
  "appendix": "`付属書`・`附属書`は規格・条約・技術文書で独立した後付け構造を表すため認識し、資料を明示する`付属資料`・`附属資料`もここに置きます。書籍で`付録A`と同様に使われる`付属A`・`附属A`などのcompactな番号・文字付き見出しも通常の`appendix` labelとして認識します。`付属`・`附属`単独は、付属品や所属関係まで表せて文書構造を保証しないため認識しません。hrサンドイッチ`h1`の`付属A 参考データ`・`附属A 参考データ`は、より限定的な`appendix-titlepage`推定になります。",
  "appendix-titlepage": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。`付録扉。`/`付属扉。`/`附属扉。`のような明示ラベルも使えますが、通常のsemantic labelとして処理されるため、`labelControl`または`semanticContainerSc`で非表示にしない限りラベル文字列はHTMLに残ります。`label=\"\"`などで非表示にしても、roleなしの`div`には`aria-label` fallbackを付けません。titlepageをアクセシブルな名前付きグループとして扱う必要があるworkflowでは、そのworkflow側で`role=\"group\"`などのrole付きwrapperを明示してください。電子書籍の扉では、`付録A 参考データ`/`付属A 参考データ`/`附属A 参考データ`のようなhrで挟まれた`h1`、または解析済みfrontmatterの`sc.titlepage: true` / `sc: { titlepage: true }`を優先します。",
  "chapter-titlepage": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。`章扉。`のような明示ラベルも使えますが、通常のsemantic labelとして処理されるため、`labelControl`または`semanticContainerSc`で非表示にしない限りラベル文字列はHTMLに残ります。`label=\"\"`などで非表示にしても、roleなしの`div`には`aria-label` fallbackを付けません。titlepageをアクセシブルな名前付きグループとして扱う必要があるworkflowでは、そのworkflow側で`role=\"group\"`などのrole付きwrapperを明示してください。電子書籍の章扉では、`第1章 はじめに`、`第II章 ローマ数字`のようなhrで挟まれた`h1`、または解析済みfrontmatterの`sc.titlepage: true` / `sc: { titlepage: true }`を優先します。",
  "glossary": "DPUB-ARIAに近いroleがあり、`doc-glossary`を出します。",
  "foreword": "`刊行に寄せて`と、`本書の`/`日本語版の`を前置した形を認識します。不自然な`の刊行に寄せて`は認識しません。",
  "editor-note": "英語では`editor note`、`editor's note`、`editors' note`、`editorial note`の自然な分かち書きを認識します。空白のない`editornote`とアポストロフィのない`editors note`は認識しません。",
  "lead": "built-in semanticで唯一`hideLabel: true`を持ちます。lead/ledeは通常、独立して移動対象となる文書sectionではなく冒頭の導入文・導入段落なので、roleなしの`div`を使います。`lead`自体はEPUB Structural Semantics Vocabularyの語でもDPUB-ARIA roleでもなく、非表示にした制御用ラベルから名前付き`region` landmarkを作りません。standard・bracket・GitHub alert入力のいずれでも既定では制御用ラベルを本文から除去します。空でないinline label controlを指定すると既定を上書きし、置換ラベルを表示できます。`## Lead`のようにラベルしか含まないjointless headingは、非表示化によって空見出しになるため意図的に認識しません。これはcatalogでラベルを既定非表示にするsemanticすべてに適用する不変条件であり、`lead`を名前で分岐する例外ではありません。製品導入やシステム導入にもなる`導入`単独も認識しません。",
  "book": "既存の`sc-book`出力を保つため、書籍・雑誌・刊行物の情報ブロックを表すcanonical semanticとして維持します。`publication`、`magazine`と各information形式も入力ラベルとして認識します。関連・推薦刊行物は`related-book`、現在の刊行物自身の正式な奥付は`colophon`を使います。複数形`publications`は著者の業績一覧や刊行物一覧にもなるため、既定aliasにはしません。`sc-book`と`sc-publication`の二重出力は、label・joint classまで含む一般的なlegacy class契約が必要になるため追加しません。",
  "chapter-toc": "`nav`に`doc-toc`を出します。章または小さなsectionを対象とする実際のリンク付きナビゲーションリストにだけ使ってください。プラグインはリンク構造を生成・検証しません。",
  "endnotes": "`doc-endnotes`には注を含む子孫listが少なくとも1つ必要で、roleをlist自体へ付けることはできません。このプラグインは明示された見出しからsectionを認識するだけです。注の収集、backlink、list生成、構造検証はfootnote/endnoteプラグインまたは後段のEPUB処理に委譲します。",
  "errata": "DPUB-ARIAに近いroleがあり、`doc-errata`を出します。公開後の訂正に使い、一般的な更新や改訂履歴は`updates`を使います。",
  "note": "中立的な注です。本文の流れに含まれる注も多いため、補足的な`aside`ではなくsection相当の文書ブロックとして扱います。警告・注意・重要事項は`warning`/`caution`/`important`を使います。",
  "notice": "行為・出来事から生じ得る結果をユーザーへ通知する、現行EPUB/DPUBの限定的な`notice`です。仕様自身がwarning・caution・dangerを例に挙げています。文書構造を示す`doc-notice`のsuperclassは`alert`ではなく`note`で、このroleだけでポップアップ表示、focus移動、即時読み上げは起こりません。日本語では直接的な`通知`と、より正式な`通告`を、英語の`Notice`と同様に著者がこのsemanticを選ぶ自然な見出しとして認識します。内容は結果を知らせる定義に合う必要があります。より広いannouncementの`お知らせ`・`告知`はrolelessの`information`、`掲示`は未登録です。`注意書`・`注意書き`は`notice`の訳語にはせず、具体的に注意を求める`caution`へ置きます。",
  "information": "一般情報、参考情報、案内・ご案内、お知らせ・告知に使います。`お知らせ`・`告知`は、結果指向の`doc-notice`を断定しない一般的な告知見出しとして、rolelessの`information`に置きます。`ご案内`も`案内`の自然な見出し表現です。`参考情報`は、判断や理解の助けになる情報をブロック内で提示する見出しで、参照先・照合先を示す`参照情報`は`reference`です。手順・イベント・更新履歴・ナビゲーションと明確に分かる場合は、より具体的なsemanticを使います。単独の`掲示`は表示行為や掲示物・掲示板まで指せるため認識しません。",
  "index": "`doc-index`は、索引対象へのリンクを含むナビゲーション用の索引です。プラグインは見出しからsectionを認識しますが、索引項目やリンクの生成・検証は行いません。",
  "caution": "避けるべきミスや注意点に使います。より強い危険性がある場合は`warning`または`danger`を使います。",
  "warning": "注意より強い警告に使います。最上位の危険表示だけ`danger`を使います。",
  "danger": "最も強い危険表示に限定して使います。",
  "alert": "危険度を固定しないアラート・注意喚起に使います。`注意喚起`は、個別の注意事項よりも、危険や問題へ注意を向けさせる行為・公表カテゴリを表すため、`caution`ではなくここに置きます。`警報`は強い警戒レベルや警報機能そのものを示しやすいため、既定aliasにはしません。危険度が明確なら`caution`/`warning`/`danger`を使います。",
  "important": "危険度ではなく重要度を示します。`重要`、`重要情報`、`重要事項`、`重要なこと`などは認識しますが、警告に近い`重大`は既定aliasにはしません。重要度だけでは`doc-notice`が示す行為・出来事の結果への注意とはいえないため、既定roleは出力しません。",
  "answer": "`solution`の`解答`/`解法`とは分けます。`answer`は回答・答え寄りです。",
  "assessment": "アセスメント、試験、確認テストなど、測定・診断・確認を主目的とする部分に使います。`テスト`単独は技術文書で広すぎるため認識しません。`採点`単独は点数・評定を付ける行為なので、assessmentそのものとは分けて認識しません。canonicalは現行EPUB語彙の単数形`assessment`に合わせ、複数形`assessments`は英語aliasとして認識します。",
  "evaluation": "品質・価値・成果・性能などを判断する部分です。英語ではproduct/quality/performance evaluationの自然な単数形・複数形、日本語では`製品評価`、`品質評価`、`性能評価`、`パフォーマンス評価`に限定して認識します。裸の`評価`、`評価結果`、`総合評価`はassessment・grading・judgmentの境界をまたぐため認識しません。測定・診断寄りの`リスク評価`や、grading寄りの`成績評価`も認識しません。`評価基準`は`rubric`です。",
  "event": "イベント・行事・催し物の情報に使います。一般的な文章見出しとして広すぎる`出来事`は既定aliasにはしません。",
  "explanation": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。",
  "interview": "インタビューは、地の文、人物紹介、対談的な構成も含み得るため、既定では`doc-qna`を出しません。質問と回答の連続であることを明示する場合は`qna`を使います。",
  "problem": "解く対象となる問題・演習の単位です。問題文や解答指示を直接含められ、内部に`question`を置く必要はありません。`question`、`hint`、`answer`、`explanation`は独立したブロックとして離れた位置にも置けますが、同じ番号から対応関係を自動生成することはありません。`問題1`、`演習問題2`、`練習問題A`のような連番を認識し、`練習`単独は広すぎるため認識しません。裸の`問題`は一般的な問題・演習見出しとして維持し、技術文書で問題報告を表す場合は`問題点`または`既知の問題`を使います。",
  "pullquote": "canonicalは現行EPUB語彙と`doc-pullquote`の綴りに合わせた`pullquote`です。`pull quote`と旧canonicalの`pull-quote`は入力aliasとして残しますが、出力classとcanonical名を使う設定は`sc-pullquote` / `pullquote`へ移行します。DPUB-ARIAでは本文と重複する装飾用プルクオートを支援技術から隠す必要がありますが、プラグインには原文と複製を判定できないため、`aria-hidden`を無条件には付けません。重複表示する場合は後段の変換で指定してください。",
  "qna": "`QA`単独は技術文書でquality assuranceを指すことが多いため認識しません。質問と回答の連続には`Q&A`、`Q and A`、`Questions and answers`を使い、独立した単位には`question`と`answer`を使います。",
  "question": "独立した問いや、問題内で個別にラベル付けされた設問・小問・発問に使います。`問い1`、`設問３`、`小問2`、`問一`、`発問1`、`主発問`、`中心発問`を認識します。裸の`問`、空白なしの`質問1`、連番付き`主発問1`/`中心発問1`、`基本発問`/`補助発問`などは、短すぎるか先回りしすぎるため認識しません。空白を置く`質問 1`は共通の英数字接尾辞として認識します。",
  "solution": "解答や解法に使います。回答・答えは`answer`と分けます。",
  "check": "チェックリストは業務・技術文書の作業用セクションなので、既定の`role`属性は出力しません。",
  "limitations": "技術文書では重要ですが、DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。",
  "procedure": "`requirements`/`要件`や`resources`/`資料`とは分け、実際の手順に使います。",
  "requirements": "要件、要求事項、必要条件、必須項目など、満たすべき条件に使います。動作環境・推奨環境も、一般的な推奨ではなくシステムの稼働条件なのでここです。手順は`procedure`、制約は`limitations`に分けます。",
  "resources": "資料・教材・参考資料のような補助資産に使います。参照先や参照情報は`reference`、正式な参考文献は`bibliography`、リンク集は`related-link`です。",
  "lesson": "`教訓`は学習単元よりも強い意味になりやすいため既定aliasにはしません。",
  "learning-objective": "canonicalは現行EPUB語彙の単数形`learning-objective`に合わせます。旧canonicalの`learning-objectives`は互換aliasとして残し、自然な空白区切りの単数形・複数形も英語aliasとして認識します。業務目標やプロジェクト目標にもなる`objectives`単独は認識しません。EPUB側に対応するDPUB-ARIA roleがないため、既定roleは出力しません。",
  "keywords": "キーワード・重要語・手がかり語に限定します。`手がかり`単独は一般語として広いため認識しません。",
  "issue": "`検討課題`は会議の議題にも見えますが、内容としては検討すべき論点・懸案に近いため`issue`に寄せます。",
  "task": "タスク・宿題・アクションアイテムのように、割り当てられた作業が明確な見出しに限定します。裸の`課題`はassignmentとissue、裸の`作業`はtaskとprocedureの境界をまたぐため認識しません。",
  "preamble": "規約・宣言・仕様などの正式な前文に使います。著者の前書きは`preface`、刊行に寄せた言葉は`foreword`、本文の導入は`introduction`、物語・章構造上の開始部は`prologue`を使います。広い`序`と`序文`は既定aliasにはしません。",
  "reference": "参照先、参照情報、リファレンスのように、何を・どこを参照するかを示すブロックに使います。`参照情報`は参照・照合のための手掛かり、`参考情報`は本文中で提示する判断・理解の助けとして`information`に分けます。`参考`単独は広いため認識せず、補助資料としての`参考資料`は`resources`です。",
  "related": "関連情報・関連資料のような広い関連内容に使います。日本語の`関連`単独は対象が分からず、`related-book` / `related-article` / `related-link`との境界も不安定なため認識しません。英語では名詞句の`related information` / `related resources`を認識し、抽象名詞`relation`は認識しません。",
  "related-book": "互換性のためcanonical semanticとして維持しつつ、関連する書籍・雑誌・刊行物を扱います。`related-publication`と自然なpublication形式は入力aliasで、出力classとcanonical名を使う設定は引き続き`sc-related-book` / `related-book`です。",
  "related-link": "リンク集としての関連リンク・参考リンクに使います。正式な文献一覧は`bibliography`です。",
  "next-steps": "具体的な作業項目は`task`、計画そのものは`planning`を使います。",
  "overview": "`概要`は正式なabstractの見出しにもなり得ますが、rolelessの`overview`として維持します。出版物の要旨として`doc-abstract`を出す場合は`要旨`または`抄録`を使います。",
  "part-titlepage": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。`部扉。`のような明示ラベルも使えますが、通常のsemantic labelとして処理されるため、`labelControl`または`semanticContainerSc`で非表示にしない限りラベル文字列はHTMLに残ります。`label=\"\"`などで非表示にしても、roleなしの`div`には`aria-label` fallbackを付けません。titlepageをアクセシブルな名前付きグループとして扱う必要があるworkflowでは、そのworkflow側で`role=\"group\"`などのrole付きwrapperを明示してください。電子書籍の部扉では、`第1部 扉タイトル`のようなhrで挟まれた`h1`、または解析済みfrontmatterの`sc.titlepage: true` / `sc: { titlepage: true }`を優先します。",
  "planning": "`計画`、`計画案`、`プラン`のような予定・段取りに使います。承認や採否判断を求めることを明示した企画案・提案書・企画書は`proposal`、軽い提案は`suggestion`を使います。",
  "point": "英語の`point`には論旨・要点・主眼という意味があるため、`要点`はここで維持します。中心的なtakeawayなのでrolelessの`section`とし、助言を示す`hint`/`tip`の`doc-tip` asideとは分けます。",
  "proposal": "承認・採否判断の対象となる書類寄りの案です。`提案書`、`企画案`、`企画書`、`プロポーザル`を認識します。裸の`提案`は`suggestion`、`提言`は`recommendation`に分け、裸の`企画`はplanningとの境界が曖昧なため認識しません。",
  "recommendation": "採否対象の企画書ではなく、選択や行動を勧める内容に使います。`提言`、`推奨事項`、`推奨項目`を含みます。`推奨環境`はシステム条件なので`requirements`です。見出しとして不自然な`勧め`は認識しません。",
  "suggestion": "正式な承認を必須としない軽い提案に使います。裸の`提案`と`サジェスト`はここ、`提案書`は`proposal`です。",
  "summary": "`まとめ`は文末の締めにも使われますが、rolelessの`summary`として維持します。より強い結論の意味で`doc-conclusion`を出す場合は`結論`または`おわりに`を使います。",
  "supplement": "本文を明確にしたり補ったりする補足情報・補遺に使います。正式な後付け構造で`doc-appendix`を持つ`appendix`/`付録`とは分けます。`補遺`は使用頻度が低くても文書用語として意味が限定されているため維持します。印刷後の追加・修訂を指す`追補`はaddendum寄りなので認識せず、後から書き足す`追記`は`postscript`に分けます。",
  "toc": "`nav`に`doc-toc`を出します。実際の目次ナビゲーションにだけ使ってください。プラグインは子孫リンクを生成・検証しません。",
  "updates": "DPUB-ARIAに近いroleがないため、既定の`role`属性は出力しません。一般的な更新や改訂履歴に使います。追記は`postscript`、訂正は`errata`と分けます。"
}

const CATEGORIES = [
  {
    "enTitle": "Publishing structure and front/back matter",
    "jaTitle": "出版構造・前付け・後付け",
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
      "pullquote",
      "toc"
    ]
  },
  {
    "enTitle": "Notices, key points, tips, and sidebars",
    "jaTitle": "注意書き・要点・ヒント・サイドバー",
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
    "enTitle": "Learning, Q&A, assessment, and evaluation",
    "jaTitle": "学習・Q&A・アセスメント・評価",
    "semantics": [
      "answer",
      "assessment",
      "evaluation",
      "explanation",
      "faq",
      "feedback",
      "interview",
      "learning-objective",
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
    "jaTitle": "技術・業務ドキュメント",
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
      "troubleshooting",
      "updates"
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

const formatInlineCodeList = (values) => values.length > 0
  ? values.map((value) => `\`${value}\``).join(', ')
  : '—'

const formatAttrs = (attrs) => {
  if (!Array.isArray(attrs) || attrs.length === 0) return ''
  return attrs.map(([key, value]) => ` ${key}="${value}"`).join('')
}

const outputTag = (semantic) => {
  const attrs = formatAttrs(semantic.attrs)
  const hasAriaLabel = Array.isArray(semantic.attrs)
    && semantic.attrs.some(([key]) => key === 'aria-label')
  const hiddenLabelAttr = semantic.hideLabel === true && semantic.tag !== 'div' && !hasAriaLabel
    ? ' aria-label="{label}"'
    : ''
  return `<${semantic.tag} class="sc-${semantic.name}"${attrs}${hiddenLabelAttr}>`
}

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
  '- This plugin handles semantics that wrap content as `section`, `aside`, `div`, or `nav`.',
  '- Built-in titlepage inference converts conservative numbered, lettered, and Roman-numeral hr-sandwiched `h1` headings into `chapter-titlepage`, `appendix-titlepage`, and `part-titlepage`. Parsed frontmatter can also set `sc.titlepage: true` or nested `sc: { titlepage: true }` to wrap from the first content `h1` without an opening body `hr`; no plugin option is required for that control.',
  '- Explicit titlepage labels are supported as direct semantic labels, but they are marker-like compared with natural document labels. Prefer `h1` inference or `sc.titlepage: true` for ebook title pages; explicit labels remain visible unless hidden with `labelControl` or `semanticContainerSc`, and hidden labels on roleless `div` titlepages do not add an `aria-label` fallback. If a workflow needs accessible named titlepage groups, add an explicit role-bearing wrapper such as `role=\"group\"` in that workflow.',
  '- `Prologue`, `Epilogue`, `Introduction`, `Conclusion`, `序章`, `終章`, `プロローグ`, and `エピローグ` are not inferred as h1 titlepages by default. Use explicit semantic labels for those DPUB section semantics, or handle whole-document wrapping in EPUB-level tooling.',
  '- Figure-like examples are intentionally delegated to figure/caption plugins such as `p7d-markdown-it-figure-with-p-caption`.',
  '- `role="doc-*"` is emitted only for exact or close DPUB-ARIA matches. EPUB structural terms and DPUB-ARIA roles are separate layers: matching an EPUB term does not by itself justify a role.',
  '- Alias recognition is semantic classification, not cosmetic spelling normalization. Every built-in or runtime alias inherits its canonical semantic\'s tag, classes, and default attributes, including `role`. There are no alias-level role overrides; leave an ambiguous label unregistered or map it to an appropriate roleless semantic instead of attaching it to a role-bearing canonical.',
  '- `doc-notice` is a structural document role whose superclass is `note`, not the live-region `role="alert"`; it does not by itself create a pop-up, move focus, or request immediate announcement.',
  '- The plugin does not synthesize IDs or `aria-labelledby` relationships for visible labels. When a document contains multiple instances of the same DPUB landmark role, downstream authoring or EPUB tooling must give them unique accessible names. Structure-specific requirements also remain outside this recognizer: footnote/endnote tooling should own the lists and references required by `doc-endnotes`, while downstream tooling must provide descendant entry lists for `doc-bibliography` and real descendant links for `doc-index` and `doc-toc`.',
  '- `epub:type` is not emitted by default.',
  '- Canonical grammatical number follows an authoritative external vocabulary when the semantic intentionally corresponds to one. Otherwise, use a singular conceptual name by default and keep natural alternate-number headings as aliases. Retain a plural canonical only for a lexicalized or deliberately aggregate concept such as `acknowledgments`, `endnotes`, `keywords`, `requirements`, or `resources`; do not rename an established canonical merely for visual consistency.',
  '- A multiword alias that contains another canonical name does not automatically belong to its grammatical head noun. The catalog chooses the semantic that dominates the phrase\'s document function and records ambiguous choices in the entry notes.',
  '- Register an alias only when it is plausible as a standalone heading in real target documents, has a stable boundary from neighboring semantics, and leads to an appropriate output contract. Dictionary correspondence alone is insufficient; a rare but precise established heading can be safer than a common ambiguous word.',
  '',
  '## Common distinctions',
  '',
  'This section explains boundaries between easily confused semantics and shows which label to choose when several terms look similar.',
  '',
  '- `answer` vs `solution`: `answer` is a direct response. `solution` can include a worked method or explanation.',
  '- `question` vs `problem`: `problem`/`exercise` is a unit to solve and can contain its prompt directly; it does not require a nested `question`. `question` marks an independent question, subquestion, or teaching prompt. Matching numbers do not create automatic links to `answer` or `explanation` blocks.',
  '- `interview` vs `qna`: `interview` identifies the editorial content type and stays roleless because its structure may mix narrative or conversation. Use `qna` when the section is explicitly a series of questions and answers and should emit `doc-qna`.',
  '- `notice` vs `information`: current EPUB/DPUB `notice` notifies users of consequences that might arise from an action or event and emits `doc-notice`; Japanese `通知` / `通告` map here as direct author-selected headings. `information` presents general, background, or supplemental information without asserting that role; generic announcement headings `お知らせ` / `告知` therefore map to roleless `information`. Japanese `注意書` / `注意書き` map to `caution`; bare `掲示` remains unregistered.',
  '- `information` vs `reference` vs `resources`: `information` presents useful facts or guidance in the block (`参考情報`). `reference` identifies what or where to consult (`参照`, `参照先`, `参照情報`). `resources` supplies supporting documents or assets (`参考資料`). Use `bibliography` for a formal references list and `related-link` for a see-also/further-reading link list.',
  '- `book` vs `related-book` vs `colophon`: `book` is the compatibility-stable canonical for an information block about a book, magazine, or publication; `publication` remains an input alias. `related-book` suggests related books, magazines, or publications, with `related-publication` as an input alias. `colophon` is the current work\'s formal imprint. Output remains `sc-related-book`.',
  '- `preamble` vs `preface`/`foreword`/`introduction`/`prologue`: `preamble` is a formal opening statement. `preface` is authorial front matter, `foreword` is introductory front matter often by another contributor, `introduction` orients the main text, and `prologue` is an opening narrative or section.',
  '- `afterword` vs `conclusion`: `afterword` is closing commentary from the author or another important contributor about the work\'s creation, significance, or later events. `conclusion` closes the subject, argument, or narrative itself. Japanese `あとがき`/`後書き` map to `afterword`; `おわりに`/`終わりに` and `結論` map to `conclusion`.',
  '- `outline` vs `overview` vs `abstract` vs `summary`: `outline` exposes the main points or planned structure, often as a skeleton. `overview` gives broad orientation without detail. `abstract` is a concise representation of a larger work and emits `doc-abstract`. `summary` is a general condensation or recap and stays roleless because its position and function are not known from the heading alone. Japanese `要旨`/`抄録` are the role-bearing abstract labels; broader `概要`, `概略`, `要約`, and `まとめ` remain roleless.',
  '- `chapter-titlepage`/`appendix-titlepage`/`part-titlepage` vs `chapter-toc`/`toc`: titlepage semantics wrap chapter/appendix/part opening design material. TOC semantics wrap navigational lists.',
  '- `note` vs `notice`/`alert`/`important`: `note` is neutral and emits no default `role`. `notice` and consequence-oriented `alert` blocks emit structural `doc-notice`; this is not the live-region `role="alert"`. `important` marks emphasis without necessarily implying consequences and therefore emits no default role.',
  '- `point` vs `hint`/`tip`: `point` states a central idea or takeaway and remains a roleless main-flow section. `hint` and `tip` provide helpful advice and emit `doc-tip` on an `aside`.',
  '- Compound label ownership: `important notice` and `important information` map to `important` because priority is the callout intent. `related information` and `related resources` map to `related` because the relationship makes the block tangential; unmodified `information` and `resources` remain main-flow sections.',
  '- `caution` vs `warning` vs `danger`: `caution` is for care-needed points or preventable trouble. `warning` is stronger. `danger` is reserved for the strongest hazard level.',
  '- `alert` vs `caution`: `alert` is a severity-neutral call for attention to a risk or problem; `caution` is a concrete care-needed point or instruction. Japanese `注意喚起` maps to `alert`, while `注意`, `注意事項`, `注意書`, and `注意書き` map to `caution`. Both are close mappings to the umbrella structural role `doc-notice`.',
  '- `requirements` vs `prerequisites` vs `procedure` vs `limitations`: `requirements` are conditions to satisfy. `prerequisites` are preconditions before starting. `procedure` is how to do something. `limitations` are restrictions or constraints.',
  '- `agenda` vs `issue`: `agenda` is the list of meeting or class topics. `issue` is a point to discuss, dispute, or resolve.',
  '- `postscript` vs `errata` vs `updates`: `postscript` is an added after-note. `errata` is corrections after publication and emits `doc-errata`. `updates` is general update notes or revision history and emits no default role.',
  '- `minutes` vs `agenda` vs `decision`: `agenda` is the plan for a meeting. `minutes` is the record of a meeting. `decision` is a decision item.',
  '- `planning` vs `proposal` vs `suggestion` vs `recommendation`: `planning` describes plans or schedules. `proposal` is a formal plan or document submitted for approval. `suggestion` is a lighter idea. `recommendation` advises a choice or action.',
  '- `learning-objective` vs `rubric` vs `assessment` vs `evaluation` vs `feedback`: `learning-objective` states learning goals. `rubric` states criteria. `assessment` measures or tests. `evaluation` judges quality, value, results, or performance. `feedback` comments on results. English and Japanese evaluation aliases require a specific product, quality, or performance qualifier when they are more specific than the canonical `evaluation`; broad Japanese or assessment/grading-like forms remain unregistered.',
  '- `appendix` vs `supplement` vs `postscript`: `appendix` is a formal appended structure and emits `doc-appendix`. `supplement` clarifies or supplements the work and emits no default role. `postscript` is a later after-note. Japanese `補遺` maps to `supplement`, `追記` maps to `postscript`, and addendum-like `追補` remains unregistered.',
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
  '- このプラグインは、`section`、`aside`、`div`、`nav`としてラップするsemanticを扱います。',
  '- 組み込みのtitlepage推定は、保守的な番号付き・文字付き・ローマ数字のhrサンドイッチ`h1`見出しを`chapter-titlepage`/`appendix-titlepage`/`part-titlepage`に変換します。解析済みfrontmatterでは`sc.titlepage: true`または入れ子の`sc: { titlepage: true }`を指定すると、追加オプションなしで本文側の開始`hr`なしにファイル先頭の`h1`から章扉・付録/付属扉・部扉として扱えます。',
  '- titlepage系の明示ラベルも直接指定用のsemantic labelとして使えますが、自然な文書ラベルというより制御マーカー寄りです。電子書籍の扉では`h1`推定または`sc.titlepage: true`を優先してください。明示ラベルは`labelControl`や`semanticContainerSc`で非表示にしない限りHTMLに残ります。非表示にしてもroleなしの`div`には`aria-label` fallbackを付けません。titlepageをアクセシブルな名前付きグループとして扱う必要があるworkflowでは、そのworkflow側で`role=\"group\"`などのrole付きwrapperを明示します。',
  '- `Prologue`、`Epilogue`、`Introduction`、`Conclusion`、`序章`、`終章`、`プロローグ`、`エピローグ`は、既定ではh1 titlepageとして推定しません。これらのDPUB section semanticは明示ラベルで使うか、文書全体のラップをEPUB処理ツール側で扱います。',
  '- figure的な例示は、`p7d-markdown-it-figure-with-p-caption`などのfigure/caption系プラグインに委譲します。',
  '- `role="doc-*"`はDPUB-ARIAに完全一致または近い対応がある場合だけ出力します。EPUBの構造語彙とDPUB-ARIA roleは別レイヤーであり、EPUB語彙にあることだけを理由にroleを付けません。',
  '- alias認識は表記揺れの吸収だけではなく、semanticの分類です。built-in aliasと実行時aliasはどちらも、canonical semanticのtag・class・既定属性を`role`も含めて継承します。alias単位でroleだけを外す例外は設けません。曖昧なラベルは、role付きcanonicalへ無理に追加せず、適切なroleless semanticへ割り当てるか未登録のままにします。',
  '- `doc-notice`は文書構造を示すroleで、superclassはlive regionの`alert`ではなく`note`です。単独でポップアップ表示、focus移動、即時読み上げを起こしません。',
  '- プラグインは、表示ラベル用のIDや`aria-labelledby`の関連を自動生成しません。同じDPUB landmark roleを文書内で複数使う場合は、後段のHTML/EPUB処理で一意なアクセシブル名を付けてください。`doc-endnotes`に必要な注listと参照関係はfootnote/endnote処理、`doc-bibliography`の子孫listと`doc-index`/`doc-toc`の実リンクは後段ツールの責務です。',
  '- `epub:type`は既定では出力しません。',
  '- canonical名の単数形・複数形は、対応させる外部標準語彙がある場合はその表記を優先します。それ以外は単一の概念型を表す単数形を基本とし、自然な別の数はaliasで認識します。`acknowledgments`、`endnotes`、`keywords`、`requirements`、`resources`のように、定着した集合概念または意図的な集約概念だけ複数形canonicalを維持します。見た目の統一だけを理由に、安定したcanonical名は変更しません。',
  '- 別のcanonical名を含む複合aliasでも、文法上の主要語だけで所属先を決めません。見出し全体の文書機能を支配するsemanticへ割り当て、曖昧な判断は各項目の注意書きに残します。',
  '- 日本語aliasはEPUB/DPUB語彙の規範的な訳語表ではなく、このプラグインが日本語文書の見出しとして認識する語です。',
  '- そのため、直訳よりも実際の技術文書、業務文書、教材で見出しとして自然に使える語を優先しています。',
  '- aliasは、対象文書で単独見出しとして実在し得ること、隣接semanticとの境界が安定していること、出力されるtag・role・classがその文書機能に合うことを確認して登録します。辞書上の対応だけでは追加せず、使用頻度が低くても意味が限定された見出しは、よく使われる曖昧語より安全な場合があります。',
  '',
  '## 使い分け',
  '',
  'この節では、意味が近くて迷いやすいsemanticについて、どのラベルを選ぶとよいかを説明します。',
  '',
  '- `answer`と`solution`: `answer`は直接の回答です。`solution`は解き方や解決方法まで含められます。',
  '- `question`と`problem`: `problem`/`exercise`は解く対象となる単位で、問題文を直接含められます。内部に`question`は必須ではありません。`question`は独立した質問・小問・発問です。同じ番号でも`answer`や`explanation`との関係は自動生成しません。',
  '- `interview`と`qna`: `interview`はインタビューという編集上の内容種別で、地の文や対談も含み得るためrolelessです。質問と回答の連続を明示して`doc-qna`を出す場合は`qna`を使います。',
  '- `notice`と`information`: 現行EPUB/DPUBの`notice`は行為・出来事から生じ得る結果をユーザーへ通知するもので、`doc-notice`を出します。日本語の`通知`・`通告`はここへ置き、`注意書`・`注意書き`は`caution`にします。`information`は一般情報・参考情報・案内をroleなしで表すため、一般的な告知見出しの`お知らせ`・`告知`もここへ置きます。単独の`掲示`は認識しません。',
  '- `information`、`reference`、`resources`: `information`はブロック内で役立つ事実や案内を提示する`参考情報`、`reference`は何を・どこを参照するかを示す`参照`・`参照先`・`参照情報`、`resources`は文書や資産としての`参考資料`です。正式な文献一覧は`bibliography`、関連リンク集は`related-link`です。',
  '- `book`、`related-book`、`colophon`: `book`は互換性を保った書籍・雑誌・刊行物の情報ブロック用canonicalで、`publication`は入力aliasです。`related-book`は関連・推薦する書籍・雑誌・刊行物を表し、`related-publication`は入力aliasです。`colophon`は現在の刊行物自身の正式な奥付です。出力は引き続き`sc-related-book`です。',
  '- `preamble`、`preface`、`foreword`、`introduction`、`prologue`: `preamble`は正式な前文、`preface`は著者の前書き、`foreword`は刊行に寄せた言葉、`introduction`は本文の導入、`prologue`は物語・章構造上の開始部です。',
  '- `afterword`と`conclusion`: `afterword`は著者または重要な寄稿者が、成立事情・意義・後日談などを述べる締めくくりです。`conclusion`は主題・論旨・物語そのものを締めくくります。`あとがき`/`後書き`は`afterword`、`おわりに`/`終わりに`と`結論`は`conclusion`です。',
  '- `outline`、`overview`、`abstract`、`summary`: `outline`は主要項目や構成の骨組み、`overview`は詳細に入る前の全体像、`abstract`は大きな作品を簡潔に表す要旨・抄録、`summary`は一般的な要約・振り返りです。`abstract`だけ`doc-abstract`を出します。位置や用途を見出しだけでは確定できない`概要`、`概略`、`要約`、`まとめ`はrolelessのままです。',
  '- `chapter-titlepage`/`appendix-titlepage`/`part-titlepage`と`chapter-toc`/`toc`: titlepage系は章・付録/付属・部の扉デザイン部分、TOC系はナビゲーション用の目次です。',
  '- `note`と`notice`/`alert`/`important`: `note`は中立的な注記です。`notice`と、行為・出来事の結果へ注意を促す`alert`は構造的な`doc-notice`を出しますが、live regionの`role="alert"`ではありません。`important`は危険性や結果を伴うとは限らない重要度の強調なので、既定roleを出しません。',
  '- `point`と`hint`/`tip`: `point`は中心的な要点・takeawayなのでrolelessの本文sectionです。`hint`と`tip`は役立つ助言として`aside`に`doc-tip`を出します。',
  '- 複合ラベルの所属: `important notice`/`important information`は優先度がcalloutの意図を決めるため`important`です。`related information`/`related resources`は関連性によって補助的な`aside`になるため`related`です。修飾のない`information`/`resources`は本文フローのsectionとして扱います。',
  '- `caution`、`warning`、`danger`: `caution`は注意点や避けるべきミス、`warning`はそれより強い警告、`danger`は最も強い危険表示です。',
  '- `alert`と`caution`: `alert`は危険や問題へ注意を向けさせる、危険度を固定しない呼びかけです。`caution`は具体的な注意点や慎重な行動を求める指示です。`注意喚起`は`alert`、`注意`・`注意事項`・`注意書`・`注意書き`は`caution`に割り当てます。どちらもDPUB-ARIA上は包括的な構造roleである`doc-notice`に近接対応します。',
  '- `requirements`、`prerequisites`、`procedure`、`limitations`: `requirements`は満たすべき条件、`prerequisites`は始める前の前提、`procedure`は手順、`limitations`は制限や制約です。',
  '- `agenda`と`issue`: `agenda`は会議や授業の議題一覧です。`issue`は検討・解決すべき論点や懸案です。',
  '- `postscript`、`errata`、`updates`: `postscript`は後から加える追記、`errata`は公開後の訂正で`doc-errata`を出します。`updates`は一般的な更新・改訂履歴で、既定のroleは出力しません。',
  '- `minutes`、`agenda`、`decision`: `agenda`は会議前の議題、`minutes`は会議記録、`decision`は決定事項です。',
  '- `planning`、`proposal`、`suggestion`、`recommendation`: `planning`は計画・予定・段取り、`proposal`は承認・採否判断の対象となる提案書や企画書、`suggestion`は軽い提案、`recommendation`は選択や行動を勧める内容です。',
  '- `learning-objective`、`rubric`、`assessment`、`evaluation`、`feedback`: `learning-objective`は学習目標、`rubric`は評価基準、`assessment`は測定・試験、`evaluation`は品質・価値・成果・性能の判断、`feedback`は結果へのコメントや助言です。英語の複合evaluation aliasと日本語aliasは製品・品質・性能を明示する語に限定し、日本語の裸の`評価`やassessment・grading寄りの語は認識しません。',
  '- `appendix`、`supplement`、`postscript`: `appendix`は`doc-appendix`を持つ正式な付録構造、`supplement`は本文を明確にしたり補ったりするroleなしの補足・補遺、`postscript`は後から加える追記です。addendum寄りの`追補`は既定では認識しません。',
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
