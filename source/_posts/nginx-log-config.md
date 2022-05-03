---
title: Nginx 日志配置
date: 2022-04-20 22:09:38
summary:  Nginx 日志对于统计、系统服务排错很有用, 通过访问日志我们可以得到用户的IP地址、浏览器的信息，请求的处理时间等信息。错误日志记录了访问出错的信息，可以帮助我们快速定位错误的原因。
keywords: Nginx,Nginx 日志配置,linux,nginx logs,服务器搭建
tags:
- linux
- Nginx
categories: nginx
---


## 设置 access_log

### access_log 语法
```nginx
access_log path [format] [buffer=size] [gzip[=level]] [flush=time] [if=condition];
```

 - `path` 指定日志的存储路径
 - `format` 指定日志的格式
 - `buffer` 指定日志写入时的缓存大小
 - `gzip` 日志写入前进行压缩，压缩比例 1 到 9 数值越大压缩率越高, 同时 cpu 消耗也越大, 默认为1
 - `flush` 缓存的有效时间, 如果超过此时间, 缓存中的内容会被清空
 - `if` 条件判断, 如果指定的条件不满足, 则不会写入日志

### format 语法

Nginx 预定义了日志格式，如果没有明确指定日志格式默认使用该格式：

```nginx
log_format  main  '$remote_addr - $remote_user [$time_local] '
                  '"$request" $status $body_bytes_sent '
                  '"$http_referer" "$http_user_agent"'
```

如果不想使用 Nginx 预定义的格式，可以通过 format 指令来自定义。

下面是 `format` 指令中常用的一些变量：
| 变量 | 含义 |
| :--- | :--- |
| \$bytes_sent | 发送给客户端的总字节数 |
| \$body_bytes_sent | 发送给客户端的字节数，不包括响应头的大小 |
| \$connection | 连接序列号 |
| \$connection_requests | 当前通过连接发出的请求数量 |
| \$msec | 日志写入时间，单位为秒，精度是毫秒 |
| \$pipe | 如果请求是通过http流水线发送，则其值为"p"，否则为“." |
| \$request_length | 请求长度（包括请求行，请求头和请求体） |
| \$request_time | 请求处理时长，单位为秒，精度为毫秒，从读入客户端的第一个字节开始，直到把最后一个字符发送张客户端进行日志写入为止 |
| \$status | 响应状态码 |
| \$time_iso8601 | 标准格式的本地时间,形如“2017-05-24T18:31:27+08:00” |
| \$time_local | 通用日志格式下的本地时间，如"24/May/2017:18:31:27 +0800" |
| \$http_referer | 请求的referer地址 |
| \$http_user_agent | 客户端浏览器信息 |
| \$remote_addr | 客户端IP |
| \$http_x_forwarded_for | 当前端有代理服务器时，设置web节点记录客户端地址的配置，此参数生效的前提是代理服务器也要进行相关的x_forwarded_for设置 |
| \$request | 完整的原始请求行，如 "GET / HTTP/1.1" |
| \$remote_user | 客户端用户名称，仅针对启用了用户认证的请求 |
| \$request_uri | 完整的请求地址，如 "https://nginx.org" |

测试
```nginx
log_format  main  '$remote_addr $remote_user [$time_local] "$request" '
                  '"$request_uri" $status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';
access_log /var/logs/access.log main
```

假如客户端有发起请求：https://example.com， 我们看一下一个请求的日志记录:
```log
115.60.176.39 - [20/Apr/2022:22:06:20 +0800] "GET / HTTP/1.1" "https://example.com" 200 160 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36" "-"
```

日志记录中 `$remote_user`、`$http_referer`、`$http_x_forwarded_for` 都对应了一个 `-` ，这是因为这几个变量为空。

## 设置 error_log

错误日志在 Nginx 中是通过 `error_log` 指令实现的。该指令记录服务器和请求处理过程中的错误信息。

### 语法
```nginx
error_log file [level];
```

- `file` 指定日志的写入位置
- `level` 指定错误级别, 可选值从低到高依次是 `debug`, `info`, `notice`, `warn`, `error`, `crit`, `alert`, `emerg` 只有设置日志的错误级别等于或高于 `level` 指定的值才会写入错误日志中。默认值是 `error` 

### 基本用法
```nginx
error_log /var/logs/nginx/error.log
```

例子中指定了错误日志的路径为：`/var/logs/nginx/error.log`, 日志级别使用默认的 `error`

## 总结
Nginx 中通过 `access_log` 和 `error_log` 指令配置访问日志和错误日志，通过 `log_format` 我们可以自定义日志格式。