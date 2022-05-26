---
title: 微信小程序反编译，获取小程序源代码
date: 2022-05-06 17:05:26
summary:  微信小程序反编译，获取小程序源代码, 刚度过了愉快又短暂的五一小长假，开工第一天，直接就被封印在家了，放假前清楚的记得把要上线的代码提交了，但提交是真提交了，却忘记了 push，功能又很着急上线。这就很头大，还好节前提测时上传了体验版，只能尝试着反编译取出代码来渡过难关了。
keywords: wechat,Decompilation,反编译,wechat mini,微信小程序,反编译
updated: 2022-05-26 21:36:00
---

刚度过了愉快又短暂的五一小长假，开工第一天，直接就被封印在家了:sweat_smile:，放假前清楚的记得把要上线的代码提交了，但提交是真提交了，却忘记了 `push`:sob:，功能又很着急上线。这就很头大，还好节前提测时上传了体验版，只能尝试着反编译取出代码来渡过难关了。

## 安装 nodejs

这点就不过多赘述了，应该没人不会吧:grinning:

## 下载工具

度盘下载：https://pan.baidu.com/s/1Uq4RhT8YrZ9ir19LTs7vUg?pwd=h6gv

github下载：https://github.com/xuedingmiaojun/wxappUnpacker

## 开始反编译

1. 在刚刚下载的工具目录直接运行 `npm install`
2. 获取小程序包，首先打开一次小程序，安卓一般储存在 `http://data/data/com.tencent.mm/MicroMsg/32位字符串/appbrand/pkg/` 目录中，文件是以 `wxapkg` 为后缀名，需要 root 权限才能获取到。电脑端的目录是 `微信文件储存路径\Applet\小程序appid\两位数字\__APP__.wxapkg`，很好找，微信文件储存路径即微信设置中设置得到文件储存位置
3. 复制 `wxapkg` 到工具目录，运行 `node wuWxapkg.js __APP__.wxapkg` 即可解密，解密后的文件存放在 `__APP__` 目录

## 总结

反编译后的文件是混淆过的，只能凑活着先用，长期运行还是要回公司拿到源代码才行的。

更详细的使用方法查看工具目录的 `README` 文件