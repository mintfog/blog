---
title: Go 语言中的 RSA 加密、解密、签名与验签
date: 2023-02-21 22:21:03
keywords: golang,Go语言,RSA,加密,解密,验签,签名,非对称加密,密码学,证书生成,RSA私钥生成,php,php rsa
summary:  RSA 加密演算法是一种非对称加密演算法，在一些项目中经常使用，在 golang 中 RSA 的加密、解密、签名与验签主要使用 crypto/x509 和 crypto/rsa 两个包中的方法。
tags:
- GoLang
categories: GoLang
updated: 2024-08-27 16:14:00
---

RSA 加密算法是一种非对称加密算法[^1]，在许多项目中广泛使用，是当前数据安全加密中最常用的算法之一。在 Go 语言中，RSA 的加密、解密、签名与验签主要通过 `crypto/x509` 和 `crypto/rsa` 两个包的方法来实现。

## 加密与解密

RSA 通过生成一对公钥和私钥来进行加密和解密，公钥与私钥是相互对应的。公钥可以用来加密数据，但不能用于解密；而私钥则可以解密由对应公钥加密的数据。公钥可以公开分发，而私钥需要妥善保管，只有拥有私钥的人才能解密通过公钥加密的信息。

### 加密

代码示例: 

```go
// RsaEncryptBase64 使用 RSA 公钥加密数据, 返回加密后并编码为 base64 的数据
func RsaEncryptBase64(originalData, publicKey string) (string, error) {
	block, _ := pem.Decode([]byte(publicKey))
	if block == nil {
		return "", errors.New("公钥解码失败")
	}

	pubKey, parseErr := x509.ParsePKIXPublicKey(block.Bytes)
	if parseErr != nil {
		return "", fmt.Errorf("解析公钥失败: %v", parseErr)
	}

	// 获取密钥长度，计算最大加密块大小
	keySize := pubKey.(*rsa.PublicKey).Size()
	maxEncryptSize := keySize - 11

	// 将原始数据按块大小分段加密
	var encryptedData []byte
	for len(originalData) > 0 {
		segment := originalData
		if len(segment) > maxEncryptSize {
			segment = originalData[:maxEncryptSize]
		}

		encryptedSegment, err := rsa.EncryptPKCS1v15(rand.Reader, pubKey.(*rsa.PublicKey), []byte(segment))
		if err != nil {
			return "", fmt.Errorf("加密失败: %v", err)
		}

		encryptedData = append(encryptedData, encryptedSegment...)
		originalData = originalData[len(segment):]
	}

	return base64.StdEncoding.EncodeToString(encryptedData), nil
}
```

解析: 

- `originalData`，需要加密的原始数据。
- `publicKey`，RSA 公钥。

> 注: RSA 加密时对明文长度有限制，超过限制需要分段处理。通常情况下，RSA 不用于加密过长的数据。具体限制为 密钥长度除8减11字节。例如，1024 位的 RSA 密钥最长可以加密 1024/8-11=117 Byte 的数据。

### 解密

代码示例: 

```go
// RsaDecryptBase64 使用 RSA 私钥解密数据
func RsaDecryptBase64(encryptedData, privateKey string) (string, error) {
	encryptedDecodeBytes, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		return "", fmt.Errorf("Base64 解码失败: %v", err)
	}

	block, _ := pem.Decode([]byte(privateKey))
	if block == nil {
		return "", errors.New("私钥解码失败")
	}

	priKey, parseErr := x509.ParsePKCS8PrivateKey(block.Bytes)
	if parseErr != nil {
		return "", fmt.Errorf("解析私钥失败: %v", parseErr)
	}

	// 获取密钥长度，计算最大解密块大小
	keySize := priKey.(*rsa.PrivateKey).Size()

	// 分段解密数据
	var decryptedData []byte
	for len(encryptedDecodeBytes) > 0 {
		segment := encryptedDecodeBytes
		if len(segment) > keySize {
			segment = encryptedDecodeBytes[:keySize]
		}

		decryptedSegment, err := rsa.DecryptPKCS1v15(rand.Reader, priKey.(*rsa.PrivateKey), segment)
		if err != nil {
			return "", fmt.Errorf("解密失败: %v", err)
		}

		decryptedData = append(decryptedData, decryptedSegment...)
		encryptedDecodeBytes = encryptedDecodeBytes[len(segment):]
	}

	return string(decryptedData), nil
}
```

解析: 

- `originalData`，Base64 编码的密文内容。
- `privateKey`，RSA 私钥。
- `返回值1` 解密后的明文数据。

> 注: RSA 解密时对内容有同样的长度限制，见前文说明。

## 签名与验签

RSA 密钥对也可以用于签名和验签。不同于加密，签名的目的是验证消息的真实性，而非保护其机密性。消息的接收者通过验证签名来判断消息是否被篡改。只有持有私钥的人才能对信息进行签名，而持有公钥的人则可以验证签名的正确性。

### 签名

```go
// originalData 签名前的原始数据
// privateKey RSA 私钥
func signBase64(originalData, privateKey string) (string, error) {
	block, _ := pem.Decode([]byte(privateKey))
	if block == nil {
		return "", errors.New("解析私钥失败: 无法解码PEM数据")
	}

	priKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("解析私钥失败: %v", err)
	}

	// sha256 加密方式，必须与 下面的 crypto.SHA256 对应
	// 例如使用 sha1 加密，此处应是 sha1.Sum()，对应 crypto.SHA1
	hash := sha256.Sum256([]byte(originalData))
	signature, err := rsa.SignPKCS1v15(rand.Reader, priKey.(*rsa.PrivateKey), crypto.SHA256, hash[:])
	if err != nil {
		return "", fmt.Errorf("签名失败: %v", err)
	}

	return base64.StdEncoding.EncodeToString(signature), nil
}
```

### 验签

```go
// originalData 签名前的原始数据
// signData Base64 格式的签名串
// pubKey 公钥（需与加密时使用的私钥相对应）
// 返回 true 代表验签通过，反之为不通过
func verifySignWithBase64(originalData, signData, pubKey string) (bool, error) {
	sign, err := base64.StdEncoding.DecodeString(signData)
	if err != nil {
		return false, fmt.Errorf("签名解码失败: %v", err)
	}

	block, _ := pem.Decode([]byte(pubKey))
	if block == nil {
		return false, errors.New("解析公钥失败: 无法解码PEM数据")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return false, fmt.Errorf("解析公钥失败: %v", err)
	}

	// sha256 加密方式，必须与 下面的 crypto.SHA256 对应
	// 例如使用 sha1 加密，此处应是 sha1.Sum()，对应 crypto.SHA1
	hash := sha256.Sum256([]byte(originalData))
	err = rsa.VerifyPKCS1v15(pub.(*rsa.PublicKey), crypto.SHA256, hash[:], sign)
	if err != nil {
		return false, fmt.Errorf("验签失败: %v", err)
	}

	return true, nil
}
```

## 附1：公私钥的生成

使用 Go 语言生成 RSA 公私钥非常简单。需要特别注意的是，私钥必须严格保密，防止泄露。以下是生成公私钥的代码：

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
