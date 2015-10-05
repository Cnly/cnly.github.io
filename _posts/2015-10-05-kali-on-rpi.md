---
title: 在Raspberry Pi 2上安装Kali Linux 2.0
tags: [tutorial]
---

##下载及写入系统

####下载
[Kali-ARM](https://www.offensive-security.com/kali-linux-vmware-arm-image-download/)

####写入SD卡
{% highlight Bash shell scripts %}
xz -d kali.img.xz
dd if=kali.img of=/dev/YOURCARD bs=1M
# bs = block size, 每次读取及写入的数据量
{% endhighlight %}

####扩展系统分区（可直接在树莓派上操作）

{% highlight Bash shell scripts %}
# 如有警告，忽略即可
parted
  unit chs
  rm 2 # 移除分区2
  p # 记住boot分区的chs数据
  mkpart
  primary
  START为分区1的后一个chs
  END为-1
  q
{% endhighlight %}

{% highlight Bash shell scripts %}
reboot
{% endhighlight %}

{% highlight Bash shell scripts %}
resize2fs /dev/mmcblk0p2

e2fsck -f /dev/mmcblk0p2
{% endhighlight %}

(本步可参考：[Raspberry Pi Forums](https://www.raspberrypi.org/forums/viewtopic.php?f=51&t=45265))

####更改apt源到镜像
将`/etc/apt/sources.list`中官方源的域名替换为`mirrors.aliyun.com`。

####添加中文支持
解决中文乱码、不能输入中文的问题
{% highlight Bash shell scripts %}
apt-get update
apt-get install ttf-wqy-* # 字体
apt-get install ibus-pinyin # 拼音输入法
dpkg-reconfigure locales # 选择字符集：en_GB.UTF-8, zh_CN.GBK, zh_CN.UTF-8以及期望的系统语言

reboot
{% endhighlight %}

####补全系统
由于这里安装的Kali是精简版，所以还需要安装Kali Linux的Metapackage，补全Kali应有的功能。
{% highlight Bash shell scripts %}
apt-get update && apt-get upgrade -y && apt-get dist-upgrade -y
apt-get install kali-linux-full
# 可用的metapackage: https://www.kali.org/news/kali-linux-metapackages/
# 若命令出错，可改成aptitude install kali-linux-full
# 本步骤非常耗时，以小时计算
{% endhighlight %}
