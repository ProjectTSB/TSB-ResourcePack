## 神器テクスチャ/モデル
### 必要なもの
* [Visual Studio Code](https://azure.microsoft.com/ja-jp/products/visual-studio-code/)

* [MC Resourcepack Generator][]

### 最初の手順
* [How-to-use-Git](https://github.com/TheSkyBlock/TheSkyBlock/wiki/How-to-use-Git)の手順に従い"リポジトリのクローン"の項でURLを`https://github.com/TheSkyBlock/TSB-ResourcePack.git`に変えクローンする

* VSCodeで拡張機能の項目に行き、[MC Resourcepack Generator][]をインストール

### 作り方
1. 使うテクスチャを作る/バニラテクスチャのパスを確認する

1. コマンドパレット(`Ctrl + Shift + P`)を開いて`ResourcePack: Resourcepack Generator`を選択

1. フォルダ選択のダイアログが出るのでcloneしたリソースパックディレクトリを指定する

1. 元となるアイテムを入力する(`minecraft:`は省略してね)

1. CustomModelDataの入力欄に神器のIDを入力する

1. `非アニメーションテクスチャ`/`アニメーションテクスチャ`/`バニラテクスチャ`/`非アニメーション3Dモデル`選択肢が出るので該当するものを選ぶ

1. 生成タイプに応じた質問に答える
    #### 非アニメーションテクスチャの場合
    1. ファイル選択のダイアログが出るので表示したいテクスチャの画像ファイルを選択する

    #### アニメーションテクスチャの場合
    1. ファイル選択のダイアログが出るので表示したいアニメーションテクスチャの画像ファイルを選択する

    1. フレーム間補完(interpolate)を有効にするかどうかを選択する

    1. フレーム間の推移速度を入力する

    #### バニラテクスチャの場合
    1. 表示したいバニラテクスチャのパスを入力する

    #### 非アニメーション3Dモデルの場合
    1. ファイル選択ダイアログが出るので使いたいモデルのJsonファイルを選択する

    1. テクスチャファイルを選択する場合は画像ファイルを選択する

完成。

<!-- Links -->

[MC Resourcepack Generator]: https://github.com/ChenCMD/MC-Resourcepack-Generator
