---
title: Python、Scrapy、豆瓣日报(1)
tags: [scrapy, douban-daily, python]
date: 2016-07-15 11:37+0800
---

之前想将豆瓣时间线上的内容爬下来，做成电子书看。最好是可以把程序扔到树莓派上，自动生成，并通过Email发到Kindle上。于是开工，用Python、Scrapy和Amazon的kindlegen（kindlegen在amazon上用中国IP无法下载）。

## 整体思路

通过爬虫获取douban.com上的时间线内容，选取其中的日记类型feed，并下载内容，输出为HTML，最后转换成mobi格式，再用电子邮件发送。

## Scrapy

### Scrapy at a glance（来自Docs）

Scrapy is an application framework for crawling web sites and extracting structured data which can be used for a wide range of useful applications, like data mining, information processing or historical archival.

Even though Scrapy was originally designed for web scraping, it can also be used to extract data using APIs (such as Amazon Associates Web Services) or as a general purpose web crawler.

### Scrapy项目的目录结构

    myproj - 项目根目录
    ├── myproj
    │   ├── __init__.py
    │   ├── items.py
    │   ├── pipelines.py
    │   ├── settings.py
    │   └── spiders
    │       └── myspider.py
    └── scrapy.cfg
    
scrapy.cfg: 包含储存项目设置的模块名称及一些deploy设置。

items.py: 默认的Item定义文件。Item可以用来储存Spider获取到的数据，并通过Pipeline传递到其它模块进一步处理或输出等。

pipelines.py: 默认的Pipeline定义文件。Pipeline说明见上。使用的管道及其序列可在settings.py中配置。

settings.py: 默认的设置文件。见[Docs](http://doc.scrapy.org/en/latest/topics/settings.html)。

spiders: 默认存放蜘蛛的目录。一个项目中可以存在多个蜘蛛。

## XPath

### XPath简介

XPath是一个用于在XML文档内导航的工具。它：

* 是用于定义XML文档各部分的语法
* 使用路径表达式来在XML文档中导航
* __包含一些基本函数__
* 是XSLT中的一个主要元素
* 被W3C推荐

在Web爬虫的数据处理中，仅使用正则表达式可能出现意想不到的结果，所以选择对parse过的HTML进行XPath选择会更好。而Scrapy的selector也带有XPath选择的功能。

## 实践

### 页面分析

因为一般网站的WAP版页面复杂度都会比桌面版低，所以首先看了看WAP版的网页：wap.douban.com。结果发现WAP版根本没有时间线。而且无论是WAP版还是桌面版，登录处都有验证码，所以看来是不能通过WAP版简化登录了。

转到桌面版站点www.douban.com，观察排版。

时间线上有不同类型的feed，比如评论、日记、相册等。而我们要的仅是日记。其实每个status item里面的一些a标签的onclick属性中都会带有一个object_kind字段，目前观察到的结果是，这个字段为`"1015"`则代表日记内容。还有一种简单方法：判断status item的标题中是否含有“日记”两字（当发表的用户的名称中含有该两字时本方法会失效）。

每个status item都包含一些内容的基本信息，比如作者、发布时间、来源（如热门推荐）、链接等，所以可以在不跟踪超链接的情况下进行一些筛选（如忽略某个作者）。

再跟踪进日记链接里看看，发现日记有两种，一种是在主站上（www.douban.com）的日记，还有一种是在小站（site.douban.com）上的日记，两者排版有差别，需要分别处理。又因为后者占比非常小，根据80%原则，我们先完成主站上日记的抓取。

### 爬虫设计思路

既然要用时间线，就必须先登录。但是我们并不打算制作GUI界面，而且想让这个程序自动完成抓取，所以方案是用浏览器登录后将Cookies交给我们的程序（而豆瓣的Cookies似乎是一周内有登录便可续期，所以可行）。

时间线不是在一页内显示完全的。爬虫登录后通过XPath获取首页所有日记的链接，yield request。这里有一点：我们不能把看到的所有日记都获取下来，否则会有很多过期内容（如10年前feed的日记）。豆瓣的status item是根据时间排列的，所以我们找到一个超出希望的时间范围的item后，即可以不再往下看。

另外，Scrapy是多线程处理请求的。所以如果我们想让生成的文件中各日记的顺序与在主页上看到的顺序一致，就必须手动维护一个list，在spider看到日记时将日记添加到list中，导出时按照这个list的顺序导出。

日记中可能不仅有文字内容，还有图片内容。所以我们要找出每篇日记里的img src，用Scrapy的ImagesPipeline来完成图片的下载，并将生成的HTML中的img src全部替换成本地路径。

Scrapy并没有自带的HTML导出模块。所以这部分我们需要用pipeline和自定义的exporter来完成。

### 坑

0. 豆瓣已经启用HTTPS。Python 3版本的Scrapy，用pip安装时会自动安装`16.0.0`版本的PyOpenSSL。而这个版本在爬取HTTPS站点时，会出现[错误](http://stackoverflow.com/questions/37226591/scrapy-openssl-scraping-https-sites-attributeerror-module-object-has-no-at)，解决方法是手动安装0.15.1版本。
0. 豆瓣会给空UA客户端返回403。所以需要在settings.py中填入一个UA。
0. Scrapy的spider等一些对象不能在`__init__`方法中访问settings。需要手动重写`__from_crawler__`等方法，将crawler的（或已有的）settings传入到对象中。（参考[Docs](http://doc.scrapy.org/en/latest/topics/settings.html)）
0. Scrapy中selector（基于lxml构建）的XPath似乎不支持在selector本身不是最初的根元素的情况下（如通过`scrapy.Selector(response).xpath(r'/a')`获取的selector）使用`/element`获取元素（需要使用`./element`）。
0. 对于中文内容，kindlegen的输出文件中可能出现编码问题。解决方法是在HTML文件中加入编码声明，如`<meta http-equiv="content-type" content="application/xhtml+xml; charset=UTF-8">`

### 待续

内容黑/白名单、电子邮件发送等功能等有时间再完成。

## References

* [http://www.w3schools.com/xsl/xpath_intro.asp](http://www.w3schools.com/xsl/xpath_intro.asp)
* [http://doc.scrapy.org/en/latest/](http://doc.scrapy.org/en/latest/)
