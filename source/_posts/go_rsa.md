---
title: Go 语言中的 RSA 加密、解密、签名与验签
date: 2023-02-21 22:21:03
keywords: golang,Go语言,RSA,加密,解密,验签,签名,非对称加密,密码学,证书生成,RSA私钥生成,php,php rsa
summary:  RSA 加密演算法是一种非对称加密演算法，在一些项目中经常使用，在 golang 中 RSA 的加密、解密、签名与验签主要使用 crypto/x509 和 crypto/rsa 两个包中的方法。
tags:
- Go
categories: Go
---

RSA 加密演算法是一种非对称加密演算法[^1]，在一些项目中经常使用，是目前使用最广的数据安全加密算法之一。在 golang 中， RSA 的加密、解密、签名与验签主要使用 `crypto/x509` 和 `crypto/rsa` 两个包中的方法。

## 加密与解密

RSA 是通过生成一个公钥和与之对应的私钥来进行加/解密的，公钥与私钥一一对应，公钥可以用来加密数据，但不能用于解密，私钥可以解密由它所对应的公钥加密的数据。我们可以将公钥分发，之后所有持有公钥的人都可以使用公钥对信息进行加密，唯一能获取信息的方式就是用我们自己的私钥来进行解密。

### 加密

代码示例: 

```go
// RsaEncryptBase64 使用 RSA 公钥加密数据, 返回加密后并编码为 base64 的数据
func RsaEncryptBase64(originalData, publicKey string) (string, error) {
	block, _ := pem.Decode([]byte(publicKey))
	pubKey, parseErr := x509.ParsePKIXPublicKey(block.Bytes)
	if parseErr != nil {
		fmt.Println(parseErr)
		return "", errors.New("解析公钥失败")
	}
	encryptedData, err := rsa.EncryptPKCS1v15(rand.Reader, pubKey.(*rsa.PublicKey), []byte(originalData))
	return base64.StdEncoding.EncodeToString(encryptedData), err
}
```

解析: 

- `originalData`，加密的原数据。
- `publicKey`，RSA 公钥。

> 注: RSA 加密时，对密文长度有限制，超出长度限制则需要分段处理（把数据分割为多段分别加密与解密）不过 RSA 大部分的用途中不会加密过长数据。具体的长度限制为 `密钥长度除8减11个字节`，例如 1024 位的 RSA 密钥对最长加密数据长度为 `1024/8-11=117 Byte`，即使用 1024 位的 RSA 公钥加密数据时，明文数据最大为 117 Byte。

### 解密

代码示例: 

```go
// RsaDecryptBase64 使用 RSA 私钥解密数据
func RsaDecryptBase64(encryptedData, privateKey string) (string, error) {
	encryptedDecodeBytes, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		return "", err
	}
	block, _ := pem.Decode([]byte(privateKey))
	priKey, parseErr := x509.ParsePKCS8PrivateKey(block.Bytes)
	if parseErr != nil {
		fmt.Println(parseErr)
		return "", errors.New("解析私钥失败")
	}

	originalData, encryptErr := rsa.DecryptPKCS1v15(rand.Reader, priKey.(*rsa.PrivateKey), encryptedDecodeBytes)
	return string(originalData), encryptErr
}
```

解析: 

- `originalData`，Base64 格式的密文内容。
- `privateKey`，RSA 私钥。
- `返回值1` 解密后的明文数据。

> 注: RSA 解密时对内容有同样的长度限制，见前文说明。

## 签名与验签

RSA 密钥对也可用于签名和验签，不同于加密，签名不能保护内容的机密性，其目的为验证消息的真实性，消息接收者通过验证签名来判断消息是否被篡改过。只有拥有私钥的人才能对信息签名，拥有公钥的人可以验证签名正确性。

### 签名

```go
// originalData 签名前的原始数据
// privateKey RSA 私钥
func signBase64(originalData, privateKey string) (string, error) {
	block, _ := pem.Decode([]byte(privateKey))
	priKey, parseErr := x509.ParsePKCS8PrivateKey(block.Bytes)
	if parseErr != nil {
		fmt.Println(parseErr)
		return "", errors.New("解析私钥失败")
	}
    
    // sha256 加密方式，必须与 下面的 crypto.SHA256 对应
    // 例如使用 sha1 加密，此处应是 sha1.New()，对应 crypto.SHA1
	hash := sha256.New()
	hash.Write([]byte(originalData))
	signature, err := rsa.SignPSS(rand.Reader, priKey.(*rsa.PrivateKey), crypto.SHA256, hash.Sum(nil), nil)

	return base64.StdEncoding.EncodeToString(signature), err
}
```

### 验签

```go
// originalData 签名前的原始数据
// signData Base64 格式的签名串
// pubKey 公钥（需与加密时使用的私钥相对应）
// 返回 true 代表验签通过，反之为不通过
func VerySignWithBase64(originalData, signData, pubKey string) (bool, error) {
	sign, err := base64.StdEncoding.DecodeString(signData)
	if err != nil {
		return false, err
	}

	block, _ := pem.Decode([]byte(pubKey))
	pub, err1 := x509.ParsePKIXPublicKey(block.Bytes)
	if err1 != nil {
		return false, err1
	}
    // sha256 加密方式，必须与 下面的 crypto.SHA256 对应
    // 例如使用 sha1 加密，此处应是 sha1.New()，对应 crypto.SHA1
	hash := sha256.New()
	hash.Write([]byte(originalData))
	verifyErr := rsa.VerifyPKCS1v15(pub.(*rsa.PublicKey), crypto.SHA256, hash.Sum(nil), sign)
	return verifyErr == nil, nil
}
```

## 附1：公私钥的生成

使用 GO 生成 RSA 公私钥较为简单，需要注意的是：私钥要严格保密，谨防外泄。生成公私钥代码如下: 

```go
// bits 生成的公私钥对的位数，一般为 1024 或 2048
// privateKey 生成的私钥
// publicKey 生成的公钥
func GenRsaKey(bits int) (privateKey, publicKey string) {
	priKey, err2 := rsa.GenerateKey(rand.Reader, bits)
	if err2 != nil {
		panic(err2)
	}

	derStream := x509.MarshalPKCS1PrivateKey(priKey)
	block := &pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: derStream,
	}
	prvKey := pem.EncodeToMemory(block)
	puKey := &priKey.PublicKey
	derPkix, err := x509.MarshalPKIXPublicKey(puKey)
	if err != nil {
		panic(err)
	}
	block = &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: derPkix,
	}
	pubKey := pem.EncodeToMemory(block)

	privateKey = string(prvKey)
	publicKey = string(pubKey)
	return
}
```

## 附2: PHP 中对应用法

### 加密

```php
/**
 * RSA 加密
 *
 * @param string $data 待加密数据
 * @param string $publicKey 公钥
 * @return string base64编码后的加密数据
 */
function rsaEncryptBase64($data, $publicKey)
{
    $publicKey = openssl_get_publickey($publicKey);
    openssl_public_encrypt($data, $encrypt, $publicKey);
    openssl_free_key($publicKey);
    return base64_encode($encrypt);
}
```

### 解密

```php
/**
 * RSA 解密
 *
 * @param string $data base64编码的密文
 * @param string $privateKey 私钥
 * @return string 解密后的明文内容
 */
function rsaEncryptBase64($data, $privateKey)
{
    $privateKey = openssl_get_privatekey($privateKey);
    openssl_private_decrypt($data, $encrypt, $privateKey);
    openssl_free_key($privateKey);
    return base64_encode($encrypt);
}
```

### 签名

```php
/**
 * 签名
 *
 * @param string $original_data 签名前的原始数据
 * @param string $private_key 私钥
 * @return string 签名后的 base64 字符串
 */
function verySignWithBase64($original_data, $private_key) {
    $openssl_res = openssl_get_privatekey($private_key);
    openssl_sign($original_data, $signature, $openssl_res, OPENSSL_ALGO_SHA256);
    openssl_free_key($openssl_res);

    return base64_encode($signature);
}
```

### 验签

```php
/**
 * 验证签名
 *
 * @param string $original_data 签名前的原始数据
 * @param string $signature Base64 格式的签名串
 * @param string $public_key 公钥（需与加密时使用的私钥相对应）
 * @return bool 返回 true 代表验签通过，反之为不通过
 */
function verySignWithBase64($original_data, $signature, $public_key) {
    $openssl_res = openssl_get_publickey($public_key);
    $verify_res = openssl_verify($original_data, base64_decode($signature), $openssl_res, OPENSSL_ALGO_SHA256);
    openssl_free_key($openssl_res);

    return 1 == $verify_res;
}
```



[^1]: 非对称式密码学（英语：Asymmetric cryptography）也称公开密钥密码学（英语：Public-key cryptography），是密码学的一种演算法，他需要两个密钥，分别是公钥与私钥。公钥用作加密，私钥则用作解密。