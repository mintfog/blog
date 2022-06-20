---
title: php原生socket之IO多路复用以及实现web服务器
date: 2022-06-17
keywords: php,php原生socket,socket,通讯,服务端与客户端通讯,linux,socket原理,数据互通,系列文章,websocket,多路复用,php实现http服务器
summary:  实现网络进程之间的通信，几乎所有应用程序都是采用 socket，socket是应用层与 TCP/IP 协议族通信的中间抽象层，它是一组接口
description: 本文介绍php原生socket之IO多路复用以及实现web服务器简单实现，系列文章：php原生socket从入门到实战websocket聊天室，实现网络进程之间的通信，几乎所有应用程序都是采用 socket，socket是应用层与 TCP/IP 协议族通信的中间抽象层，它是一组接口。
tags:
- php
- socket
categories: socket
updated: 2022-06-20
---

## 前言

这是一篇系列文章，文章列表：

1. [php原生socket实现客户端与服务端数据传输](https://www.codeover.cn/php-socket/)
2. php原生socket之IO多路复用以及实现web服务器
3. [php原生socket实现websocket](https://www.codeover.cn/php-socket-http/php-socket-websocket)

## 多路复用

[前文](https://www.codeover.cn/php-socket/) 通过原生 socket 实现了简单的服务端与客户端通信，但当有多个客户端连接时，服务端仅能处理第一个客户端的请求，而无法对后续客户端服务

![服务端未正确处理截图](https://cdn.codeover.cn/img/image-20220615231853841.gif-imageFop)

产生这种情况的原因是因为IO模型是阻塞的，同一时刻只能由一个客户端进行访问，解决此问题主要有两种解决方案：

1. 多进程，即在服务端启动多个进程监听
2. IO多路复用机制，简单来说实现了 N 个客户端使用一根网线同时访问

同时多路复用又分为两个不同的模型，即 `select` 与 `epoll`，常见的软件中，`Apache` 使用了 `select` 模型，`nginx` 则使用 `epoll` 模型。在 php 中内置了 `select` 模型，对应的函数为 `socket_select`，多路复用是实现 http 服务器的基础

### 语法

在前文中我们介绍了 php 原生 socket 内置了 `socket_select` 函数实现了 `select` 模型，其语法如下：

```php
socket_select(
    array &$read,
    array &$write,
    array &$except,
    int $seconds [,
    int $microseconds = 0]
): int|false
```

#### 参数

- `read` 

  服务端监听的套接字资源，当他有变化（即收到新的消息或有客户端连接、断开）时，`socket_select` 函数才会返回（否则继续阻塞），同时修改该变量为当前发生事件（收到消息或有客户端连接、断开）的套接字资源列表，并继续向下执行。

- `write`

  监听是否有客户端写数据，传入 `null` 则代表不关心是否有写变化

- `except`

  套接字内要排除的元素，传入 `null` 是 「监听」 全部

- `seconds`

  秒和微秒一起构成超时参数。如果传入 `null` 则会阻塞，为 0 非阻塞，如果是 >0 则为最大阻塞时间

- `microseconds`

### 优化

我们在 [上篇文章](https://www.codeover.cn/php-socket/#%E5%BF%AB%E9%80%9F%E4%BD%93%E9%AA%8C) 简单实现了 socket 服务端监听与客户端的连接，接下来我们在服务端监听代码的基础上通过多路复用优化代码：

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

$sockets[] = $socket;

while (true) {
    $tmp_sockets = $sockets;
    socket_select($tmp_sockets, $write, $except, null);

    foreach ($tmp_sockets as $sock) {
        // 如果当前套接字等于 socket_create 创建的套接字，说明是有新的连接或有新的断开连接
        if ($sock == $socket) {
            $conn_sock = socket_accept($socket);
            $sockets[] = $conn_sock;
            socket_getpeername($conn_sock, $ip, $port);
            echo '请求ip: ' . $ip . '端口: ' . $port . PHP_EOL;
        } else { // 否则说明是之前连接的客户端发来消息
            $msg = socket_read($sock, 10240);
            socket_write($sock, strtoupper($msg));
            echo $msg;
        }
    }
}
```

在本示例中 `socket_select` 函数会阻塞当前进程，当 `$tmp_sockets` 数组内的 socket 资源有新的客户端连接或断开或收到新消息时，会将 `$tmp_sockets` 数组修改为当前活跃的 socket 资源，随后通过遍历该数组处理业务逻辑

![优化结果截图](https://cdn.codeover.cn/img/GIF2022-6-1523-25-48.gif-imageFop)

## 使用socket实现简易http服务器

http 协议是在 socket 的基础上规定了指定的数据格式，所以我们只需在 `socket_write` 时按照格式发送数据，浏览器就可正常响应请求

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

$sockets[] = $socket;

while (true) {
    $tmp_sockets = $sockets;
    socket_select($tmp_sockets, $write, $except, null);

    foreach ($tmp_sockets as $sock) {
        if ($sock == $socket) {
            $conn_sock = socket_accept($socket);
            $sockets[] = $conn_sock;
        } else {
            $msg = socket_read($sock, 10240);
            var_dump($msg);
            if ($msg == '') return;
            
            $output = '<h1>this is php worker</h1>';
            $len = strlen($output);
            
            $response = "HTTP/1.1 200 OK\r\n";
            $response .= "content-type: text/html\r\n";
            $response .= "server: php socket\r\n";
            $response .= "Content-Length: {$len}\r\n\r\n";
            
            $response .= $output;

            socket_write($sock, $response);
        }
    }
}
```

在服务端运行此示例，随后在浏览器访问 `ip:8888` ，可以看到如下：

<img src="https://cdn.codeover.cn/img/image-20220616235259254.png-imageFop" alt="浏览器访问截图" style="zoom:50%;" />

同时服务端会输出如下内容：

```http
GET / HTTP/1.1
Host: 124.222.**.**:8888
Connection: keep-alive
Cache-Control: max-age=0
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: jenkins-timestamper-offset=-28800000; _ga=GA1.1.1403944751.1652010033; _ga_2GM6102E19=GS1.1.1652802985.7.1.1652803014.0
```

该内容即为用户端请求原始数据，可解析此数据并根据请求做出响应，比如使用 `file_get_content` 读取指定文件内容返回给浏览器
