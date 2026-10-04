# ボスバー用フォントの生成

`vanilla.json` の182列の文字割当てを使い、7色と4種類の目盛り、位置調整用の `space.json` を生成する。元のバニラ画像はコピーせず、Minecraft 1.20.4 のスプライトを参照する。

DevSpace 直下で入力を取得し、次を実行する。

```sh
python3 TheSkyBlessing/scripts/fetch-font-assets.py .cache/bossbar-font-input
npm ci --ignore-scripts --prefix TSB-ResourcePack/scripts/bossbar
node TSB-ResourcePack/scripts/bossbar/generate.cjs .cache/bossbar-font-input
```

完全に透明な列は bitmap provider の送り幅が短くなるため、space provider で他の列と揃える。ゲージ全体は本体が組み立て、送り幅0で描く。

`bossbar/space` は正負の2の累乗の整数幅と ±0.5 を持つ。default/uniform の E 系・F 系とは別フォントであり、こちらの送り幅は Unicode フォント強制の設定によって変えない。

本体のゲージ文字列・文字幅表、Asset の名前位置調整も更新する場合は、TheSkyBlessing の `docs/knowledge/bossbar-and-text.md` にある生成順序に従う。見た目の検証には、バニラのゲージを非表示にする既存のリソースパック設定も必要になる。
