/// <reference types="blockbench-types" />
import ExportAction from './actions/export'

function register() {

    BBPlugin.register('objmc_bb', {
        title: 'OBJMC Blockbench',
        author: 'TheNuclearNexus',
        description: 'Export animations to OBJMC format',
        variant: 'desktop',
        icon: 'icon-objects',
        version: '0.1.0',
        tags: ['Minecraft: Java Edition'],
        onload: onLoad,
        onunload: onUnload,
        
    } as PluginOptions & {[key: string]: any})

}


let properties: Property[] = []
function onLoad() {
    (Animation as any).prototype.menu.addAction(ExportAction, -1);

    properties = [
        new Property(ModelProject, "string", "model_output_folder", {
            exposed: true,
            default: undefined
        }),
        new Property(ModelProject, "string", "texture_output_folder", {
            exposed: true,
            default: undefined
        }),
        new Property(Animation, "object", "previous_settings", {
            exposed: true,
            default: undefined
        })
    ]
}
function onUnload() {
    ExportAction.delete();
    properties.forEach(p => p.delete())
}

register()