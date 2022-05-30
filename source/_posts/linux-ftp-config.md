---
title: linux 安装 vsftpd 服务以及配置全攻略
date: 2022-05-30 21:40:52
summary:  FTP 是 File Transfer Protocol 的简称，用于 Internet 上的控制文件的双向传输。同时，他也是一个应用程序，基于不同的操作系统有不同的 FTP 应用程序，而所有这些应用程序都遵守同一协议传输文件。
keywords: ftp,ftp 安装,vsftpd,服务器搭建,vsftpd 配置,文件传输,filezilla
description: CentOS8安装vsftpd CentOS7安装 FTP服务器的配置 linux编译安装，本篇文章主要介绍vsftpd的安装与配置，FTP是常用的文件传输协议，yum方式安装
tags:
- linux
categories: linux
---

FTP 是 File Transfer Protocol 的简称，用于 Internet 上的控制文件的双向传输。同时，他也是一个应用程序，基于不同的操作系统有不同的 FTP 应用程序，而所有这些应用程序都遵守同一协议传输文件。在 FTP 的使用当中，用户经常遇到两个概念：上传和下载，下载文件就是从远程主机拷贝文件到自己的计算机上，上传文件是指将自己计算机中的文件拷贝至远程主机上。FTP 常用于开发阶段文件上传工具，常用的客户端软件有 [filezilla](https://filezilla-project.org/)、[flashfxp](https://www.flashfxp.com/)、[winscp](https://winscp.net/eng/download.php)、[xftp](https://www.xshell.com/zh/xftp/) 等

## 服务端安装

服务端最常用的软件就是 [vsftpd](https://security.appspot.com/vsftpd.html)，其安装方式也很简单，如下:

```bash
yum install vsftpd -y # CentOS
apt-get install vsftpd -y # Ubuntu
```

启动与停止命令如下：

```bash
systemctl start vsftpd.service # 启动
systemctl stop vsftpd.service # 停止
systemctl restart vsftpd.service # 重启
```

或者：

```bash
service vsftpd start # 启动
service vsftpd stop # 停止
service vsftpd restart # 重启
```

## 配置

### 配置文件说明

vsftpd 的默认基础配置文件位于 `/etc/vsftpd/vsftpd.conf`，这个文件是 vsftpd 的核心配置文件，操作修改之前最好先备份，配置文件内容的基础说明：

```yaml
# 是否允许匿名登录 FTP 服务器，默认设置为 NO 表示允许
# 用户可使用用户名 ftp 或 anonymous 进行 ftp 登录，口令为用户的 E-mail 地址。
# 如在内网使用不需要登录可设置为 YES
anonymous_enable=NO
# 是否允许本地用户(即 linux 系统中的用户帐号)登录 FTP 服务器，默认设置为 YES 允许
# 本地用户登录后会进入用户主目录，而匿名用户登录后进入匿名用户的下载目录 /var/ftp/pub
# 若只允许匿名用户访问，前面加上#注释掉即可阻止本地用户访问 FTP 服务器
local_enable=YES
# 是否允许本地用户对 FTP 服务器文件具有写权限，默认设置为 YES 允许
write_enable=YES 
# 掩码，本地用户默认掩码为 077
# 你可以设置本地用户的文件掩码为缺省 022，也可根据个人喜好将其设置为其他值
local_umask=022
# 是否允许匿名用户上传文件，须将全局的 write_enable=YES 默认为 NO
#anon_upload_enable=YES
# 是否允许匿名用户创建新文件夹
#anon_mkdir_write_enable=YES 
# 是否激活目录欢迎信息功能
# 当用户用 CMD 模式首次访问服务器上某个目录时，FTP 服务器将显示欢迎信息
# 默认情况下，欢迎信息是通过该目录下的 .message 文件获得的
# 此文件保存自定义的欢迎信息，由用户自己建立
dirmessage_enable=YES
# 是否让系统自动维护上传和下载的日志文件
# 默认情况该日志文件为 /var/log/vsftpd.log 也可以通过下面的 xferlog_fil e选项对其进行设定
xferlog_enable=YES
# 是否设定 FTP 服务器将启用 FTP 数据端口的连接请求
# ftp-data 数据传输，21 为连接控制端口
connect_from_port_20=YES
# 设定是否允许改变上传文件的属主，与下面一个设定项配合使用
# 注意，不推荐使用 root 用户上传文件
#chown_uploads=YES
# 设置想要改变的上传文件的属主，如果需要，则输入一个系统用户名
# 可以把上传的文件都改成 root 属主。whoever：任何人
#chown_username=whoever
# 设定系统维护记录 FTP 服务器上传和下载情况的日志文件
# /var/log/vsftpd.log 是默认的，也可以修改为其它
#xferlog_file=/var/log/vsftpd.log
# 是否以标准 xferlog 的格式书写传输日志文件
# 默认为 /var/log/xferlog，也可以通过 xferlog_file 选项对其进行设定
# 默认值为 YES
xferlog_std_format=YES
# 设置数据传输中断间隔时间，此语句表示空闲的用户会话中断时间为 600 秒
# 即当数据传输结束后，用户连接 FTP 服务器的时间不应超过 600 秒。可以根据实际情况对该值进行修改
#idle_session_timeout=600
# 设置数据连接超时时间，该语句表示数据连接超时时间为 120 秒，可根据实际情况对其个修改
#data_connection_timeout=120
# 运行 vsftpd 需要的非特权系统用户，缺省是 nobody
#nopriv_user=ftpsecure
# 是否识别异步 ABOR 请求。
# 如果 FTP client 会下达 “async ABOR” 这个指令时，这个设定才需要启用
# 而一般此设定并不安全，所以通常将其注释
#async_abor_enable=YES
# 是否以 ASCII 方式传输数据。默认情况下，服务器会忽略 ASCII 方式的请求。
# 启用此选项将允许服务器以 ASCII 方式传输数据
# 不过，这样可能会导致由 "SIZE /big/file" 方式引起的 DoS 攻击
#ascii_upload_enable=YES
#ascii_download_enable=YES
# 登录 FTP 服务器时显示的欢迎信息
# 如有需要，可在更改目录欢迎信息的目录下创建名为 .message 的文件，并写入欢迎信息保存后
#ftpd_banner=Welcome to blah FTP service.
# 黑名单设置。可以阻止某些特殊的 email address 链接
#deny_email_enable=YES
# 当上面的 deny_email_enable=YES 时，可以利用这个设定项来规定哪些邮件地址不可登录 vsftpd 服务器
# 此文件需用户自己创建，通常情况下为一行一个 email address
#banned_email_file=/etc/vsftpd/banned_emails
# 用户登录 FTP 服务器后是否具有访问自己目录以外的其他文件的权限
# 设置为 YES 时，用户被锁定在自己的 home 目录中，vsftpd 将在下面 chroot_list_file 选项值的位置寻找 chroot_list 文件
# 必须与下面的设置项配合
#chroot_list_enable=YES
# 被列入此文件的用户，在登录后将不能切换到自己目录以外的其他目录
# 从而有利于 FTP 服务器的安全管理和隐私保护。此文件需自己建立
#chroot_list_file=/etc/vsftpd/chroot_list
# 是否允许递归查询。默认为关闭，以防止远程用户造成过量的 I/O
#ls_recurse_enable=YES
# 是否允许监听。
# 如果设置为 YES，则 vsftpd 将以独立模式运行，由 vsftpd 自己监听和处理 IPv4 端口的连接请求
listen=NO
# 设定是否支持 IPV6
listen_ipv6=YES
# 设置 PAM 外挂模块提供的认证服务所使用的配置文件名，即 /etc/pam.d/vsftpd 文件
# 此文件 中file=/etc/vsftpd/ftpusers 字段，说明了 PAM 模块能抵挡的帐号内容来自文件 /etc/vsftpd/ftpusers 中
pam_service_name=vsftpd
# 是否允许 ftpusers 文件中的用户登录 FTP 服务器，默认为 YES
# 若此项设为 YES，则 user_list 文件中的用户允许登录 FTP 服务器
# 而如果同时设置了userlist_deny=YES，则 user_list 文件中的用户将不允许登录 FTP 服务器，甚至连输入密码提示信息都没有
userlist_enable=YES
```

`/etc/vsftpd/ftpusers` 这个文件是禁止使用 vsftpd 的用户列表文件。记录不允许访问 FTP 服务器的用户名单，一般把一些对系统安全有威胁的用户账号记录在此文件中，以免用户从 FTP 登录后获得大于上传下载操作的权利，而对系统造成损坏。其默认值为：

![默认值截图](http://cdn.codeover.cn/img/image-20220530230942689.png-imageFop)

`/etc/vsftpd/user_list` 文件是允许或禁止使用 vsftpd 的用户列表文件。这个文件中指定的用户缺省情况（即在 `/etc/vsftpd/vsftpd.conf` 中设置 `userlist_deny=YES`）下也不能访问 FTP 服务器，在设置了 `userlist_deny=NO` 时,仅允许 `user_list` 中指定的用户访问 FTP 服务器。

## 用户访问模式

vsftpd 服务访问模式有三种，分别是：匿名用户、系统用户和虚拟用户

### 匿名用户模式

匿名模式即 FTP 服务器建立一个公开账户 (一般为 anonymous)，并赋予该账户访问公共目录的权限（默认为 `/var/ftp/pub`），该模式适合只在内网使用或公开文件的场景使用。默认情况下，匿名用户只有查看权限，无法创建、删除、修改。如果想要允许匿名用户能够上传、下载、删除文件，需在 `/etc/vsftpd/vsftpd.conf` 配置文件中修改：

```yaml
anon_upload_enable=YES      # 允许匿名用户上传文件；
anon_mkdir_write_enable=YES # 允许匿名用户创建目录；
anon_other_write_enable=YES # 允许匿名用户其他写入权限。
```

vsftpd 默认的匿名用户有两个：`anonymous` 与 `ftp` ，所以如果需要使用匿名用户上传、删除文件需要 `anonymous` 用户对 `/var/ftp/pub` 目录有写入权限：

```bash
chown -R ftp /var/ftp/pub/
```

### 系统用户模式

如果在非内网情况下，匿名模式可以让任何人使用 ftp 服务，比较公开，多适用于共享文件。如果只想要部分特定用户使用，就需要使用系统用户登录访问，这种模式我们需要创建不同的用户：

```bash
groupadd www # 创建用户组
useradd -g www www -s /sbin/nologin # 创建用户
```

参数说明：

- `groupadd` 创建对应的用户组，参数 `www` 即创建的组名
- `useradd` 创建用户
  - `-g www` 指定用户组，`www` 即为指定的用户组名
  - `www` 指定本次创建的用户名
  - `-s /sbin/nologin` 禁止用户通过 `ssh` 登录系统

然后需要修改配置文件（`/etc/vsftpd/vsftpd.conf`）：

```yaml
anonymous_enable=NO   # 禁止匿名用户登录
chown_uploads=NO      # 设定禁止上传文件更改宿主
nopriv_user=ftptest   # 设定支撑 vsftpd 服务的宿主用户为新建用户
ascii_upload_enable=YES
ascii_download_enable=YES # 设定支持 ASCII 模式的上传和下载功能。
userlist_enable=YES
userlist_deny=NO
```

然后修改 `/etc/vsftpd/user_list` 文件，将新建(或原有)的用户添加到文件的最后一行，这种模式下，登录 FTP 后访问的就是 `/home/www/`，即为当前用户的家目录

### 虚拟用户配置

TODO
