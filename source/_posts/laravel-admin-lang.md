---
title: laravel-admin 根据路由自动切换语言包
date: 2022-06-30
keywords: php,laravel,laravel-admin,本地化,语言包,根据路由切换语言包,laravel使用,laravel技巧,多语言文件
summary: laravel 的本地化功能提供了一种方便的方法来检索各种语言的字符串，本文将使用路由名动态切换需要使用的语言包，实现每个控制器单独翻译文件
tags:
- php
- laravel
- 代码速记
categories: 代码速记
---

## 背景

laravel 的本地化功能提供了一种方便的方法来检索各种语言的字符串，从而可以轻松的在应用内支持多种语言，我们一般将语言文件存放在 `lang` 目录下，随后使用 [`__`](https://learnku.com/docs/laravel/9.x/localization/12232#3c3f33) 辅助函数从语言文件检索翻译字符串。同样，laravel-admin 也使用这种方式来实现本地化，但这个目录是公共翻译路径，如果同一个键在不同控制器翻译的结果不一致[^1]情况，将翻译内容直接放置在 `lang` 就会造成一定的歧义[^2]

为了解决此问题，本文介绍根据控制器来区分不同的翻译文件

## 代码部分

`app\Admin\Middleware\SwitchLanguage.php` 

```php
<?php

namespace App\Admin\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;

class SwitchLanguage
{
    /**
     * 根据路由自动切换语言包
     *
     * @param \Illuminate\Http\Request $request
     * @param Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $multi_language = config('admin.multi_language');
        $languages = $multi_language['languages'];
        $current = $multi_language['default'];
        $cookie_name = $multi_language['cookie_name'];
        $cookie_language = Cookie::get($cookie_name);
        if (!$cookie_language || !array_key_exists($cookie_language, $languages)) {
            $cookie_language = $current;
        }
        App::setLocale($cookie_language);

        $controller_name = get_class($request->route()->controller);

        if (strtolower(substr($controller_name, -10)) === 'controller' and Str::startsWith($controller_name, 'App\\Admin\\Controllers\\')) {
            $controller_name = str_replace('App\\Admin\\Controllers\\', '', $controller_name);
            $controller_name = substr($controller_name, 0, strlen($controller_name) - 10);
            $translator_path = config('admin.multi_language.lang_directory') . str_replace('\\', DIRECTORY_SEPARATOR, $controller_name . DIRECTORY_SEPARATOR);
            app('translator')->addJsonPath($translator_path);
        }
        return $next($request);
    }
}
```

`config/admin.php` 新增如下配置：

```php
'multi_language' => [
    // 指定语言文件目录
    'lang_directory' => resource_path('langext') . DIRECTORY_SEPARATOR,
    // 支持的语言
    'languages' => [
        'en' => 'English',
        'zh_CN' => '简体中文',
    ],
    // 默认语言
    'default' => 'zh_CN',
    // cookie键，用于记住用户语言
    'cookie_name' => 'backend_locale',
],
```

然后在 `config/admin.php` 中添加该中间件：

```diff
'route' => [

    'prefix' => env('ADMIN_ROUTE_PREFIX', 'admin'),

    'namespace' => 'App\\Admin\\Controllers',

-   'middleware' => ['web', 'admin'],
+   'middleware' => ['web', 'admin', \App\Admin\Middleware\SwitchLanguage::class],
],
```

随后在 `resources/langext/控制器名/区域名/xxx.json` 中新增翻译内容即可，例如给 `ProductsController` 创建单独翻译文件，则翻译文件路径为 `resources/langext/Products/zh_CN/zh_CN.json`



注意：如果翻译键值与公共翻译处冲突，则以单独的翻译文件为准。

<br>

[^1]: 例如 `__('Name')` 在 `UsersController` 中需要翻译为 `用户姓名`，而在 `TagsController` 中需要翻译为 `标签名`，或者同一翻译键在前台用户端与后台翻译结果不同
[^2]: 一般使用 laravel-admin 时，一般使用 `php artisan admin:make UsersController --model=App\\Models\\User` 来生成控制器，该命令默认会将数据库字段名作为翻译键