import * as path from 'path';
import * as fs from 'fs';
import FileType from './FileType';
import * as vscode from 'vscode';
import vsHelp from './vsHelp';
import getNewContent from './getJs';
export class Dom {
    //当前用户配置
    private config: any;
    //配置名称
    private configName: string;
    //要修改的文件路径
    private filePath: string;
    //插件版本号
    private version: string;
    //插件名称
    private extName: string;


    //初始化参数
    public constructor(
        configName: string,
        filePath: string,
        version: string,
        extName: string,
    ) {
        this.configName = configName;
        this.filePath = filePath;
        this.version = version;
        this.extName = extName;

        this.config = vscode.workspace.getConfiguration(this.configName);
        let firstload = this.checkFirstload();  // 是否初次加载插件

        let fileType = this.getFileType(); // css 文件目前状态

        // 如果是第一次加载插件，或者旧版本
        if (firstload || fileType == FileType.isOld || fileType == FileType.empty) {
            this.install(true);
        }
    }

    /**
     * 安装插件，hack css
     * 
     * @private
     * @param {boolean} [refresh] 需要更新
     * @returns {void} 
     */
    public install(refresh?: boolean): void {

        let lastConfig = this.config;  // 之前的配置
        let config = vscode.workspace.getConfiguration(this.configName); // 当前用户配置

        // 1.如果配置文件改变到时候，当前插件配置没有改变，则返回
        if (!refresh && JSON.stringify(lastConfig) == JSON.stringify(config)) {
            // console.log('配置文件未改变.')
            return;
        }

        // 之后操作有两种：1.初次加载  2.配置文件改变 

        // 2.两次配置均为，未启动插件
        if (!lastConfig.enabled && !config.enabled) {
            // console.log('两次配置均为，未启动插件');
            return;
        }

        // 3.保存当前配置
        this.config = config; // 更新配置

        // 4.如果关闭插件
        if (!config.enabled) {
            this.uninstall();
            vsHelp.showInfoRestart(this.extName + ' has been uninstalled! Please restart.');
            return;
        }

        // 5.hack 样式

        // 自定义的样式内容
        let content = getNewContent(config, this.extName,this.version).replace(/\s*$/, ''); // 去除末尾空白

        // 添加到原有样式(尝试删除旧样式)中
        let newContent = this.getContent();
        newContent = this.clearCssContent(newContent);
        newContent += content;

        this.saveContent(newContent);
        vsHelp.showInfoRestart(this.extName + ' has been changed! Please restart.');

    }


	/**
	 * 获取文件内容
	 * @var mixed
	 */
    private getContent(): string {
        return fs.readFileSync(this.filePath, 'utf-8');
    }

    /**
     * 设置 css 文件内容
     * 
     * @private
     * @param {string} content 
     * @memberof Background
     */
    private saveContent(content: string): void {
        fs.writeFileSync(this.filePath, content, 'utf-8');
    }
    /**
     * 清理css中的添加项
     * 
     * @private
     * @param {string} content 
     * @returns {string} 
     * @memberof Background
     */
    private clearCssContent(content: string): string {
        var re =new RegExp("\\/\\*ext-" + this.extName + "-start\\*\\/[\\s\\S]*?\\/\\*ext-" + this.extName + "-end\\*"+"\\/","g"); 
        content = content.replace(re, '');
        content = content.replace(/\s*$/, '');
        return content;
    }

    /**
     * 卸载
     * 
     * @private
     * @memberof Background
     */
    private uninstall(): boolean {
        try {
            let content = this.getContent();
            content = this.clearCssContent(content);
            this.saveContent(content);
            return true;
        }
        catch (ex) {
            //console.log(ex);
            return false;
        }
    }

    /**
 * 检测是否初次加载，并在初次加载的时候提示用户
 * 
 * @private
 * @returns {boolean} 是否初次加载
 */
    private checkFirstload(): boolean {
        const configPath = path.join(__dirname, '../resources/config.json');
        let info: { firstload: boolean } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        if (info.firstload) {
            // 提示
            vsHelp.showInfo('Welcome to use ' + this.extName + '! U can config it in settings.json.')
            // 标识插件已启动过
            info.firstload = false;
            fs.writeFileSync(configPath, JSON.stringify(info, null, '    '), 'utf-8');

            return true;
        }

        return false;
    }

    /**
 * 获取css文件状态
 * 
 * @private
 * @returns {FileType} 
 * @memberof Background
 */
    private getFileType(): FileType {
        let cssContent = this.getContent();

        // 未 hack 过
        let ifUnInstall: boolean = !~cssContent.indexOf(`ext.${this.extName}.ver`);

        if (ifUnInstall) {
            return FileType.empty;
        }

        // hack 过的旧版本
        let ifVerOld: boolean = !~cssContent.indexOf(`/*ext.${this.extName}.ver.${this.version}*/`);

        if (ifVerOld) {
            //fs.writeFileSync(path.join(__dirname, '../xxx.css'), cssContent, 'utf-8');
            return FileType.isOld;
        }

        // hack 过的新版本
        return FileType.isNew;
    }

}