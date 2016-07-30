---
title: 配置树莓派上的lirc(Raspbian, 2016)
tags: [tutorial, raspi]
date: 2016-07-30 11:48+0800
---

## 1. 什么是LIRC

[http://www.lirc.org/](http://www.lirc.org/)

## 2. lirc基本配置

本文使用设备：Raspberry Pi 2 Model B

本文使用OS: Raspbian(Linux <REDACTED> 4.4.13-v7+ #894 SMP Mon Jun 13 13:13:27 BST 2016 armv7l GNU/Linux)

首先，安装lirc

    sudo apt-get install lirc

增加下列内容到`/etc/modules`：

    lirc_dev
    lirc_rpi gpio_in_pin=18 gpio_out_pin=17

其中gpio\_in\_pin和gpio\_out\_pin可以依喜好而定。

编辑`/etc/lirc/hardware.conf`：

    LOAD_MODULES=true

    DRIVER="default"

    DEVICE="/dev/lirc0"
    MODULES="lirc_rpi"

将以下内容增加到`/boot/config.txt`：

    dtoverlay=lirc-rpi,gpio_in_pin=18,gpio_out_pin=22

使lirc随系统启动：

    sudo update-rc.d lirc defaults

重启lirc，使配置生效：

    sudo service lirc restart

## 3. 配置遥控器

配置文件说明：

* `/etc/lirc/lircd.conf`为遥控器配置文件
* `/etc/lirc/lircmd.conf`为lircmd配置文件，后者可以将遥控器用作鼠标，本文不作展开。
* `/etc/lirc/lircrc`为irexec配置文件，后者可以在收到遥控器信号号运行设定的程序。

首先我们要制作遥控器配置文件。这一步可以到网上找已有的文件或自己录制。附LIRC官方遥控数据库：[链接](http://lirc-remotes.sourceforge.net/remotes-table.html)

如果要自己制作配置文件的方法，__首先要停止lirc服务__：

    sudo service lirc stop

然后使用`irrecord`命令：

    irrecord <model>.conf

如果上述命令出错，可尝试

    irrecord -d /dev/lirc0 <model>.conf

根据指示完成基本配置后即可开始录制按钮。此处按钮最好使用标准namespace内的映射。标准namespace表可通过`irrecord --list-namespace`查看。

录制好后，应用遥控器配置文件：

    sudo ln -s /etc/lirc/lircd.conf <model>.conf

并启动lirc服务：

    sudo service lirc start

如果要配置irexec，则可以参考[lircrc文件格式](http://www.lirc.org/html/configure.html#lircrc_format)。

## References

* [Setting up LIRC on the RaspberryPi - alexba.in](http://alexba.in/blog/2013/01/06/setting-up-lirc-on-the-raspberrypi/)
* [Record Infrared Codes of Any Remote Control Unit for Usage with Linux Infrared Remote Control (LIRC) on Raspberry Pi's GPIO-based Infrared Receiver - All](http://www.instructables.com/id/Record-Infrared-Codes-of-Any-Remote-Control-Unit-f/?ALLSTEPS)
* [LIRC - Linux Infrared Remote Control](http://www.lirc.org/)
