import JSZip from 'jszip'
import * as fs from 'fs'
import { defineComponent } from 'vue'
import path from 'path'
import { executeObjMC } from '../objmc'

const COLORBEHAVIORS = {
    'yaw': 'Yaw',
    'pitch': 'Pitch',
    'roll': 'Roll',
    'time': 'Time',
    'scale': 'Scale',
    'overlay': 'Overlay',
    'hurt': 'Hurt'
}

const AUTOROTATES = {
    'off': 'Off',
    'yaw': 'Yaw',
    'pitch': 'Pitch',
    'both': 'Both'
}
interface NewProperties {
    modelOutputFolder: string
    textureOutputFolder: string
}

const getCurrentProject = (): (ModelProject & NewProperties) | null => Project ? Project as any : null


export default new Action('export_objmc', {
    name: 'Export OBJ MC',
    description: 'Export animation as OBJMC Files',
    icon: 'icon-objects',
    category: 'animation',
    condition: (context) => context && AnimationItem.selected,
    click: () => clickOnAnimation()
})

interface ExportFormData {
    length: number,
    fps: number,
    cbR: string,
    cbG: string,
    cbB: string,
    autoAnimate: boolean,
    autoRotate: string,
    pow2: boolean,
    noShadow: boolean,
    exportModel: boolean,
    modelOutputFolder: string,
    modelFileName: string,
    textureOutputFolder: string,
    textureFileName: string
}

function clickOnAnimation(previous_results: any = { exportModel: true }) {
    const selected = (Animation as any).selected

    const curProject = getCurrentProject()

    const modelOutputFolder: DialogFormElement = { label: 'Model Output Folder', type: 'folder', value: curProject?.modelOutputFolder };
    const modelFileName: DialogFormElement = { label: 'Model File Name', type: 'text', value: selected.name.split('.').at(-1) + '.json' };
    const textureOutputFolder: DialogFormElement = { label: 'Texture Output Folder', type: 'folder', value: curProject?.textureOutputFolder }
    const textureFileName: DialogFormElement = { label: 'Texture File Name', type: 'text', value: selected.name.split('.').at(-1) + '.png' }


    const form: {
        [formElement: string]: DialogFormElement | "_";
    } = {
        length: { label: 'Length', type: 'number', value: previous_results.length ?? selected.length, min: 0, max: 10000 },
        fps: { label: 'FPS', type: 'number', value: previous_results.fps ?? selected.snapping, min: 1, max: 1000 },
        colorBehavior: "_",
        cbR: { label: 'Colorbehavior.R', type: 'select', options: COLORBEHAVIORS, value: previous_results.cbR ?? 'yaw' },
        cbG: { label: 'Colorbehavior.G', type: 'select', options: COLORBEHAVIORS, value: previous_results.cbG ?? 'time' },
        cbB: { label: 'Colorbehavior.B', type: 'select', options: COLORBEHAVIORS, value: previous_results.cbB ?? 'hurt' },
        autos: "_",
        autoAnimate: { label: 'Auto Animate?', type: 'checkbox', nocolon: true, value: previous_results.autoAnimate ?? true },
        autoRotate: { label: 'Auto Rotate?', type: 'select', options: AUTOROTATES, nocolon: true, value: previous_results.autoRotate ?? 'off' },
        pow2: { label: 'Force Power of Twos?', type: 'checkbox', nocolon: true, value: previous_results.pow2 ?? false, description: 'Force texture to be a power of 2 in length' },
        noShadow: { label: 'No Shadow?', type: 'checkbox', nocolon: true, value: previous_results.noShadow ?? false },
        exportSettings: "_",
        exportModel: { label: 'Export Model?', type: 'checkbox', value: previous_results.exportModel, nocolon: true },
    }

    if (previous_results.exportModel) {
        form.modelOutputFolder = modelOutputFolder
        form.modelFileName = modelFileName
    }
    form.modelFiller = "_"
    form.textureOutputFolder = textureOutputFolder
    form.textureFileName = textureFileName

    new Dialog({
        id: 'export_objmc',
        title: 'Export OBJMC',
        form: form,
        onConfirm: onConfirmDialog,
        onFormChange(form_result) {
            if (!this.form)
                return

            if (form_result.exportModel == previous_results.exportModel)
                return

            Dialog.open?.hide()

            clickOnAnimation(form_result)
        }
    }).show();
}

function collectObjs(length: number, fps: number) {
    if (Codecs.obj.compile === undefined)
        throw "Codecs.obj.compile is undefined!"


    Timeline.setTime(0, false);
    const frames = length * fps
    const objs = []

    for (let frame = 0; frame <= frames; frame++) {
        Timeline.setTime(frame / fps, false);
        Animator.preview();


        let obj = Codecs.obj.compile();
        objs.push(obj)
    }

    return objs
}

function collectTextures() {
    if (Codecs.obj.compile === undefined)
        throw "Codecs.obj.compile is undefined!"

    let all_files: {
        mtl: string,
        images: { [key: string]: any }
    } = Codecs.obj.compile({ all_files: true });

    const textures = []

    for (let key in all_files.images) {
        let texture = all_files.images[key]
        console.log(texture)
        if (texture && !texture.error) {
            textures.push(texture.getBase64())
        }
    }

    return textures
}


async function onConfirmDialog(args: any) {
    const {
        length,
        fps,
        cbR,
        cbG,
        cbB,
        exportModel,
        modelOutputFolder,
        modelFileName,
        textureOutputFolder,
        textureFileName,
        autoAnimate,
        autoRotate,
        noShadow,
        pow2
    } = args as ExportFormData
    const curProject = getCurrentProject()

    if (exportModel && curProject) {
        console.log(curProject)
        curProject.modelOutputFolder = modelOutputFolder
        curProject.textureOutputFolder = textureOutputFolder
    }

    const objs = collectObjs(length, fps)
    const textures = collectTextures()


    await executeObjMC(
        objs,
        textures,
        [cbR, cbG, cbB],
        length * 20,
        exportModel ? path.join(modelOutputFolder, modelFileName) : undefined,
        path.join(textureOutputFolder, textureFileName),
        autoAnimate,
        autoRotate,
        noShadow,
        pow2
    )
}