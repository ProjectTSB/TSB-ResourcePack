# リソースパックの CI

## dev リリースへの公開

`publish` ワークフローは、更新されたブランチの ZIP を `dev` リリースへ追加・差し替えます。デフォルトブランチの配布名・表示名は `resources.zip` です。他のブランチには `resources-branch-<ブランチ名>-<ハッシュ>.zip` を使います。ブランチ名の記号を `-` に置換し、先頭80文字を残します。置換後の名前が重なる場合に備え、元のブランチ名の SHA-256 の先頭12桁を付けます。デフォルトブランチにはラベルを付けず、他のブランチの添付ラベルに元のブランチ名とコミット SHA を表示します。

各ブランチの `Generate effect icon.json` が push を受けて完了すると、デフォルトブランチにある公開処理が動きます。フォント生成 CI が存在しないブランチや、Actions をスキップした push では自動公開されません。フォント生成の成功・失敗にかかわらず、その時点でブランチに保存済みのファイルを公開します。生成が成功してコミットされた場合は、その変更も含みます。

ZIP のルートには `assets/`、`pack.mcmeta`、`pack.png` を配置します。公開側は対象コミットから `git archive` で取り出すため、対象ブランチのスクリプトを実行しません。ZIP 作成中に先端コミットが変わった場合は公開を見送り、次の実行に任せます。リリース自体は再作成せず、対象ブランチの添付だけを差し替えます。デフォルトブランチの公開時には `dev` タグもそのコミットへ移動します。

ブランチの削除時には、対応する ZIP だけを削除します。公開前にブランチが消えた場合も削除し、遅れて到着した削除イベントの時点で同名ブランチが再作成されていれば何もしません。更新・削除は同じ concurrency group で直列実行します。`queue: max` で最大100件を待機させ、別ブランチの待機中の処理が新しいイベントに置き換わるのを防ぎます。

手動で再実行する場合は、Actions の `publish` をデフォルトブランチから実行し、`branch` に対象ブランチ名を指定します。存在するブランチは公開し、存在しないブランチは添付を削除します。デフォルトブランチは実行ごとに ZIP を公開します。他のブランチでは、同じコミットの ZIP が公開済みなら再アップロードしません。アップロードに失敗した場合や待機上限を超えた場合も、この手順で再実行できます。`dev` リリースでは添付の変更を許可する必要があります。

公開処理のテストは、リポジトリのルートで `node --test .github/scripts/publish.test.cjs` を実行します。GitHub API を模したテストで、追加・更新・削除、他の添付の保持、ブランチ更新と削除の競合を確認します。

実装は [publish.yml](../../.github/workflows/publish.yml) と [publish.cjs](../../.github/scripts/publish.cjs) にあります。イベントと待機設定の契約は GitHub の [workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run) と [concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency) を参照してください。
