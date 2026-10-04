# エフェクト付与のフライテキスト

既存の `effect/inline/icon.json` と `effect/inline/common.json` から、縦位置を変えた186個のフォントと、各アイコンの送り幅を戻す space フォントを生成する。画像と高さは既存のものを使い、アイコン9px、符号・背景・解除レベル・スタック12pxを維持する。文字が重複する場合は、Minecraft と同じく先頭の定義を採用する。

DevSpace 直下で実行する。第1引数は本体のデータパックディレクトリであり、repo 直下ではない。

```sh
npm ci --ignore-scripts --prefix TSB-ResourcePack/scripts/bossbar
node TSB-ResourcePack/scripts/effect-flytext/generate.cjs TheSkyBlessing/TheSkyBlessing
```

リソースパックの `assets/minecraft/font/effect/flytext/` と、本体の `data/asset_manager/functions/effect/flytext/generated/icons.mcfunction` を更新する。アイコンを追加・変更したら、元の inline フォントを更新した後に再生成し、両方を反映する。

表示位置・期間・件数は本体の `docs/knowledge/bossbar-and-text.md` にある。フォント番号はinlineフォントから下方向への移動量をピクセル単位で表し、88〜149、163〜224、269〜330の3範囲。開始位置88・163・269pxのそれぞれに、移動19pxと後続3行の42pxを加えた範囲をカバーする。生成時には範囲外の数値名のフォントを削除する。送り幅は各画像の高さと文字ごとの区画から計算し、同じ文字を `effect/flytext/space` で描くと元の横位置へ戻る。

## 名前用フォント

先にアイコン用フォントを生成してから、名前用フォントを生成する。高さ一覧は生成済みのアイコン用フォントから読み取る。名前は既存のEffect定義から文字を収集し、バニラ1.20.4の字形をbitmapへ変換する。生成時に登録されていた367文字に対応する。収録文字の組み合わせを変えた名前はそのまま使えるが、未収録の文字を追加した場合は再生成と配布が必要になる。任意の日本語全体への対応ではない。

```sh
python3 TheSkyBlessing/scripts/fetch-font-assets.py .cache/bossbar-font-input
node TSB-ResourcePack/scripts/effect-flytext/generate-names.cjs .cache/bossbar-font-input Asset/Asset
```

生成先は `font/effect/flytext/name/` と `textures/font/effect_flytext/`。文字一覧・送り幅・画像メモリの計算値を `name-metrics.json` に保存する。入力したAssetの名前から `text`・`extra`・`with` 内の文字を収集する。名前以外の任意文字を自動で含める処理はない。

共通字形359文字は各高さの `common` へまとめ、通常用とUnicode用からreferenceで共有する。異なる7文字だけを `default` と `uniform` に分ける。画像は元の白黒の画素を保ち、通常の太さで描く。bitmapの送り幅に合わせた負のspaceフォントも生成する。白・通常の太さの試作であり、unihex固有の影のずれ幅や文字送りまで完全に再現するものではない。

`minecraft:default` と `minecraft:uniform` には制御用space文字U+E300・E301・F300・F301を追加する。Unicode強制によるフォント切り替えを利用し、設定に合わない名前を右へ65536px退避してから戻す。名前全体の送り幅は両設定で0になる。65536pxへ届くGUI幅は対象外。シェーダーは変更しない。

同じbitmap画像でも別のprovider定義では個別に読み込まれる。referenceで共有したproviderは重複して数えない。186段階の画像寸法から算出した追加の画像メモリは約67.6MiB。文字情報やGPUの描画用テクスチャ、既存アイコンはこの値に含まない。クライアントの総メモリと読み込み時間は別途確認する。

Unifontの字形はMojang配布の `unifont.zip` から抽出し、同梱のライセンスを画像と同じディレクトリの `UNIFONT-LICENSE.txt` に保存する。バニラ入力の取得元とSHA-1は本体の `scripts/fetch-font-assets.py` に固定している。

生成後は `node TSB-ResourcePack/scripts/effect-flytext/check-names.cjs` で全収録文字と高さの送り幅、退避用space、共通字形の縦位置を検査できる。クライアントの描画結果を判定する検査ではない。
