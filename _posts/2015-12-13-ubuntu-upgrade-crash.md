---
title: Ubuntu 15.04 升级到 15.10 过程中挂了……
tags: default
---

之前把Ubuntu升级到15.10，结果中途卡在os-prober上了。

<pre><code>
Generating grub configuration file ...
Warning: Setting GRUB_TIMEOUT to a non-zero value when GRUB_HIDDEN_TIMEOUT is set is no longer supported.
Found linux image: /boot/vmlinuz-4.2.0-18-generic
Found initrd image: /boot/initrd.img-4.2.0-18-generic
Found linux image: /boot/vmlinuz-3.19.0-33-generic
Found initrd image: /boot/initrd.img-3.19.0-33-generic
Found linux image: /boot/vmlinuz-3.19.0-32-generic
Found initrd image: /boot/initrd.img-3.19.0-32-generic
Found linux image: /boot/vmlinuz-3.19.0-31-generic
Found initrd image: /boot/initrd.img-3.19.0-31-generic
Found linux image: /boot/vmlinuz-3.19.0-30-generic
Found initrd image: /boot/initrd.img-3.19.0-30-generic
Found linux image: /boot/vmlinuz-3.13.0-63-generic
Found initrd image: /boot/initrd.img-3.13.0-63-generic
Found linux image: /boot/vmlinuz-3.13.0-62-generic
Found initrd image: /boot/initrd.img-3.13.0-62-generic
Found linux image: /boot/vmlinuz-3.13.0-61-generic
Found initrd image: /boot/initrd.img-3.13.0-61-generic
Found linux image: /boot/vmlinuz-3.13.0-57-generic
Found initrd image: /boot/initrd.img-3.13.0-57-generic
Found linux image: /boot/vmlinuz-3.13.0-55-generic
Found initrd image: /boot/initrd.img-3.13.0-55-generic
Found linux image: /boot/vmlinuz-3.13.0-53-generic
Found initrd image: /boot/initrd.img-3.13.0-53-generic
Found linux image: /boot/vmlinuz-3.13.0-52-generic
Found initrd image: /boot/initrd.img-3.13.0-52-generic
Found linux image: /boot/vmlinuz-3.13.0-51-generic
Found initrd image: /boot/initrd.img-3.13.0-51-generic
Found linux image: /boot/vmlinuz-3.13.0-49-generic
Found initrd image: /boot/initrd.img-3.13.0-49-generic
Found linux image: /boot/vmlinuz-3.13.0-48-generic
Found initrd image: /boot/initrd.img-3.13.0-48-generic
Found linux image: /boot/vmlinuz-3.13.0-46-generic
Found initrd image: /boot/initrd.img-3.13.0-46-generic
Found linux image: /boot/vmlinuz-3.13.0-45-generic
Found initrd image: /boot/initrd.img-3.13.0-45-generic
Found linux image: /boot/vmlinuz-3.13.0-44-generic
Found initrd image: /boot/initrd.img-3.13.0-44-generic
Found linux image: /boot/vmlinuz-3.13.0-43-generic
Found initrd image: /boot/initrd.img-3.13.0-43-generic
Found linux image: /boot/vmlinuz-3.13.0-40-generic
Found initrd image: /boot/initrd.img-3.13.0-40-generic

</code></pre>

不知道为什么会这样。似乎跟mount也有点关系，因为这时我发现之前没挂载的硬盘都挂不上了，用mount挂载会出来mount无限sleep的情况。

不过我的Windows和Ubuntu没装在同一块硬盘上，于是直接禁用os-prober解决问题：
{% highlight bash scripts %}
cd /etc/grub.d
chmod a-x 30_os-prober
{% endhighlight %}

然后再次升级，问题解决……