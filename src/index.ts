/// <reference types="blockbench-types" />
import ExportAction from "./actions/export";
import { cleanTemp, setupFS } from "./objmc";

function register() {
  BBPlugin.register("objmc_bb", {
    title: "OBJMC Blockbench",
    author: "TheNuclearNexus",
    description: "Export animations to OBJMC format",
    variant: "desktop",
    icon: "icon-objects",
    version: "0.1.1",
    tags: ["Minecraft: Java Edition"],
    onload: onLoad,
    onunload: onUnload,
  } as PluginOptions & { [key: string]: any });
}

let properties: Property[] = [];
let registeredSettings: Setting[] = [];

async function onLoad() {
  await setupFS();

  (Animation as any).prototype.menu.addAction(ExportAction, -1);

  properties = [
    new Property(ModelProject, "string", "model_output_folder", {
      exposed: true,
      default: undefined,
      values: [],
    }),
    new Property(ModelProject, "string", "texture_output_folder", {
      exposed: true,
      default: undefined,
      values: [],
    }),
    new Property(ModelProject, "instance", "animation_settings", {
      exposed: true,
      default: {},
      values: [],
    }),
  ];

  registeredSettings = [
    new Setting("python_command", {
      type: "string",
      description: "Command used to invoke the objmc python script",
      name: "Python Command",
      value: "py",
      category: "export",
    }),
  ];

  console.log(settings.python_command);
}
function onUnload() {
  ExportAction.delete();
  properties.forEach((p) => p.delete());
  registeredSettings.forEach((s) => s.delete());
  cleanTemp();
}

register();
