# LUIRE Official Site（luire-official.com）

AILLYN & MAI による R&B ユニット・LUIRE のオフィシャルサイト。
外部パッケージなしの静的サイト。`node build.mjs` で `out/` に書き出し、Cloudflare Workers で配信する。

## ページ構成
- `/` トップ（表紙 → LIVE → NEWS → DISCOGRAPHY → PROFILE → MOVIE）
- `/live/` ライブ一覧（今後の公演＋過去の公演）
- `/news/` ニュース一覧 ／ `/news/{id}/` 記事
- `/discography/` 作品一覧 ／ `/discography/{id}/` 作品詳細
- `/movie/` MV一覧

## 更新のしかた（microCMS）
| API（エンドポイント） | 形式 | 内容 |
|---|---|---|
| `release` | リスト | 作品。**一番新しいリリース日の作品が、トップの表紙・No.バッジ・差し色に自動で反映** |
| `news` | リスト | ニュース（カテゴリ：LIVE / MUSIC / MEDIA / INFO） |
| `live` | リスト | ライブ。公演日を過ぎたものは自動で「過去の公演」へ移動（サイトが再ビルドされたタイミングで切り替わる） |
| `movie` | リスト | MV。YouTubeのURLを貼るだけで埋め込み表示 |
| `profile` | オブジェクト | グループ紹介文、AILLYN・MAIの紹介文と写真 |

- 新曲が出たら `release` に1件追加 → 表紙写真（`cover`）・テーマカラー（`color`、例 `#E0218A`）・キャッチコピーを入れると表紙が切り替わる
- `microcms-schema/` に各APIのスキーマファイルあり（API作成時に「スキーマをインポート」で読み込める）
- microCMSが未接続・空のときは `content/*.json` の初期データで表示される

## Cloudflare の設定
- ビルドコマンド：`node build.mjs`
- デプロイコマンド：`npx wrangler deploy`
- ビルド変数：`MICROCMS_SERVICE_DOMAIN`（例 `luire`）、`MICROCMS_API_KEY`
- microCMS の Webhook に Cloudflare のデプロイフックURLを登録すると、更新→自動公開

## 問い合わせ先
フッターに STANFORD Inc.（info@stanford-group.com）を表示。変更は `build.mjs` の `CONTACT_EMAIL`。

