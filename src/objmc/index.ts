import { exec, execFileSync } from 'child_process'
import * as fs from 'fs'
import path from 'path'

const OBJMC_URL = new URL("https://raw.githubusercontent.com/TheNuclearNexus/objmc/main/objmc.py")

const parentFolder = './objmc'
const tempFolder = path.join(parentFolder, 'temp')

async function setupFS() {
    if (!fs.existsSync(parentFolder))
        fs.mkdirSync(parentFolder)

    if (!fs.existsSync('./objmc/objmc.py')) {
        const resp = await fetch(OBJMC_URL)
        if (!resp.ok)
            throw "An error occured while fetching OBJMC\n" + resp.status + "\n" + resp.statusText
        fs.writeFileSync('./objmc/objmc.py', await resp.text())
    }

    if (fs.existsSync(tempFolder))
        fs.rmSync(tempFolder, { recursive: true, force: true })
    fs.mkdirSync(tempFolder)
}

function leftPadName(width: number, content: string, suffix: string) {
    return '0'.repeat(width).slice(0, -content.length) + content + suffix
}

export async function executeObjMC(objs: any[], textures: any[], colorbehavior: string[],
    duration: number, modelPath: string | undefined, texturePath: string, autoAnimate: boolean, autoRotate: string, noShadow: boolean, pow2: boolean) {
    await setupFS()


    const objFilePaths = objs.map((obj, idx) => {
        const name = leftPadName(objs.length.toString().length, idx.toString(), '.obj')
        const filePath = path.join(
            tempFolder,
            name
        )
        fs.writeFileSync(
            filePath,
            Buffer.from(obj)
        )

        return path.resolve(filePath)
    })

    const textureFilePaths = textures.map((texture, idx) => {
        const name = leftPadName(textures.length.toString().length, idx.toString(), '.png')
        const filePath = path.join(
            tempFolder,
            name
        )
        fs.writeFileSync(
            filePath,
            texture,
            'base64'
        )
        return path.resolve(filePath)
    })

    const args: string[] = [
        path.join(parentFolder, 'objmc.py'),
        '--objs', ...objFilePaths,
        '--texs', ...textureFilePaths,
        '--duration', duration.toString(),
        '--colorbehavior', ...colorbehavior
    ]

    if(autoAnimate)
        args.push('--autoplay')
    if(autoRotate != 'off')
        args.push('--autorotate', autoRotate)
    if(noShadow)
        args.push('--noshadow')
    if(!pow2)
        args.push('--nopow')
        
    args.push('--out', modelPath ?? path.join(tempFolder, 'model.json'), texturePath)

    execFileSync('py', args)
}