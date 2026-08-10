---
title: Codex API 中转站价格与倍率汇总：Plus、Pro 与月卡
date: 2026-08-04 10:57:00
summary: 持续汇总 Codex GPT API 中转站的注册入口、Plus 与 Pro 价格、充值比例、消耗倍率和月卡实际成本，并提供通用的 Codex 配置流程。
keywords: Tokens Kingdom, 77code, ooioo, Krill AI, Codex 中转站, GPT 中转站, Codex API, GPT API, Plus, Pro, 月卡, 中转站倍率
description: 本文持续整理 Codex GPT API 中转站的 Plus、Pro 与月卡价格，结合充值比例和消耗倍率计算实际成本，并介绍通用的 Codex API Key 配置方法。
tags:
- AI
- Codex
- API
categories: AI
updated: 2026-08-10 16:16:22
---

如果你想在 Codex App 或 Codex CLI 中使用 GPT 模型，Codex API 中转站通常会提供统一的 API 地址和按量计费服务。各平台的使用方法大同小异，真正需要对比的是 Plus、Pro 等号池的充值价格、消耗倍率，以及两者相乘后的实际综合倍率。

每个平台只记录入口和价格，注册、充值、创建 API Key 与配置 Codex 的公共流程统一放在后面。

## 怎么计算真实倍率

中转站页面显示的模型倍率只是“消耗倍率”。如果充值 1 元能获得超过 1 元的站内额度，还需要乘上充值系数：

```text
充值系数 = 实付金额 ÷ 到账额度
综合倍率 = 消耗倍率 × 充值系数
```

例如，实付 7 元获得 100 美金额度：

```text
充值系数 = 7 ÷ 100 = 0.07
```

某分组的消耗倍率为 `1.2x` 时：

```text
综合倍率 = 1.2 × 0.07 = 0.084
```
即花费 0.084 元能价值使用 $1 的 tokens

所以比较中转站时，不能只看模型分组显示的倍率，还要同时考虑充值到账比例。

> 本文沿用中转站常见的计算口径：实付金额使用商品页显示的人民币数值，到账额度使用站内美金额度数值，不额外换算人民币兑美元汇率。

## 中转站价格汇总

以下价格与倍率更新于 2026 年 8 月 4 日。平台可能随时调整商品价格、模型分组或倍率，请在充值前再次核对。

### 1. Tokens Kingdom

**注册入口：** [点击注册 Tokens Kingdom](https://tokenskingdom.com/register?aff=Y2QY8LVEKRWU)

**充值入口：**

- [USDT 支付](https://buy.tokenskingdom.com/)：免手续费
- [链动购买](https://pay.ldxp.cn/shop/xiaoba)

充值价格：

| 到账额度 | 实付金额 | 充值系数 |
| ---: | ---: | ---: |
| 100 美金额度 | 7 元 | 0.07000 |
| 520 美金额度 | 36 元 | 0.06923 |
| 2088 美金额度 | 145 元 | 0.06944 |
| 7088 美金额度 | 490 元 | 0.06913 |
| 14500 美金额度 | 999 元 | 0.06890 |

不同面额的充值系数约为 `0.0689–0.07`。结合“API 密钥 → 创建密钥 → 分组”中显示的消耗倍率，实际价格如下：

| 分组 | 消耗倍率 | 综合倍率 |
| --- | ---: | ---: |
| Image-2 | 1x | 0.0689–0.0700 |
| Pro帝 | 4x | 0.2756–0.2800 |
| Plus/Pro 无极 | 2.3x | 0.1585–0.1610 |
| Kiro 高缓存 | 0.8x | 0.0551–0.0560 |
| Plus 吕布 | 1.6x | 0.1102–0.1120 |
| Plus 赵云 | 1.2x | 0.0827–0.0840 |
| Team/plus 典韦 | 0.9x | 0.0620–0.0630 |
| Grok 4.5 | 0.4x | 0.0276–0.0280 |
| Plus 无双 | 1x | 0.0689–0.0700 |
| CC Max | 17x | 1.1712–1.1900 |

### 2. 77code

**注册入口：** [点击注册 77code](https://doce.77code.fun/sign-up?aff=EtkG)

**充值入口：** [链动购买兑换码](https://pay.ldxp.cn/shop/56JSQ9GE)

77code 当前充值与到账为 1:1，例如支付 10 到账 10，因此充值系数为 `1`：

| 分组 | 消耗倍率 | 综合倍率 |
| --- | ---: | ---: |
| Plus | 0.1x | 0.1000 |
| Pro | 0.15x | 0.1500 |

### 3. ooioo.work

**注册入口：** [点击注册 ooioo.work](https://ooioo.work/sign-up?aff=EL7Q)

> **平台说明：** ooioo.work 是二道贩子，服务有时不稳定，请谨慎选择。

当前价格倍率：

| 分组 | 价格倍率 | 备注 |
| --- | ---: | --- |
| Plus | 0.08x | 价格较低 |
| Pro | 0.2x | — |

### 4. Krill AI

**注册入口：** [点击注册 Krill AI](https://www.krill-ai.net/register?invite=QP0I5CMRU2)

该平台为纯 Pro 号池，消耗倍率为 `0.25x`：

| 分组 | 消耗倍率 | 备注 |
| --- | ---: | --- |
| Pro | 0.25x | 纯 Pro 号池 |

平台还提供月卡，原价为每月 360 元，包含 2400 美金额度。月卡额度按 1:1 消耗，不使用上面的 `0.25x` 倍率：

```text
原价综合倍率 = 360 ÷ 2400 = 0.15
8 折实付金额 = 360 × 0.8 = 288 元
8 折综合倍率 = 288 ÷ 2400 = 0.12
```

| 套餐 | 实付价格 | 月额度 | 额度消耗倍率 | 综合倍率 |
| --- | ---: | ---: | ---: | ---: |
| Pro 月卡原价 | 360 元/月 | 2400 美金额度 | 1x | 0.15 |
| Pro 月卡 8 折 | 288 元/月 | 2400 美金额度 | 1x | 0.12 |

该平台的月卡通常会有 8 折活动，因此常见实际综合倍率约为 `0.12`，如果叠加其他优惠还可能更低。活动力度并非固定，最终以付款页面的实际价格为准。

## 使用流程

不同中转站的页面名称可能略有区别，但使用过程基本一致：

1. 通过本文提供的入口注册并登录中转站；
2. 在线充值或购买卡密，在“钱包”“充值”或“兑换”页面获得余额；
3. 进入“API 密钥”页面创建一个 `sk-` 开头的 API Key；
4. 选择需要使用的模型分组，并记下对应消耗倍率；
5. 复制平台提供的 API 地址，在 Codex 中填写 API 地址与 API Key；
6. 新建对话发送一条简单消息，确认能够调用后再正式使用。

这里最容易混淆的是卡密和 API Key：

- **卡密或兑换码**只用于充值账户余额；
- **API Key**用于调用模型接口，通常以 `sk-` 开头；
- 不要把充值卡密直接填写到 Codex 中。

## Codex 安装与配置

Codex App 和 Codex CLI 共用 `.codex` 目录中的配置和 API Key，各系统的文件路径如下：

| 系统 | 配置文件 | API Key 文件 |
| --- | --- | --- |
| Windows | `%USERPROFILE%\.codex\config.toml` | `%USERPROFILE%\.codex\auth.json` |
| macOS | `~/.codex/config.toml` | `~/.codex/auth.json` |
| Linux | `~/.codex/config.toml` | `~/.codex/auth.json` |

### 1. 安装或更新 Node.js

安装 Node.js v18.0 或更高版本。已经安装的用户可以执行下面的命令查看版本：

```bash
node --version
```

### 2. 安装 Codex

打开 PowerShell 或终端，执行：

```bash
npm install -g @openai/codex
```

### 3. 验证安装

执行下面的命令，如果能够输出版本号，说明 Codex 已安装成功：

```bash
codex --version
```

### 4. 配置 config.toml

将下面的内容写入对应系统的 `config.toml`：

```toml
model_provider = "relay"
model = "gpt-5.6-sol"
review_model = "gpt-5.6-sol"
model_reasoning_effort = "high"
model_verbosity = "high"

[model_providers.relay]
name = "Codex Relay"
base_url = "https://example.com/v1"
wire_api = "responses"
requires_openai_auth = true
```

将 `https://example.com/v1` 换成中转站提供的真实 API 地址。如果中转站使用的模型名称不是 `gpt-5.6-sol`，还需要修改 `model` 和 `review_model`。

### 5. 配置 auth.json

将下面的内容写入对应系统的 `auth.json`，并把示例值替换为中转站创建的完整 API Key：

```json
{
  "OPENAI_API_KEY": "你的API Key"
}
```

### 6. 启动 Codex

保存两个文件后，在终端中执行：

```bash
codex
```

新建对话并发送一条简单消息。如果能够正常回复，说明 API Key、API 地址和模型配置正确。

> API Key 相当于账户的消费凭证，不要发到群聊、写进公开代码或出现在截图中。如果怀疑泄露，应立即删除旧 Key 并创建新 Key。

## 常见问题

### 提示 API Key 无效

确认填写的是中转站“API 密钥”页面创建的 `sk-` 开头密钥，而不是充值卡密，并检查复制内容是否完整。

### 提示余额不足

回到所选中转站的“钱包”“充值”或“兑换”页面补充余额。

### 请求一直失败

检查 `config.toml` 中的 `base_url` 是否与平台提供的 API 地址完全一致，并确认没有被旧配置或环境变量覆盖。

### 模型不可用

模型名称和可用渠道可能变化。进入对应平台的模型列表或渠道状态页面，换成当前可用的模型名称。

## 使用建议

- 第一次先少量充值，完整跑通充值、创建 Key 和调用流程；
- 用同一模型和相近输入输出量比较不同平台的实际扣费、速度与成功率；
- 为不同设备或项目分别创建 API Key，便于排查和控制用量；
- 定期查看使用记录与余额，发现异常消耗时及时删除相关 Key；
- 价格和渠道稳定性可能变化，重要项目应准备备用中转站。
