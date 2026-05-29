# Semantic catalog future candidates

This note keeps future semantic-catalog candidates separate from the current
released contract. The built-in catalog should remain conservative: add a new
canonical semantic only when it is useful as a standalone document label across
multiple document types, and do not emit a default `role` unless DPUB-ARIA has a
close match.

## Added in the current 0.12.0 work

These started as review candidates and were promoted to canonical semantics
because they are common headings in technical documents, office documents, or
school materials:

- `requirements`
  - English labels: `Requirements`, `System requirements`
  - Japanese labels: `要件`, `必要条件`, `動作要件`, `システム要件`
  - Default role: none
- `procedure`
  - English labels: `Procedure`, `Steps`, `Instructions`
  - Japanese labels: `手順`, `操作手順`, `作業手順`
  - Default role: none
- `resources`
  - English labels: `Resources`, `Materials`
  - Japanese labels: `資料`, `教材`
  - Default role: none
- `explanation`
  - English labels: `Explanation`
  - Japanese labels: `解説`
  - Default role: none
- `limitations`
  - English labels: `Limitations`, `Constraints`, `Restrictions`
  - Japanese labels: `制限事項`, `制約`, `制約事項`
  - Default role: none
- `decision`
  - English labels: `Decision`, `Decisions`
  - Japanese labels: `決定事項`, `決定内容`
  - Default role: none
- `glossary`
  - English labels: `Glossary`, `Glossary of terms`
  - Japanese labels: `用語集`, `用語一覧`
  - Default role: `doc-glossary`
- `troubleshooting`
  - English labels: `Troubleshooting`
  - Japanese labels: `トラブルシューティング`, `困ったときは`
  - Default role: none
- `prerequisites`
  - English labels: `Prerequisites`, `Prerequisite`
  - Japanese labels: `前提条件`, `事前準備`
  - Default role: none
- `next-steps`
  - English labels: `Next steps`
  - Japanese labels: `次のステップ`, `今後の対応`, `今後の予定`
  - Default role: none
- `minutes`
  - English labels: `Minutes`, `Meeting minutes`
  - Japanese labels: `議事録`
  - Default role: none
- `learning-objectives`
  - English labels: `Learning objectives`, `Objectives`
  - Japanese labels: `学習目標`, `到達目標`
  - Default role: none
- `rubric`
  - English labels: `Rubric`, `Grading rubric`
  - Japanese labels: `評価基準`, `採点基準`, `ルーブリック`
  - Default role: none

Entries with no default role above intentionally do not emit invented `doc-*`
roles.
The `proposal` semantic also gained the narrow Japanese alias `企画案`; bare
`企画` remains a future candidate because it can mean planning more broadly.

The previous broad `example` semantic is intentionally not part of the 0.12.0
built-in catalog. DPUB-ARIA 1.1 treats `doc-example` as figure-like, and
examples often overlap with captioned code, terminal, image, or table figures.
Use `p7d-markdown-it-figure-with-p-caption` with `roleDocExample: true` for
figure-specific `role="doc-example"` output. If a project still wants
paragraph-level `Example.` recognition, map it to a suitable existing semantic
locally with `semanticContainerSc`.

## Strong future candidates

### Technical documentation

- `configuration`
  - English candidates: `Configuration`, `Settings`
  - Japanese candidates: `設定`, `設定項目`
  - Notes: Useful, but `設定` and `Settings` can be broad. Add tests for false
    positives if promoted.
- `troubleshooting` was promoted in 0.12.0 without `問題解決`. Keep
  `問題解決` under observation because it can overlap with `solution` and
  general problem-solving sections.

### Office documents

- `proposal` aliases
  - Japanese candidates: `企画`
  - Notes: `企画案` is now recognized as `proposal`. Bare `企画` still needs
    boundary checks against `planning` (`計画`, `計画案`).

### School and training materials

- `review`
  - English candidates: none yet
  - Japanese candidates: `復習`
  - Notes: English `Review` is broad; Japanese `復習` is more specific. Adding a
    canonical `review` would also make bare English `review` recognized, so keep
    this out for now.

## Candidates to keep out by default

- `test` / `テスト`
  - Too broad, especially in software documentation.
  - Prefer `quiz`, `exam`, `小テスト`, or `確認テスト`.
- `practice` / `練習`
  - Too broad as a section label for `problem`.
  - Prefer `practice problem(s)`, `exercise`, `演習問題`, or `練習問題`.
- Bare `問` / bare `答`
  - Too short and collision-prone.
  - Prefer numbered compact labels such as `問1`, `問いA`, `回答1`, and
    `答えA`.
- `example` / `sample` / `例` / `サンプル`
  - Too broad for this plugin's built-in paragraph-level catalog and too close
    to figure/caption semantics.
  - Prefer figure/caption tooling for `doc-example`, or project-local
    `semanticContainerSc` aliases to a suitable existing semantic when
    paragraph-level examples are required.

## Promotion checklist

Before promoting a candidate:

1. Confirm whether it has a close DPUB-ARIA role. If not, do not emit a default
   `role`.
2. Add English and Japanese direct tests that lock useful matches.
3. Add at least one negative test for broad words when applicable.
4. Update `semantics/en.json`, `semantics/ja.json`, and
   `docs/semantic-catalog-references.md` when the role policy changes.
5. Regenerate docs with `npm run docs:semantic-catalog`.
6. Run `npm test`, `npm run labels:audit:strict`, and `npm run smoke:pack`.
