---
title: rsync 配置和使用
date: 2022-06-08 22:04:03
keywords: rsync,rsync配置,文件同步,数据备份,同步,linux rsync,数据恢复,运维,linux文件同步,代码部署
summary:  rsync 是 linux 系统下的数据镜像备份工具，可以快速增量备份，支持远程同步、本地复制，或者与其他 ssh、rsync主机同步。rsync 具有安全性高、备份迅速、支持增量备份等诸多优点
tags:
- linux
categories: linux
---

rsync 是 linux 系统下的数据镜像备份工具，可以快速增量备份，支持远程同步、本地复制，或者与其他 ssh、rsync主机同步。rsync 具有安全性高、备份迅速、支持增量备份等诸多优点，通过 rsync 可以解决对实时性要求不高的数据备份需求，例如定期备份服务器数据到远端服务器，对本地磁盘定期做数据镜像等。

## 参数介绍

- `-V` 展示详细的同步信息
- `-a` 归档模式，相当于 `-rlptgoD`
  - `-r` 递归给定的目录
  - `-l` 同步软连接文件
  - `-p` 保留文件权限
  - `-t` 同步源文件的修改时间
  - `-g` 保持文件的所属用户组
  - `-o` 保持文件所属的用户
  - `-D` 保留设备文件与特殊文件
- `-z` 压缩文件后再传输，减少网络带宽占用，但是会消耗一定的 cpu
- `-H` 保持硬链接
- `-n` 试运行，不做实际传输
- `-P` 相当于 `--partial --progress`
  - `--partial` 支持断点续传
  - `--progress` 传输时展示文件的传输进度
- `--delete` 如果同步目录的文件被删除，同步删除目标文件
- `--delete-excluded` 在目标目录删除 `--exclude` 中指定的排除目录
- `--exclude` 要排除的路径，即不参与同步的路径
- `--exclude-from=FILE_PATH` 如果要排除的路径过多，可以统一写在一个文件内，并指定文件路径
- `-e ssh` 使用 ssh 加密隧道传输文件

## 简单使用

### 本地文件同步

```bash
# 如果目标目录（/tmp/desc/）不存在会自动创建目录
rsync -av /tmp/test_dir/ /tmp/desc/
```

### 远程文件同步

rsync 可以通过 ssh 隧道在不同服务器间同步数据，此方式只需其中一方安装 rsync 即可完成文件同步

- 本地 => 远程

```bash
rsync -ave ssh /tmp/test_dir/ www@192.198.2.188:/tmp/desc/
```

- 远程 => 本地
```bash
rsync -ave ssh www@192.198.2.188:/tmp/desc/ /tmp/test_dir/
```

此命令执行后会要求输入 ssh 密码，可设置使用 [密钥登录](https://www.codeover.cn/forbid-root/#%E8%AE%BE%E7%BD%AE%E5%AF%86%E9%92%A5%E7%99%BB%E5%BD%95) 方式免除密码，如下：

```bash
rsync -ave "ssh -i /root/deploy_key" /tmp/test_dir/ www@192.198.2.188:/tmp/desc/
```

- `-ave` 同 `-a -v -e`
- `ssh -i /root/deploy_key` 使用 ssh 连接并指定连接使用的密钥文件 `/root/deploy_key`，引号内可使用 ssh 命令支持的参数，如 `-P`、`-y` 等
- `/tmp/test_dir/` 要传输目录
- `www@192.198.2.188:/tmp/desc/`
  - `www` 连接 ssh 使用的用户名
  - `192.198.2.188` 远端服务器 ip
  - `/tmp/desc/` 传输目标路径

## 服务监听模式

rsync 可开启服务监听模式来完成远程文件同步，设置完成后可直接在两台服务器间同步数据，而无需使用 ssh 隧道连接。在一定程度上相较于 ssh 同步模式安全（只有文件同步权限，ssh 同步模式则有链接 ssh 的权限），但同时需要在其中一端持续运行监听 rsync，并且需要完成一定的配置后才能进行同步

### 服务端配置

被连接的服务器为 rsync 的监听端（或称为服务端），即推送文件接收方或拉取文件的被拉取方需要在后台持续监听 rsync。

rsync 本身未提供配置文件，需要我们根据需要自行创建，其主要配置文件有以下三个：

1. `rsyncd.conf` 主配置文件
1. `rsyncd.passwd` 用户名密码文件，一个用户一行，用户名与密码之间使用 `:` 分隔
1. `rsyncd.motd` 连接成功后的欢迎信息，没什么用

创建主配置文件，配置文件路径可以随意，在监听时指定即可，常用配置项如下：

```yaml
# 设置 pid 文件位置
pid file = /var/run/rsyncd.pid
# 指定 lock 文件位置
lock file = /var/run/rsync.lock
uid = root
gid = root
# chroot 为 yes 时必须使用 root 权限, 客户端连接模块，首先 chroot 到模块 path 参数指定的目录下，且不能备份 path 路径外的链接文件
use chroot = yes
# 是否只读
read only = no
# 是否只写
write only = no
# 最大连接数
max connections = 200
# 超时时间
timeout = 300

# 以下模块配置，可以多个，模块名称使用 [] 包裹
[test]
# 模块根目录, 即推送文件的路径，必须指定
path = /var/test
# 忽略错误
ignore errors
# 是否只读
read only = no
# 是否允许列出模块里的内容
list = false
# 允许推送的主机, 留空允许所有 ip
host allow = 192.168.2.0/24
# 模块验证用户名称, rsyncd.passwd 中指定的用户，非系统用户，可使用空格或者逗号隔开多个用户名
auth users = rsync
# 模块验证密码文件 可放在全局配置里
secrets file=/etc/rsync/rsyncd.passwd
```

创建密码文件，一行一组用户名密码，用户名与密码之间使用 `:` 分隔，配置文件地址为主配置文件中指定的路径：

```bash
mkdir /etc/rsync
# 创建一个 rsync 用户，密码为 123456
echo "rsync:123456" > /etc/rsync/rsyncd.passwd
# 密码文件权限必须为 600，否则连接时会报错
chmod 600 /etc/rsync/rsyncd.passwd
```

启动监听，在实际应用中可使用 `supervisor` 来确保服务不会中断：

```bash
# /etc/rsync/rsyncd.conf 为 rsync 主配置文件
# 如果未指定则默认取 /etc/rsyncd.conf
rsync --daemon --config=/etc/rsync/rsyncd.conf
```

### 客户端

客户端只需安装 rsync 即可完成同步，不需要进行复杂的配置

- 从服务端同步到客户端，即从远端同步到本地

  ```bash
  rsync -avz --delete rsync@192.198.2.188::test /tmp/sync/
  ```

- 从客户端同步到服务端，即从本地同步到远端

  ```bash
  rsync -avz --delete /tmp/sync/ rsync@192.198.2.188::test
  ```
  

上述命令执行后会要求输入密码，密码即为服务端密码配置中的密码，使用得到账号必须在对应的模块注册过，详细参数解释：

- `-avz` 同 `-a -v -z`，详情可参考前文 [参数介绍](#参数介绍)
- `--delete` 如果本地目录删除了文件，同步删除远端文件
- `rsync@192.198.2.188::test`
  - `rsync` 服务端模块配置中配置的用户名
  - `192.198.2.188` 远端服务器地址，需要在远端主配置文件中允许当前 ip 同步
  - `test` 服务端主配置文件中的模块名，即被 `[]` 包裹的内容
- `/tmp/sync/` 本地目录地址，如果是 `/tmp/sync` 则同步目录，`/tmp/sync/` 则是同步目录中的内容。如果是从远端同步到本地且此目录不存在，则 rsync 会自动创建目录



#### 免密码同步

上述命令在执行后会有一个输入密码的交互，在自动同步脚本中可以创建一个密码验证文件来跳过此交互，此文件中只需指定连接用户对应的密码即可：

```bash
# 创建验证文件
# 假设服务端的密码为 123456
echo "123456" > rsync.passwd
# 密码验证文件的权限必须为 600，否则在同步时会报错
chmod 600 rsync.passwd
# 指定密码验证文件
# 这里使用相对路径，实际使用中可以使用绝对路径
rsync -avz --delete /tmp/sync/ rsync@192.198.2.188::test --password-file=rsync.passwd
```

