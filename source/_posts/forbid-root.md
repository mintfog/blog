---
title: linux 禁止 root 登录与密钥登录配置
date: 2022-06-04
summary:  为了安全起见，生产环境服务器通常禁止 root 用户的 ssh 连接，我们实际使用普通用户去连接，连接之后切换到 root 执行命令或使用 sudo 执行命令
keywords: linux,linux禁止root登录,sudo,服务器安全,sudo配置,密钥登录,子账户登录
tags:
- linux
categories: linux
---

为了安全起见，生产环境服务器通常禁止 root 用户的 ssh 连接，这通常是防止服务器被暴力破解，我们实际使用普通用户去连接，然后切换到 root 执行命令或使用 sudo 执行命令。

## 禁止root登录

1. 创建子用户

   在禁止 root 登录前，必须确保已经创建了一个子用户，尝试链接并登录成功，新增用户命令如下，其中 test 为新建的用户名：

   ```bash
   useradd test # 添加用户
   passwd test # 设置用户密码
   ```

2. 修改 ssh 配置文件

   ssh 配置文件位于 `/etc/ssh/sshd_config`，我们可使用 `vim` 等工具修改，在文件中修改 `PermitRootLogin yes` 为 `PermitRootLogin no` 即可

3. 重启 ssh

   ```bash
   service sshd restart
   ```


4. 修改 root 密码

   如果你之前是使用密钥方式登录的 root 账户，此时务必重设一下 root 密码以防因遗忘密码导致无法切换至 root 账户

## 设置密钥登录

在上一步中我们已经禁用了 root 用户的 ssh 登录，但依然存在被暴力破解的可能性，此时我们就可以设置只允许通过密钥方式登录，并且可以将对应的公钥复制到多台服务器，实现一个私钥管理多台服务器的目的。

1. 制作密钥对

   使用如下命令生成密钥对，如果已经有对应的密钥对可跳过此步骤：
   
   ```bash
   ssh-keygen
   ```

   ![制作密钥对示例截图](https://cdn.codeover.cn/img/image-20220604222022292.png-imageFop)
   
   

2. 在服务器中安装公钥

   如果你是通过上一步骤生成的密钥对，使用如下方式安装，如果自定义了生成路径，需将 `~/.ssh/id_rsa.pub` 替换为对应路径：

   ```bash
   cd ~/.ssh
   cat ~/.ssh/id_rsa.pub > authorized_keys
   ```

   如果已经之前已经有了对应的密钥对，将公钥内容上传至服务器并改名为 `~/.ssh/authorized_keys`

3. 修改 ssh 配置文件

   使用 vim 等编辑器编辑 ssh 配置文件 `/etc/ssh/sshd_config`：

   ```diff
   - #PubkeyAuthentication yes
   + RSAAuthentication yes
   + PubkeyAuthentication yes
   ```

4. 下载私钥至客户端

   ```bash
   yum install lrzsz -y
   sz ~/.ssh/id_rsa
   ```

   为了安全起见，将文件妥善保存后，删除服务器内的私钥文件

   ```bash
   rm -f ~/.ssh/id_rsa
   ```
   
5. 重启 ssh

   ```bash
   service sshd restart
   ```

6. 禁用密码登录

   在完成以上步骤后，使用密钥进行连接测试，确认无误后即可禁止密码方式登录，修改配置文件 `/etc/ssh/sshd_config`：
   
   ```diff
   # To disable tunneled clear text passwords, change to no here!
   #PasswordAuthentication yes
   #PermitEmptyPasswords no
   - PasswordAuthentication yes
   + PasswordAuthentication no
   ```

## sudo 配置

在上文中我们介绍了禁止 root 用户登录与密钥登录的配置，但我们执行一些操作时就需要切换至 root 用户，这会造成一定的误操作风险，此时我们就可以配置 sudo 实现不切换 root 操作一些系统命令，sudo 的主要配置文件位于 `/etc/sudoers`，可使用 vim 等编辑该文件

其主要语法为：

```
test ALL=(ALL) NOPASSWD: ALL
```

- `test` 指定对应用户名或用户组名，如果填写的是用户组，则需要在前添加 `%`，例如：`%test`

- `ALL=(ALL)` 指定该用户或用户组可执行的命令，其中 `(ALL)` 代表该用户或组可执行所有命令，如需指定可执行的命令，将其替换为想让该用户执行的命令即可，多条命令用 `,` 分隔。例如：`ALL=/etc/init.d/mysqld,/etc/init.d/tengine,/etc/init.d/php81 restart`
- `NOPASSWD: ALL` 该项为可选项，指定执行哪些命令可以不确定执行者密码，语法与上一项一致，如果配置此项，则上一项必须配置为 `ALL=(ALL)`，否则在执行 sudo 时会报错

> 注意：如果使用 vim 编辑该文件，在保存时需要添加 `!`，如：`:wq!`