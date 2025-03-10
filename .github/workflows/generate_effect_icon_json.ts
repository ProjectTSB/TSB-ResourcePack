`use strict`;
import * as fs from "fs"
import path from "path"

const throwError: (message: string) => never = m => { throw new Error(m) }
const env: { getOrDefault: (key: string, defaultValue: string) => string, getOrThrow: (key: string) => string } = {
  getOrDefault: (key, defaultValue) => process.env[key] ?? defaultValue,
  getOrThrow: key => process.env[key] ?? throwError(`Missing environment key: ${key}`)
}

const run = () => {
  const checkoutPath = env.getOrThrow("CHECKOUT_PATH")

  const fontDir = path.join(checkoutPath, "assets", "minecraft", "textures", "font", "effect")

  const fontFiles = fs.readdirSync(fontDir)

  const effectMappings = fontFiles.flatMap<[id: number, mappingChar: string, resourcePath: string, isBuff: boolean]>(fileName => {
    const parsed = path.parse(fileName)
    const [id, suffix] = parsed.name.split("_")
    if (suffix !== "buff" && suffix !== "debuff") return []

    const isBuff = suffix === "buff"

    const mappingChar = `\\u${id.padStart(4, "0")}`

    switch (parsed.ext) {
      case ".png":
        return [[parseInt(id), mappingChar, `minecraft:font/effect/${fileName}`, isBuff]]
      case ".txt":
        const extendId = fs.readFileSync(path.join(fontDir, fileName), "utf-8").trim()
        const extendFileName = fontFiles.find(f => f.startsWith(`${extendId}_`))
        if (!extendFileName) throw new Error(`Cannot find extend texture for ${extendId} in ${fileName}`)
        console.log(`Extend ${fileName} to ${extendFileName}`)
        return [[parseInt(id), mappingChar, `minecraft:font/effect/${extendFileName}`, isBuff]]
      default:
        return []
    }
  }).sort((a, b) => a[0] - b[0])

  const jsonPostProcess = (jsonString: string) => jsonString.replace(/\\\\/g, "\\")

  const iconJson = effectMappings.map(([, c, file, isBuff]) => ({ chars: [c], file, type: "bitmap", ascent: isBuff ? -17 : -31, height: 9 }))
  const iconJsonPath = path.join(checkoutPath, "assets", "minecraft", "font", "effect", "icon.json")
  fs.writeFileSync(iconJsonPath, jsonPostProcess(JSON.stringify({ providers: iconJson })))

  const inlineIconJson = effectMappings.map(([, c, file]) => ({ chars: [c], file, type: "bitmap", ascent: 8, height: 9 }))
  const inlineIconJsonPath = path.join(checkoutPath, "assets", "minecraft", "font", "effect", "inline", "icon.json")
  fs.writeFileSync(inlineIconJsonPath, jsonPostProcess(JSON.stringify({ providers: inlineIconJson })))
}

run()
