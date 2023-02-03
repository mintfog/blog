---
title: Hexo 主题里的脚注功能
date: 2023-02-02 17:30:00
summary:  Markdown 基本语法中并不包含脚注语法，但是脚注作为一种常见的文本格式，对于文字编辑工作者，特别是像我这种喜欢插入引文的人而言，有着很大的使用需求。所以 Multi-Markdown 在其扩充语法集中增添了脚注的语法：
keywords: Hexo,脚注,插件,Markdown,Multi-Markdown,语法,扩展
---

## Markdown 的脚注
Markdown 基本语法中并不包含脚注[^1]语法，但是脚注作为一种常见的文本格式，对于文字编辑工作者，特别是像我这种喜欢插入引文的人而言，有着很大的使用需求。所以 Multi-Markdown[^2] 在其扩充语法集中增添了脚注的语法：

上面的语法经过语法渲染得到的结果就如下所示：

this is a basic footnote[^3]
here is an inline footnote[^4]
and another one[^5]
and another one[^6]
this one with lot content[^7]

## 插件的安装和使用
MMD 的脚注语法得到广泛的传播和认可，大部分的 Markdown 编辑器现在都采用了该语法来渲染脚注。可是 Hexo 的默认渲染器是不支持脚注语法的，所以我写了这个简单的功能来实现脚注的渲染。该功能已内置于 [主题](https://github.com/f-dong/hexo-theme-minimalism)。

- 脚注部分功能参考于: [https://github.com/kchen0x/hexo-reference](https://github.com/kchen0x/hexo-reference)
- 代码块内的脚注也会被渲染[^8]
- 如需禁用脚注，可在主题配置文件 `_config.yml` 中设置 `footnote.enable` 的值为 `false`
- 本功能参考了 [hexo-reference](https://github.com/kchen0x/hexo-reference)

### 示例

```markdown
基本脚注[^1]
这是一个内联脚注[^2](内联脚注)
另一个[^3]
另一个[^4]


[^1]: 基本脚注内容
[^3]: 段落
脚注
内容
[^4]: 一些脚注内容 [markdown](https://en.wikipedia.org/wiki/Markdown)
```

## 扩展功能
因为我有时候并不喜欢通过点击引用编号来往跳转于正文和脚注之间，相较之下我对维基百科风格的悬浮提示非常喜欢，所以我就想利用 Tooltip 工具来实现正文内的脚注呈现。实现了一种更加优雅的脚注呈现方式。

你不妨把鼠标移动到编号上去看看效果😊。

[^1]: 英文称为footnote，用于为正文补充注解（解释性加注）或标明被引用于正文或注解的数据源。一般，脚注会在文章内以符号或数字标示，然后在文章末端（也就是文章的「脚」），列出所有的补充、数据源的详情。脚注让编者补充细节之余，也不影响行文的聚焦，让版面显得更整齐。
[^2]: MultiMarkdown，又名 MMD，是 Markdown 的衍生产品，它添加了新的语法功能，例如脚注、表格和元数据。
[^3]: basic footnote content
[^4]: inline footnote
[^5]: paragraph
footnote
content
[^6]: footnote content with some markdown
[^7]: Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry’s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
[^8]: 默认不过滤代码块内的脚注，即在代码块内的脚注也会被渲染出来。如果你需要过滤代码块内的脚注，可以在主题配置文件 `_config.yml` 中设置 `footnote.ignoreCodeBlock` 的值为 `true`。