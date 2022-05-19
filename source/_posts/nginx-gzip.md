---
title: nginx 使用 gzip 压缩静态资源
date: 2022-04-29 22:18:00
keywords: Nginx,Nginx 安装,linux,nginx gzip,gzip
summary:  为提高网页加载速度，启用gzip缩减资源的大小是非常常见的手段。现代浏览器基本均支持gzip压缩，并会为HTTP请求自动协商此类压缩。
tags:
- linux
- Nginx
categories: nginx
---

为提高网页加载速度，启用 `gzip` 缩减资源的大小是非常常见的手段。现代浏览器基本均支持 `gzip` 压缩，并会为HTTP请求自动协商此类压缩。



## 处理过程

nginx 在接收到浏览器发出的请求之后，会根据请求信息检查浏览器可以接受哪些压缩方法，详情可见下图。

![过程截图](https://cdn.codeover.cn/img/626ab151239250f7c52e1bde.jpg-imageFop)

浏览器在请求头信息中会追加上上 `Accept-Encoding` 参数来说明自己支持哪些压缩方式。

如果服务端压缩了文件，就会在返回头信息增加一个 `Content-Encoding` ，用来说明数据的压缩方式。

绝大多数的浏览器都已经支持了 `gzip`，并且有请求头的验证，所以基本不需要担心兼容相关的问题。

压缩前后的体积差异，可以在控制台中看到。对于 js、css 文件的压缩率还是比较可观的。

![压缩率对比](https://cdn.codeover.cn/img/626ab42c239250f7c535a2a8.png-imageFop)

## gzip 配置参数

| 名称                                                         | 默认配置                    | 含义                                                         |
| ------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------ |
| gzip                                                         | gzip off;                   | 设置是否开启对后端响应的 gzip 压缩，然后返回压缩内容给前端   |
| xxxxxxxxxx # 启动nginx​# 停止nginx -s stop​# 重启nginx -s quitnginx​# 平滑重启nginx -s reloadshell | gzip_buffers 32 4k 或16 8k; | 设置用于压缩后端 response 的 buffer 的数量和每个的大小，默认每个 buffer 大小为一个内存页，根据平台不同可能是 4k 或 8k |
| gzip_comp_level                                              | gzip_comp_level 1;          | 指定 gzip 压缩的级别，默认为 1，该值可设置的范围是 1-9，数字越大压缩的越好，同时也越占用CPU资源 |
| gzip_disable                                                 | 无                          | 正则匹配 User-Agent 中的值，匹配上则不进行 gzip              |
| gzip_min_length                                              | gzip_min_length 20;         | 设定进行 gzip 压缩的阈值，当后端 response 的 Content-Length 大小小于该值则不进行 gzip 压缩 |
| gzip_http_version                                            | gzip_http_version 1.1;      | 设定进行 gzip 压缩的最小 http 版本                           |
| gzip_proxied                                                 | gzip_proxied off;           | 根据 request 或响应的相关 header 的值来决定是否进行 gzip     |
| gzip_types                                                   | gzip_types text/html;       | 指定哪些 mime types 启用 gzip 压缩，默认 text/html           |
| gzip_vary                                                    | gzip_vary off;              | 是否在 response header 中头写入Vary: Accept-Encoding         |
| gzip_static                                                  | gzip_static off;            | 开启之后，接到(静态文件)请求会到 url 相同的路径的文件系统去找扩展名为 ".gz" 的文件，如果存在直接把它发送出去，如果不存在，则进行 gzip 压缩，再发送出去，需要额外编译 http_gzip_static |

## 案例

编辑 `nginx.conf` 文件

``` nginx
http {
    ...

    # 开启 gzip
    gzip on;
    # 1k 以下的文件不压缩（小文件压缩反而会适得其反）
    gzip_min_length 1k;
    # 压缩级别设置为 2，设置较大数值会消耗较多 cpu 资源
    gzip_comp_level 2;
    # 参与压缩的文件类型 可在配置文件同级的 mime.types 查看并添加 不建议压缩图片文件
    gzip_types text/plain text/css text/javascript application/json application/javascript application/x-javascript application/xml font/ttf font/otf;
    gzip_vary on;

    ...
}
```

