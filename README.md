## 神器
1. `assets/minecraft/models/item/<元となるアイテム>.json`のその神器の`model`のところを`item/sacred_treasure/<神器ID>`に書き換えてね

   -> ない場合`assets/minecraft/models/item/template.txt`を複製して<元となるアイテム.json>に変更、中の`<元となるアイテム>`も全部書き換えればヨシ！

2. `assets/minecraft/models/item/sacred_treasure/<神器ID>.json`を置いて[下記のテンプレート](#2Dテンプレ)を記載してね

3. `assets/minecraft/models/textures/item/sacred_treasure/<神器ID>.png`にテクスチャを置いてね

   複数ある場合は、`textures/item/sacred_treasure/<神器ID>/<自由な名前>.png`の形で置いてね

   バニラアイテムを参照する場合はテクスチャを置かずに、2のjsonの`item/sacred_treasure/<ID>`を`item/<block|item>/<itemID>`に変更してね

> #### 2Dテンプレ
> `assets/minecraft/models/item/sacred_treasure/<ID>.json`
> ```json
> {
>     "parent": "item/generated",
>     "textures": {
>         "layer0": "item/sacred_treasure/<ID>"
>     }
> }
> ```