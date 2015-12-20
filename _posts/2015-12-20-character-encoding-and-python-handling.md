---
title: 字符编码与Python 2编码处理笔记
tags: default
---

## 字符编码简要笔记

### 英文
美国的ASCII（American Standard Code for Information Interchange）编码统一规定了英文常用符号用哪些二进制数来表示。**ASCII是标准的单字节字符编码方案**，用于基于文本的数据。

ASCII已被国际标准化组织（ISO）定为国际标准，称为ISO 646标准。适用于所有拉丁文字字母。ASCII码使用指定的7位或8位二进制数组合来表示128或256种可能的字符。标准ASCII码也叫基础ASCII码，使用7位二进制数来表示所有的大写和小写字母，数字0到9、标点符号，以及在美式英语中使用的特殊控制字符。而最高位为1的另128个字符（80—FF）被称为“扩展ASCII”，一般用来存放英文的制表符、部分音标字符等等的一些其它符号。

### 中文
中国先后推出了几种编码：GB2312（1981年）、GBK（1995年）、GB18030（2005年）。从GB2312到GB18030，收录的字符越来越多。这三个标准都是**变长编码**，且**向下兼容**的。

### Unicode
提到Unicode不能不提UCS（通用字符集Universal Character Set）。UCS是由ISO制定的ISO 10646（或称ISO/IEC 10646）标准所定义的标准字符集。UCS-2用两个字节编码，UCS-4用4个字节编码。Unicode是由unicode.org制定的编码机制，ISO与unicode.org是两个不同的组织, 虽然最初制定了不同的标准; 但目标是一致的。所以**从unicode2.0开始, unicode采用了与ISO 10646-1相同的字库和字码, ISO也承诺ISO10646将不会给超出0x10FFFF的UCS-4编码赋值, 使得两者保持一致。**

需要注意的是，**Unicode只是一个符号集，它只规定了符号的二进制代码，却没有规定这个二进制代码应该如何存储。**Unicode常见的实现有几种：UTF-8（最常用，使用1~4个字节表示一个字符）、UTF-16（字符用两个字节或四个字节表示）、UTF-32（字符用四个字节表示）。

#### UTF-8
UTF-8的编码规则很简单，只有2条：

0. 对于单字节的符号，字节的第一位设为0，后面7位为这个符号的unicode码。因此对于英语字母，UTF-8编码和ASCII码是相同的。

0. 对于n字节的符号（n>1），第一个字节的前n位都设为1，第n+1位设为0，后面字节的前两位一律设为10。剩下的没有提及的二进制位，全部为这个符号的unicode码。
下表总结了编码规则，字母x表示可用编码的位。

<pre><code>Unicode符号范围      | UTF-8编码方式
(十六进制)           | （二进制）
--------------------+------------------------------------
0000 0000-0000 007F | 0xxxxxxx
0000 0080-0000 07FF | 110xxxxx 10xxxxxx
0000 0800-0000 FFFF | 1110xxxx 10xxxxxx 10xxxxxx
0001 0000-0010 FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
</code></pre>

以汉字"严"为例，演示如何实现UTF-8编码。
已知"严"的unicode是4E25（100111000100101），根据上表，可以发现4E25处在第三行的范围内（0000 0800-0000 FFFF），因此"严"的UTF-8编码需要三个字节，即格式是"1110xxxx 10xxxxxx 10xxxxxx"。然后，从"严"的最后一个二进制位开始，依次从后向前填入格式中的x，多出的位补0。这样就得到了，"严"的UTF-8编码是"11100100 10111000 10100101"，转换成十六进制就是E4B8A5。

#### Little Endian and Big Endian
以汉字"严"为例，Unicode码是4E25，需要用两个字节存储，一个字节是4E，另一个字节是25。存储的时候，4E在前，25在后，就是Big endian方式；25在前，4E在后，就是Little endian方式。

Unicode规范中定义，每一个文件的最前面分别加入一个字节顺序标记（BOM，Byte order mark），这个字符的表示是FEFF。文件第一个字符为`FEFF`，则表示文件为Big endian。

#### UTF-8中的BOM
UTF-8可以包含BOM，但并没有作用，因为UTF-8是面向字节（byte oriented）的，即一个一个字节地读取，读取一个字节后根据其高位决定下一动作；但在UTF-16及UTF-32中，一次需要读取多个字节，故需要定义字节排列顺序。

在UTF-8中，BOM的使用可能使一些无法接受UTF-8中的BOM的系统/协议出错，或受影响，如Unix Shell Script中开头的`#!`。

<br />

## Python 2中的字符编码处理

### 理解encode与decode
首先，把Unicode看成一种标准，大一统标准。那么Unicode就是一张巨大的字符表。

计算机要储存和/或操作Unicode，都需要将它们**编码**成字节。比如UTF-8就是一种编码（Encoding），它可以编码任何Unicode字符。再比如latin1也是一种编码，但只能编码Unicode的部分字符，大多数时候都是西方国家使用。

基本上讲，Unicode可以被用不同的编码来编码，而编码后的字符串可以被解码成Unicode。但是，Unicode来得太晚，以至于用着8位字符集长大的我们现在才意识到我们其实一直在用编码过的字符串（encoded string）。这些编码可能是ISO8859-1、Windows CP437等，取决于系统默认值。

所以当你在代码中使用字符串（如`add “Monitoring” to list`）时，你用的实际上是已经被系统默认编码（如CP1252）编码过的字符串。如果你想把它转换成Unicode，你就需要对其进行**解码**。

### str 与 unicode
`str`与`unicode`都是`basestring`的两个子类型。所以可用`isinstance(obj, basestring)`来检测一个对象是否是字符串类对象。

str与unicode的关系为：

    str  -> decode -> unicode
    unicode -> encode -> str

### 字符串的.encode()和.decode()

`encode`和`decode`方法均有`encoding`和`errors`两个可选参数，两个参数的类型均为str。`errors`表示错误处理方法，默认为`strict`，其它可选值有`ignore`、`replace`、`xmlcharrefreplace`、`backslashreplace`及其余通过`codecs.register_error()`注册的值。

对8位字符串来讲，`encode()`一般没有什么用处。但是`encode()`可以用于其它用途，如：

    >>> s.encode('zip')
    'x\x9c;\xbc\r\x00\x02>\x01z'

### PEP 0263 - 定义源码编码
Python 2默认使用ASCII编码。

根据[PEP 0263]，可以在源文件的开头放置如下magic comment来定义源文件的编码：

    # coding=<encoding name>

或人气编辑器识别的格式：

      #!/usr/bin/python
      # -*- coding: <encoding name> -*-

或：

      #!/usr/bin/python
      # vim: set fileencoding=<encoding name> :

若头部声明coding=utf-8, 声明变量`a = '中文'`，其编码为utf-8。

[PEP 0263]: (https://www.python.org/dev/peps/pep-0263/) "PEP 0263 -- Defining Python Source Code Encodings | Python.org"

### codecs 模块
为简化对已编码的文件或流的处理，`codecs`模块提供了一些函数，如：

    codecs.open(filename, mode[, encoding[, errors[, buffering]]])

详见[https://docs.python.org/2/library/codecs.html](https://docs.python.org/2/library/codecs.html)。

<br />
## References

* [字符编码笔记：ASCII，Unicode和UTF-8 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2007/10/ascii_unicode_and_utf-8.html)
* [中文编码杂谈 «  搜索技术博客－淘宝](http://www.searchtb.com/2012/04/chinese_encode.html)
* [GB 18030 - Wikipedia, the free encyclopedia](https://en.wikipedia.org/wiki/GB_18030)
* [FAQ - UTF-8, UTF-16, UTF-32 & BOM](http://unicode.org/faq/utf_bom.html)
* [unicode - Isn’t on big endian machines UTF-8's byte order different than on little endian machines? So why then doesn’t UTF-8 require a BOM? - Stack Overflow](http://stackoverflow.com/questions/3833693/isn-t-on-big-endian-machines-utf-8s-byte-order-different-than-on-little-endian)
* [unicode - Python UnicodeDecodeError - Am I misunderstanding encode? - Stack Overflow](http://stackoverflow.com/questions/368805/python-unicodedecodeerror-am-i-misunderstanding-encode#370199)
* [PEP 0263 -- Defining Python Source Code Encodings \| Python.org](https://www.python.org/dev/peps/pep-0263/)