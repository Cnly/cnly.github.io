---
title: 树莓派桥接将路由器有线网络扩展成无线
tags: [tutorial, raspi]
date: 2016-07-30 09:24+0800
---

## 1. 目标


     WLAN
       +
       |
       |
       |
       |
    +--+------------------+                      +------------------------+
    |                     |                      |                        |
    |    Raspberry Pi     |    BRIDGE            |    MAIN ROUTER         |
    |                     +----------------------+                        |
    +---------------------+    WIRED             +------------------------+
                               CONNECTION

如图，用RasPi做桥接。

## 2. 何为桥接

A network bridge is a device that performs Network bridging, which is the action taken by network equipment to create an aggregate network from either two or more communication networks, and or network segments. If one or more segments of the bridged network are wireless, it is known as __wireless bridging__.

（维基百科）

## 3. 桥接原理

### 路由器端口与MAC地址的对应

（在一般家用有线路由器环境下）路由器系统内部有一张保存各端口对应与其连接的设备的MAC地址的映射表。__一个端口可以对应超过一个MAC地址。__

当路由器遇到一个包，其目的地是一个未知对应关系的MAC地址时，路由器会“降级”为switch，将包转发给所有端口。

当端口连接的设备以一个MAC地址为源地址向外发包时，路由器会将这个映射关系保存下来。

路由器遇到以已知对应关系的MAC地址为目的地的包时，会将包直接转发到该端口上。

路由器上的这张映射表还会为每个MAC地址设定一个ageing timer，如Linux默认300秒。超时则MAC地址过期。

#### 查看映射表(Linux)

我们可以通过`brctl`命令来查看系统中的这张表：`brctl showmacs <bridge>`

    port no mac addr        is local?   ageing timer
      2 --:--:--:--:--:d0   yes        0.00
      3 --:--:--:--:--:d1   yes        0.00
      1 --:--:--:--:--:32   no         0.02
      1 --:--:--:--:--:c2   no         3.30
      1 --:--:--:--:--:12   yes        0.00
      2 --:--:--:--:--:e0   no         1.55

    （上表MAC地址有部分删去）

其中`port no`字段是MAC对应的端口。__可见一个端口可对应多个MAC地址。__

如欲了解port no具体对应的NIC，可用命令`brctl showstp <bridge>`。

([ref][ULKVBPNULSE])

#### 真正的路由器中

在我使用的OpenWRT路由器中，还没有找到可以查看这张表的方法。可能的原因是在Ethernet口与CPU之间还有一层Programmable switch，表在这层里。

([ref - OW Wiki][SDOW])<br />
([ref - SO][LFTPPOAEDO])

### 桥接

在本例中，RasPi充当了路由器与无线客户端之前的桥。它对客户端发送的包做第二层上的MAC地址转换，发给路由器。又对路由器发来的包做类似的转换，发到自己的无线客户端。

## 4. 实践

__第一步__：配置好Pi的基本环境，用eth0将其连接到路由器

__第二步__：在Pi上安装bridge-utils和hostapd

__第三步__：编辑`/etc/network/interfaces`，禁止Pi自动配置WLAN接口。__同时用`kill`杀掉所有`wpa\_supplicant`和其它Network-Manager类软件。([ref][HENCNCDMAU])__

__第四步__：在`/etc/network/interfaces`中增加桥的配置：

    auto br0
    iface br0 inet static
        address <填eth0一致>
        network <与eth0一致>
        netmask <与eth0一致>
        bridge-ports eth0  # 文件中只填有线接口即可，无线接口我们在`hostapd.conf`中配置。

同时，将eth0设为manual并将其IP地址设置删除。

对第四步有两个疑问：

__1__. 为什么网桥作为第二层设施要有IP地址而且eth0不能有？

答：

    (1) 理论上网桥不需要IP地址也能工作。但是实际中我们往往需要对网桥本身设备进行控制，所以我们需要有IP地址。
    (2) 如果要让网桥进行第三层的包（如DHCP、DNS）的转发，其必须要有IP地址。
    (3) 如果eth0有与br0相同的IP，它对eth0上设备发来的包作应答，设备将失去转发能力。

([ref - (2)][WDWNAIAFABAU])  
([ref - (3)][WDLRMIFEITBIULSE])

__2__. 有的教程将br0的bridge\_fd设为0是什么意思？

答：

    bridge_fd是forward delay，即桥在进入forwarding态之前，在listening和learning态中各花的时间。实测在不开启STP的情况下无用（情况可能因设备、系统而异）。

([ref - Cisco][UATSTPTC])  
([ref - Linux Foundation Wiki][NBLFW])

__第五步__：配置hostapd

新建`/etc/hostapd.conf`并根据需要配置。注意其中的`bridge`项填之前建立的桥。配置文件可参考[这里][hostapd.conf]。

## References

* [Bridging (networking) - Wikipedia](https://en.wikipedia.org/wiki/Bridging_(networking))
* [Understand Linux kernel virtual bridge port numbering - Unix & Linux Stack Exchange][ULKVBPNULSE]
* [Switch Documentation OpenWrt Wiki][SDOW]
* [linux - Finding the Physical port of an Ethernet device - OPENWRT - Stack Overflow][LFTPPOAEDO]
* [wireless- hostapd error "nl80211: Could not configure driver mode" - Ask Ubuntu][HENCNCDMAU]
* [networking - Why do we need an IP address for a bridge? - Ask Ubuntu][WDWNAIAFABAU]
* [networking - Why does Linux require moving IP from eth interface to bridge interface - Unix & Linux Stack Exchange][WDLRMIFEITBIULSE]
* [Understanding and Tuning Spanning Tree Protocol Timers - Cisco][UATSTPTC]
* [networking:bridge Linux Foundation Wiki][NBLFW]
* [https://w1.fi/cgit/hostap/plain/hostapd/hostapd.conf][hostapd.conf]

[ULKVBPNULSE]: http://unix.stackexchange.com/questions/199378/understand-linux-kernel-virtual-bridge-port-numbering
[SDOW]: https://wiki.openwrt.org/doc/uci/network/switch
[LFTPPOAEDO]: http://stackoverflow.com/questions/19670980/finding-the-physical-port-of-an-ethernet-device-openwrt
[HENCNCDMAU]: http://askubuntu.com/questions/472794/hostapd-error-nl80211-could-not-configure-driver-mode
[WDWNAIAFABAU]: http://askubuntu.com/questions/407828/why-do-we-need-an-ip-address-for-a-bridge
[WDLRMIFEITBIULSE]: http://unix.stackexchange.com/questions/86056/why-does-linux-require-moving-ip-from-eth-interface-to-bridge-interface
[UATSTPTC]: http://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/19120-122.html
[NBLFW]: https://wiki.linuxfoundation.org/networking/bridge
[hostapd.conf]: https://w1.fi/cgit/hostap/plain/hostapd/hostapd.conf
