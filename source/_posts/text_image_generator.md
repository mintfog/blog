---
title: 使用 wkhtmltoimage 生成多样式文本图片
date: 2025-02-07
keywords: wkhtmltoimage,wkhtmltopdf,APP多字体,图片处理,Python
summary:  使用 wkhtmltoimage 结合 Python 生成多字体、多样式文本图片，避免移动端嵌入过多字体导致的应用体积膨胀。
description: 本文介绍如何使用 wkhtmltoimage 在后端生成支持多字体、多样式的文本图片，适用于 React Native 等需要动态文本渲染的应用。并提供完整 Python 代码示例，涵盖环境配置、HTML 生成、图片裁剪等关键步骤。
tags: 代码速记
categories: 代码速记
---

使用 wkhtmltoimage 生成多字体文本图片

## 背景

在移动端应用中，需要支持多字体、多样式的文本显示。然而，直接在 React Native 中嵌入所有字体可能会导致应用体积过大。因此，我们需要一种更高效的方式来动态生成带有特定字体的文本图片。
在查找方案时，发现了 [wkhtmltopdf](https://wkhtmltopdf.org/) 该工具支持 HTML 转换为图片或 PDF，刚好符合需求。实现流程如下：

1. 当需要显示图片时，请求后端，携带所需文本内容、字体样式、字体颜色等等参数。
2. 后端生成对应 HTML 并交由  `wkhtmltoimage` 生成图片。
3. 进行图片裁切，返回前端使用。

App 端显示的文字实际上是一张图片，类似这样

![](http://cdn.codeover.cn/img/CMvLguqFsxovKJkUFmYTsDGDkNiuWTCe.png-imageFop)

## 遇到的问题

因为项目后端主要语言是 PHP，计划使用 PHP 调用 `wkhtmltoimage` ，在 PHP 中也恰好有对应 [扩展](https://www.php.net/manual/zh/book.wkhtmltox.php)，但最终实施时发现会出现重影，于是不得不放弃了这一方案（直接使用 PHP 调用命令也可以，但是需要使用 `proc_open` 等函数执行，会对生产环境的安全造成威胁），因为项目中有使用 Python，所以最终决定将此功能放于 Python处理

## 完整代码

代码中已经添加了对应注释，我自己使用的是 Django 框架，部分细节可以自行调整，其实不仅仅可以用于生成文字图片，像生成 pdf，html 转图片都非常好用

我们需要先确保服务器可以正确加载字体，因此要创建一个 `fonts.conf` 配置文件，并设置环境变量。

```python
import base64
import hashlib
import json
import os
import random
import shutil
import string
from io import BytesIO
from urllib.parse import urlparse

import imgkit
import requests
from PIL import Image, ImageDraw, ImageFont
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from fontTools.ttLib import TTFont

# 项目的根目录地址 适当调整
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# 这里也是一个小插曲，因为 wkhtmltoimage 无法直接读取指定字体，需要在指定目录创建 fonts.conf，并把路径设置到 FONTCONFIG_FILE 中
def init():
    config_path = os.path.join(root_dir, "fonts.conf")
    if not os.path.exists(config_path):
        # 生成 fonts.conf
        fonts_conf = f"""
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
    <dir>{root_dir}/fonts</dir>
    <cachedir>{root_dir}/font_cache</cachedir>
</fontconfig>
    """
        with open(config_path, 'w') as f:
            f.write(fonts_conf.strip())

    # 设置环境变量 FONTCONFIG_FILE
    os.environ['FONTCONFIG_FILE'] = config_path


@csrf_exempt
def getText(request):
    # 数据格式示例 {"text":"粉丝专属优惠","fontSize":"30","fontColor":"#DD1010","fontOpcity":"1","fontFamily":"0","id":"22871","fontAlign":"1","fontFormat":["bold"],"fontSpace":"0","fontLineSpace":"1","fontOutlineColor":"#E65000","fontOutlineWidth":"0","fontProjectionColor":"#0D47A1","fontProjectionScopeX":"0","fontProjectionScopeY":"0","fontProjectionScopeDim":"0","fontFamilyUrl":""}
    params = json.loads(request.body)
    init()

    # 一开始试图首先获取文字宽度，并指定给 wkhtmltoimage 生成没有空白内容的图片 后来否定了这一方案
    # text = params.get('text', '')
    # font_path = getFont(params.get('fontFamilyUrl', ''))
    # font_size = int(params.get('fontSize', ''))
    #
    # text_width = get_text_size(text, font_path, font_size)

    # print(text_width)
    options = {
        'format': 'png',  # 指定生成图片的格式 因为我这里需要透明背景 所以选择了 png
        'transparent': "",  # 设置背景为透明
        'quiet': "",  # 设置此项可以屏蔽 wkhtmltoimage 的输出内容
        # 'crop-w': text_width,  # 可以指定图片的宽度，实际效果并不好
        # 'quality': 60,  # 图片的质量 越高质量越好 实际似乎没什么作用
    }

    # 随机16位图片名
    img_name = ''.join(random.sample(string.ascii_letters + string.digits, 16))
    image_path = '/tmp/' + img_name + '.png'
    html = build_html(params)

    # 如果设置了环境变量 此处可以不指定 但是指定一下更可靠点
    path_wkthmltoimage = '/usr/local/bin/wkhtmltoimage'
    config = imgkit.config(wkhtmltoimage=path_wkthmltoimage)

    imgkit.from_string(html, image_path, options=options, config=config)

    # 裁剪图片边界 这一点 Python 确实方便
    crop_image(image_path)

    # 加删除线 （这里原因是直接使用 HTML 的删除线生成图片后线会非常细，只能想办法手绘一条线）
    if 'strikethrough' in params.get('fontFormat', []):
        drawLine(image_path, float(params.get('fontSize')))

    # Read the image file in binary mode
    with open(image_path, 'rb') as f:
        file_content = f.read()

        # return HttpResponse(file_content, content_type='image/png')

    os.remove(image_path)

    data = {
        'base64_data': base64.b64encode(file_content).decode('utf-8'),
        'size': len(file_content)
    }

    # 图片宽高
    img = Image.open(BytesIO(file_content))
    data['width'], data['height'] = img.size
    # 图片 md5 值
    md5_hash = hashlib.md5()
    md5_hash.update(file_content)
    data['etag'] = md5_hash.hexdigest()

    # 这里框架使用的是 Django 可以根据实际调整
    return HttpResponse(json.dumps(data))
    # return HttpResponse(file_content, content_type='image/png')


def get_text_size(text, font_path, font_size):
    temp_image = Image.new('RGB', (1, 1), color='white')
    draw = ImageDraw.Draw(temp_image)

    # 加载字体
    font = ImageFont.truetype(font_path, font_size)

    # 获取文本的边界框
    text_bbox = draw.textbbox((0, 0), text, font=font)

    # 计算文本的宽度和高度
    return text_bbox[2] - text_bbox[0] + 10


def build_html(params):
    style = ""
    divStyle = ""

    fontSize = params.get('fontSize', '')
    fontColor = params.get('fontColor', '')
    fontOpcity = params.get('fontOpcity', '')
    # fontName = params.get('fontName', '')
    text = params.get('text', '')
    text = text.replace("\n", "<br/>")
    fontName = getFontName(params.get('fontFamilyUrl'))
    fontFormat = params.get('fontFormat', [])

    if fontName:
        style += "font-family: '" + fontName + "';"

    if fontSize:
        style += "font-size: " + str(fontSize) + "px;"

    if fontColor:
        if str(fontOpcity) != "1":
            rgb = Hex2RGB(fontColor)
            style += "color: rgba(" + rgb + "," + fontOpcity + ");"
        else:
            style += "color: " + fontColor + ";"

    # if str(fontOpcity) != "1":
    #     style += "opacity: " + fontOpcity + ";"

    if fontAlign := params.get('fontAlign', ''):  # 对齐方式
        divStyle += "text-align: " + fontAlign + ";"
    if fontSpace := params.get('fontSpace', ''):  # 字间距
        style += "letter-spacing: " + fontSpace + "px;"
    if fontLineHeight := params.get('fontLineSpace', ''):  # 行间距
        style += "line-height: " + fontLineHeight + ";"
    if fontOutlineWidth := params.get('fontOutlineWidth', ''):  # 描边
        fontOutlineColor = params.get('fontOutlineColor', '#000')
        style += '-webkit-text-stroke: ' + fontOutlineWidth + 'px ' + fontOutlineColor + ';'
    fontProjectionScopeX = params.get('fontProjectionScopeX', '0')
    fontProjectionScopeY = params.get('fontProjectionScopeY', '0')
    if fontProjectionScopeX or fontProjectionScopeY:  # 投影
        fontProjectionScopeDim = params.get('fontProjectionScopeDim', '')
        fontProjectionColor = params.get('fontProjectionColor', '#000')
        style += 'text-shadow: ' + fontProjectionScopeX + 'px ' + fontProjectionScopeY + 'px ' + fontProjectionScopeDim + 'px ' + fontProjectionColor + ';'
    if 'bold' in fontFormat:
        style += "font-weight: bold;"
    if 'italic' in fontFormat:
        style += "font-style: italic;"

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<div style="{divStyle}">
    <span style="{style}">{text}</span>
</div>
</body>
</html>
        """


# 把字体下载到本地
def getFontName(fontFamilyUrl):
    url_path = urlparse(fontFamilyUrl).path
    file_name = os.path.basename(url_path)
    fonts_dir = os.path.join(root_dir, "fonts")
    full_path = os.path.join(fonts_dir, file_name)
    if not os.path.exists(fonts_dir):
        os.makedirs(fonts_dir)
    # 判断是否存在 不存在下载
    if not os.path.exists(full_path):
        # 下载
        response = requests.get(fontFamilyUrl)
        with open(full_path, 'wb') as f:
            f.write(response.content)
            modifyFontName(full_path)  # 修改字体名称
            if os.path.exists(os.path.join(root_dir, "font_cache")):
                shutil.rmtree(os.path.join(root_dir, "font_cache"))
        pass

    return file_name


# 裁剪图片
def crop_image(image_path):
    # 打开图片
    img = Image.open(image_path)

    # 计算内容的边界
    bbox = img.getbbox()

    # 如果图片是空的或全透明的，bbox会是None
    if bbox:
        # 裁剪图片
        img_cropped = img.crop(bbox)

        # 保存裁剪后的图片
        img_cropped.save(image_path)
    else:
        print("图片是空的或全透明的，无法裁剪。")


# 修改字体名为文件名
def modifyFontName(font_path):
    file_name = os.path.basename(font_path)
    font = TTFont(font_path)

    # 修改字体名称
    name_table = font['name']
    for record in name_table.names:
        if record.nameID == 1 or record.nameID == 16 or record.nameID == 4:
            record.string = file_name.encode('utf-16be')

    # 保存修改后的字体文件
    font.save(font_path)

    print(f"字体名称已修改为：{file_name}")


def drawLine(url, fontSize):
    img = Image.open(url)
    draw = ImageDraw.Draw(img)
    width, height = img.size
    line_width = int(fontSize / 12) if int(fontSize / 12) > 1 else 1

    draw.line((2, height / 2, width - 2, height / 2), fill=(0, 0, 0), width=line_width)
    img.save(url)


# 16 进制色码转rgb
def Hex2RGB(hex):
    r = int(hex[1:3], 16)
    g = int(hex[3:5], 16)
    b = int(hex[5:7], 16)
    rgb = str(r) + ',' + str(g) + ',' + str(b)
    return rgb
```

------

## 结论

通过这种方式，我们在 React Native 中成功实现了多字体支持，而不增加 APP 体积。后端动态生成的 PNG 图片可以确保字体一致性，并支持多种文字样式，为用户带来更好的体验。