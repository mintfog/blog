---
title: MySQL 备份恢复策略
date: 2022-05-08 22:16:05
keywords: mysql,mysql 备份恢复,数据库,数据库数据恢复,mysql闪回,数据恢复,运维,数据闪回
summary:  数据库在运行过程中，总会遇到各种各样的问题：硬件故障、bug 导致数据损坏、由于服务器宕机或者其他原因造成的数据库不可用。除此以外还有人为操作，如 DELETE 语句忘记加条件、ALTER TABLE 执行错表、DROP TABLE 执行错表、黑客攻击……
tags:
- linux
- mysql
categories: mysql
---

数据库在运行过程中，总会遇到各种各样的问题：硬件故障、`bug` 导致数据损坏、由于服务器宕机或者其他原因造成的数据库不可用。除此以外还有人为操作如 `DELETE` 语句忘加条件、`ALTER TABLE` 执行错表、`DROP TABLE` 执行错表、黑客攻击等。备份就是在数据库意外的情况下保证数据不丢失，或者最小程度丢失的解决方法。


## 备份方式

### 逻辑备份

逻辑备份是最常见也是最简单的备份方式，在数据量较少时较为实用。

逻辑备份的优势：
- 备份恢复比较简单，使用 `mysql` 自带的 `mysqldump` 即可进行备份，无需额外安装任何软件，恢复的时候使用 `mysql` 命令恢复即可。
- 避免备份内容遭到损坏，只要 `mysql` 还能执行 `SELECT` 语句，就可以得到一份可信赖的备份文件，这在文件损坏的时候很有用
- 备份的数据非常直观（`sql` 语句），可以轻易使用 `sed` `grep` 等进行修改或者提取
- 因为备份的文件是 `sql` 语句，所以客观上备份的数据不对储存引擎做区分，可以轻易的从 `MyISAM` 引擎迁移到 `InnoDB`。
- 可以在任一机器执行备份命令，也就是说可以远程备份和恢复。

逻辑备份的缺点：
- 恢复时间较长，使用逻辑备份进行数据恢复，需要占用大量的资源进行行锁分配、冲突检查、构建索引等，这在数据量大时非常致命。
- 备份时间较长，因为要使用 `mysql` 服务进行备份操作，备份时要消耗大量 cpu 资源。
- 备份文件较大，逻辑备份在某些场景下比数据库文件更大，文本储存并不总是比储存引擎更高效。当然使用压缩的话备份文件会更小，但是需要消耗更多的 cpu 资源。

逻辑备份的常用方式：
- `mysqldump` ， `mysql` 自带的备份工具，通用型强，较为实用。后文会详细介绍。
- `mydumper`，允许使用多线程进行备份，备份的数据会对表结构与数据分离处理，在恢复某些表或数据的时候会有奇效，可以守护进程的工作方式，定时快照和连续二进制日志。

### 物理备份

物理备份在数据量较大时比较实用。

物理备份的优势：
- 备份速度快，因为物理备份就是复制文件，也就意味着复制文件多快，备份就有多快。
- 恢复速度快，与备份同理，只需把文件复制到数据库即可，不需要进行额外操作。

物理备份的缺点：
- 出现意外情况的概率较大，因为没有官方物理热备份工具的支持，意味着出问题的概率极大，恢复时需要格外谨慎
- `InnoDB` 的原始文件备份通常比逻辑备份更大，`InnoDB` 表空间往往包含很多未使用的空间，`InnoDB` 在表删除后不会立即删除空间，所以即使数据量不多，备份出的文件也可能很大。
- 不可跨平台版本，`mysql` 源文件和文件操作系统、`mysql` 版本等息息相关，如果环境与原来有差异，很可能无法恢复

物理备份常用方法：
- `xtrabackup` ，最常用的物理备份工具，由 `percona` 开源，能够实现对 `InnoDB` 储存引擎和 `XtraDB` 存储引擎非阻塞地备份（对于 `MyISAM` 需要加锁，以得到一份一致性备份）。
- 直接复制文件/文件系统快照，这种方式对于 `MySIAM` 引擎是非常高效的，只需要执行 `FLUSH TABLE WITH READ LOCK` 就可以复制得到一份备份文件。但是对于 `InnoDB` 引擎就比较困难，因为 `InnoDB` 引擎使用了大量的异步技术，即使执行了 `FLUSH TABLE WITH READ LOCK`，它还是会继续合并日志、缓存数据。所以要用这种方法备份 `InnoDB`，需要确保 `checkpoint` 已经最新。

## 备份方案

### 全量备份

全量备份分逻辑备份与物理备份，最常用的逻辑备份工具为 `mysqldump` 与 `mydumper`，常用的物理备份工具为 `xtrabackup`

#### mysqldump

##### 语法：

```bash
mysqldump [OPTIONS] [database] [tables]
```

如果不指定任何表，整个数据库将被导出。`OPTIONS` 支持下列选项，更多的选项可参考 [官方文档](https://dev.mysql.com/doc/refman/5.7/en/mysqldump.html)

| 选项          | 解释                                                         |
| ------------- | ------------------------------------------------------------ |
| `--add-locks` | 在每个表导出之前增加 LOCK TABLES 并且之后 UNLOCK TABLE |
| `--add-drop-table` | 在每个 create 语句之前增加一个 drop table |
| `--allow-keywords` | 允许创建是关键词的列名字，这由表名前缀于每个列名做到 |
| `-c`，`--complete-insert` | 使用完整的 insert 语句 |
| `-C`， `--compress` | 如果客户和服务器均支持压缩，压缩两者间所有的信息 |
| `--delayed` | 用 `INSERT DELAYED` 命令插入行。 |
| `-e`，`--extended-insert` | 使用多行 `INSERT` 语法（给出更紧缩并且更快的插入语句） |
| `-#`， `--debug` | 用于调试 |
| `-F`，`--flush-logs` | 在开始导出前，洗掉在 MySQL 服务器中的日志文件（重新开始写入binlog） |
| `-f`，`--force` | 即使在一个表导出期间得到一个 SQL 错误，也继续导出 |
| `-h`，`--host=...` | 从命名的主机上的 MySQL 服务器导出数据。缺省主机是 localhost。 |
| `-l`，`--lock-tables` | 导出开始执行时锁上所有表 |
| `-t`，`--no-create-info` | 不写入表创建信息( CREATE TABLE 语句） |
| `-d`，`--no-data` | 只导出表结构，不导出任何数据 |
| `--opt` | 相当于同时开启了 `--quick --add-drop-table --add-locks --extended-insert --lock-tables` |
| `-pyour_pass`，`--password[=your_pass]` | 与服务器连接时使用的口令，如果你不指定 “=your_pass” 部分，mysqldump 需要来自终端的口令 |
| `-P port_num`，`--port=port_num` | 与一台主机连接时使用的 TCP/IP 端口号 |
| `-q`，`--quick` | 不缓冲查询，直接导出至 stdout |
| `-S /path/to/socket`，`--socket=/path/to/socket` | 与 localhost 连接时，使用的套接字文件。 |
| `-T`，`--tab=path-to-some-directory` | 对于每个给定的表，创建一个 table_name.sql 文件，它包含 SQL CREATE 命令，和一个 table_name.txt 文件，它包含数据。 注意：这只有在 mysqldump 运行在 mysqld 守护进程运行的同一台机器上的时候才工作。.txt 文件的格式根据 --fields-xxx 和 --lines--xxx 选项来定。 |
| `-u user_name`，`--user=user_name` | 与服务器连接时，MySQL 使用的用户名 |
| `-v`，`--verbose` | 冗长模式。打印出程序所做的更多的信息 |
| `-w`，`--where='where-condition'` | 只导出被选择了的记录；注意引号是强制的。 `--where=user='jimf', -wuserid>1, -wuserid<1` |
| `--lock-all-tables` | 锁表备份。由于 `MyISAM` 不能提供一致性读，如果要得到一份一致性备份，只能进行全表锁定 |
| `-V`， `--version` | 打印版本信息并且退出 |
| `--help` | 显示一条帮助消息并且退出 |

##### 示例：

```bash
mysqldump --opt -h<host> -u<user> -p<password> <database> > backup.sql
```

##### 恢复：

恢复方式比较简单，直接执行 sql 语句就可以了

```sql
source backup.sql;
```

#### xtrabackup

##### 安装：

```bash
yum install http://www.percona.com/downloads/percona-release/redhat/0.1-6/percona-release-0.1-6.noarch.rpm
yum update percona-release
# qpress 用作压缩解压
yum install percona-xtrabackup-24 qpress
```

##### 备份：

```bash
innobackupex --defaults-file=/etc/my.cnf --user=<user> --password=<pwd> <要备份到哪个目录> --no-timestamp --compress --compress-threads=4 --parallel=4
```

- `--defaults-file` 指定 mysql 配置文件所在的路径
- `--no-timestamp` 不使用当前时间建立文件夹，默认情况下会在备份目录以当前时间创建文件夹。
- `--compress` 开启压缩以减少储存空间占用
- `--compress-threads=N` 压缩线程
- `--parallel=N` 备份线程

##### 恢复：

```bash
# 1：解压
innobackupex --decompress <备份文件所在目录> --parallel=4

# 2：应用日志
innobackupex --apply-log <备份文件所在目录> --parallel=4

# 3：复制备份文件到数据目录
innobackupex --datadir=<MySQL数据目录> --copy-back <备份文件所在目录> --parallel=4
```

### 增量备份

当数据量达到了一定规模后，经常做全量备份就变的不再现实，这是常见的策略就是定期做增量备份，增量备份只包含了变化的数据集，一般情况下不会比原始数据大，所以可以减少备份时间与备份空间。增量备份同时也分逻辑备份与物理备份，常用的物理备份工具是 `xtrabackup`，逻辑备份常见的则是直接备份 `binlog` 日志。

#### xtrabackup

`xtrabackup` 允许进行增量备份，`xtrabackup`的安装前文已经介绍过，增量备份示例如下：

```bash
innobackupex --defaults-file=/etc/my.cnf --user=<user> --password=<pwd> --no-timestamp --compress --incremental --incremental-basedir=<全量备份的目录> <增量备份的目标目录>
```

恢复：

```bash
# 1：对全备解压
innobackupex --decompress <全量备份文件所在目录>

# 2：对全备应用日志
innobackupex --apply-log --redo-only <全量备份文件所在目录>

# 3：对增量备份进行解压
innobackupex --decompress <增量备份文件所在的目录>

# 4：合并增量数据
innobackupex --apply-log --redo-only --incremental <全量备份文件所在目录> --incremental-dir=<增量备份文件所在的目录>

# 5：对合并后的数据应用日志
innobackupex --apply-log <全量备份文件所在目录>

# 6：复制备份文件到数据目录
innobackupex --datadir=<MySQL数据目录> --copy-back <全量备份文件所在目录>
```

#### binlog

使用 `binlog` 做增量备份比较简单，在使用 `mysqldump` 执行全备的时候增加参数 `--flush-logs` 轮转日志，然后把新的 `binlog` 直接复制到备份目录就可以了。

恢复的时候使用 `mysqlbinlog binlog日志文件 > backup.sql`，随后链接数据库使用 `source` 恢复就可以了，注意在恢复前需要过滤掉异常的 sql 语句。

不必担心日志过多占用空间问题，当下最不值钱的就是储存空间，反倒真正需要恢复数据时会有大用，推荐的 binlog 配置为：

```bash
# binlog 存放目录
log_bin=/www/wwwlogs/mysql/log_bin_data
# mysql 清除过期日志的时间，默认值 0，不自动清理，而是使用滚动循环的方式。
expire_logs_days = 0
# 如果二进制日志写入的内容超出给定值，日志就会发生滚动。你不能将该变量设置为大于 1GB 或小于 4096 字节。 默认值是 1GB。
max_binlog_size = 1000M
# 记录每一行数据的变化
binlog_format = row
# 备库在重做数据的时候，记录一条 binlog
log_slave_updates = 1
# 记录数据库表中修改前的内容
binlog_row_image = FULL
```

恢复：

```bash
mysqlbinlog --start-datetime="2022-05-10 21:41:00" --stop-datetime="2022-05-11 21:41:00" mysqlbinlog.000001 | mysql -uroot -p1234
```



## 闪回

`mysql` 闪回(flashback)利用 `binlog` 直接进行回滚，能急速恢复且不用停机。[MyFlash](https://github.com/Meituan-Dianping/MyFlash) 是美团开源的一款闪回操作工具

限制：

1. `binlog` 格式必须为 `row`，且 `binlog_row_image=full`
2. 仅支持 5.6 与 5.7
3. 只能回滚 DML（增、删、改）

安装：

```bash
# 下载文件
wget https://github.com/Meituan-Dianping/MyFlash/archive/master.zip -O MyFlash.zip
unzip MyFlash.zip
cd MyFlash-master

# 编译安装
./build.sh
cd binary
```

使用示例：

```bash
flashback --databaseNames=<数据库名> --binlogFileNames=<binlog文件位置>
```

执行后会生成 `binlog_output_base.flashback` 文件，需要用 `mysqlbinlog` 解析出来再使用

```bash
mysqlbinlog -vv binlog_output_base.flashback > sql_text.sql
```

语法：

| 参数                    | 说明                                                         |
| ----------------------- | ------------------------------------------------------------ |
| --databaseNames         | 要闪回的数据库名称，多个数据库用 `,` 隔开                    |
| --tableNames            | 要闪回的数据表名称，多个用 `,` 隔开                          |
| --start-position        | 闪回的起始位置，默认从头开始处回滚<br>需要使用 binlog 分析工具获取，如 binlog2sql 或 mysqlbinlog |
| --stop-position         | 闪回的终止位置，默认回滚到文件结尾                           |
| --start-datetime        | 闪回的开始时间（误操作的时间）                               |
| --stop-datetime         | 闪回的终止时间（误操作的时间）                               |
| --sqlTypes              | 指定需要回滚的 sql 类型，支持 INSERT、DELETE、UPDATE<br>多个类型使用逗号 `,` 分开 |
| --maxSplitSize          | 对生成的闪回文件进行切割                                     |
| --binlogFileNames       | 指定需要回滚的 binlog 文件，多个文件用 `,` 隔开              |
| --outBinlogFileNameBase | 指定输出的 binlog 前缀，如不指定，则默认为 binlog_output_base |
| include-gtids           | 指定需要回滚的 gtid，支持 gtid 的单个和范围两种形式          |
| exclude-gtids           | 指定不需要回滚的 gtid，用法同 include-gtids                  |

## 总结

1. 逻辑备份与物理备份可以同时启用，以防万一
2. 全备的间隔周期不应过长，尽量每周都进行一次全备
3. 要经常做数据恢复演练，否则真正需要恢复时才发现备份的文件有问题，就追悔莫及了
4. 如果数据过多，可采用增量备份的方式，但同时恢复失败的风险会更高
5. `binlog` 一定要开启，并且设为 `row` 模式、设置 `log_slave_updates = 1`，且定时备份 binlog 并分散与异地服务器
6. 有条件的话增加一个延迟同步库，在做紧急恢复的时候有奇效