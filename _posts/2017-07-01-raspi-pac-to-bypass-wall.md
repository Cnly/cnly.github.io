---
title: 树莓派 + SS + PAC = 智能科学上网
tags: [raspi]
---

## TL; DR

[->](https://github.com/Cnly/okss/tree/master/zgmpac)

<br />

## 正文

想用Raspi做一个智能的科学上网工具，主要供内网手机或其它未安装SOCKS5代理工具的设备使用（远端为SS）。搜索发现，目前与Raspi结合的科学上网方式大多都或多或少存在一些问题，不适应我个人环境：

* 需要客户端安装附加工具
* 不需要客户端有改动，但非智能
* 不需要客户端有改动，但仅半智能（如使用IP表等判断是否代理，或需要自行配置一个DNS服务器等）

不太喜欢自行配置另一个DNS服务器，因为SOCKS5协议中完全可以直接命令代理服务器根据域名连接远端：

>          o  ATYP   address type of following address
>             o  IP V4 address: X'01'
>             o  DOMAINNAME: X'03'
>             o  IP V6 address: X'04'

另一方面，喜欢比较透明的代理，所以不想在每个客户端都安装特殊工具。

P.S. 折腾完之后发现有一个COW: <https://github.com/cyfdecyf/cow>

然后发现，许多设备(Android 4.4或以下估计不行)都支持PAC(Proxy Auto-Config)。如果可以下发PAC文件给目标设备，并在其中设定按域名的访问规则，Raspi上再每天更新（配合[某list](https://github.com/gfwlist/gfwlist)），那么目标就可以达成了。

<br />

### 实践

#### 代理类型转换

许多PAC文件的示例中，`FindProxyForURL`返回的都是`DIRECT`或`PROXY proxy.example.com:8080`这样的字符串；而实际上PAC文件也可以指定SOCKS4/SOCKS5代理（同时要求客户端支持），只需：

    return "SOCKS fastproxy.example.com:8080";
    // 抓包发现Chrome此时使用的SOCKS协议版本为04

或

    return "SOCKS5 fastproxy.example.com:8080";

又经测试，发现手头电脑上的Ubuntu、Chrome等都可以直接利用PAC返回的SOCKS代理连接，而Android则不行，所以还是需要将SOCKS代理转换成HTTP代理使用。此处使用工具：Polipo。

参考：[Convert Shadowsocks into an HTTP proxy · shadowsocks/shadowsocks Wiki](https://github.com/shadowsocks/shadowsocks/wiki/Convert-Shadowsocks-into-an-HTTP-proxy)

<br />

#### 生成PAC文件

某list解码后，得到的似乎是AutoProxy的配置文件，但是这个项目似乎已经搜不到了。但是想起SwitchyOmega使用的也是这个list，于是转向[源码](https://github.com/FelisCatus/SwitchyOmega/blob/497d5de8ce5a4e8f1aea68c8ccffd9ba1c304d8e/omega-pac/src/rule_list.coffee#L7)就可以发现这个文件的规则。

写一个py，试着根据上述规则解析list并生成PAC文件，结果发现这样生成的文件似乎有点性能问题。于是再转向list本身，发现URL Wildcard类型中，有许多规则实际上在Host Wildcard部分就已经体现了，故为了简化，直接忽略这部分规则。而同时对于针对`host`的无通配符的规则，使用`host.endsWith`方法就已经可以适应绝大部分情况，这样就无需使用`shExpMatch`了。

最后成品：[->](https://github.com/Cnly/okss/blob/master/zgmpac/zgm.py)

<br />

#### Cron

此处别忘了加个cron任务，自动更新PAC文件。

<br />

#### Host并分发PAC文件

首先试了Python的SimpleHTTPServer，结果这个玩意常常出现奇怪的问题，导致无法接受新连接，于是转投lighttpd。

把文件host好后，就可以选择：

0. 手动设置客户端使用PAC
0. 使用WPAD，让客户端自动发现PAC文件

但是搜索后发现，WPAD受到的支持并不是很好（见下refs），所以还是选择手动设置。设置完后便可收工。

<br />

## References

* [RFC 1928](https://www.ietf.org/rfc/rfc1928.txt)
* [Proxy auto-config - Wikipedia](https://en.wikipedia.org/wiki/Proxy_auto-config)
* [SwitchyOmega/rule_list.coffee at 497d5de8ce5a4e8f1aea68c8ccffd9ba1c304d8e · FelisCatus/SwitchyOmega](https://github.com/FelisCatus/SwitchyOmega/blob/497d5de8ce5a4e8f1aea68c8ccffd9ba1c304d8e/omega-pac/src/rule_list.coffee#L7)
* [Web Proxy Auto-Discovery Protocol - Wikipedia](https://en.wikipedia.org/wiki/Web_Proxy_Auto-Discovery_Protocol)
* [How to distribute wpad.dat (Page 1) — General Discussion — OpenWrt](https://forum.openwrt.org/viewtopic.php?id=62630)
* [Convert Shadowsocks into an HTTP proxy · shadowsocks/shadowsocks Wiki](https://github.com/shadowsocks/shadowsocks/wiki/Convert-Shadowsocks-into-an-HTTP-proxy)