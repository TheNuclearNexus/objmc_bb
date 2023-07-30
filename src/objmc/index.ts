import { exec, execFileSync } from 'child_process'
import * as fs from 'fs'
import path from 'path'

const API_URL = new URL("https://api.github.com/repos/TheNuclearNexus/objmc/contents/objmc.py")

const parentFolder = './objmc'
const tempFolder = path.join(parentFolder, 'temp')

interface GithubContentResult {
    name: string
    path: string
    sha: string
    size: number,
    url: string
    html_url: string
    git_url: string
    download_url: string
    type: string,
    encoding: string,
    content: string,
      
}

export function cleanTemp() {

    if (fs.existsSync(tempFolder))
        fs.rmSync(tempFolder, { recursive: true, force: true })
    fs.mkdirSync(tempFolder)
}

export async function setupFS() {
    if (!fs.existsSync(parentFolder))
        fs.mkdirSync(parentFolder)

    const shaPath = path.join(parentFolder, 'sha')
    let curSha = fs.existsSync(shaPath) ? fs.readFileSync(shaPath, {encoding: 'utf-8'}) : ''
    const githubResponse = await fetch(API_URL)

    if (!githubResponse.ok)
        throw "An error occured while fetching OBJMC from git API\n" 
            + githubResponse.status + "\n" 
            + githubResponse.statusText

    const githubData: GithubContentResult = await githubResponse.json()

    if(githubData.sha !== curSha) {
        fs.writeFileSync('./objmc/objmc.py', githubData.content, {encoding: 'base64'})
        fs.writeFileSync(shaPath, githubData.sha)
    }

    cleanTemp()
}

function leftPadName(width: number, content: string, suffix: string) {
    return '0'.repeat(width).slice(0, -content.length) + content + suffix
}

export async function executeObjMC(objs: any[], textures: any[], colorbehavior: string[],
    duration: number, modelPath: string | undefined, modelTexturePath: string | undefined, texturePath: string, 
    autoAnimate: boolean, autoRotate: string, noShadow: boolean, pow2: boolean,
    scale: number|undefined, offset: number[]|undefined) {
    cleanTemp()

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
    if(scale)
        args.push('--scale', scale.toString())
    if(offset)
        args.push('--offset', ...offset.map(o => o.toString()))

    let usedTexturePath = modelTexturePath ?? texturePath
    console.log(usedTexturePath)

    args.push('--out', modelPath ?? path.join(tempFolder, 'model.json'), usedTexturePath)

    execFileSync('py', args)

    if(modelTexturePath) {
        const filePath = modelTexturePath.split('/').at(-1) ?? ''
        console.log(filePath)
        fs.cpSync(filePath + '.png', texturePath)
        fs.rmSync(filePath + '.png', {force: true})
    }

}