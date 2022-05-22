---
title: Centos 编译安装 memcached 以及基础配置
date: 2022-05-20 23:15:52
summary:  memcached是一套分散式的高速缓冲记忆体系统，由LiveJournal的Brad Fitzpatrick开发，但目前被许多网站使用。这是一套开放原始码软体，以BSD license授权释出。
keywords: memcached,memcached 安装,linux,服务器搭建,memcached 编译安装,memcached配置,php配置memcached
description: CentOS8编译安装memcached CentOS7编译安装 memcached linux编译安装memcached 本篇文章将采用源代码编译的方式安装memcached数据库，并介绍memcached的基本设置，以及 php 扩展的安装，采用源码编译方式安装，并配置开机启动脚本。
tags:
- linux
categories: linux
---

memcached是一套分散式的高速缓冲记忆体系统，由LiveJournal的Brad Fitzpatrick开发，但目前被许多网站使用。这是一套开放原始码软体，以BSD license授权释出。

## 准备工作

### 下载安装文件

保险起见使用 memcached 官网下载：http://memcached.org/downloads
使用官网下载速度较慢，但是安全性有保障，如对安全性没有要求也可百度搜索相关镜像，本文选择官网最新稳定版本 memcached 1.6.15

```bash
wget http://memcached.org/files/memcached-1.6.15.tar.gz
tar -zxvf memcached-1.6.15.tar.gz
cd memcached-1.6.15
```

### 安装依赖

```bash
yum install libevent-devel -y
```

<br>

> 注意：当前 Centos 官方镜像已停止服务，`yum install` 安装 `devel` 软件时，如报错无法安装可尝试将 `/etc/yum.repos.d/` 目录下的 `CentOS-Base.repo.rpmsave` 中的文件内容覆盖至 `CentOS-Linux-BaseOS.repo` ，`CentOS-AppStream.repo.rpmsave` 覆盖至 `CentOS-Linux-AppStream.repo`，操作前请注意备份

## 安装与配置

### 安装

```bash
# 生成编译文件
./configure --prefix=/www/server/memcached
# 编译并安装
make && make install
```

### 启动

```bash
/www/server/memcached/bin/memcached -uwww -p11211 -P /var/run/memcached.pid -d -l127.0.0.1
```

- `/www/server/memcached` 编译时指定的 memcached 安装路径
- `-u` 指定运行用户，示例中使用 `www` 用户运行
- `-p` 指定运行端口，不指定则默认为 `11211`
- `-P` 指定运行的 `pid` 文件储存位置 
- `-d` 以守护进程方式运行，即后台运行
- `-l` 指定监听的 ip ，示例中监听 `127.0.0.1` 即不允许外网连接

### 测试

依次运行下列命令：

```bash
telnet 127.0.0.1 11211
set key 0 0 15
hello memcached # 输出 STORED
get key # 输出 VALUE key 0 15 / hello memcached / END
```

如图所示：

![测试截图](http://cdn.codeover.cn/img/image-20220520234722981.png-imageFop)

### php 扩展安装

我们需要使用 php 连接 memcached 服务的话，就要安装对应的扩展

pecl 官网：[https://pecl.php.net](https://pecl.php.net)，在右上角输入 memcached 并搜索并进入，复制相应的下载链接

![扩展安装截图](http://cdn.codeover.cn/img/image-20220521225539313.png-imageFop)

安装命令如下：

```bash
# 下载
wget https://pecl.php.net/get/memcached-3.2.0.tgz
# 解压
tar -zxvf memcached-3.2.0.tgz
cd memcached-3.2.0
# /www/server/php81 为 PHP 安装路径
/www/server/php81/bin/phpize
yum install libmemcached-devel -y
./configure --with-php-config=/www/server/php81/bin/php-config
make && make install
# 此时屏幕会显示 Installing shared extensions:     /www/server/php81/lib/php/extensions/no-debug-non-zts-20210902/
```

修改 php 安装目录下 `etc/php.ini` 文件中新增一行 `extension=memcached` ，如图所示：

![修改PHP.ini图示](http://cdn.codeover.cn/img/image-20220522223958549.png-imageFop)

![安装成功截图](http://cdn.codeover.cn/img/image-20220522224235937.png-imageFop)

如果你在安装 `libmemcached-devel` 时提示 `No match for argument: libmemcached-devel`，请尝试按照以下方式进行编译安装：

```bash
wget https://launchpad.net/libmemcached/1.0/1.0.18/+download/libmemcached-1.0.18.tar.gz
tar -zxvf libmemcached-1.0.18.tar.gz
cd libmemcached-1.0.18
./configure --prefix=/usr/local/libmemcached --with-memcached
make && make install

./configure --with-php-config=/www/server/php81/bin/php-config --with-libmemcached-dir=/usr/local/libmemcached --disable-memcached-sasl
# 重新运行上一步中 ./configure 之后的步骤
```

注意：如在执行 `make` 中遇到 `clients/memflush.cc:42:22: error: ISO C++ forbids comparison between pointer and integer [-fpermissive]` 的报错，可直接使用 vim 将 `clients/memflush.cc` 文件的 42 行的 `false` 修改为 0，然后重新执行 `nake && make install` 即可成功

![报错截图](http://cdn.codeover.cn/img/image-20220522220846044.png-imageFop)

![修改截图](http://cdn.codeover.cn/img/image-20220522221346542.png-imageFop)