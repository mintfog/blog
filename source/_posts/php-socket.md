---
title: php原生socket实现客户端与服务端数据传输
date: 2022-06-14
keywords: php,php原生socket,socket,通讯,服务端与客户端通讯,linux,socket原理,数据互通,系列文章,websocket
summary:  实现网络进程之间的通信，几乎所有应用程序都是采用 socket，socket是应用层与 TCP/IP 协议族通信的中间抽象层，它是一组接口
description: 本文介绍socket的原理与使用php原生方式的简单实现，系列文章：php原生socket从入门到实战websocket聊天室，实现网络进程之间的通信，几乎所有应用程序都是采用 socket，socket是应用层与 TCP/IP 协议族通信的中间抽象层，它是一组接口。
tags:
- php
- socket
categories: socket
---



## socket介绍

实现网络进程之间的通信，几乎所有应用程序都是采用 socket，socket是应用层与 TCP/IP 协议族通信的中间抽象层，它是一组接口。在设计模式中，socket其实是一个门面模式，它把复杂的 TCP/IP 协议族隐藏在 socket 接口后面，对用户来说，一局简单的接口就是全部，让 socket 去阻止数据，以符合指定的协议

![socket流程图](https://cdn.codeover.cn/img/socket_flow_chart.jpg-imageFop)

socket 的英文原意是 「孔」或「插座」，通常也被称作「套接字」，用于描述 IP 地址和端口，是一个通信链的句柄，可以用来实现不同虚拟机或不同计算机之间的通信。

socket 链接的三个过程

1. 服务端监听：IP+端口号
2. 客户端请求：发出向服务端的 IP 以及端口的连接请求
3. 链接确认：服务端套接字监听到或者说接收到客户端套接字连接请求，他就会建立一个新的进程，把服务端的套接字描述发给客户端，以响应客户端的请求，一旦客户端确认了此描述，连接就建立好了。儿服务端的套接字继续处于监听状态，继续接受其他客户端套接字的连接请求。

![建立连接过程](https://cdn.codeover.cn/img/image-20220613231853841.png-imageFop)

## php实现socket

如果需要在 php 中使用 socket，则需要在编译 php 是添加 `--enable-sockets` 配置项来启用，可使用 `php -m|grep sockets` 命令检查启用情况，具体编译过程可参考 [这篇文章](https://www.codeover.cn/centos-install-php/)

### 快速体验

服务端与客户端简略代码如下，运行后服务端会阻塞等待客户端连接，客户端会在控制台要求输入内容，输入后信息会在服务端打印，同时客户端显示转为大写的内容，此示例服务端与客户端运行在一台服务器：

#### 服务端监听

```php
<?php

// 创建套接字
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);

// 设置 ip 被释放后立即可使用
socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, true);

// 绑定ip与端口
socket_bind($socket, 0, 8888);

// 开始监听
socket_listen($socket);

while (true) {
    // 接收内容
    $conn_sock = socket_accept($socket);
    socket_getpeername($conn_sock, $ip, $port);
    // echo '请求ip: ' . $ip . PHP_EOL . '端口: ' . $port;

    while (true) {
        // 获取消息内容
        $msg = socket_read($conn_sock, 10240);
        // TODO 处理业务逻辑

        // 将信息转为大写并原样返回客户端
        socket_write($conn_sock, strtoupper($msg));

        echo $msg;
    }
}
```

#### 客户端连接

```php
<?php

// 创建套接字
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);

// 连接服务端
socket_connect($socket, '127.0.0.1', 8888);

while (true) {
    // 让控制台输入内容
    fwrite(STDOUT, '请输入内容：');
    $in = fgets(STDIN);

    // 向服务端发送内容
    socket_write($socket, $in);

    // 读取服务端发送的消息
    $msg = socket_read($socket, 10240);
    echo $msg;
}
```

### 语法解释

#### socket_create

```php
socket_create(int $domain,int $type, int $protocol): resource|false
```

创建并返回一个套接字资源，通常也称作一个通讯节点。一个典型的 socket 由至少 2 个套接字组成，其中一个运行在客户端，一个运行在服务端。

参数：

- `domain` 指定当前套接字使用什么协议，可用协议如下：

  | Domain   | 描述                                     |
  | -------- | ---------------------------------------- |
  | AF_INET  | IPv4 网络协议，TCP 与 UDP 都可使用此协议 |
  | AF_INET6 | IPv6 网络协议，TCP 与 UDP 都可使用此协议 |
  | AF_UNIX  | 本地通讯协议，具有高性能与低成本的 IPC   |

- `type` 用户指定当前套接字使用的类型

  | type           | 描述                                                         |
  | -------------- | ------------------------------------------------------------ |
  | SOCK_STREAM    | 可顺序化的、可靠的、全双工的、基于链接的字节流，支持数据传送流量控制机制。TCP 协议基于这种流式套接字。 |
  | SOCK_DGRAM     | 数据报文的支持（无连接、不可靠、固定最大长度）UDP 协议基于这种报文套接字 |
  | SOCK_SEQPACKET | 可顺序化的、可靠的、全双工的、面向连接的、固定最大长度的数据通信，数据端通过接收每一个数据段来读取整个数据包 |
  | SOCK_RAW       | 读取原始的网络协议，这种特殊的套接字可用于手工构建任意类型的协议，一般使用这个套接字来实现 ICMP 请求 |
  | SOCK_RDM       | 可靠的数据层，但不保证到达顺序，一般的操作系统都未实现此功能 |

- `protocol` 设置指定 domain 套接字下的具体协议，如果所需协议是 TCP 或者 UDP，可以直接使用常量 `SOL_TCP` 或 `SOL_UDP`，这个参数的具体值可通过 `getprotobyname()` 函数获取

返回值

`socket_create()` 正确时返回一个套接字资源，失败时返回 `false`。可以调用 `socket_last_error()` 获取错误码，错误码可以通过 `socket_strerror(int $err_no)` 转换为文字的错误说明。

#### socket_bind

```php
socket_bind(resource $socket, string $address [, int $port]): bool
```

绑定一个地址与端口到套接字

参数：

- `socket` 使用 `socket_create()` 创建的套接字资源

- `address`

  如果套接字是 `AF_INET` 族，那么 `address` 必须是一个四点法的 IP 地址，例如 `127.0.0.1`、`0.0.0.0`

  如果套接字是 `AF_UNIX` 族，那么 `address` 是 Unix 套接字一部分（例如 `/tmp/my.sock` ）

- `port` （可选）

  该参数仅用于使用 `AF_INET` 族时，指定当前套接字监听的端口号

返回值：

绑定成功返回 `true`，失败时则返回 `false`，同 `socket_create` ，在绑定失败时可以调用 `socket_last_error()` 获取错误码，错误码可以通过 `socket_strerror(int $err_no)` 转换为文字的错误说明。

#### socket_listen

```php
socket_listen(resource $socket [, int $backlog]): bool
```

在使用 `socket_create()` 创建套接字并使用 `socket_bind()` 将其绑定到名称之后，可能会告诉它侦听套接字上的传入连接。该函数仅适用于 `SOCK_STREAM` 或 `SOCK_SEQPACKET` 类型的套接字。

参数：

- `socket` 使用 `socket_create()` 创建的套接字资源
- `backlog` 最大数量的积压传入连接将排队等待处理，如果连接请求到达时队列已满，则客户端可能会收到指示为 `ECONNREFUSED` 的错误。或者，如果底层协议支持重传，则可能会忽略该请求，以便重试可能会成功。

返回值：

绑定成功返回 `true`，失败时则返回 `false`，可以调用 `socket_last_error()` 获取错误码，错误码可以通过 `socket_strerror(int $err_no)` 转换为文字的错误说明。

#### socket_accept

```php
socket_accept(resource $socket): resource|false
```

阻塞并监听套接字创建的连接，用户接收客户端请求

参数：

- `socket` 使用 `socket_create()` 创建的套接字资源

返回值：

成功时返回一个新的套接字资源，错误时返回 `false`，可以调用 `socket_last_error()` 获取错误码，错误码可以通过 `socket_strerror(int $err_no)` 转换为文字的错误说明。

#### socket_connect

```php
socket_connect(resource $socket, string $address [, int $port = null]): bool
```

使用套接字实例发起到 `address` 的连接

参数：

- `socket` 该参数必须是由 `socket_create()` 创建的 `socket` 实例

- `address` 

  如果套接字是 `AF_INET` 族，那么 `address` 必须是一个四点法的 IP 地址，例如 `127.0.0.1` 如果支持 IPv6 并且套接字是 `AF_INET6`，那么 `address` 也可以是一个有效的 IPv6 地址（例如 `::1`）

  如果套接字是 `AF_UNIX` 族，那么 `address` 是 Unix 套接字一部分（例如 `/tmp/my.sock` ）

返回值：

成功时返回 `true`， 或者在失败时返回 `false`

#### socket_write

```php
socket_write(resource $socket, string $data [, int $length = null]): int|false
```

传输数据至指定套接字

参数：

- `socket` 使用 `socket_create()` 或 `socket_accept()` 创建的套接字资源

- `data` 要发送的内容

- `length` （可选）

  可以指定发送套接字的替代字节长度。如果这个长度大于实际发送内容的长度，它将被静默地截断为实际发送内容的长度。

返回值：

成功时返回成功发送的字节数，或者在失败时返回 `false`，可以调用 `socket_last_error()` 与 `socket_strerror(int $err_no)` 获取具体错误信息

#### socket_read

```php
socket_read(resource $socket, int $length, int $mode = PHP_BINARY_READ): string|false
```

从套接字资源内读取数据

参数：

- `socket` 使用 `socket_create()` 或 `socket_accept()` 创建的套接字资源（服务端为 `socket_accept()` 客户端为 `socket_create()`）

- `length` 指定最大能够读取的字节数。否则您可以使用 `\r`、`\n`、`\0` 结束读取（根据 `mode` 参数设置）

- `mode` （可选）

  `PHP_BINARY_READ` （默认）- 使用系统的 `recv()` 函数。二进制安全地读取数据。

  `PHP_NORMAL_READ` - 读取到 `\n`、`\r` 时停止。

返回值：

`socket_read()` 返回一个字符串，表示接收到的数据。如果发生了错误（包括远程主机关闭了连接），则返回 `false`，可以调用 `socket_last_error()` 与 `socket_strerror(int $err_no)` 获取具体错误信息

#### socket_close

```php
socket_close(resource $socket): void
```

关闭并销毁一个套接字资源

参数：

- `socket` 使用 `socket_create()` 或 `socket_accept()` 创建的套接字资源

返回值：

无
