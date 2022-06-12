---
title: Centos 编译安装 php 与配置
date: 2022-05-15 21:20:28
keywords: php,php 安装,php编译安装,php8.0 编译安装,php-fpm,服务器搭建
summary: PHP（全称：PHP：Hypertext Preprocessor，即“PHP：超文本预处理器”）是一种开源的通用计算机脚本语言，尤其适用于网络开发并可嵌入HTML中使用。PHP的语法借鉴吸收C语言、Java和Perl等流行计算机语言的特点，易于一般程序员学习。PHP的主要目标是允许网络开发人员快速编写动态页面。
tags:
- linux
- php
categories: linux
updated: 2022-06-12
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
<br>

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
./configure --prefix=/www/server/php81 --with-config-file-path=/www/server/php81/etc --enable-fpm --with-fpm-group=www --enable-mysqlnd --with-mysqli=mysqlnd --with-pdo-mysql=mysqlnd --with-iconv-dir --with-freetype --with-mcrypt --with-jpeg --with-png -with-zlib --with-libxml-dir --enable-xml --disable-rpath --enable-bcmath --enable-shmop --enable-sysvsem --enable-inline-optimization --with-curl -enable-mbstring --enable-gd --with-openssl --with-mhash --enable-pcntl --with-xmlrpc --enable-zip --enable-soap --with-gettext --enable-opcache --with-xsl --enable-sockets --enable-mbregex --enable-ftp --with-webp
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

![配置成功截图](http://cdn.codeover.cn/img/6281217c09475431299ffedb.jpg-imageFop)

### nginx php 多版本共存

在日常的开发中，不同项目可能需要不同版本的 `php` 来运行，这就需要通过一些配置来实现 `php` 的共存。多个 `php` 版本共存时，需要在编译时将不同版本的 `php` 安装到不同的目录。

打开 `php` 安装路径，编辑文件 `etc/php-fpm.d/www.conf` 或 `etc/php-fpm.conf`，在文件中新增或修改以下项：

```ini
[www]
; 根据版本配置，比如 php8.1 配置为 php-cgi-81.sock
listen = /tmp/php-cgi-81.sock
listen.backlog = 8192
listen.allowed_clients = 127.0.0.1
; 运行 master 进程用户名，一定要设置！！并且 listen 中设置的文件 nginx 必须有读权限，否则会报错
listen.owner = www
; 运行 master 进程用户名，参考上一个
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

随后在 nginx 配置文件，对应的 server 中修改 `fastcgi_pass` 为刚才设置中的 `listen` 对应的路径，注意此文件 nginx 运行用户必须有读权限，否则会报错：

```diff
 location ~ [^/]\.php(/|$) {
-    fastcgi_pass   127.0.0.1:9000;
+    fastcgi_pass   unix:/tmp/php81.sock;
     fastcgi_index  index.php;
     include        fastcgi.conf;
 }
```

> `php-fpm` 即 `php-Fastcgi Process Manager`，`php-fpm` 是 `FastCGI` 的实现，并提供了进程管理的功能。`php-fpm` 进程包含 `master` 进程与 `worker` 进程，一般情况下，`master` 进程只有一个，负责监听端口、调度请求，而 `worder` 进程则有多个，每个进程内部都嵌入了一个 `PHP` 解释器，是 `PHP` 代码真正运行的地方。前文设置中的 `worker` 即 `php-fpm` 的 `worker` 进程数量。

### 开机自启

编辑文件 `/etc/init.d/php-fpm81`，如需多版本兼容文件名后加上当前版本，如这里使用 `php-fpm81`，写入如下内容：

```shell
#!/bin/bash

# chkconfig: - 51 64

. /etc/init.d/functions

# php-fpm 路径
exec=/www/server/php81/sbin/php-fpm
# 锁文件 用于识别当前软件是否在运行
lock=/var/lock/subsys/php-fpm81
# 标识 输出信息用 可随意修改
proc=php-fpm81

function start() {
    pidofproc $exec > /dev/null
    [ $? = 0 ] && echo "${proc} 正在运行中" && exit
    daemon $exec
    if [ $? = 0 ]; then
        echo "${proc} 启动成功"
        rm -f lock
        touch $lock
    else
      echo "${proc} 启动失败 $?"
    fi
}

function stop() {
    pidofproc $exec > /dev/null
    [ $? != 0 ] && echo "${proc} 未运行" && exit
    killproc $exec
    if [[ $? == 0 ]]; then
        echo "${proc} 停止成功"
        rm -f $lock
    else
      echo "${proc} 停止失败 $?"
    fi
}

function reload() {
    killproc $exec -HUP
    if [[ $? == 0 ]]; then
        echo "平滑重启成功"
    else
        echo "平滑重启失败 $?"
    fi
}

function restart() {
    stop
    start
}

function procStatus() {
    status $exec > /dev/null
    if [[ $? == 0 ]]; then
        echo "${proc} 已启动"
    else
        echo "${proc} 未启动"
    fi
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  reload)
    reload
    ;;
  restart)
    restart
    ;;
  status)
    procStatus
    ;;
  *)
    echo $"Usage: $0 {start|stop|reload|restart|status}"
esac
```

随后添加为开机自启即可，如下：( `php-fpm81` 是上一步自定义得到文件名)

```bash
# 添加运行权限
chmod +x /etc/init.d/php-fpm81
chkconfig --add php-fpm81
chkconfig php-fpm81 on
```

手动操作命令如下：

```bash
# 启动
/etc/init.d/php-fpm81 start
# 停止
/etc/init.d/php-fpm81 stop
# 平滑重启
/etc/init.d/php-fpm81 reload
# 重启
/etc/init.d/php-fpm81 restart
# 运行状态
/etc/init.d/php-fpm81 status
```



