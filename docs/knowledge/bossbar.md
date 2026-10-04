# ボスバーの描画

Minecraft 1.20.4 の通常ボスバーは、GUI アトラスの `minecraft:boss_bar/` にあるスプライトでゲージを描く。`assets/minecraft/atlases/gui.json` の `single` 定義で、7色と4種類の目盛りの背景・進捗、計22個のスプライトを透明画像へ差し替える。名前のテキストと表示行は残る。

ゲージ用フォントは元の `textures/gui/sprites/boss_bar/` の画像ファイルを直接読む。この画像を透明にするとフォントのゲージも消えるため、非表示化は GUI アトラス内の割り当てに限定する。透明画像は `textures/gui/bossbar_empty.png` に置く。他の GUI スプライトの割り当ては変更しない。

フォント・GUI アトラス定義・透明画像は、[生成スクリプト](../../scripts/bossbar/generate.cjs) から更新する。実行手順は [生成 README](../../scripts/bossbar/README.md) にある。GUI アトラスへ別の用途の定義を追加する場合も、生成スクリプトを変更して再生成時に保持されるようにする。

Minecraft 1.20.4 の `SpriteSourceList` は各パックの定義を順に追加し、同じスプライト ID の後の定義で置き換える。`SingleFile` の `resource` は画像の参照先、`sprite` は置換対象の ID を指定する。この挙動は Mojang 配布のクライアント JAR と公式マッピングで確認した。ほかのバージョンへ更新するときは、GUI の参照 ID とアトラスの読込処理を確認する。

## エフェクトのフライテキスト

エフェクトアイコンを縦に動かす場合は、`effect/flytext/0` から `effect/flytext/61` のフォントを切り替える。各フォントは同じ画像を参照し、ascent だけが1pxずつ異なる。名前など別の文字を動かす機能は含まない。

送り幅を0へ戻すには、アイコンと同じ文字を `effect/flytext/space` で続けて描く。アイコンによって画像内の右端が異なるため、一律の負の幅で戻さない。元の inline フォントに同じ文字が複数ある場合は、先頭の画像と幅を使う。

生成手順と本体側の対応表の更新先は、[フライテキストの生成](../../scripts/effect-flytext/README.md) を参照する。
