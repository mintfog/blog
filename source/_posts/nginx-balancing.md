---
title: Nginx 负载均衡配置
date: 2022-05-03 17:11:20
summary:  在现实的应用场景中，一台后端服务器出现单点故障的概率很大或者单台机器的吞吐量有限，无法承担过多请求，这时候就需要在 nginx 后端配置多台服务器，利用 nginx 内置的规则将请求转发至不同的后端机器上。
keywords: Nginx,Nginx 负载均衡配置,linux,服务器搭建,反向代理,负载均衡
tags:
- linux
- Nginx
categories: nginx
---

在现实的应用场景中，一台后端服务器出现单点故障的概率很大或者单台机器的吞吐量有限，无法承担过多请求，这时候就需要在 nginx 后端配置多台服务器，利用 nginx 内置的规则将请求转发至不同的后端机器上。

## 负载均衡常用算法

### 1. 轮询

轮询为负载均衡中较为基础也较为简单的算法，它不需要配置额外参数。该算法会遍历服务器节点列表，并按节点次序每轮选择一台服务器处理请求。当所有节点均被调用过一次后，该算法将从第一个节点开始重新一轮遍历。

特点：由于在该算法中每个请求按请求时间顺序逐一分配到不同的服务器处理，因此适用于服务器性能相近的情况下使用，其中每个服务器承载了相同的负载。但对于服务器性能不同的服务器而言，该算法会引发资源分配不合理等问题。

用法：

```nginx
...
http {
    upstream testServer { # 定义负载服务器列表
      server ip:port; # ip 为负载服务器 port 为端口 缺省为80
      server ip:port;
      server ip:port;
    }
    
    server {
        ...
        location / {
          proxy_pass http://testServer; # testServer 为上方定义的服务器集群
        }
    }
}
```

### 2. 加权轮询

为了避免轮询带来的弊端，加权轮询应运而生。在每个服务器后添加 `weight` 即为加权轮询，一般情况下，`weight` 的值越大分配到的请求就越多，对应的性能也更好。

特点：加权轮询可以应用于服务器性能不等的集群中，使资源分配更加的合理化。

用法：

```nginx
...
http {
    upstream testServer {
      server ip:port weight=2; # weight 为对应的权重 权重越高分配到的请求越多
      server ip:port weight=8;
      server ip:port weight=10;
    }
    
    server {
        ...
        location / {
          proxy_pass http://testServer; # testServer 为上方定义的服务器集群
        }
    }
}
```

### 3. IP 哈希（IP hash）

`ip_hash` 根据发出请求的 IP 的 `hash` 值来分配对应服务器，该方式可使同 IP 发出的请求转发到同一服务器，或具有相同 `hash` 值的不同 IP  转发到同一个服务器。

特点：该算法可在一定程度上保证同一用户分配到的是同一服务器，并在一定程度上可解决集群部署环境下 Session 不共享的问题

用法：

```nginx
...
http {
    upstream testServer {
      ip_hash; # 定义使用 ip_hash 算法
      server ip:port weight=2; # weight 为对应的权重 权重越高分配到的请求越多
      server ip:port weight=8;
      server ip:port weight=10;
    }
    
    server {
        ...
        location / {
          proxy_pass http://testServer; # testServer 为上方定义的服务器集群
        }
    }
}
```

### 4. URL 哈希（URL hash）

`url_hash` 是根据请求的 URL 的 hash 值来分配服务器。该算法的特点是，相同 URL 的请求会分配给固定的服务器，当存在缓存的时候，效率一般较高。然而 Nginx 默认不支持这种负载均衡算法，需要依赖第三方库。

### 5. 最小连接数（Least Connections）

假设共有 N 台服务器，当有新的请求出现时，遍历服务器节点列表并选取其中连接数最小的一台服务器来响应当前请求。连接数可以理解为当前正在处理的请求数量。

## 总结

Nginx 作为一款优秀的反向代理服务器，可以通过不同的负载均衡算法来解决请求量过大情况下的服务器资源分配问题。较为常见的负载均衡算法有轮询、加权轮询、IP 哈希等等，可分别应对不同的请求场景。
