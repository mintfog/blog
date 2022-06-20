---
title: php原生socket实现websocket
date: 2022-06-20
keywords: php,php原生socket,socket,通讯,服务端与客户端通讯,linux,socket原理,数据互通,系列文章,websocket
summary:  webSocket 协议是一种网络通信协议，在 2008 年诞生，2011 年成为国际标准，RFC6455定义了它的通信标准，如今所有浏览器都已支持了该协议
description: 本文介绍socket的原理与使用php原生方式的简单实现，php原生socket从入门到实战websocket聊天室，webSocket 协议是一种网络通信协议，全双工网络通信协议，html5支持，所有浏览器都兼容了此协议
tags:
- php
- socket
categories: socket
---

## 前言

这是一篇系列文章，文章列表：

1. [php原生socket实现客户端与服务端数据传输](https://www.codeover.cn/php-socket/)
2. [php原生socket之IO多路复用以及实现web服务器](https://www.codeover.cn/php-socket-http/)
3. php原生socket实现websocket

### websocket介绍

webSocket 协议是一种网络通信协议，在 2008 年诞生，2011 年成为国际标准，[RFC6455](https://datatracker.ietf.org/doc/html/rfc6455) 定义了它的通信标准，如今所有浏览器都已支持了该协议。webSocket 是 HTML5 开始提供的一种在单个 TCP 连接上进行全双工[^1]通讯的协议，服务器可以主动向客户端推送消息，客户端也可以主动向服务端发送消息。
webSocket 约定了一个通信协议的规范，通过握手机制，客户端（浏览器）和服务器（webserver）之间能建立一个类似 tcp 的连接，从而方便 cs 通信。

### 为什么需要websocket

HTTP 协议是一种无状态的、无连接的、单向的应用层协议。它采用了 `请求 => 响应` 模型，通信请求仅能由客户端发起，服务端对请求做出应答处理，这种通信模型有一个弊端：无法实现服务端主动向客户端发起消息。传统的 HTTP 请求，其并发能力都是依赖同时发起多个 TCP 连接访问服务器实现的而 websocket 则允许我们在一条 ws 连接上同时并发多个请求，即在 A 请求发出后 A 响应还未到达，就可以继续发出 B 请求。由于 TCP 的慢启动特性，以及连接本身的握手损耗，都使得 websocket 协议的这一特性有很大的效率提升。

<img src="https://cdn.codeover.cn/img/image-20220618222456220.png-imageFop" alt="http与websocket对比" style="zoom:67%;" />

### 特点

1. 建立在 TCP 协议之上，服务端的实现相对比较容易
2. 与 HTTP 协议有良好的兼容性，默认端口也是 80 和 443，并且握手阶段采用 HTTP 协议，因此握手时不容易被屏蔽，能通过各种 HTTP 代理服务器。
3. 数据格式比较轻量，性能开销小，通信高效。
4. 可以发送文本，也可以发送二进制数据。
5. 没有同源限制，客户端可以与任意服务器进行通信。
6. 协议标识符是 ws（如果加密则为 wss），服务地址就是 URL。

## PHP实现websocket

### 客户端与服务端握手

websocket 协议在连接前需要握手[^2]，通常握手方式有以下几种方式

- 基于 flash 的握手协议（不建议）

- 基于 md5 加密方式的握手协议

  较早的握手方法，有两个 key，使用 md5 加密

- 基于 sha1 加密方式的握手协议

  当前主要的握手协议，本文将以此协议为主

  1. 获取客户端上报的 `Sec-WebSocket-key`
  2. 拼接 `key` + `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`
  3. 对字符串做 `SHA1` 计算，再把得到的结果通过 `base64` 加密，最后再返回给客户端

客户端请求信息如下：

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Origin: http://example.com
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13
```

客户端需返回如下数据：

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Sec-WebSocket-Version: 13
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

我们根据此协议通过 PHP 方式实现：

```php
<?php

$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, true);
socket_bind($socket, 0, 8888);
socket_listen($socket);

while (true) {
    $conn_sock = socket_accept($socket);
    $request = socket_read($conn_sock, 102400);

    $new_key = getShaKey($request);

    $response = "HTTP/1.1 101 Switching Protocols\r\n";
    $response .= "Upgrade: websocket\r\n";
    $response .= "Sec-WebSocket-Version: 13\r\n";
    $response .= "Connection: Upgrade\r\n";
    $response .= "Sec-WebSocket-Accept: {$new_key}\r\n\r\n";

    socket_write($conn_sock, $response);
}

function getShaKey($request)
{
    // 获取 Sec-WebSocket-key
    preg_match("/Sec-WebSocket-Key: (.*)\r\n/", $request, $match);

    // 拼接 key + 258EAFA5-E914-47DA-95CA-C5AB0DC85B11
    $new_key = trim($match[1]) . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

    // 对字符串做 `SHA1` 计算，再把得到的结果通过 `base64` 加密
    return base64_encode(sha1($new_key, true));
}
```

相关语法解释可参考 [之前的文章](https://www.codeover.cn/php-socket/#%E8%AF%AD%E6%B3%95%E8%A7%A3%E9%87%8A)，本文章不做详细介绍。

使用前端测试，打开我们的任意浏览器控制台（console）输入以下内容，返回的 websocket 对象的 readyState 为 1 即为握手成功，此为前端内容，本文不多做介绍，详情可参考 [菜鸟教程](https://www.runoob.com/html/html5-websocket.html)：

```javascript
console.log(new WebSocket('ws://192.162.2.166:8888'));
// 运行后返回：
WebSocket {
    binaryType: "blob"
    bufferedAmount: 0
    extensions: ""
    onclose: null
    onerror: null
    onmessage: null
    onopen: null
    protocol: ""
    readyState: 1
    url: "ws://192.162.2.166:8888/"
}
```

### 发送数据与接收数据

使用 websocket 协议传输协议需要遵循特定的格式规范，详情请参考 https://datatracker.ietf.org/doc/html/rfc6455#section-5.2

![发送数据与接收数据](https://cdn.codeover.cn/img/image-20220619231347489.png-imageFop)

为了方便，这里直接贴出加解密代码，以下代码借鉴与 [workerman](https://github.com/walkor/workerman/) 的 `src/Protocols/Websocket.php` 文件：

```php
// 解码客户端发送的消息
function decode($buffer)
{
    $len = \ord($buffer[1]) & 127;
    if ($len === 126) {
        $masks = \substr($buffer, 4, 4);
        $data = \substr($buffer, 8);
    } else {
        if ($len === 127) {
            $masks = \substr($buffer, 10, 4);
            $data = \substr($buffer, 14);
        } else {
            $masks = \substr($buffer, 2, 4);
            $data = \substr($buffer, 6);
        }
    }
    $dataLength = \strlen($data);
    $masks = \str_repeat($masks, \floor($dataLength / 4)) . \substr($masks, 0, $dataLength % 4);
    return $data ^ $masks;
}

// 编码发送给客户端的消息
function encode($buffer)
{
    if (!is_scalar($buffer)) {
        throw new \Exception("You can't send(" . \gettype($buffer) . ") to client, you need to convert it to a string. ");
    }
    $len = \strlen($buffer);

    $first_byte = "\x81";

    if ($len <= 125) {
        $encode_buffer = $first_byte . \chr($len) . $buffer;
    } else {
        if ($len <= 65535) {
            $encode_buffer = $first_byte . \chr(126) . \pack("n", $len) . $buffer;
        } else {
            $encode_buffer = $first_byte . \chr(127) . \pack("xxxxN", $len) . $buffer;
        }
    }

    return $encode_buffer;
}
```

我们修改刚才 [客户端与服务端握手](#客户端与服务端握手) 阶段的代码，修改后全代码全文如下，该段代码实现了将客户端发送的消息转为大写后返回给客户端（当然只是为了演示）：

```php
<?php

$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, true);
socket_bind($socket, 0, 8888);
socket_listen($socket);

while (true) {
    $conn_sock = socket_accept($socket);
    $request = socket_read($conn_sock, 102400);

    $new_key = getShaKey($request);

    $response = "HTTP/1.1 101 Switching Protocols\r\n";
    $response .= "Upgrade: websocket\r\n";
    $response .= "Sec-WebSocket-Version: 13\r\n";
    $response .= "Connection: Upgrade\r\n";
    $response .= "Sec-WebSocket-Accept: {$new_key}\r\n\r\n";

    // 发送握手数据
    socket_write($conn_sock, $response);

    // 新增内容，获取客户端发送的消息并转为大写还给客户端
    $msg = socket_read($conn_sock, 102400);
    socket_write($conn_sock, encode(strtoupper(decode($msg))));
}

function getShaKey($request)
{
    // 获取 Sec-WebSocket-key
    preg_match("/Sec-WebSocket-Key: (.*)\r\n/", $request, $match);

    // 拼接 key + 258EAFA5-E914-47DA-95CA-C5AB0DC85B11
    $new_key = trim($match[1]) . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

    // 对字符串做 `SHA1` 计算，再把得到的结果通过 `base64` 加密
    return base64_encode(sha1($new_key, true));
}

function decode($buffer)
{
    $len = \ord($buffer[1]) & 127;
    if ($len === 126) {
        $masks = \substr($buffer, 4, 4);
        $data = \substr($buffer, 8);
    } else {
        if ($len === 127) {
            $masks = \substr($buffer, 10, 4);
            $data = \substr($buffer, 14);
        } else {
            $masks = \substr($buffer, 2, 4);
            $data = \substr($buffer, 6);
        }
    }
    $dataLength = \strlen($data);
    $masks = \str_repeat($masks, \floor($dataLength / 4)) . \substr($masks, 0, $dataLength % 4);
    return $data ^ $masks;
}

function encode($buffer)
{
    if (!is_scalar($buffer)) {
        throw new \Exception("You can't send(" . \gettype($buffer) . ") to client, you need to convert it to a string. ");
    }
    $len = \strlen($buffer);

    $first_byte = "\x81";

    if ($len <= 125) {
        $encode_buffer = $first_byte . \chr($len) . $buffer;
    } else {
        if ($len <= 65535) {
            $encode_buffer = $first_byte . \chr(126) . \pack("n", $len) . $buffer;
        } else {
            $encode_buffer = $first_byte . \chr(127) . \pack("xxxxN", $len) . $buffer;
        }
    }

    return $encode_buffer;
}
```

使用 [在线测试工具](http://www.websocket-test.com/) 进行测试，可以看到消息已经可以正常发送接收，接下来的文章将继续优化代码，实现简易聊天室，敬请关注：

![测试截图](https://cdn.codeover.cn/img/GIF2022-6-2023-53-02.gif-imageFop)

[^1]:是通讯传输的一个术语。 通信允许数据在两个方向上同时传输，它在能力上相当于两个单工通信方式的结合
[^2]:  为了建立 websocket 连接，需要通过浏览器发出请求，之后服务器进行回应，这个过程通常称为“握手”（Handshaking）

