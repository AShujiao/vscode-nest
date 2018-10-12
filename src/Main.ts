
import * as vscode from 'vscode';
import version from './version';
import { Dom } from './Dom';
import * as path from 'path';
export class Main{
	public static watch():vscode.Disposable{
		const base = path.dirname(require.main.filename);

		// 文件路径
		const filePath = path.join(base, 'vs','code','electron-browser', 'workbench', 'workbench.js');
		const extName = "nest";
		let DomApi = new Dom(extName,filePath,version,extName);
		return vscode.workspace.onDidChangeConfiguration(() => DomApi.install(true));
	}
}