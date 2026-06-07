// UIテキスト定義ファイル
// 将来の多言語対応に備え、主要なUI文言をここに集約する。
// 全画面ではなく、空状態・共通ボタン・主要メッセージを対象とする。
// (#354)

export const UI = {
  // 空状態メッセージ
  empty: {
    habits: '習慣を追加してみよう',
    analysis: '習慣を追加すると達成率が表示されます。',
    record: '習慣を追加すると続いた日数が表示されます。',
    stats: '習慣を追加すると統計が表示されます。',
    noHabitsOnDay: '習慣がまだ登録されていません',
    noColorCategory: '名前が設定された色の習慣がありません。',
  },

  // 共通ボタン
  button: {
    close: '閉じる',
    cancel: 'キャンセル',
    confirm: '確認',
    edit: '編集',
    done: '完了',
    save: '保存',
    add: '追加',
    addHabit: '+ 最初の習慣を追加',
  },

  // ナビゲーション
  nav: {
    record: '実績',
    analysis: '分析',
    help: 'ヘルプ',
    settings: '設定',
    home: '今日の習慣へ戻る',
  },

  // モーダルタイトル
  modal: {
    record: '実績',
    analysis: '分析',
    settings: '設定',
    help: '使い方',
    stats: '統計',
  },

  // 設定ラベル
  settings: {
    theme: '見た目',
    habit: '習慣',
    analysis: '分析',
    data: 'データ',
    statsStartDate: '集計開始日',
    colorNames: '色の名前を設定',
    colorNameUnset: '未設定',
    backup: 'バックアップを保存',
    restore: 'バックアップから復元',
  },
}
