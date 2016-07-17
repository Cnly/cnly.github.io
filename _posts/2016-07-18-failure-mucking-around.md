---
title: 失败的折腾
tags: [default]
date: 2016-07-18 00:33+0800
---

                                            +------------------+
                                            |                  |
                                            |      WAN         |
                                            |                  |
                                            +------------------+
                                               (4)^       |(5)
                                        masquerade|       |return
                                                  |       |        main router
           (1)request                      +------+-------v-------+
     +------------------------------------->                      +----+
     |                                     |      192.168.1.1     |    |
     |                                     |                      |    |
     |                                     +------^-------+-------+    |
     |                                            |       |            |
     |                                            |       |            |(2)main router forward
     |                                         (3)|       |            |traffic to .156:
    ++---------------------+            masquerade|       |(6)         |  ip rule fwmark 88 lookup evil
    |                      |                      |       |receive     |  ip route table evil default via <.156> dev br-lan
    |  192.168.1.128       |                      |       |            |  iptables -A PREROUTING -t mangle -s <.128> -j MARK --set-mark 88
    |                      |                      |       |            |
    +^---------------------+                      |       |            |
     |    victim                                  |       |            |
     |                                         +--+-------v------------v+
     |                                         |                        |Linux box:
     |                                         |     192.168.1.156      |sniff the traffic
     |                                         |                        |
     |                                         +----------+-------------+
     |                                                    |
     +----------------------------------------------------+
                              (7)return

上面这个方案好像会有一个问题：victim发request时包的dest-mac是router的，但接收返回时，包的src-dest却是box的。
而且目前测试的结果是box根本收不到victim发向外网的包，victim ping外网时显示`Response from 192.168.1.1: Port Unreachable`。

所以在没有进一步测试之前，解决方法是在.1上插个U盘，装tcpdump。XD
