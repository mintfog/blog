---
title: Centos 编译安装 php 与配置
date: 2022-05-15 21:20:28
keywords: php,php 安装,php编译安装,php8.0 编译安装,php-fpm,服务器搭建
summary: PHP（全称：PHP：Hypertext Preprocessor，即“PHP：超文本预处理器”）是一种开源的通用计算机脚本语言，尤其适用于网络开发并可嵌入HTML中使用。PHP的语法借鉴吸收C语言、Java和Perl等流行计算机语言的特点，易于一般程序员学习。PHP的主要目标是允许网络开发人员快速编写动态页面。
tags:
- linux
- php
categories: linux
---


PHP（全称：PHP：Hypertext Preprocessor，即“PHP：超文本预处理器”）是一种开源的通用计算机脚本语言，尤其适用于网络开发并可嵌入HTML中使用。PHP的语法借鉴吸收C语言、Java和Perl等流行计算机语言的特点，易于一般程序员学习。PHP的主要目标是允许网络开发人员快速编写动态页面。

## 准备工作

### 下载安装文件

保险起见使用 php 官网下载：https://www.php.net/downloads
使用官网下载速度较慢，但是安全性有保障，如对安全性没有要求也可百度搜索相关镜像，本文选择最新稳定版本 PHP 8.1.6

```bash
wget https://www.php.net/distributions/php-8.1.6.tar.gz
tar -zxvf php-8.1.6.tar.gz
cd php-8.1.6
```

### 安装依赖

```bash
yum install libxml2 libxml2-devel libsqlite3x-devel openssl bzip2 libcurl-devel libcurl libjpeg libpng freetype gmp libmcrypt libmcrypt-devel readline readline-devel libxslt libxslt-devel zlib zlib-devel glibc glib2 ncurses curl gdbm-devel db4-devel libXpm-devel libX11-devel gd-devel gmp-devel expat-devel xmlrpc-c xmlrpc-c-devel libicu-devel libmcrypt-devel libmemcached-devel -y
```

> 注意：当前 Centos 官方镜像已停止服务，`yum install` 安装 `devel` 软件时，如报错无法安装可尝试将 `/etc/yum.repos.d/` 目录下的 `CentOS-Base.repo.rpmsave` 中的文件内容覆盖至 `CentOS-Linux-BaseOS.repo` ，`CentOS-AppStream.repo.rpmsave` 覆盖至 `CentOS-Linux-AppStream.repo`，操作前请注意备份

因 yum 源中没有 oniguruma 包，这里使用 github 源码编译安装，项目地址：https://github.com/kkos/oniguruma
```bash
wget https://github.com/kkos/oniguruma/releases/download/v6.9.8/onig-6.9.8.tar.gz
tar -zxvf onig-6.9.8.tar.gz
cd onig-6.9.8
./configure --prefix=/usr
make && make install
```

### 创建用户

安全起见，我们需要创建一个用户用于运行 php，一般这个用户是禁止登陆的，本文创建用户名与用户组均为 `www`，这个名称可以自定义

```bash
# 创建用户组
groupadd www
# 创建用户
useradd -g www www -M -s /sbin/nologin
```

- `-g www` 指定用户组
- `-M` 不创建家目录（程序运行不需要家目录）
- `-s /sbin/nologin` 不允许登录，更加安全

## 编译并安装

```bash
# 生成编译文件
./configure --prefix=/www/server/php81 --with-config-file-path=/www/server/php81/etc --enable-fpm --with-fpm-group=www --with-mysqli=mysqlnd --with-pdo-mysql=mysqlnd --with-iconv-dir --with-freetype-dir --with-mcrypt --with-jpeg-dir --with-png-dir -with-zlib --with-libxml-dir --enable-xml -enable-rpath --enable-inline-optimization --with-curl -enable-mbstring --with-gd --enable-gd-native-ttf --with-openssl --with-mhash --enable-pcntl --with-xmlrpc --enable-zip --enable-soap --with-gettext --enable-opcache --with-xsl
# 编译并安装
make && make install
# 复制配置文件
cp php.ini-production /www/server/php81/etc/php.ini
# 或者使用 development
cp php.ini-development /www/server/php81/etc/php.ini
```

如果使用 `apache` 的话，需要在编译参数中新增 `--with-apxs2=/www/server/apache/bin/apxs`，同时 `--enable-fpm` 参数可去除，其中 `/www/server/apache` 为 `apache` 安装目录，编译完成后在 `apache` 的配置文件中解注释对 `php_module` 的注释即可，本文不细讲 `apache` 配置。

## 配置

### 配置环境变量

在 `/etc/profile` 下新增 `PATH=$PATH:/www/server/php81/bin && export PATH`，使用 `source /etc/profile` 使配置立即生效。

创建 `php-fpm` 软链接：

```bash
ln -s /www/server/php81/sbin/php-fpm /www/server/php81/bin/php-fpm
```
### nginx 配置 php

1. 复制配置文件，如果之前已经复制过请跳过此步骤：

```bash
cp /www/server/php81/etc/php-fpm.conf.default /www/server/php81/etc/php-fpm.conf
cp /www/server/php81/etc/php-fpm.d/www.conf.default /www/server/php81/etc/php-fpm.d/www.conf
```

2. 启动 php-fpm：

```bash
/www/server/php81/sbin/php-fpm
```

3. 修改 nginx 配置文件

编辑 `nginx.conf` 文件，在对应的 `server` 下新增如下内容：

```nginx
location ~ [^/]\.php(/|$) {
    fastcgi_pass   127.0.0.1:9000;
    fastcgi_index  index.php;
    include        fastcgi.conf;
}
```

重启 nginx ，`nginx -s reload`，在网站根目录新建 `phpinfo.php` 文件：

```php
<?php
    
phpinfo();
```

![配置成功截图](https://pic.imgdb.cn/item/6281217c09475431299ffedb.jpg)

### nginx php 多版本共存

在日常的开发中，不同项目可能需要不同版本的 `php` 来运行，这就需要通过一些配置来实现 `php` 的共存。多个 `php` 版本共存时，需要在编译时将不同版本的 `php` 安装到不同的目录。

打开 `php` 安装路径，编辑文件 `etc/php-fpm.d/www.conf` 或 `etc/php-fpm.conf`，在文件中新增或修改以下项：

```ini
[www]
; 根据版本配置，比如 php8.1 配置为 php-cgi-81.sock
listen = /tmp/php-cgi-81.sock
listen.backlog = 8192
listen.allowed_clients = 127.0.0.1
; 指定监听文件使用的用户名，一定要设置！！并且 listen 中设置的文件 nginx 必须有读权限，否则会报错
listen.owner = www
; 指定监听文件的用户组，参考上一个
listen.group = www
listen.mode = 0666
; worker 进程运行的用户，该用户需要有运行的 PHP 文件的读权限，如涉及文件上传还需要对应目录的写权限
user = www
; worker 进程的用户组，参考上一项
group = www
; 动态调整 worker 数
pm = dynamic
; 依据版本设置 如 php8.1 配置为 phpfpm_81_status
pm.status_path = /phpfpm_81_status
; 最大 worker 进程数 一般设置为 内存/50M
pm.max_children = 50
; 启动时的 worker 进程数
pm.start_servers = 5
; 限制时的最小 worder 进程数
pm.min_spare_servers = 5
; 限制时的最大 worder 进程数
pm.max_spare_servers = 10
; 请求超时时间
request_terminate_timeout = 100
; 慢日志记录时间，请求事件超出此时间会记录日志
request_slowlog_timeout = 30
; 慢日志目录，目录一定要存在且上面设置的 user 用户要有写权限
slowlog = /www/wwwlogs/php/slow.log
```

worker 说明：