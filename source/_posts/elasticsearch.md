---
title: Elasticsearch 全文搜索引擎基本使用
date: 2022-07-24
keywords: es,elasticsearch,全文搜索,elasticsearch 7,elasticsearch 8,分面搜索,同义词搜索,相似推荐,电商搜索,搜索引擎
description: elasticsearch 8全文搜索与分面搜索, 常见的电商搜索方案，同义词搜索，分面搜索，相似商品推荐，php使用elasticsearch，laravel使用elasticsearch
summary: Elasticsearch 是一个分布式的搜索和分析引擎，可以用于全文检索、结构化检索和分析，并能将这三者结合起来。Elasticsearch 基于 Lucene 开发，是 Lucene 的封装，提供了 REST API 的操作接口，开箱即用。
tags:
- php
- laravel
- es
categories: es
updated: 2022-07-28
---

Elasticsearch 是一个分布式的搜索和分析引擎，可以用于全文检索、结构化检索和分析，并能将这三者结合起来。Elasticsearch 基于 Lucene 开发，是 Lucene 的封装，提供了 REST API 的操作接口，开箱即用。现在是使用最广的开源搜索引擎之一，Wikipedia、Stack Overflow、GitHub 等都基于 Elasticsearch 来构建他们的搜索引擎。

## 安装

Elasticsearch 安装相对简单，只需安装 JDK[^1] 下载解压即可使用。

### 安装 JDK

```sh
yum install java-1.8.0-openjdk # 👈 CentOs

apt-get install openjdk-8-jdk # 👈 Ubuntu
```

下载完后运行以下命令检查

```bash
java -version 
# openjdk version "1.8.0_312"
# OpenJDK Runtime Environment (build 1.8.0_312-b07)
# OpenJDK 64-Bit Server VM (build 25.312-b07, mixed mode)
```

### 下载并安装 Elasticsearch

- 打开网址：https://www.elastic.co/cn/downloads/past-releases#elasticsearch

- 选择适合的版本点击 Download 按钮，本文选择安装 8.2.3 版本「截止发文 ik 插件最新版为 8.2.3」

  ![下载流程](https://cdn.codeover.cn/img/image-20220724220810173.png-imageFop)

- 选择 LINUX X86_64 右键点击复制链接

  ![复制链接截图](https://cdn.codeover.cn/img/image-20220724221803766.png-imageFop)

- 使用 `wget` 命令下载并解压到你喜欢的路径

  ```sh
  # 此过程在国内服务器较为缓慢
  wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.2.3-linux-x86_64.tar.gz -O elasticsearch.tar.gz
  tar -zxvf elasticsearch.tar.gz
  
  # 将 elasticsearch 移动到 elasticsearch 目录
  mv elasticsearch /www/server/elasticsearch
  ```

### 运行

Elasticsearch 不可以使用 root 用户运行，所以在执行以下命令前需要切换至普通用户，并赋予该用户对应命令的执行权限

```sh
/www/server/elasticsearch/bin/elasticsearch -d
```

### 连接测试

```sh
curl 'http://localhost:9200/?pretty'
```

如果一切正常，将会返回类似如下格式内容

```json
{
  "name" : "VM-12-15-centos",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "pYjA-9oFTpGhS295HBxpOg",
  "version" : {
    "number" : "8.2.3",
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "9905bfb62a3f0b044948376b4f607f70a8a151b4",
    "build_date" : "2022-06-08T22:21:36.455508792Z",
    "build_snapshot" : false,
    "lucene_version" : "9.1.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

如果遇到报错，是因为 Elasticsearch 8 默认开启了 X-Pack[^2]，因其不在本文的讨论范围，故现将其关闭，编辑文件 `config/elasticsearch.yml` 在 98 行左右将 `xpack.security.enabled: false` 修改为 `false`，如图

![修改配置](https://cdn.codeover.cn/img/image-20220724233806934.png-imageFop)

## 基础概念

Elasticsearch 是一个基于文档的 NoSQL 数据库，是一个 `分布式`、`RESTful`风格的搜索和数据分析引擎，同时也是 `Elastic Stack` 的核心，集中存储数据。Elasticsearch、Logstash、Kibana 经常被用作日志分析系统，俗称 ELK。

说白了就是一个数据库，既然是数据库，有一些概念是互通的，如下表：

| MySQL          | Elasticsearch    |
| -------------- | ---------------- |
| 表（Table）    | 索引（Index）    |
| 记录（Row）    | 文档（Document） |
| 字段（Column） | 字段（Fields）   |

### 基础操作

以下为 Elasticsearch 常用的 API，其中 `{index_name}` 代表自定义的索引名称，`{id}` 为文档的 ID「Elasticsearch 的 ID 并非自增，所以需要自行指定」。Elasticsearch 的返回值是 JSON 格式，在对应地址后添加 `?pretty` 即可获取格式化的 JSON 内容

| 请求方式 | 请求路径                 | 说明          |
| -------- | ------------------------ | ------------- |
| PUT      | `/{index_name}`          | 创建索引      |
| GET      | `/{index_name}`          | 查看索引信息  |
| PUT      | `/{index_name}/_mapping` | 修改索引字段  |
| PUT      | `{index_name}/_doc/{id}` | 创建\编辑文档 |
| DELETE   | `{index_name}/_doc/{id}` | 删除文档      |
| GET      | `{index_name}/_doc/{id}` | 读取文档数据  |
| POST     | `{index_name}/_search`   | 搜素数据      |

#### 创建索引

```bash
curl -XPUT http://localhost:9200/test_index
```

#### 查看索引信息

```bash
curl http://localhost:9200/test_index
```

#### 为索引创建类型

```bash
curl -H'Content-Type: application/json' -XPUT http://localhost:9200/test_index/_mapping -d'{
  "properties": {
    "title": { "type": "text", "analyzer": "ik_smart" }, 
    "description": { "type": "text", "analyzer": "ik_smart" },
    "price": { "type": "scaled_float", "scaling_factor": 100 }
  }
}'
```

- `properties` 表示这个索引中各个字段的定义，其中 `key` 是字段名称，`value` 是字段的定义
  - `type` 定义了字段的数据类型，常用的类型有 `text` / `integer` / `date` / `boolean` / `keyword`，可以在 [这个连接](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html) 查看所有类型
  - `analyzer` 告诉 Elasticsearch 使用什么方式给这个字段分词，示例中使用了 `ik_smart` ，这是一个中文分词器，后文会有介绍。

#### 创建文档

```bash
curl -H'Content-Type: application/json' -XPUT http://localhost:9200/test_index/_doc/1 -d'{
    "title": "iPhone XR",
    "description": "全新国产",
    "price": 12800
}'
```

URL 中的 `1` 是文档的 ID，这点和 Mysql 不太一样，Elasticsearch 的文档 ID 不是自增的，需要我们手动指定。

#### 读取文档

```bash
curl http://localhost:9200/test_index/_doc/1
```

URL 中的 `1` 即创建文档时的ID

#### 搜索

```bash
curl -XPOST -H'Content-Type:application/json' http://localhost:9200/test_index/_search?pretty -d'
{
    "query" : { "match" : { "description" : "全新" }}
}'
```

返回内容

```json
{
  "took" : 201,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 0.6931471,
    "hits" : [
      {
        "_index" : "test_index",
        "_id" : "1",
        "_score" : 0.6931471,
        "_source" : {
          "title" : "iPhone XR",
          "description" : "全新国产",
          "price" : 12800
        }
      }
    ]
  }
}
```

`ik_smart` 会把『全新国产』分词成『全新』和『国产』两个词，当我们用 `match` 来搜索时，Elasticsearch 就会拿搜索词在分词结果中寻找完全匹配的文档。

### Elasticsearch 查询

#### 布尔查询

Elasticsearch 的布尔查询（Bool Query）与 SQL 语言中的 `and` / `or` 有些类似，可以根据多个条件来筛选文档。

布尔查询下可以有 4 类条件，每个类条件对应的项都是一个数组，数组内的每个项对应一个条件

- `filter` 与 SQL 语句中的 `and` 类似，查询的文档必须同时满足类下的所有条件。 
- `must` 与 `filter` 相同，区别在于 `must` 方法会参与 *打分*，而 `filter` 不会。
- `should` 查询条件不需完全满足，默认情况下只需要满足 `should` 下的一项即可，可以通过 `minimum_should_match` 参数来改变需要满足的个数，满足的条件越多对应文档的打分就越高。
- `must_not` 与 `must` 相反，查询的文档必须不符合此类下的所有条件。

示例如下：

```bash
curl -XPOST -H'Content-Type:application/json' http://localhost:9200/test_index/_search?pretty -d'
{
	"query": {
		"bool": {
			"filter": [{
				"match": {
					"description": "全新"
				}
			}, {
				"match": {
					"title": "iPhone"
				}
			}]
		}
	}
}'
```

在上面的示例中，查询条件必须同时满足 `title` 包含 `iPhone` 且 `description` 包含 `全新`

#### 分页查询

分页是数据库查询的一项非常重要的功能，Elasticsearch 提供了 `from` 和 `size` 两个参数，其含义与 SQL 语句的 `limit $offset, $count` 语法中的 `$offset` 与 `$count` 参数完全一致。

示例如下：

```bash
curl -XPOST -H'Content-Type:application/json' http://localhost:9200/test_index/_search?pretty -d'
{
	"from": 0,
	"size": 10,
	"query": {
		"bool": {
			"filter": [{
				"match": {
					"description": "全新"
				}
			}]
		}
	}
}'
```

此示例中从第 0 个文档获取，共获取 10 个文档，返回数据中心的 `$results['hits']['hits']` 数组包含了此次查询符合条件的文档，`$results['hits']['total']['value']` 则代表整个索引中符合查询条件的文档数量。

#### 排序

Elasticsearch 的排序很简单，只需要一个 `sort` 参数，`sort` 参数是一个数组，数组下的项可以有多种格式，我们常用的格式是 `key` `value` 数组，`key` 是要排序的字段，`value` 可以是 `desc` 或者 `asc`。

示例

```bash
curl -XPOST -H'Content-Type:application/json' http://localhost:9200/test_index/_search?pretty -d'
{
	"from": 0,
	"size": 10,
    "sort": [{"price": "desc"}],
	"query": {
		"bool": {
			"filter": [{
				"match": {
					"description": "全新"
				}
			}]
		}
	}
}'
```

该示例使用 `price` 对查询结果进行排序。

#### 多字段匹配查询

```bash
curl -XPOST -H'Content-Type:application/json' http://localhost:9200/test_index/_search?pretty -d'
{
	"from": 0,
	"size": 10,
    "sort": [{"price": "desc"}],
	"query": {
		"bool": {
			"must": [{
				"multi_match": {
					"query": "全新",
					"fields": ["title^2", "description"]
				}
			}]
		}
	}
}'
```

该示例同时搜索 `title` 与 `description` 字段，其中 `title` 字段的权重为 2

## 中文分词

Elasticsearch 默认提供了一堆的分词器，比如 `standard`、`whitespace`、`language(比如english)` 等分词器，但是都对中文分词的效果不太好，为了实现更好的搜索效果，我们需要安装第三方分词器来进行分词，比较常见的就是 `ik` 分词器。

`ik` 分词器的安装比较简单，首先前往 github 选择与你的 Elasticsearch 相同的版本下载，下载地址：https://github.com/medcl/elasticsearch-analysis-ik/releases，随后解压至 的 `plugins/ik/` 目录下即可。如下下载 8.2.3 版本：

```bash
cd /www/server/elasticsearch/plugins
mkdir ik
cd ik
wget https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v8.2.3/elasticsearch-analysis-ik-8.2.3.zip
unzip elasticsearch-analysis-ik-8.2.3.zip
rm -f elasticsearch-analysis-ik-8.2.3.zip
```

## 分面搜索

我们可以在京东上搜索一下『手机』：

![京东分面搜索](https://cdn.codeover.cn/img/image-20220728220719329.png-imageFop)

我们可以看到京东把一些属性聚合在一起并做成了链接，我们可以点击聚合的链接进一步的筛选商品，这个功能就叫做分面搜索，分面搜索是搜索引擎中非常重要的一个功能，可以帮助用户更方便的搜索想要的商品。

想要实现分面搜索就需要用到 Elasticsearch 中的聚合，其与 SQL 语句的 `group by` 有些类似，但更加灵活和强大

在实现分面搜索之前，我们需要先对索引结构进行调整：

```bash
curl -H'Content-Type: application/json' -XPUT http://localhost:9200/test_index/_mapping -d'{
  "properties": {
    "title": { "type": "text", "analyzer": "ik_smart" }, 
    "description": { "type": "text", "analyzer": "ik_smart" },
    "price": { "type": "scaled_float", "scaling_factor": 100 },
    "properties": {
      "type": "nested",
      "properties": {
        "name": { "type": "keyword" }, 
        "value": { "type": "keyword" }
      }
    }
  }
}'
curl -H'Content-Type: application/json' -XPUT http://localhost:9200/test_index/_doc/1 -d'{
    "title": "iPhone XR",
    "description": "全新国产",
    "price": 12800,
    "properties": [{
        "name": "品牌名称",
        "value": "苹果"
    }, {
        "name": "机身内存",
        "value": "256G"
    }]
}'
curl -H'Content-Type: application/json' -XPUT http://localhost:9200/test_index/_doc/2 -d'{
    "title": "VIVO X3",
    "description": "全新国产正品",
    "price": 3600,
    "properties": [{
        "name": "品牌名称",
        "value": "VIVO"
    }, {
        "name": "机身内存",
        "value": "128G"
    }]
}'
curl -H'Content-Type: application/json' -XPUT http://localhost:9200/test_index/_doc/3 -d'{
    "title": "iPhone 13 PLUS",
    "description": "全新国行",
    "price": 9800,
    "properties": [{
        "name": "品牌名称",
        "value": "苹果"
    }, {
        "name": "机身内存",
        "value": "520G"
    }]
}'
```

可以看到我们在 `test_index` 索引新增了一个 `properties` 字段用于储存商品属性，并插入了三条测试文档。接下来我们尝试进行搜索：

```bash
curl -XPOST -H'Content-Type:application/json' http://localhost:9200/test_index/_search?pretty -d'
{
	"from": 0,
	"size": 10,
	"sort": [{
		"price": "desc"
	}],
	"query": {
		"bool": {
			"must": [{
				"multi_match": {
					"query": "全新",
					"fields": ["title^2", "description"]
				}
			}]
		}
	},
	"aggs": {
		"properties": {
			"nested": {
				"path": "properties"
			},
			"aggs": {
				"properties": {
					"terms": {
						"field": "properties.name"
					}
				}
			}
		}
	}
}'
```

以上搜索条件返回如下：

![返回示例](https://cdn.codeover.cn/img/image-20220728231814918.png-imageFop)

以下为对应字段解释

```json
'aggs' => [
    // 这里的 properties 是我们给这个聚合操作的命名
    // 可以是任意字符串，与商品结构里的 properties 没有必然联系
    'properties' => [
        // 由于我们要聚合的属性是在 nested 类型字段下的属性，需要在外面套一层 nested 聚合查询
        'nested' => [ 
            // 代表我们要查询的 nested 字段名为 properties
            'path' => 'properties',
        ],
        // 在 nested 聚合下嵌套聚合
        'aggs'   => [
            // 聚合的名称
            'properties' => [
                // terms 聚合，用于聚合相同的值
                'terms' => [
                    // 我们要聚合的字段名
                    'field' => 'properties.name',
                ],
            ],
        ],
    ]
]
```

返回信息解释：

```json
 // 聚合结果
 "aggregations" => [
   // 第一层聚合的名称
   "properties" => [
     // 聚合了 6 个文档，即搜索结果中共有 6 个商品属性
     "doc_count" => 6,
     // 第二层聚合的名称
     "properties" => [
       "doc_count_error_upper_bound" => 0,
       "sum_other_doc_count" => 0,
       // 第二层聚合结果
       "buckets" => [
         [
           // properties.name 为『品牌名称』的属性共有 3 个
           "key" => "品牌名称", 
           "doc_count" => 3,
         ],
         [
           "key" => "机身内存",
           "doc_count" => 3,
         ],
       ],
     ],
   ],
 ],
```

解决下我们进行第三层聚合，也就是属性值的聚合

```bash
curl -XPOST -H'Content-Type:application/json' http://localhost:9200/test_index/_search?pretty -d'
{
	"from": 0,
	"size": 10,
	"sort": [{
		"price": "desc"
	}],
	"query": {
		"bool": {
			"must": [{
				"multi_match": {
					"query": "全新",
					"fields": ["title^2", "description"]
				}
			}]
		}
	},
	"aggs": {
		"properties": {
			"nested": {
				"path": "properties"
			},
			"aggs": {
				"properties": {
					"terms": {
						"field": "properties.name"
					},
					"aggs": {
						"value": {
							"terms": {
								"field": "properties.value"
							}
						}
					}
				}
			}
		}
	}
}'
```

![第三层聚合](https://cdn.codeover.cn/img/image-20220728232629770.png-imageFop)

此时可以看到几乎已实现类似于京东分面搜索的功能。

## 同义词搜索



## 推荐相似商品



## 在 php 中使用 Elasticsearch



## 在 Go 中使用 Elasticsearch

[^1]: JDK 全称 **Java Development Kit**。它是 Java 语言的软件开发工具包，主要用于移动设备、嵌入式设备上的 java 应用程序。JDK 是整个 java 开发的核心，它包含了 JAVA 的运行环境（JVM+Java 系统类库）和 JAVA 工具。
[^2]: x-pack 是 elasticsearch 的一个扩展包，集安全，警告，监视，图形和报告功能于一体，可以轻松的启用或者关闭一些功能。