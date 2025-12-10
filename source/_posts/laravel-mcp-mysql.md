---
title: 用 Laravel MCP 让 AI 直接读取数据库表结构
date: 2025-12-10 21:30:00
summary: 介绍如何使用 Laravel MCP 包让 AI 直接读取数据库表结构，免去手动复制表结构的烦恼。
keywords: Laravel, MCP, AI, 数据库, 表结构, OpenAI, Cursor, Claude
description: 在日常使用 AI 编程时，难免会遇到大模型想要获取数据库的表结构来生成代码，但是我们写 php 很少在代码中写数据库的结构体，或者字段列表，所以每次都要手动复制表结构给它。最近看到 Laravel 官方出了个 MCP 包，MCP 是 OpenAI 推出的一个协议，就是让 ai 可以调用自己写的小工具的一个协议，常用的 ai 编辑器（例如cursor、claude code)等都是支持 MCP 协议的。
tags:
- Laravel
- MCP
- AI
categories: AI
updated: 2025-12-10 21:30:00
---


在日常使用 AI 编程时，难免会遇到大模型想要获取数据库的表结构来生成代码，但是我们写 php 很少在代码中写数据库的结构体，或者字段列表，所以每次都要手动复制表结构给它。

最近看到 Laravel 官方出了个 MCP 包，MCP 是 OpenAI 推出的一个协议，就是让 ai 可以调用自己写的小工具的一个协议，常用的 ai 编辑器（例如cursor、claude code)等都是支持 MCP 协议的。

我写完后放到了 github 如果有需要也可以放到本地运行，[仓库地址](https://github.com/mintfog/laravel-mcp-mysql)

其实不仅仅是获取数据库结构，借助 MCP 可以实现很多个性化需求，例如查询项目信息、调用IMAP读取邮件等等，用法很多。

## 使用

使用方式很简单，把仓库下载下来，安装 composer 依赖，在 `.env` 配置好连接信息即可，与日常 Laravel 项目无异。

代码位置在 `\App\Mcp\Servers\MysqlServer` 可以看一下，实现方式非常简单，只有几十行代码。

以 cursor 为例，打开 cursor 的设置页面，找到 MCP 设置，添加以下 json 配置：

```json
{
  "mcpServers": {
    "mysql": {
      "args": [
        "D:\\code\\data\\laravel-mcp-mysql\\artisan",
        "mcp:start",
        "mysql"
      ],
      "command": "php",
      "type": "stdio"
    }
  }
}
```

注意将 `D:\\code\\data\\laravel-mcp-mysql\\artisan` 替换为你本地 Laravel 项目中 `artisan` 文件的绝对路径，如果本地安装了多个 PHP 版本，可以将 php 也改为绝对路径。

配置流程如下：

![img.png](https://cdn.codeover.cn/img/cursor-mcp-edit-config.png-imageFop)

每次调用 MCP 之前，都会询问是否同意执行，所以安全性还是可以的：

![img.png](https://cdn.codeover.cn/img/cursor-mcp-edit-config2.png-imageFop)


这样在写一些数据库查询时，大模型会自己去查询对应的表结构，然后生成代码，比盲写准确率会高很多
