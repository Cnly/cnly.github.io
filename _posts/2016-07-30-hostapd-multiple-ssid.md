---
title: hostapd多SSID
tags: default
date: 2016-07-30 12:21+0800
---

首先，我们要确定网卡支持多SSID：

    iw list

在输出中找到像这样的信息：

    valid interface combinations:
       { AP, mesh point } <= 8,total <= 8, #channels <= 1

在上面的示例中，网卡支持最多8个SSID。

在`/etc/hostapd.conf`中直接添加`bss`字段：

    bss=wlan0_0
    ssid=wifi1
    wpa=2
    wpa_passphrase=12345678

P.S. 在我的设备上不用修改MAC地址。

## References

* [Multiple SSIDs Configuration · mengning/chameleon Wiki](https://github.com/mengning/chameleon/wiki/Multiple-SSIDs-Configuration)
