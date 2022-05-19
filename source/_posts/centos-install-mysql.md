---
title: Centos 编译安装 MySQL
date: 2022-05-03 21:38:44
summary:  MySQL是一个关系型数据库管理系统，由瑞典MySQL AB 公司开发，目前属于 Oracle 旗下产品。MySQL 最流行的关系型数据库管理系统，在 WEB 应用方面MySQL是最好的 RDBMS (Relational Database Management System，关系数据库管理系统) 应用软件之一。
keywords: mysql,mysql 安装,linux,服务器搭建,mysql 编译安装
tags:
- linux
- mysql
categories: mysql
---

MySQL是一个关系型数据库管理系统，由瑞典MySQL AB 公司开发，目前属于 Oracle 旗下产品。MySQL 最流行的关系型数据库管理系统，在 WEB 应用方面MySQL是最好的 RDBMS (Relational Database Management System，关系数据库管理系统) 应用软件之一。MySQL是一种关联数据库管理系统，关联数据库将数据保存在不同的表中，而不是将所有数据放在一个大仓库内，这样就增加了速度并提高了灵活性。MySQL所使用的 SQL 语言是用于访问数据库的最常用标准化语言。MySQL 软件采用了双授权政策，它分为社区版和商业版，其体积小、速度快、总体拥有成本低，并且开源.

## 下载安装包

MySQL 官网：[https://www.mysql.com/cn/](https://www.mysql.com/cn/)
mysql-8.0.29源码包：[https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-boost-8.0.29.tar.gz](https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-boost-8.0.29.tar.gz)

### 获取最新版源码包

1. 进入 mysql 官网，点击 Downloads，然后选择 `MySQL Community (GPL) Downloads »`，如图所示
![下载截图1](https://cdn.codeover.cn/img/63d0f703918fa0ec9836de68369759ee3c6ddbe6.jpg-imageFop)
2. 选择  `MySQL Community Server`，如图所示：
![下载截图2](https://cdn.codeover.cn/img/627136970947543129ff4739.jpg-imageFop)
3. 分别选择 `Source Code` 与 `All Operating Systems (Generic) (Architecture Independent)`，如图所示：
![下载截图3](https://cdn.codeover.cn/img/62714a88094754312944b987.jpg-imageFop)
4. 在新窗口中右键点击 `No thanks, just start my download.` 复制下载链接

### 下载并解压

以当前最新的 mysql 8.0.29 版本为例

```shell
wget https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-boost-8.0.29.tar.gz
tar -zxvf mysql-boost-8.0.29.tar.gz
cd mysql-8.0.29
```

因是国外资源下载可能过慢，可在后台下载，如下：
```shell
nohup wget https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-boost-8.0.29.tar.gz & # 后台下载
tail -f wget_log # 查看下载进度
```

## 安装

### 1. 创建 swap 分区（非必须）

如果你的服务器内存小于 `4G` ，建议先创建 swap 分区，否则编译过程可能因为内存不足而中断

```shell
# count 一般设置为物理内存的二倍，但最大不要超过2G，示例中设置了 2G
dd if=/dev/zero of=/home/swap bs=1024 count=2048000
mkswap /home/swap
swapon /home/swap
# 设置开机自动挂起
vi /etc/fstab
/home/swap swap swap defaults 0 0 # 将这行添加至文件末尾
```

### 2. 安装依赖文件

```shell
yum install cmake gcc gcc-c++ perl bison ncurses-devel gcc-toolset-11-gcc gcc-toolset-11-gcc-c++ gcc-toolset-11-binutils libtirpc-devel autoconf -y
# 编译安装 rpcgen
wget https://github.com/thkukuk/rpcsvc-proto/releases/download/v1.4.3/rpcsvc-proto-1.4.3.tar.xz
tar -zxvf rpcsvc-proto-1.4.3.tar.xz
cd rpcsvc-proto-1.4.3
./configure
make && make install
```

### 3. 编译 mysql 并安装

```shell
cmake -DCMAKE_INSTALL_PREFIX=/www/server/mysql -DMYSQL_DATADIR=/www/server/data -DMYSQL_USER=www -DDEFAULT_CHARSET=utf8mb4 -DDEFAULT_COLLATION=utf8mb4_general_ci -DWITH_DEBUG=0 -DWITH_READLINE=1 -DWITH_EMBEDDED_SERVER=1 -DMYSQL_UNIX_ADDR=/tmp/mysql.sock -DENABLED_LOCAL_INFILE=1 -DFORCE_INSOURCE_BUILD=1 -DWITH_BOOST=boost
make # 需要相当长的时间，建议放后台运行
make install
```

其中可根据需要自定义的内容如下

| 配置项                | 说明                              |
| --------------------- | --------------------------------- |
| DCMAKE_INSTALL_PREFIX | 指定 mysql 的安装路径             |
| DMYSQL_DATADIR        | 指定 mysql 数据储存路径(即表数据) |
| DMYSQL_USER           | 指定运行 mysql 的用户             |
| DDEFAULT_CHARSET      | 指定默认的字符集编码              |
| DDEFAULT_COLLATION    | 指定默认的排序方式                |
| DWITH_DEBUG           | 禁用 debug，1 为启用              |

## 使用

### 初始化数据库

如果在编译时自定义了安装路径，需要修改 `/www/server/mysql/` 与 `/www/server/data/` 为对应路径

```shell
# 初始化数据库
/www/server/mysql/bin/mysqld --initialize-insecure
# 设置数据目录权限	
chown -R www /www/server/data/ && chgrp -R www /www/server/data/
chown -R www /www/server/mysql/ && chgrp -R www /www/server/mysql/
# 创建软连接
ln -s /www/server/mysql/bin/mysql /sbin/
# 启动
/www/server/mysql/support-files/mysql.server start
# 初始化数据库（根据需要选择即可）
/www/server/mysql/bin/mysql_secure_installation
```

### my.cnf 配置

mysql 5.6 以上版本就没有自带 `my.cnf` 文件了，我们需要手动创建，以下为常用配置说明（照抄自 [https://www.jianshu.com/p/5f39c486561b](https://www.jianshu.com/p/5f39c486561b)，略有修改），只取需要修改的部分添加至 `my.cnf` 即可，其中 `innodb_buffer_pool_size` 与 `log_bin` 需要重点关注

```yaml
# 客户端设置
[client]
port = 3306
# 默认情况下，socket文件应为/usr/local/mysql/mysql.socket,所以可以ln -s xx  /tmp/mysql.sock
socket = /tmp/mysql.sock 

# 服务端设置
[mysqld]

##########################################################################################################
# 基础信息
#Mysql服务的唯一编号 每个mysql服务Id需唯一
server-id = 1

#服务端口号 默认3306
port = 3306

# 启动mysql服务进程的用户
user = www

##########################################################################################################
# 安装目录相关
# mysql安装根目录
basedir = /www/server/mysql

# mysql数据文件所在位置
datadir = /www/server/data

# 临时目录 比如load data infile会用到,一般都是使用/tmp
tmpdir  = /tmp

# 设置socke文件地址
socket  = /tmp/mysql.sock


##########################################################################################################
# 事务隔离级别，默认为可重复读（REPEATABLE-READ）。（此级别下可能参数很多间隙锁，影响性能，但是修改又影响主从复制及灾难恢复，建议还是修改代码逻辑吧）
# 隔离级别可选项目：READ-UNCOMMITTED  READ-COMMITTED  REPEATABLE-READ  SERIALIZABLE
# transaction_isolation = READ-COMMITTED
transaction_isolation = REPEATABLE-READ

##########################################################################################################
# 数据库引擎与字符集相关设置

# mysql 5.1 之后，默认引擎就是 InnoDB 了
default_storage_engine = InnoDB
# 内存临时表默认引擎，默认InnoDB
default_tmp_storage_engine = InnoDB
# mysql 5.7 新增特性，磁盘临时表默认引擎，默认 InnoDB
internal_tmp_disk_storage_engine = InnoDB

# 数据库默认字符集,主流字符集支持一些特殊表情符号（特殊表情符占用4个字节）
character-set-server = utf8mb4

#数据库字符集对应一些排序等规则，注意要和character-set-server对应
collation-server = utf8mb4_general_ci

# 设置client连接mysql时的字符集,防止乱码
# init_connect='SET NAMES utf8'

# 是否对sql语句大小写敏感，默认值为0，1表示不敏感
lower_case_table_names = 1


##########################################################################################################
# 数据库连接相关设置
# 最大连接数，可设最大值16384，一般考虑根据同时在线人数设置一个比较综合的数字，鉴于该数值增大并不太消耗系统资源，建议直接设10000
# 如果在访问时经常出现Too Many Connections的错误提示，则需要增大该参数值
max_connections = 10000

# 默认值100，最大错误连接数，如果有超出该参数值个数的中断错误连接，则该主机将被禁止连接。如需对该主机进行解禁，执行：FLUSH HOST
# 考虑高并发场景下的容错，建议加大。
max_connect_errors = 10000

# MySQL打开的文件描述符限制，默认最小1024;
# 当open_files_limit没有被配置的时候，比较max_connections*5和ulimit -n的值，哪个大用哪个，
# 当open_file_limit被配置的时候，比较open_files_limit和max_connections*5的值，哪个大用哪个。
open_files_limit = 65535

# 注意：仍然可能出现报错信息Can't create a new thread；此时观察系统cat /proc/mysql进程号/limits，观察进程ulimit限制情况
# 过小的话，考虑修改系统配置表，/etc/security/limits.conf和/etc/security/limits.d/90-nproc.conf

# MySQL默认的wait_timeout  值为8个小时, interactive_timeout参数需要同时配置才能生效
# MySQL连接闲置超过一定时间后(单位：秒，此处为1800秒)将会被强行关闭
interactive_timeout = 1800 
wait_timeout = 1800 

# 在MySQL暂时停止响应新请求之前的短时间内多少个请求可以被存在堆栈中 
# 官方建议back_log = 50 + (max_connections / 5),封顶数为900
back_log = 900

##########################################################################################################
# 数据库数据交换设置
# 该参数限制服务器端，接受的数据包大小，如果有BLOB子段，建议增大此值，避免写入或者更新出错。有BLOB子段，建议改为1024M
max_allowed_packet = 128M

##########################################################################################################
# 内存，cache与buffer设置


# 内存临时表的最大值,默认16M，此处设置成128M
tmp_table_size = 64M
# 用户创建的内存表的大小，默认16M，往往和tmp_table_size一起设置，限制用户临师表大小。
# 超限的话，MySQL就会自动地把它转化为基于磁盘的MyISAM表，存储在指定的tmpdir目录下，增大IO压力，建议内存大，增大该数值。
max_heap_table_size = 64M

# 表示这个mysql版本是否支持查询缓存。ps：SHOW STATUS LIKE 'qcache%'，与缓存相关的状态变量。
# have_query_cache

# 这个系统变量控制着查询缓存工能的开启的关闭，0时表示关闭，1时表示打开，2表示只要select 中明确指定SQL_CACHE才缓存。
# 看业务场景决定是否使用缓存，不使用，下面就不用配置了。
query_cache_type = 0 

# 默认值1M，优点是查询缓冲可以极大的提高服务器速度, 如果你有大量的相同的查询并且很少修改表。
# 缺点：在你表经常变化的情况下或者如果你的查询原文每次都不同,查询缓冲也许引起性能下降而不是性能提升。
query_cache_size = 64M 

# 只有小于此设定值的结果才会被缓冲，保护查询缓冲,防止一个极大的结果集将其他所有的查询结果都覆盖。
query_cache_limit = 2M

# 每个被缓存的结果集要占用的最小内存,默认值4kb，一般不怎么调整。
# 如果Qcache_free_blocks值过大，可能是query_cache_min_res_unit值过大，应该调小些
# query_cache_min_res_unit的估计值：(query_cache_size - Qcache_free_memory) / Qcache_queries_in_cache
query_cache_min_res_unit = 4kb

# 在一个事务中binlog为了记录SQL状态所持有的cache大小
# 如果你经常使用大的,多声明的事务,你可以增加此值来获取更大的性能.
# 所有从事务来的状态都将被缓冲在binlog缓冲中然后在提交后一次性写入到binlog中
# 如果事务比此值大, 会使用磁盘上的临时文件来替代.
# 此缓冲在每个连接的事务第一次更新状态时被创建
binlog_cache_size = 1M


#*** MyISAM 相关选项
# 指定索引缓冲区的大小, 为MYISAM数据表开启供线程共享的索引缓存,对INNODB引擎无效。相当影响MyISAM的性能。
# 不要将其设置大于你可用内存的30%,因为一部分内存同样被OS用来缓冲行数据
# 甚至在你并不使用MyISAM 表的情况下, 你也需要仍旧设置起 8-64M 内存由于它同样会被内部临时磁盘表使用.
# 默认值 8M，建议值：对于内存在4GB左右的服务器该参数可设置为256M或384M。注意：该参数值设置的过大反而会是服务器整体效率降低！
key_buffer_size = 64M

# 为每个扫描MyISAM的线程分配参数设置的内存大小缓冲区。 
# 默认值128kb，建议值：16G内存建议1M，4G：128kb或者256kb吧
# 注意，该缓冲区是每个连接独占的，所以总缓冲区大小为 128kb*连接数；极端情况128kb*maxconnectiosns，会超级大，所以要考虑日常平均连接数。
# 一般不需要太关心该数值，稍微增大就可以了，
read_buffer_size = 262144 

# 支持任何存储引擎
# MySQL的随机读缓冲区大小，适当增大，可以提高性能。
# 默认值256kb；建议值：得参考连接数，16G内存，有人推荐8M
# 注意，该缓冲区是每个连接独占的，所以总缓冲区大小为128kb*连接数；极端情况128kb*maxconnectiosns，会超级大，所以要考虑日常平均连接数。
read_rnd_buffer_size = 1M

# order by或group by时用到 
# 支持所有引擎，innodb和myisam有自己的innodb_sort_buffer_size和myisam_sort_buffer_size设置
# 默认值256kb；建议值：得参考连接数，16G内存，有人推荐8M.
# 注意，该缓冲区是每个连接独占的，所以总缓冲区大小为 1M*连接数；极端情况1M*maxconnectiosns，会超级大。所以要考虑日常平均连接数。
sort_buffer_size = 1M

# 此缓冲被使用来优化全联合(full JOINs 不带索引的联合)
# 类似的联合在极大多数情况下有非常糟糕的性能表现,但是将此值设大能够减轻性能影响.
# 通过 “Select_full_join” 状态变量查看全联合的数量
# 注意，该缓冲区是每个连接独占的，所以总缓冲区大小为 1M*连接数；极端情况1M*maxconnectiosns，会超级大。所以要考虑日常平均连接数。
# 默认值256kb;建议值：16G内存，设置8M.
join_buffer_size = 1M

# 缓存linux文件描述符信息，加快数据文件打开速度
# 它影响myisam表的打开关闭，但是不影响innodb表的打开关闭。
# 默认值2000，建议值：根据状态变量Opened_tables去设定
table_open_cache = 2000

# 缓存表定义的相关信息，加快读取表信息速度
# 默认值1400，最大值2000，建议值：基本不改。
table_definition_cache = 1400
# 该参数是myssql 5.6后引入的，目的是提高并发。
# 默认值1，建议值：cpu核数，并且<=16
table_open_cache_instances = 2

# 当客户端断开之后，服务器处理此客户的线程将会缓存起来以响应下一个客户而不是销毁。可重用，减小了系统开销。
# 默认值为9，建议值：两种取值方式，方式一，根据物理内存，1G  —> 8；2G  —> 16； 3G  —> 32； >3G  —> 64；
# 方式二，根据show status like  'threads%'，查看Threads_connected值。
thread_cache_size = 16

# 默认值256k,建议值：16/32G内存，512kb，其他一般不改变，如果报错：Thread stack overrun，就增大看看,
# 注意，每个线程分配内存空间，所以总内存空间。。。你懂得。
thread_stack = 512k


##########################################################################################################
# 日志文件相关设置，一般只开启三种日志，错误日志，慢查询日志，二进制日志。普通查询日志不开启。

# 普通查询日志，默认值off，不开启
general_log = 0
# 普通查询日志存放地址
general_log_file = /usr/local/mysql-5.7.21/log/mysql-general.log

# 全局动态变量，默认3，范围：1～3
# 表示错误日志记录的信息，1：只记录 error 信息；2：记录 error 和 warnings 信息；3：记录 error、warnings 和普通的 notes 信息。
log_error_verbosity = 2
# 错误日志文件地址
log_error = /usr/local/mysql-5.7.21/log/mysql-error.log

# 开启慢查询
slow_query_log = 1

# 开启慢查询时间，此处为 30 秒，达到此值才记录数据
long_query_time = 30

# 检索行数达到此数值，才记录慢查询日志中
min_examined_row_limit = 100

# mysql 5.6.5新增，用来表示每分钟允许记录到 slow log 的且未使用索引的 SQL 语句次数，默认值为 0，不限制。
log_throttle_queries_not_using_indexes = 0

# 慢查询日志文件地址
slow_query_log_file = /www/wwwlogs/mysql/mysql-slow.log

# 开启记录没有使用索引查询语句
log-queries-not-using-indexes = 1


# 开启二进制日志
log_bin = /www/wwwlogs/mysql/mysql-bin.log
# mysql 清除过期日志的时间，默认值 0，不自动清理，而是使用滚动循环的方式。
expire_logs_days = 0
# 如果二进制日志写入的内容超出给定值，日志就会发生滚动。你不能将该变量设置为大于 1GB 或小于 4096 字节。 默认值是 1GB。
max_binlog_size = 1000M
# binlog 的格式也有三种：STATEMENT，ROW，MIXED。mysql 5.7.7后，默认值从 MIXED 改为 ROW
# 关于 binlog 日志格式问题，请查阅网络资料
binlog_format = row
# 默认值N=1，使binlog在每N次binlog写入后与硬盘同步，ps：1最慢
# sync_binlog = 1 

##########################################################################################################
# innodb选项

# 说明：该参数可以提升扩展性和刷脏页性能。
# 默认值1，建议值：4-8；并且必须小于innodb_buffer_pool_instances
innodb_page_cleaners = 4

# 说明：一般8k和16k中选择，8k的话，cpu消耗小些，selcet效率高一点，一般不用改
# 默认值：16k；建议值：不改，
innodb_page_size = 16384

# 说明：InnoDB使用一个缓冲池来保存索引和原始数据, 不像MyISAM.这里你设置越大,你在存取表里面数据时所需要的磁盘I/O越少.
# 在一个独立使用的数据库服务器上,你可以设置这个变量到服务器物理内存大小的60%-80%
# 注意别设置的过大，会导致 system 的 swap 空间被占用，导致操作系统变慢，从而减低 sql 查询的效率
# 默认值：128M，建议值：物理内存的 60%-80%
innodb_buffer_pool_size = 512M

# 说明:只有当设置 innodb_buffer_pool_size 值大于1G时才有意义，小于1G，instances默认为1，大于1G，instances默认为8
# 但是网络上有评价，最佳性能，每个实例至少1G大小。
# 默认值：1或8，建议值：innodb_buffer_pool_size/innodb_buffer_pool_instances >= 1G
innodb_buffer_pool_instances = 1

# 说明：mysql 5.7 新特性，defines the chunk size for online InnoDB buffer pool resizing operations.
# 实际缓冲区大小必须为innodb_buffer_pool_chunk_size*innodb_buffer_pool_instances*倍数，取略大于innodb_buffer_pool_size
# 默认值128M，建议值：默认值就好，乱改反而容易出问题，它会影响实际buffer pool大小。
innodb_buffer_pool_chunk_size = 128M 

# 在启动时把热数据加载到内存。默认值为on，不修改
innodb_buffer_pool_load_at_startup = 1
# 在关闭时把热数据dump到本地磁盘。默认值为on，不修改
innodb_buffer_pool_dump_at_shutdown = 1

# 说明：影响Innodb缓冲区的刷新算法，建议从小到大配置，直到zero free pages；innodb_lru_scan_depth * innodb_buffer_pool_instances defines the amount of work performed by the page cleaner thread each second.
# 默认值1024，建议值: 未知
innodb_lru_scan_depth = 1024

# 说明：事务等待获取资源等待的最长时间，单位为秒，看具体业务情况，一般默认值就好
# 默认值：50，建议值：看业务。
innodb_lock_wait_timeout = 60

# 说明：设置了Mysql后台任务（例如页刷新和merge dadta from buffer pool）每秒io操作的上限。
# 默认值：200，建议值：方法一，单盘sata设100，sas10，raid10设200，ssd设2000，fushion-io设50000；方法二，通过测试工具获得磁盘io性能后，设置IOPS数值/2。
innodb_io_capacity = 2000
# 说明：该参数是所有缓冲区线程io操作的总上限。
# 默认值：innodb_io_capacity的两倍。建议值：例如用iometer测试后的iops数值就好
innodb_io_capacity_max = 4000

# 说明：控制着innodb数据文件及redo log的打开、刷写模式，三种模式：fdatasync(默认)，O_DSYNC，O_DIRECT
# fdatasync：数据文件，buffer pool->os buffer->磁盘；日志文件，buffer pool->os buffer->磁盘；
# O_DSYNC：  数据文件，buffer pool->os buffer->磁盘；日志文件，buffer pool->磁盘；
# O_DIRECT： 数据文件，buffer pool->磁盘；           日志文件，buffer pool->os buffer->磁盘；
# 默认值为空，建议值：使用SAN或者raid，建议用O_DIRECT，不懂测试的话，默认生产上使用O_DIRECT
innodb_flush_method = O_DIRECT

# 说明：mysql5.7之后默认开启，意思是，每张表一个独立表空间。
# 默认值1，开启
innodb_file_per_table = 1

# 说明：The path where InnoDB creates undo tablespaces.通常等于undo log文件的存放目录。
# 默认值./;自行设置
innodb_undo_directory = /usr/local/mysql-5.7.21/log
# 说明：The number of undo tablespaces used by InnoDB.等于undo log文件数量。5.7.21后开始弃用
# 默认值为0，建议默认值就好，不用调整了。
innodb_undo_tablespaces = 0
# 说明：定义undo使用的回滚段数量。5.7.19后弃用
# 默认值128，建议不动，以后弃用了。
innodb_undo_logs = 128
# 说明：5.7.5 后开始使用，在线收缩 undo log 使用的空间。
# 默认值：关闭，建议值：开启
innodb_undo_log_truncate = 1
# 说明：结合innodb_undo_log_truncate，实现undo空间收缩功能
# 默认值：1G，建议值，不改。
innodb_max_undo_log_size = 1G

# 说明：重作日志文件的存放目录
innodb_log_group_home_dir = /usr/local/mysql-5.7.21/log
# 说明：日志文件的大小
# 默认值:48M,建议值：根据你系统的磁盘空间和日志增长情况调整大小
innodb_log_file_size = 128M
# 说明：日志组中的文件数量，mysql以循环方式写入日志
# 默认值2，建议值：根据你系统的磁盘空间和日志增长情况调整大小
innodb_log_files_in_group = 3
# 此参数确定些日志文件所用的内存大小，以M为单位。缓冲区更大能提高性能，但意外的故障将会丢失数据。MySQL开发人员建议设置为1－8M之间
innodb_log_buffer_size = 16M

# 说明：可以控制log从系统buffer刷入磁盘文件的刷新频率，增大可减轻系统负荷
# 默认值是1；建议值不改。系统性能一般够用。
innodb_flush_log_at_timeout = 1
# 说明：参数可设为0，1，2；
# 参数0：表示每秒将log buffer内容刷新到系统buffer中，再调用系统flush操作写入磁盘文件。
# 参数1：表示每次事物提交，将log buffer内容刷新到系统buffer中，再调用系统flush操作写入磁盘文件。
# 参数2：表示每次事物提交，将log buffer内容刷新到系统buffer中，隔1秒后再调用系统flush操作写入磁盘文件。
innodb_flush_log_at_trx_commit = 1

# 说明：限制Innodb能打开的表的数据，如果库里的表特别多的情况，请增加这个。
# 值默认是2000，建议值：参考数据库表总数再进行调整，一般够用不用调整。
innodb_open_files = 8192

# innodb处理io读写的后台并发线程数量，根据cpu核来确认，取值范围：1-64
# 默认值：4，建议值：与逻辑cpu数量的一半保持一致。
innodb_read_io_threads = 4
innodb_write_io_threads = 4
# 默认设置为 0,表示不限制并发数，这里推荐设置为0，更好去发挥 CPU 多核处理能力，提高并发量
innodb_thread_concurrency = 0
# 默认值为 4，建议不变。InnoDB中的清除操作是一类定期回收无用数据的操作。mysql 5.5 之后，支持多线程清除操作。
innodb_purge_threads = 4 

# 说明：mysql缓冲区分为new blocks和old blocks；此参数表示old blocks占比；
# 默认值：37，建议值，一般不动
innodb_old_blocks_pct = 37
# 说明：新数据被载入缓冲池，进入old pages链区，当1秒后再次访问，则提升进入new pages链区。
# 默认值：1000
innodb_old_blocks_time=1000
# 说明：开启异步io，可以提高并发性，默认开启。
# 默认值为1，建议不动
innodb_use_native_aio = 1

# 说明：默认为空，使用data目录，一般不改。
innodb_data_home_dir=/usr/local/mysql-5.7.21/data
# 说明：Defines the name, size, and attributes of InnoDB system tablespace data files.
# 默认值，不指定，默认为ibdata1:12M:autoextend
innodb_data_file_path = ibdata1:12M:autoextend

# 说明:设置了InnoDB存储引擎用来存放数据字典信息以及一些内部数据结构的内存空间大小,除非你的数据对象及其多，否则一般默认不改。
# innodb_additional_mem_pool_size = 16M

# 说明：The crash recovery mode。只有紧急情况需要恢复数据的时候，才改为大于1-6之间数值，含义查下官网。
# 默认值为0；
#innodb_force_recovery = 0

##########################################################################################################
# 其他。。。。
# 参考http://www.kuqin.com/database/20120815/328905.html
# skip-external-locking

# 禁止MySQL对外部连接进行DNS解析，使用这一选项可以消除MySQL进行DNS解析的时间。
# 缺点：所有远程主机连接授权都要使用IP地址方式，因为只认得ip地址了。
# skip_name_resolve = 0

# 默认值为off,timestamp列会自动更新为当前时间，设置为on|1，timestamp列的值就要显式更新
explicit_defaults_for_timestamp = 1

[mysqldump]
# quick选项强制 mysqldump 从服务器查询取得记录直接输出而不是取得所有记录后将它们缓存到内存中
quick
max_allowed_packet = 16M

[mysql]
# mysql命令行工具不使用自动补全功能，建议改为 no-auto-rehash
auto-rehash
socket = /tmp/mysql.sock
```



















