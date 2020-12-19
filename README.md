## 神器
1. `assets/minecraft/models/item/<元となるアイテム>.json`のその神器の`model`のところを`item/sacred_treasure/<神器ID>`に書き換えてね

2. `assets/minecraft/models/item/sacred_treasure/<神器ID>.json`にモデルを置いてね

3. `assets/minecraft/models/textures/item/sacred_treasure/<神器ID>.png`にテクスチャを置いてね

   複数ある場合は、`textures/item/sacred_treasure/<神器ID>/<自由な名前>.png`の形で置いてね

> 2Dテンプレ (`assets/minecraft/models/item/sacred_treasure/1.json`)
> ```json
> {
>     "parent": "item/generated",
>     "textures": {
>         "layer0": "item/sacred_treasure/1"
>     }
> }
> ```