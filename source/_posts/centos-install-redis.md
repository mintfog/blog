---
title: Centos 编译安装 redis 以及基础配置
date: 2022-05-26 22:16:00
summary:  Redis是现在最受欢迎的NoSQL数据库之一，Redis是一个使用ANSI C编写的开源、包含多种数据结构、支持网络、基于内存、可选持久性的键值对存储数据库.
keywords: redis,redis 安装,linux,服务器搭建,redis 编译安装,redis配置,php配置redis,redis下载,redis7.0安装
description: CentOS8编译安装redis7 CentOS7编译安装linux编译安装，本篇文章将采用源代码编译的方式安装redis数据库，并介绍redis的基本设置，以及 php 扩展的安装，采用源码编译方式安装,phpize
tags:
- linux
- redis
categories: redis
---

`Redis` 是现在最受欢迎的 `NoSQL` 数据库之一，Redis 是一个使用 `ANSI C` 编写的开源、包含多种数据结构、支持网络、基于内存、可选持久性的键值对存储数据库.

## 准备工作

### 下载安装文件

保险起见使用 memcached 官网下载：[https://redis.io/download/](https://redis.io/download/)
使用官网下载速度较慢，但是安全性有保障，如对安全性没有要求也可百度搜索相关镜像，本文选择官网最新稳定版本 redis 7.0

```bash
wget https://github.com/redis/redis/archive/7.0.0.tar.gz
tar -zxvf 7.0.0.tar.gz
cd redis-7.0.0
```

## 安装与配置

### 安装

```bash
# 直接安装，PREFIX 即指定安装路径
make PREFIX=/www/server/redis install
# 创建配置文件目录
mkdir /www/server/redis/etc
# 复制配置文件
cp redis.conf /www/server/redis/etc/
```

### 启动

```bash
/www/server/redis/bin/redis-server /www/server/redis/etc/redis.conf
```

- `/www/server/redis/bin/redis-server` redis 启动文件
- `/www/server/redis/etc/redis.conf` 指定 redis 配置文件

### 基础配置

redis 启动时要指定配置文件，下面是各个配置文件的解释：

| 配置项           | 默认值    | 说明                                                 |
| ---------------- | --------- | ---------------------------------------------------- |
| bind             | 127.0.0.1 | 绑定地址，如需外网链接需设置为 0.0.0.0               |
| protected-mode   | yes       | 开启保护模式                                         |
| port             | 6379      | 监听的端口                                           |
| tcp-backlog      | 511       | linux 内核 tcp_max_syn_backlog 和 somaxconn 参数调优 |
| timeout          | 0         | 设置限制多少秒后关闭连接，默认不关闭                 |
| tcp-keepalive    | 300       | 开启 TCP 长连接，以防连接被弃用                      |
| daemonize        | no        | 是否开启守护进程                                     |
| supervised       | auto      | supervised 相关配置                                  |
| pidfile          | ~         | pid 文件目录，用于记录当前正运行的 pid               |
| loglevel         | notice    | 指定日志级别，可选 debug、verbose、notice、warning   |
| logfile          | ""        | 指定 redis 日志文件路径，默认不保存日志              |
| databases        | 16        | 设置数据库的数量，即 DB 数量                         |
| always-show-logo | yes       | 是否显示 redis 的 logo                               |

### 持久化

1. 开启 RDB 持久化，修改 redis 配置文件，新增或修改 `save`，语法如下：
   `save <seconds> <changes>`
   `save 900 1`: 就是 900 秒有一次更改就做一次 rdb 快照到磁盘
   可以注释 save 行或设置 `save ""` 来禁用，下面是默认值：

```bash
save 900 1 # 900 秒内有 1 次写入触发
save 300 10 # 300 秒内有 10 次写入触发
save 60 10000 # 60 秒内有 10000 次写入触发
```

2. 失败策略

`stop-writes-on-bgsave-error yes`
默认情况下，如果 rdb 快照功能开启且最后一次的 rdb 快照创建失败时，redis 会拒绝所有写请求，这是一种强硬手段来告知用户持久化功能不正常，否则可能没人会知道当前出了大问题，如果后台保存成功后，redis 会自动允许写请求，而不需特殊操作。不过这种设定在生产环境中似乎并不合理，你可以设置一些监控来发现这些异常，然后禁用此功能，这样 redis 在持久化失败后依然可以处理写请求，以减少对线上项目产生影响

3. 其他配置项
- `rdbcompression yes`，使用 LZF 算法对 rdb 文件进行压缩，当然也会消耗一些 cpu，可设置为 no 减少 cpu 占用
- `rdbchecksum yes`，在 rdb 文件末尾设置一个 CRC64 校验码（循环冗余码），起到了一定的纠错作用，但是也会造成一定量的性能损失，可以关闭此功能以获取最大性能，如果rdb文件校验功能关闭，那么系统读取不到检验码时会自动跳过校验。
- `dbfilename dump.rdb`，rdb 文件名
- `dir ./`，redis的工作目录 ，aof 文件，rdb 文件还有 redis cluster 模式下的 node.conf 文件均会创建在这个目录下。

### php 扩展安装

我们需要使用 php 连接 redis 服务的话，就要安装对应的扩展，一般我们可以选择直接安装 php 扩展，或者使用 composer 安装 [predis](https://github.com/predis/predis)，本文介绍 php 扩展的安装

pecl 官网：[https://pecl.php.net](https://pecl.php.net)，在右上角输入 redis 并搜索并进入，复制相应的下载链接

![扩展安装截图](http://cdn.codeover.cn/img/image-20220526220912070.png-imageFop)

安装命令如下：

```bash
# 下载
wget https://pecl.php.net/get/redis-5.3.7.tgz
# 解压
tar -zxvf redis-5.3.7.tgz
cd redis-5.3.7
# /www/server/php81 为 PHP 安装路径
/www/server/php81/bin/phpize
./configure --with-php-config=/www/server/php81/bin/php-config
make && make install
# 此时屏幕会显示 Installing shared extensions:     /www/server/php81/lib/php/extensions/no-debug-non-zts-20210902/
```

修改 php 安装目录下 `etc/php.ini` 文件中新增一行 `extension=memcached` ，如图所示：

![修改PHP.ini图示](http://cdn.codeover.cn/img/image-20220526221500661.png-imageFop)

![安装成功截图](http://cdn.codeover.cn/img/image-20220526221546849.png-imageFop)