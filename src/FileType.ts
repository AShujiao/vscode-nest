enum FileType {
    /**
     * 未修改的css文件
     */
    empty,
    /**
     * hack 过的旧版本css文件
     */
    isOld,
    /**
     * hack 过的新版本的css文件
     */
    isNew
}

export default FileType;