---
title: Centos 编译安装 Nginx
date: 2022-04-18 21:18:28
keywords: Nginx,Nginx 安装,linux,nginx 编译安装,服务器搭建
summary: Nginx (engine x) 是一个高性能的 HTTP 和反向代理 web 服务器, 同时也提供了 IMAP/POP3/SMTP 服务, Nginx是由伊戈尔·赛索耶夫为俄罗斯访问量第二的Rambler.ru站点（俄文：Рамблер）开发的。
tags:
- linux
- Nginx
categories: nginx
---



Nginx (engine x) 是一个高性能的 HTTP 和反向代理 web 服务器, 同时也提供了 IMAP/POP3/SMTP 服务, Nginx是由伊戈尔·赛索耶夫为俄罗斯访问量第二的Rambler.ru站点（俄文：Рамблер）开发的。

Nginx 官网：[https://nginx.org](https://nginx.org/)

### 1.下载源码

```shell
# 下载
wget https://nginx.org/download/nginx-1.20.2.tar.gz
# 解压
tar xfs nginx-1.20.2.tar.gz
cd nginx-1.20.2
```
### 2.编译安装

```shell
# 添加用户和用户组 （可自行修改）
groupadd www
useradd -g www www -M -s /sbin/nologin

# 安装依赖
yum install pcre-devel openssl-devel -y

# 配置
./configure --user=www --group=www --prefix=/usr/local/nginx --with-http_stub_status_module --with-http_ssl_module --with-http_gzip_static_module --with-http_sub_module --with-pcre

# 编译并安装
make && make install
```

> 注意：Centos 镜像已停止服务，`yum install` 安装 `devel` 软件时，如报错无法安装可尝试将 `/etc/yum.repos.d/` 目录下的 `CentOS-Base.repo.rpmsave` 中的文件内容覆盖至 `CentOS-Linux-BaseOS.repo` ，`CentOS-AppStream.repo.rpmsave` 覆盖至 `CentOS-Linux-AppStream.repo`，操作前请注意备份

其中 `user` 与 `group` 用于指定运行 nginx 的用户，`prefix` 指定安装路径，可根据需要自行修改

### 3.创建软连接

```shell
ln -s /usr/local/nginx/sbin/nginx /usr/bin/nginx
```

### 4.验证
```shell
nginx
```
输出如下
![输出截图](https://pic.imgdb.cn/item/625d6710239250f7c5a8b4ff.jpg)

### 5.配置
1. `worker_processes` 启动进程数，修改为 `auto`
2. `worker_connections` 单个工作进程可以允许同时建立外部连接的数量， 修改为 65535
3. 运行 `ulimit -SHn 65535` 修改系统资源限制，并添加至 `/etc/profile` 文件底部

### 6.常用命令
```shell
# 启动
nginx

# 停止
nginx -s stop

# 重启
nginx -s quit
nginx

# 平滑重启
nginx -s reload
```