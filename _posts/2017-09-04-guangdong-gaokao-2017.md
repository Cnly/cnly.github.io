---
title: 用Python [3]拉取2017年广东高考分数及录取情况
tags: [python]
---

TL; DR

[->](https://github.com/Cnly/Philomelus)

---

## 入口

今年广东高考的分数及录取结果可以在两个地方查询：

* 5184.com
* service.southcn.com

## 验证码

而且两个地方都设置有验证码。但是经过对比可以发现，southcn的验证码比5184的简单很多，所以应该找它下手。

（这个故事告诉我们，必须保证所有入口是安全的，才能保证核心的数据是安全的。安全性和便利性，常常是对立的（service.southcn.com原来应该是服务于微信用户的）。）

对于分数查询系统的验证码，只能是硬上的：[https://cnly.github.io/2017/07/02/captchas.html](https://cnly.github.io/2017/07/02/captchas.html)。

而对于录取情况查询系统的验证码，则可以使用技巧加速破解（现已修复，但原代码未删除，以注释形式保留）：

使用Burpsuite等抓包可以发现，在提交请求的同时，response的json中有一个`debug` object，再看到里面的`vrd` object，这里居然是正确的验证码！于是配合原来的SouthOCR(下称SOCR)，可以做到：

1. 第一次请求验证码，并通过SOCR识别，将识别结果和所对应的参数存到池内
1. SouthEnrollmentDataService拉取池内验证码，尝试请求录取数据
1. 如果请求成功，略
1. 如果response提示验证码错误，则使用这个response内的`vrd`信息，替换刚刚的验证码，再次尝试请求
1. 如果请求成功，略
1. 如果仍然失败，则丢弃该验证码，在log中记录异常，并从池内拉取新的验证码重试

## 程序框架

Philomelus（本项目）的程序分为几大部分，分别负责不同的工作：

1. CaptchaService，负责管理验证码池，提供验证码
1. QuerySupplier，负责提供DataService所需的学号与出生年月信息
1. DataService，负责使用池内的验证码信息，拉取高考数据
1. PersistenceService，负责从DataService中拉取准备好的高考数据，整理，并持久化（如写入csv中）

在有网络交互的部分中，使用多线程会得到更好的效果。目前没有发现southcn使用限速设置。

## 程序实现

Philomelus使用Python 3作为语言，可以在[https://github.com/Cnly/Philomelus](https://github.com/Cnly/Philomelus)找到。
