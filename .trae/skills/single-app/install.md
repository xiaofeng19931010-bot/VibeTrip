# 安装说明（single-app）

由于当前项目目录有写入权限限制，本仓库内已生成 Skill 源文件于：

- `.trae/skills/single-app/SKILL.md`
- `.trae/skills/single-app/reference.md`

要让 Trae 全局识别该 Skill，请将整个目录复制到你的全局 Skills 目录（示例）：

```bash
mkdir -p ~/.trae/skills/single-app
cp -R ./.trae/skills/single-app/* ~/.trae/skills/single-app/
```

复制完成后，重启 Trae/IDE 使其重新加载 Skills。

