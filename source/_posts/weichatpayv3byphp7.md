---
title: 关于微信支付V3 PHP7.2以下实现方式
date: 2022-06-28
keywords: php,php微信支付,PHP7.2接入微信支付V3,微信支付APIV3,商家转账到零钱,linux,代码速记,平台证书下载,微信支付APIV3平台公钥下载
summary:  大概是今年 4、5 月份开通 “微信代付” 也就是商户平台的钱通过接口转账到用户余额里这个功能，更新了一版，更新完之后接入方式与之前完全分离，也就是完全不一样了。
description: PHP7.0接入微信支付V3，微信支付APIV3平台公钥下载，平台证书下载，大概是今年 4、5 月份开通 “微信代付” 也就是商户平台的钱通过接口转账到用户余额里这个功能，更新了一版，更新完之后接入方式与之前完全分离，也就是完全不一样了。
tags:
- php
- 代码速记
categories: 代码速记
updated: 2022-06-30
---

## 背景

> 大概是今年 4、5 月份开通 “微信代付” 也就是商户平台的钱通过接口转账到用户余额里这个功能，更新了一版，更新完之后接入方式与之前完全分离，也就是完全不一样了。

微信是我们项目中的一个小分支（非主线业务），前几天刚接到需求就在社区看到了 [关于微信支付V3 更新《企业打款到零钱》至《商户转账到零钱》](https://learnku.com/articles/68805) 这篇文章，原以为大佬已经铺路，这个需求已经稳了，真正开始做的时候才发现，支持微信支付 APIV3 的轮子最低都需要 PHP7.2（目前项目运行在PHP7.0）， 前文说过微信只是一小分支，如果影响主线业务估计就可以准备简历了，所以升级 PHP 版本是**绝对不可能**的，无奈，只能自己造轮子了

### 新接口介绍

前面哪位老哥发布的文章搞得我也是云里雾里的，文件A、文件C、字符串B傻傻分不清，这里我以自己的理解重新表述下各个配置的说明与获取方式（截图是取之前大哥的）

请求接口一共需要以下四项配置

1. **API 证书**，这个证书是与 APIV2 共用的，直接使用之前的配置即可，没申请直接按照步骤申请即可

![API 证书](https://cdn.codeover.cn/img/tbB1vlBoYs.png!large-imageFop)

2. **证书序列号**，这个即上一步证书的序列号，在管理证书页面有显示，这个在 APIV2 内似乎没有用到（本人对微信业务不甚熟悉，如有误请指正）
3. **商户号**，即微信支付的商户号

![商户号](https://cdn.codeover.cn/img/Wl55facGUs.png!large-imageFop)

4. **APIV3密钥**，如图，设置自定义的32位字符

![APIV3密钥](https://cdn.codeover.cn/img/f5ZHFBhUQm.png!large-imageFop)

### 平台公钥

关于第五项，平台公钥与平台公钥序列号，相信是大家一头雾水的源头，因为这个证书只能通过接口获取（无法通过商户后台获取），这个文件主要起到以下两个作用

1. 加密敏感信息，微信接口文档会明确注明需要加密的字段

![加密敏感信息](https://cdn.codeover.cn/img/BSpejkQewu.png!large-imageFop)

2. 请求验签，这里指的是同步请求结果的验签，异步回调的报文是密文，使用应用私钥解密，不需验签[^1]

如果以上两项都不需要，即可忽略平台公钥，同时 APIV3 密钥也不再需要（APIV3密钥仅用于获取平台公钥），也就是说，只需要同等于 APIV2 的配置即可调用 APIV3 接口。

例如只接入转账接口且不验证用户真实姓名，并信任[^2]微信的返回结果

如果还是需要平台公钥，可直接查看下文代码中的 `getPlatformCertificate` 方法

### 注意事项

如果 PHP 版本小于 7.1，则需要安装 [libsodium-php](https://github.com/jedisct1/libsodium-php) 扩展，该扩展是 [PECL](https://pecl.php.net/package/libsodium) 扩展，直接编译安装即可，该扩展用户解密平台公钥，如不需平台公钥则可忽略

提醒一下：这个过程还是有很大风险的，因为需要修改 `php.ini` 并且重启 `php-fpm`，我们的方案是在业务低峰期将部分服务器退出负载，待所有客户端断开连接后操作，随后由测试同学充分测试后恢复负载，以此往复。操作前一定要向 Leader 报备，以免面向监狱编程

## 实现代码

最后的最后贴出代码供大家参考（如果业务需要验签，将 `jsonBased` 方法中的验签方法取消注释，并维护对应的平台公钥列表逻辑即可）：

```php
<?php

namespace app\common\libs\wechat;

use app\common\libs\wechat\exception\WechatPayV3Exception;
use GuzzleHttp\Client;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Middleware;
use GuzzleHttp\HandlerStack;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\MessageInterface;
use think\Cache;

/** @var int - The maximum clock offset in second */
const MAXIMUM_CLOCK_OFFSET = 300;

const WechatpayNonce = 'Wechatpay-Nonce';
const WechatpaySerial = 'Wechatpay-Serial';
const WechatpaySignature = 'Wechatpay-Signature';
const WechatpayTimestamp = 'Wechatpay-Timestamp';
const ALGO_AES_256_GCM = 'aes-256-gcm';
const AUTH_TAG_LENGTH_BYTE = 16;

class WeChatPayV3
{
    /**
     * @var array The defaults configuration whose pased in `GuzzleHttp\Client`.
     */
    protected static $defaults = [
        'base_uri' => 'https://api.mch.weixin.qq.com/',
        'headers' => [
            'Accept' => 'application/json, text/plain, application/x-gzip',
            'Content-Type' => 'application/json; charset=utf-8',
        ],
    ];

    /**
     * @var string The APIv3's platform public key.
     */
    protected $platform_serial_no;

    public function __construct($config)
    {
        $this->config = [
            'app_id' => $config['app_id'],
            'ssl_key_path' => $config['ssl_key_path'], // 也可直接放私钥内容，修改下方即可
            'mch_id' => $config['mch_id'],
            'serial_no' => $config['serial_no'], // 这个是应用私钥的序列号
            'pay_sign_key' => $config['pay_sign_key'], // 这个是APIv3的密钥 32位的

        ];
    }

    /**
     * Merchant transfer an APIv3's
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter4_3_1.shtml
     * @param array $param
     * @return array|false|string
     * @throws WechatPayV3Exception
     */
    public function transfer(array $param)
    {
        $uri = 'v3/transfer/batches';

        if (!isset($param['out_detail_no']) || !isset($param['transfer_amount']) || !isset($param['openid'])) {
            throw new WechatPayV3Exception('Missing required parameters');
        }

        $detail = [
            'out_detail_no' => $param['out_detail_no'],
            'transfer_amount' => $param['transfer_amount'],
            'transfer_remark' => $param['transfer_remark'] ?? '转账',
            'openid' => $param['openid'],
        ];

        if (!empty($param['user_name'])) {
            $detail['user_name'] = $this->encryptedData($param['user_name']);
        }

        $params = [
            'appid' => $this->config['app_id'],
            'out_batch_no' => $param['out_detail_no'],
            'batch_name' => '转账',
            'batch_remark' => $param['transfer_remark'] ?? '转账',
            'total_amount' => $param['transfer_amount'],
            'total_num' => 1,
            'transfer_detail_list' => [$detail],
        ];

        try {
            return $this->request('POST', $uri, ['json' => $params]);
        } catch (RequestException $e) {
            $err = $this->toArray($e->getResponse());
            throw new WechatPayV3Exception(($err['message'] ?? $e->getMessage()) . ($err['code']), $e->getCode());
        }

    }

    /**
     * Initiate an APIv3's request.
     *
     * @param string $method The request method.
     * @param string $uri The request URI.
     * @param array $options The request options.
     * @param array $config The GuzzleHttp\Client configuration.
     * @return array|false|string
     */
    public function request(string $method, string $uri, array $options = [], array $config = [])
    {
        $method = strtolower($method);
        $response = $this->jsonBased($config)->{$method}($uri, $options);
        
        return $this->toArray($response);
    }

    /**
     * Create Wechat pay V3 client.
     *
     * @param array $config The GuzzleHttp\Client configuration.
     * @return Client
     */
    protected function jsonBased(array $config = []): Client
    {
        $privateKey = file_get_contents($this->config['ssl_key_path']); // The merchant private key.
        $mchid = $this->config['mch_id']; // The merchant ID
        $serial = $this->config['serial_no']; // The serial number of the merchant certificate

        $handler = isset($config['handler']) && ($config['handler'] instanceof HandlerStack) ? (clone $config['handler']) : HandlerStack::create();
        $handler->unshift(Middleware::mapRequest($this->signer((string)$mchid, $serial, $privateKey)), 'signer');
//        $handler->unshift(Middleware::mapResponse($this->verifier($certs)), 'verifier');

        $config['handler'] = $handler;

        return (new Client($this->withDefaults($config)));
    }

    /**
     * @param ResponseInterface $response
     * @return array|string|false
     */
    protected function toArray(ResponseInterface $response)
    {
        $contentType = $response->getHeaderLine('Content-Type');
        $contents = $response->getBody()->getContents();

        $this->headers = $response->getHeaders();

        if (false !== stripos($contentType, 'json') || stripos($contentType, 'javascript')) {
            return json_decode($contents, true);
        } elseif (false !== stripos($contentType, 'xml')) {
            return json_decode(json_encode(simplexml_load_string($contents)), true);
        }

        return $contents;
    }

    /**
     * signer middleware stack.
     *
     * @param string $mchid
     * @param string $serial
     * @param $privateKey
     * @return callable
     */
    protected function signer(string $mchid, string $serial, $privateKey): callable
    {
        return function (RequestInterface $request) use ($privateKey, $mchid, $serial) {
            if ($this->platform_serial_no) {
                $request = $request->withHeader(WechatpaySerial, $this->platform_serial_no);
            }

            $timestamp = time();
            $nonce = substr(md5(uniqid((string)rand(), true)), mt_rand(1, 16), 16);

            $body = '';
            $bodyStream = $request->getBody();
            if ($bodyStream->isSeekable()) {
                $body = (string)$bodyStream;
                $bodyStream->rewind();
            }
            $sign_data = implode("\n", array_merge([$request->getMethod(), $request->getRequestTarget(), $timestamp, $nonce, $body], ['']));
            openssl_sign($sign_data, $signature, $privateKey, 'sha256WithRSAEncryption');

            return $request->withHeader('Authorization', sprintf(
                'WECHATPAY2-SHA256-RSA2048 mchid="%s",serial_no="%s",timestamp="%s",nonce_str="%s",signature="%s"',
                $mchid, $serial, $timestamp, $nonce, base64_encode($signature)
            ));
        };
    }

    /**
     * verifier middleware stack.
     *
     * @return \Closure
     */
    protected function verifier(array &$certs): callable
    {
        return function (ResponseInterface $response) use (&$certs): ResponseInterface {
            if (!($response->hasHeader(WechatpayNonce) && $response->hasHeader(WechatpaySerial)
                && $response->hasHeader(WechatpaySignature) && $response->hasHeader(WechatpayTimestamp))) {
                throw new WechatPayV3Exception('Invalid response headers');
            }

            list($nonce) = $response->getHeader(WechatpayNonce);
            list($serial) = $response->getHeader(WechatpaySerial);
            list($signature) = $response->getHeader(WechatpaySignature);
            list($timestamp) = $response->getHeader(WechatpayTimestamp);

            $localTimestamp = time();

            if (abs($localTimestamp - intval($timestamp)) > MAXIMUM_CLOCK_OFFSET) {
                throw new WechatPayV3Exception('超出服务器时间误差范围');
            }

            if (!array_key_exists($serial, $certs)) {
                throw new WechatPayV3Exception('微信返回的序列号不存在');
            }

            if (($result = openssl_verify($this->joinedByLineFeed($timestamp, $nonce, $this->body($response)), base64_decode($signature), $certs[$serial], 'sha256WithRSAEncryption')) === false) {
                throw new WechatPayV3Exception('验证签名失败');
            }

            return $response;
        };
    }

    /**
     * Formatting the body of the response.
     *
     * @param string $timestamp
     * @param string $nonce
     * @param string $body
     * @return string
     */
    protected function joinedByLineFeed(string $timestamp, string $nonce, string $body = ''): string
    {
        return implode("\n", [$timestamp, $nonce, $body]);
    }

    /**
     * Taken body string.
     *
     * @param MessageInterface $message - The message
     */
    protected function body(MessageInterface $message): string
    {
        $body = '';
        $bodyStream = $message->getBody();
        if ($bodyStream->isSeekable()) {
            $body = (string)$bodyStream;
            $bodyStream->rewind();
        }

        return $body;
    }

    /**
     * Deep merge the input with the defaults
     *
     * @param array<string,string|int|bool|array|mixed> $config - The configuration.
     *
     * @return array<string, string|mixed> - With the built-in configuration.
     */
    protected function withDefaults(array $config = []): array
    {
        return array_replace_recursive(static::$defaults, ['headers' => $this->userAgent()], $config);
    }

    /**
     * Prepare the `User-Agent` value key/value pair
     *
     * @return array<string, string>
     */
    protected function userAgent(): array
    {
        $value = [''];

        array_push($value, 'GuzzleHttp/' . ClientInterface::VERSION);

        extension_loaded('curl') && function_exists('curl_version') && array_push($value, 'curl/' . ((array)curl_version())['version']);

        array_push($value, sprintf('(%s/%s) PHP/%s', PHP_OS, php_uname('r'), PHP_VERSION));

        return ['User-Agent' => implode(' ', $value)];
    }

    /**
     * Sensitive information encryption.
     *
     * @see https://wechatpay-api.gitbook.io/wechatpay-api-v3/qian-ming-zhi-nan-1/min-gan-xin-xi-jia-mi
     * @param string $param
     * @return string
     * @throws WechatPayV3Exception
     */
    protected function encryptedData(string $param): string
    {
        $public_key = openssl_pkey_get_public($this->getPlatformCertificate());

        if (openssl_public_encrypt($param, $encrypted, $public_key, OPENSSL_PKCS1_OAEP_PADDING)) {
            $encrypted = base64_encode($encrypted);
        }

        openssl_free_key($public_key);

        return $encrypted ?: '';
    }

    /**
     * Decrypt the encrypted data returned by APIv3.
     *
     * @see https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay4_2.shtml
     * @param string $ciphertext
     * @param string $key
     * @param string $iv
     * @param string $aad
     * @return string
     * @throws WechatPayV3Exception
     */
    public static function decryptData(string $ciphertext, string $key, string $iv = '', string $aad = ''): string
    {
        $ciphertext = base64_decode($ciphertext);
        $authTag = substr($ciphertext, intval(-16));
        $tagLength = strlen($authTag);

        /* Manually checking the length of the tag, because the `openssl_decrypt` was mentioned there, it's the caller's responsibility. */
        if ($tagLength > 16 || ($tagLength < 12 && $tagLength !== 8 && $tagLength !== 4)) {
            throw new WechatPayV3Exception('获取平台公钥失败，微信返回异常，请稍后再试');
        }

        // ext-sodium (default installed on >= PHP 7.2)
        if (function_exists('\sodium_crypto_aead_aes256gcm_is_available') && \sodium_crypto_aead_aes256gcm_is_available()) {
            try {
                $plaintext = \sodium_crypto_aead_aes256gcm_decrypt($ciphertext, $aad, $iv, $key);
            } catch (\Exception $e) {
                throw new WechatPayV3Exception('解密失败，请稍后再试');
            }
		}

        // ext-libsodium (need install libsodium-php 1.x via pecl)
        if (function_exists('\Sodium\crypto_aead_aes256gcm_is_available') && \Sodium\crypto_aead_aes256gcm_is_available()) {
            $plaintext = \Sodium\crypto_aead_aes256gcm_decrypt($ciphertext, $aad, $iv, $key);
		}

        // openssl (PHP >= 7.1 support AEAD)
        if (PHP_VERSION_ID >= 70100 && in_array(ALGO_AES_256_GCM, \openssl_get_cipher_methods())) {
            $ctext = substr($ciphertext, 0, -AUTH_TAG_LENGTH_BYTE);
            $authTag = substr($ciphertext, -AUTH_TAG_LENGTH_BYTE);

            $plaintext = \openssl_decrypt($ctext, ALGO_AES_256_GCM, $key, OPENSSL_RAW_DATA, $iv, $authTag, $aad);
		}

        if (!isset($plaintext)) {
            throw new WechatPayV3Exception('服务器异常，请稍后再试');
        } elseif (empty($plaintext)) {
            throw new WechatPayV3Exception('解密失败，请检查apiV3的公钥是否正确');
        } else {
            return $plaintext;
        }
    }

    /**
     * Get platform public key by APIv3's.
     *
     * @return mixed
     * @throws WechatPayV3Exception
     */
    public function getPlatformCertificate()
    {
        $apiv3Key = $this->config['pay_sign_key'];
        $cache_key = 'wechatpay_apiv3_cate_' . $apiv3Key;

        if ($platformCertificate = Cache::get($cache_key)) {
            $this->platform_serial_no = $platformCertificate['serial_no'];
            return $platformCertificate['cate'];
        }

        $client = $this->jsonBased();
        $handler = $client->getConfig('handler');
        $handler->remove('verifier');

        $response = $this->toArray($client->get('v3/certificates'));

        if (\is_array($response) && isset($response['data']) && \is_array($response['data'])) {
            $row = end($response['data']);

            $cert = $row['encrypt_certificate'];
            $cert = ['serial_no' => $row['serial_no'], 'cate' => static::decryptData($cert['ciphertext'], $apiv3Key, $cert['nonce'], $cert['associated_data'])];
            $this->platform_serial_no = $row['serial_no'];

            Cache::set($cache_key, $cert, 60 * 60 * 12);

            return $cert['cate'];
        } else {
            throw new WechatPayV3Exception('获取平台公钥失败，微信返回异常，请稍后再试');
        }

    }
}
```



[^1]: OpenSSL的加密签名方式为公钥加密私钥解密，私钥签名公钥验证，所以所有的解密、加签操作都需要**应用私钥**的参与，同样的，所有的验签、加密操作也都需要**平台公钥**的参与
[^2]: 这里的信任是指忽略请求微信服务端的过程中请求被拦截篡改的情况