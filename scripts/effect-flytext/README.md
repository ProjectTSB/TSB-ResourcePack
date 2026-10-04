# エフェクト付与のフライテキスト

既存の `effect/inline/icon.json` から、縦位置を変えた62個のフォントと、各アイコンの送り幅を戻す space フォントを生成する。画像は既存のものを参照し、描画する高さを12pxにする。文字が重複する場合は、Minecraft と同じく先頭の定義を採用する。

DevSpace 直下で実行する。第1引数は本体のデータパックディレクトリであり、repo 直下ではない。

```sh
npm ci --ignore-scripts --prefix TSB-ResourcePack/scripts/bossbar
node TSB-ResourcePack/scripts/effect-flytext/generate.cjs TheSkyBlessing/TheSkyBlessing
```

リソースパックの `assets/minecraft/font/effect/flytext/` と、本体の `data/asset_manager/functions/effect/flytext/generated/icons.mcfunction` を更新する。アイコンを追加・変更したら、元の inline フォントを更新した後に再生成し、両方を反映する。

表示位置・期間・件数は本体の `docs/knowledge/bossbar-and-text.md` にある。フォント番号は下方向の移動量をピクセル単位で表し、0から61まで。画像自体の送り幅は12pxの高さで計算し、同じ文字を `effect/flytext/space` で描くと元の横位置へ戻る。
