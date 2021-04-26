import { ExtensionContext, window, commands, StatusBarAlignment } from "vscode";
import { create as createBin } from "sourcebin";
import linguist from "@sourcebin/linguist/dist/linguist.json";
import { write as copy } from "clipboardy";

import { sep } from "path";

export function activate(context: ExtensionContext) {
    const commandId = "srcbin.upload";
    console.log("active");

    let disposable = commands.registerCommand(commandId, async () => {
        const editor = window.activeTextEditor;

        const fileName = editor?.document.fileName.split(sep).reverse()[0];
        const ext = fileName?.split(".").reverse()[0];

        const selection = editor?.selection;

        const selected =
            editor?.document.getText(selection) || editor?.document.getText();

        if (!selected) {
            window.showErrorMessage("Cannot create Empty Bin.");
            return;
        }

        let langId: number | undefined;
        for (const id in linguist) {
            if ((linguist as any)[id].extension === ext) {
                langId = parseInt(id);
                break;
            }
        }

        let url: string;
        let copied = false;

        try {
            const { short } = await createBin(
                [
                    {
                        content: selected,
                        language: langId || "text",
                    },
                ],
                {
                    title: fileName,
                }
            );
            url = short;
        } catch (e) {
            window.showErrorMessage(
                `Uploading to Bin Failed. Error: ${e.message}`
            );
            return;
        }

        try {
            await copy(url);
            copied = true;
        } catch (e) {}

        let message = `${
            selection ? "Selection" : "File"
        } uploaded to Sourcebin. ${
            copied ? "Copied Link successfully" : "Error Copying Link"
        }. Link: ${url}`;

        copied
            ? window.showInformationMessage(message)
            : window.showWarningMessage(message);
    });

    const statusBarItem = window.createStatusBarItem(
        StatusBarAlignment.Right,
        1000
    );
    statusBarItem.command = commandId;
    statusBarItem.text = "Upload to Bin";
    statusBarItem.tooltip = "Upload selection/file to sourcebin";
    statusBarItem.show();

    context.subscriptions.push(disposable);
    context.subscriptions.push(statusBarItem);
}
