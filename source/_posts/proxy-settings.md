---
title: 各常用包管理器配置科学上网代理
date: 2022-08-17 22:04:03
keywords: 翻墙,科学上网,代理,http代理,socket5代理,GitHub设置代理,git clone走代理,ssh走代理,GFW,包管理器,composer,go get,npm,科学上网解决方案
summary:  在日常使用各包管理器时，经常会出现被 GFW 劫持的情况，为此耽误了太多时间，故写此文已记录各常用包管理器走代理的方法，如有更好的方案请留言！
tags:
- 代码速记
categories: 代码速记
updated: 2022-08-18
---

在日常使用各包管理器时，经常会出现被 GFW 劫持的情况，为此耽误了太多时间，故写此文已记录各常用包管理器科学上网的方法（如有你有更好的方案或有纰漏请留言！）

## 目录

- [github](#github)
- [curl](#curl)
- [go get](go-get)
- [npm](#npm)
- [yarn](#yarn)
- [wget](wget)
- [composer](composer)

## github

#### HTTP 形式

```bash
# 走 http 代理
git config --global http.https://github.com.proxy "http://127.0.0.1:10809"
# 走 socks5 代理
git config --global http.https://github.com.proxy "socks5://127.0.0.1:1080"

# 取消设置
git config --global --unset http.https://github.com.proxy
```

### ssh 形式

#### macOS

创建或编辑 `~/.ssh/config` 文件，在末尾添加如下内容

```bash
Host github.com
   # 走 HTTP 代理
   ProxyCommand socat - PROXY:127.0.0.1:%h:%p,proxyport=10809
   # 走 socks5 代理
   ProxyCommand nc -v -x 127.0.0.1:1080 %h %p
```

#### Windows

创建或编辑  `C:\Users\个人用户名\.ssh\config` 文件，在末尾添加如下内容

```bash
Host github.com
    User git
    # 走 socks5 代理
    ProxyCommand connect -S 127.0.0.1:1080 %h %p
    # 走 http 代理
    ProxyCommand connect -H 127.0.0.1:10809 %h %p
```

#### Linux

创建或编辑 `~/.ssh/config` 文件，在末尾添加如下内容

```bash
Host github.com
   # 走 HTTP 代理
   ProxyCommand nc --proxy-type socks5 --proxy 127.0.0.1:1080 %h %p
   # 走 socks5 代理
   ProxyCommand nc --proxy-type http --proxy 127.0.0.1:10809 %h %p
```

## curl

将内容添加至 `~/.curlrc` 文件『Windows 系统下为 `C:\Users\个人用户名\.curlrc`』

```bash
# 走 HTTP 代理
http = "127.0.0.1:10809"
# 走 socks5 代理
socks5 = "127.0.0.1:1080"
```

## go get

试了好多方法都不起作用，还是建议使用替代方案：[goproxy.io](https://goproxy.io/)

## npm

```bash
npm config set proxy http://127.0.0.1:10809
npm config set https-proxy http://127.0.0.1:10809
```

测试使用 `socket5` 代理报错，似乎使用 `http` 代理，有些包在 `postinstall` 阶段下载内容还需要单独配置环境变量，建议一步到位直接使用 [yarn](https://yarn.bootcss.com/docs/install#windows-stable)

## yarn

```bash
yarn config set proxy http://127.0.0.1:10809
yarn config set https-proxy http://127.0.0.1:10809
```

同样不支持 `socket5` 代理

## wget

编辑文件 `~/.wgetrc` ，直接写入如下内容

```bash
use_proxy=yes
http_proxy=127.0.0.1:10809
https_proxy=127.0.0.1:10809
```

## composer

目前阿里云出了 composer 全量镜像，速度十分快，故也没有科学上网的必要了。

阿里云 composer 镜像地址: https://developer.aliyun.com/composer
