# design.md

habit-tracker の設計ドキュメント。ARCHITECTURE.md と合わせて参照すること。

---

## 設計思想

**UXは「静かに続けられる道具」。** 自己啓発感・過剰演出・ゲーミフィケーションを禁止する。
機能追加より「続けやすさ」を重視する。iPhone Safari / PWA での動作を最優先に考える。

### 判断基準

- 毎日使っても飽きない・疲れないか
- 記録する動作にストレスがないか
- 習慣を「終了」にしても過去記録が消えないか
- 新しい習慣を追加しても過去の達成率が壊れないか

---

## アーキテクチャ概要

React + Vite 構成。`src/` 以下にコンポーネントを配置し、Vite でビルドして `dist/` を生成する。
GitHub Actions で `main` への push 時に自動ビルド・GitHub Pages へデプロイ。

```
habit-tracker/
├── src/
│   ├── App.jsx             # 状態管理の中心
│   ├── App.css
│   ├── index.css           # グローバルスタイル
│   ├── components/
│   │   ├── Modal.jsx       # ボトムシート基盤
│   │   ├── HabitButton.jsx
│   │   ├── HabitEditItem.jsx
│   │   ├── Calendar.jsx
│   │   ├── AddHabitModal.jsx
│   │   ├── LongPressModal.jsx
│   │   ├── DayDetailModal.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── StatsModal.jsx
│   │   ├── HelpModal.jsx
│   │   ├── SettingsModal.jsx
│   │   ├── ArchivedHabitItem.jsx
│   │   └── Toast.jsx
│   └── utils/
│       ├── date.js         # 日付ユーティリティ
│       └── validation.js   # インポートバリデーション
├── public/
├── docs/
│   └── design.md
└── ARCHITECTURE.md         # 詳細な実装仕様
```

状態管理は `App.jsx` のみ。外部状態管理ライブラリは使用しない。

---

## データ構造

### localStorage キー

| キー | 内容 |
|---|---|
| `habit-tracker-v1` | 全データ（JSON） |
| `habit-tracker-last-backup` | 最終バックアップ日時（ISO 8601） |

### データスキーマ

```json
{
  "habits": [
    {
      "id": "h_1234567890",
      "name": "ランニング",
      "color": "#54A0FF",
      "createdAt": "2026-05-01",
      "archivedAt": null
    }
  ],
  "records": {
    "2026-05-01": ["h_1234567890", "h_0987654321"]
  }
}
```

- `habits` — 習慣の定義リスト。配列の順序が表示順
- `habits[].id` — `h_` + タイムスタンプ形式
- `habits[].createdAt` — 習慣の追加日（`YYYY-MM-DD`）。旧データには存在しない場合があり、その場合は全日付で有効と見なす（後方互換）
- `habits[].archivedAt` — 終了日（`YYYY-MM-DD`）。`null` または未定義が現役。過去記録は保持
- `records` — 日付をキーに、その日に完了した habitId の配列を値とする

### エクスポートのフォーマット

```json
{
  "version": 1,
  "exportedAt": "2026-01-20T08:00:00.000Z",
  "habits": [...],
  "records": {...}
}
```

バリデーションロジックは `src/utils/validation.js` の `validateImportData` に集約。

---

## 重要な実装ルール

### 日付の扱い

日付は常に `YYYY-MM-DD` 文字列で扱う。`new Date()` を直接使うとタイムゾーン問題が発生するため、日付のパースには `parseLocalDate`（`new Date(y, m-1, d)` 形式）を使うこと。

### 確認ダイアログ

`window.confirm` / `window.alert` は使用しない（PWA の iOS Safari でブロックされる場合があるため）。すべて `ConfirmModal.jsx` を使用する。

### createdAt による集計フィルタ

Calendar.jsx・DayDetailModal.jsx では `habits.filter(h => !h.createdAt || dateStr >= h.createdAt)` で対象日に存在した習慣のみを母数に使う。これにより新規習慣追加で過去の達成率が壊れない。

---

## 今後の拡張方針・やらないこと

### 検討中の機能

| 機能 | 方針 |
|---|---|
| スキップ機能 | `skipped: {date: [habitId]}` をデータモデルに追加。スキップはストリークを切らない |
| 統計グラフ | 過去7日の日別達成率をCSSバーで表示 |

### やらないこと

- スコアリング・ポイント・バッジなどのゲーミフィケーション
- クラウド同期・アカウント機能
- 他ユーザーとの共有・比較
- プッシュ通知（Service Worker による定期通知）
- 習慣のカテゴリ階層化
