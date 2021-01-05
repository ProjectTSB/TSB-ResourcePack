## 神器テクスチャ/モデル
### 必要なもの
* [Visual Studio Code](https://azure.microsoft.com/ja-jp/products/visual-studio-code/)

* [TSB Resource Pack Generator](https://github.com/TheSkyBlock/resource-pack-generator)

### 最初の手順
* [How-to-use-Git](https://github.com/TheSkyBlock/TheSkyBlock/wiki/How-to-use-Git)の手順に従い"リポジトリのクローン"の項でURLを`https://github.com/TheSkyBlock/TSB-ResourcePack.git`に変えクローンする

* VSCodeで拡張機能の項目に行き、[TSB Resource Pack Generator](https://github.com/TheSkyBlock/resource-pack-generator)のReleasesより入手した`tsb-resource-pack-generator-<version>.vsix`を拡張機能のリストにドラック&ドロップしてインストール

### 作り方
1. 使うテクスチャを作る/バニラテクスチャのパスを確認する

1. コマンドパレット(`Ctrl + Shift + P`)を開いて`ResourcePack: Resource Pack Generator`を選択

1. フォルダ選択のダイアログが出るのでcloneしたリソースパックディレクトリを指定する

1. `単体テクスチャ`/`アニメーションテクスチャ`/`バニラテクスチャ`選択肢が出るので該当するものを選ぶ

1. 神器のIDを入力欄に入力する

1. 元となるアイテムを入力する(`minecraft:`は省略してね)

1. 生成タイプに応じた質問に答える
    #### バニラテクスチャの場合
    1. 表示したいバニラテクスチャのパスを入力する

    #### 単体テクスチャの場合
    1. ファイル選択のダイアログが出るので表示したいテクスチャの画像ファイルを選択する

    #### アニメーションテクスチャの場合
    1. ファイル選択のダイアログが出るので表示したいアニメーションテクスチャの画像ファイルを選択する

    1. フレーム間補完(interpolate)を有効にするかどうかを選択する

    1. フレーム間の推移速度を入力する

完成。
