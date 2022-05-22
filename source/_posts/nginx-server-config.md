---
title: Nginx web server 配置
date: 2022-04-26 20:23:30
summary:  添加虚拟服务器Nginx配置文件中至少包含一条定义虚拟服务器的server指令。当Nginx处理一个请求时，第一个被选中的虚拟服务器将用于处理该请求。
keywords: Nginx,Nginx server配置,linux,服务器搭建,反向代理
description: nginx web server就是虚拟网站配置，每个server都对应了一个网站，本文介绍了如何配置nginx web server, 以及反向代理的配置等，从语法与示例讲解。
tags:
- linux
- Nginx
categories: nginx
---

Nginx 配置文件中至少包含一条定义虚拟服务器的 `server` 指令, 当 Nginx 处理一个请求时，第一个被选中的虚拟服务器将用于处理该请求

虚拟服务器通过 `http` 指令中的 `server` 指令来定义，示例如下: 
```nginx
http {
    server {
    
    }
}
```

`http` 中可包含多个 `server` 来指定多个虚拟服务器, 这些虚拟服务器统一由 nginx 进行分发，互相隔离。

## listen 指令

正常情况下每个 `server` 中都会包含一条 `listen` 指令, 用于指定该虚拟服务器要监听的 IP 地址以及端口, 例如: 
```nginx
server {
    listen 0.0.0.0:80;
}
```
如果不填写端口，则采用默认端口(80), 如果不填写 IP 地址，则监听所有地址。

## server_name 指令

nginx 根据请求中的 `host` 头部与 `server_name` 进行匹配，来进行请求的分发, 如果都没有匹配或者请求中根本就不包含 `host` 头部, nginx 会将请求路由默认的虚拟主机。`server_name` 有三种不同的配置格式，且不用配置格式的优先级也不相同。

### 通配符匹配

通配符格式中的 `*` 号只能在域名的开头或结尾，并且 `*` 号两侧只能是 `.` ，所以 `www.*.example.com` 和 `w*.example.com` 是无效的。`*` 号可以匹配多个域名部分，`*.example.com` 不仅与 `www.example.com` 匹配，而且也与 `www.sub.example.org` 匹配。
`.example.com` 是比较特殊的通配符格式, 可以同时匹配确切名称 `example.com` 和通配符名称 `*.example.com` , 例如: 

```nginx
server {
    listen       80;
    server_name  *.example.org;
}

server {
    listen       80;
    server_name  abc.*;
}
```

### 正则匹配
```nginx
server {
    listen       80;
    server_name  ~^(?<user>.+)\.example\.net$;
}
```
正则匹配格式，必须以 `~` 开头，比如：`server_name ~^www\d+\.example\.com$;`。如果开头没有 `~` ，则 nginx 认为是精确匹配。在逻辑上，需要添加 `^` 和 `$` 锚定符号。正则表达式命名捕获的变量可以在 nginx 进行引用，例如:

```nginx
server {
    server_name   ~^(www\.)?(?<domain>.+)$;

    location / {
        root   /sites/$domain;
    }
}
```

### 精确匹配
```nginx
server {
    listen       80;
    server_name  example.org  www.example.org;
}
```
精确匹配就是完整匹配域名

### 匹配顺序

如果有多个 `server_name` 匹配 `host` 字段, Nginx 根据以下规则选择第一个相匹配的 `server` 处理请求: 
1. 精确匹配
2. 以 `*` 开始的最长通配符，如 `*.example.org`
3. 以 `*` 结尾的最长通配符，如 `mail.*`
4. 第一个匹配的正则表达式（根据在配置文件中出现的先后顺序）

## location 指令

location 指令是 nginx 中最关键的指令之一，location 指令的功能是用来匹配不同的 URI 请求，进而对请求做不同的处理和响应。

### 语法

Location 块通过指定模式来与客户端请求的URI相匹配。
Location 基本语法：
- 匹配 URI 类型，有四种参数可选，当然也可以不带参数。
- 命名 location，用 `@` 来标识，类似于定义 goto 语句块。

```nginx
location [ = | ~ | ~* | ^~ ] /URI { … }
location @/name/ { … }
```

| 参数 | 解释                                                         |
| ---- | ------------------------------------------------------------ |
| 空   | location 后没有参数直接跟着 标准 URI，表示前缀匹配，代表跟请求中的 URI 从头开始匹配 |
| =    | 精准匹配，请求字符串与其精准匹配，成功则立即处理，停止搜索其他匹配 |
| ^~   | 前缀匹配，请求字符串头部与其匹配，成功则立即处理，停止搜索其他匹配，一般用来匹配目录 |
| ~    | 正则匹配，表示 URI 中包含正则表达式， 区分大小写             |
| ~*   | 正则匹配，表示 URI 中包含正则表达式， 不区分大小写           |

### 匹配顺序

location 的匹配并不是完全的按照其在配置文件中出现的顺序来匹配的，请求 URI 会按如下规则进行规则进行匹配: 

1. 先精准匹配 **`=`** ，精准匹配成功则会立即停止其他类型匹配；
2. 没有精准匹配成功时，进行前缀匹配。先查找带有 **`^~`** 的前缀匹配，带有 **`^~`** 的前缀匹配成功则立即停止其他类型匹配，普通前缀匹配（不带参数 **`^~`** ）成功则会暂存，继续查找正则匹配；
3. **`=`** 和 **`^~`** 均未匹配成功前提下，查找正则匹配 **`~`** 和 **`~\*`** 。当同时有多个正则匹配时，按其在配置文件中出现的先后顺序前后匹配，命中则立即停止其他类型匹配；
4. 所有正则匹配均未成功时，返回步骤 2 中暂存的普通前缀匹配（不带参数 **`^~`** ）的结果 （如有多个匹配则取最长匹配返回）

以上规则优先级从高到低依次是
```
1. location =    # 精准匹配
2. location ^~   # 前缀匹配
3. location ~    # 正则匹配（区分大小写）
4. location ~*   # 正则匹配（不区分大小写）
5. location /a   # 普通前缀匹配，优先级低于带参数前缀匹配。
6. location /    # 任何没有匹配成功的，就会匹配这里处理
```

### 图片防盗链

在 Nginx上配置图片防盗链非常简单，通过用户客户端 http 请求头中的 referer 信息来做为主要判断，如果图片链接嵌套在非指定的网站上，可以限制其访问。

主要配置如下：

```nginx
location ~*\.(gif|jpg|jpeg|png|bmp|swf|webp)$ { 
     valid_referers none blocked *.example.org ~\.google\. ~\.baidu\. ~\.bing\.;
     if ($invalid_referer) {
         return 403;
    } 
}
```

1. location 中指定要防盗链的文件类型;

2. valid_referers 指定资源访问是通过以下几种方式为合法

   - `none`: 直接通过 url 访问，无 referer 值的情况

   - `blocked`: referer 值被防火墙修改

   - `*.example.org`: 指定资源在合法的 *.example.org 中可以被引用，支持 `*` 通配符
   - `~\.google\.`: 指定资源在搜索引擎中可访问

3. valid_referers 如果匹配不上，`$invalid_referer` 的值为 1，if 判断如果 `$invalid_referer` 为 1 则返回 403 错误码

### 反向代理

反向代理就是后端服务不直接对外暴露，请求首先发送到 nginx，然后 nginx 将请求转发至后端服务器，比如 `tomcat` `php` 等，如果后端服务只有一台服务器，nginx 在这里就是起到了代理后端服务接收请求的作用，称之为反向代理。

配置代码

```nginx
server {
	listen       80;
	server_name  localhost;

	location / {
		proxy_pass  http://127.0.0.1:8080
	}
}
```

如上配置，`Nginx`监听 `80 `端口，故访问该服务器时，会将请求转发至 `127.0.0.1:8080` 处理，并将 `127.0.0.1:8080` 返回的结果原样返回。

