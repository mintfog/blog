---
title: Centos 编译安装 Apache
date: 2022-04-16 22:08:04
summary:  Apache(音译为阿帕奇)是世界使用排名第一的Web服务器软件。它可以运行在几乎所有广泛使用的计算机平台上，由于其跨平台和安全性被广泛使用，是最流行的Web服务器端软件之一。
keywords: Apache,Apache安装,linux,Apache 编译安装,服务器搭建
tags:
- linux
- Apache
categories: linux
---



Apache(音译为阿帕奇)是世界使用排名第一的 Web 服务器软件。它可以运行在几乎所有广泛使用的计算机平台上，由于其跨平台和安全性被广泛使用，是最流行的 Web 服务器端软件之一。它快速、可靠并且可通过简单的 API 扩充，将 Perl/Python 等解释器编译到服务器中。



## 准备工作

### 下载安装文件

使用 [清华大学开源软件镜像站](https://mirrors.tuna.tsinghua.edu.cn/) 下载安装文件，依次打开链接选择最新本 `tar.gz` 格式安装包，鼠标右键复制下载地址

1. [apr](https://mirrors.tuna.tsinghua.edu.cn/apache/apr/)
2. [apr-util](https://mirrors.tuna.tsinghua.edu.cn/apache/apr/)
3. [httpd](https://mirrors.tuna.tsinghua.edu.cn/apache/httpd/)

### 安装依赖（centos最小安装模式）

```shell
yum install gcc gcc-c++ -y
yum install make -y
yum install expat-devel -y
```

## 开始安装

### 安装  apr

```shell
# 下载安装文件
wget https://mirrors.tuna.tsinghua.edu.cn/apache/apr/apr-1.7.0.tar.gz
# 解压缩安装文件
tar xsf apr-1.7.0.tar.gz
cd apr-1.7.0
./configure --prefix=/usr/local/apr
make && make install
```

### 安装  apr-util

```shell
wget https://mirrors.tuna.tsinghua.edu.cn/apache/apr/apr-util-1.6.1.tar.gz
tar xsf apr-util-1.6.1.tar.gz
cd apr-util-1.6.1
make && make install
```

### 安装  apache

```shell
wget https://mirrors.tuna.tsinghua.edu.cn/apache/httpd/httpd-2.4.53.tar.gz
tar xsf httpd-2.4.53.tar.gz
cd httpd-2.4.53
# 安装 pcre-devel
rpm -qa | grep pcre-devel || yum install pcre-devel -y
# 安装 openssl
rpm -qa | grep openssl-devel || yum install openssl-devel -y
# 创建编译文件
./configure --prefix=/usr/local/httpd --sysconfdir=/usr/local/httpd/etc/ --enable-so --enable-ssl --enable-cli --enable-rewrite --enable-modules=most --enable-mpms-shared=all --with-npm=prefok --with-zlib --with-pcre --with-apr=/usr/local/apr --with-apr-util=/usr/local/apr-util
make && make install
```
进入 apache 配置目录 `cd /usr/local/httpd/etc/`，编辑 `httpd.conf`，解除 200 行左右的 `ServerName` 的注释 

![取消注释ServerName](https://pic.imgdb.cn/item/625c27fe239250f7c568334f.jpg)

## Apache 的基础使用

### 启动

```shell
cd /usr/local/httpd
./bin/apachectl start
# 关闭防火墙
systemctl stop firewalld
```

### 多站点配置

将 `httpd.conf` 第 243 行左右的 `AllowOverride None` 修改为 `AllowOverride All`

![修改配置截图](https://pic.imgdb.cn/item/625c2a61239250f7c56de08e.jpg)

将 `httpd.conf` 第 480 行左右的 `Include etc//extra/httpd-vhosts.conf` 解除注释
修改 `extra/httpd-vhosts.conf`，文件内容如下

![vhosts内容](https://pic.imgdb.cn/item/625c2c3e239250f7c571bfaa.jpg)

```apache
<VirtualHost *:80>
    ServerAdmin webmaster@dummy-host.example.com
    # 网站根路径
    DocumentRoot "/usr/local/httpd/docs/dummy-host.example.com"
    # 网站域名
    ServerName dummy-host.example.com
    ServerAlias www.dummy-host.example.com
    # 日志文件
    ErrorLog "logs/dummy-host.example.com-error_log"
    CustomLog "logs/dummy-host.example.com-access_log" common
</VirtualHost>
```
重启 apache 即可 `/usr/local/httpd/bin/apachectl reset`