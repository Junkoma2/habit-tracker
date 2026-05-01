# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
npm run dev      # 開発サーバー起動 (http://localhost:5173)
npm run build    # プロダクションビルド
npm run preview  # ビルド結果のプレビュー
```

テストフレームワークは未導入。

## アーキテクチャ

### データモデル

全データは `localStorage` のキー `habit-tracker-v1` に以下の形式で保存される：

```json
{
  "habits": [{ "id": "h_1234567890", "name": "ランニング", "color": "#54A0FF" }],
  "records": {
    "2026-05-01": ["h_1234567890", "h_0987654321"]
  }
}
```

- `habits` — 習慣の定義リスト（順序が表示順）
- `records` — 日付をキーに、その日に完了した habitId の配列を値とする

### 状態管理

`App.jsx` が唯一の状態管理レイヤー。`habits` と `records` の2つの useState が全データを保持し、`useEffect` で変更のたびに localStorage へ書き込む。子コンポーネントはコールバック経由でのみ状態を変更する。

### モーダルの仕組み

`Modal.jsx` がボトムシート型の基盤コンポーネント。全モーダル（AddHabitModal・LongPressModal・DayDetailModal）はこれをラップして使用する。backdrop クリックで閉じる。

### 習慣ボタンの2モード

- **通常モード** — `HabitButton`（2カラムグリッド）。タップで当日トグル、500ms 長押しで `LongPressModal` を開き今日/昨日を選択できる。長押し判定はタッチ移動 8px 超で無効化。
- **編集モード** — `HabitEditItem`（縦リスト）。`@dnd-kit/sortable` の `useSortable` でドラッグ並び替え、PointerSensor（distance: 5px）と TouchSensor（delay: 200ms）を使用。

### 編集制限

カレンダーの日付タップ時、`isEditableDate` が当日・前日のみ `true` を返す。`DayDetailModal` はこのフラグを受け取り、それ以外の日は読み取り専用で表示する。

### 日付ユーティリティ（`src/utils/date.js`）

日付は常に `YYYY-MM-DD` 文字列で扱う。`new Date()` を直接使うと timezone の問題が起きるため、日付のパースには `parseLocalDate`（`new Date(y, m-1, d)` 形式）を使うこと。`HABIT_COLORS` もここで定義されており、習慣カラーの選択肢はここを変更すれば全体に反映される。

### カレンダー表示

前月末・翌月頭の日付も表示してグリッドを埋める。他の月の日付セルには `.other-month`（opacity: 0.35）が付く。当日セルは `.today`（水色 `#BAE6FD`）。

### エクスポート/インポート

`App.jsx` 内で完結。エクスポートは Blob URL 経由でファイルダウンロード、インポートは `FileReader` でJSONを読み込み `window.confirm` で確認後に状態を上書きする。
